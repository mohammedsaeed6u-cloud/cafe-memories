import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { mergeOrganizationSettings } from '@/lib/server/settings';
import { signedMemoryUrlMap, pickSigned } from '@/lib/server/memory-urls';

export interface CustomerCardReward {
  id: string;
  name: string;
  threshold: number;
  unlockedAt: string;
}

export interface CustomerCardStamp {
  memoryId: string;
  takenAt: string;
  thumbnailUrl: string;
}

export interface CustomerCardVoucher {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  source: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface CustomerCardTier {
  id: string;
  threshold: number;
  title: string;
  description: string | null;
  rewardKind: 'voucher' | 'card';
  unlocked: boolean;
  isNext: boolean;
}

export interface CustomerCardPromotion {
  id: string;
  title: string;
  description: string | null;
  multiplier: number;
  endsAt: string;
}

export interface CustomerCardMemory {
  id: string;
  originalUrl: string;
  thumbnailUrl: string;
  caption: string | null;
  status: string;
  visibility: string;
  createdAt: string;
}

export interface CustomerCard {
  customer: {
    id: string;
    displayName: string;
    phone: string | null;
    persona: string | null;
    createdAt: string;
  };
  loyalty: {
    stampedCount: number;
    maxSlots: number;
    completedCardsCount: number;
    totalVerifiedVisits: number;
    lastStampedAt: string | null;
    rewardName: string | null;
    nextTier: { threshold: number; title: string; remaining: number } | null;
  };
  rewards: CustomerCardReward[];
  stamps: CustomerCardStamp[];
  vouchers: CustomerCardVoucher[];
  ladder: CustomerCardTier[];
  promotion: CustomerCardPromotion | null;
  memories: CustomerCardMemory[];
  walletPass: { status: string; shareUrl: string | null } | null;
}

/**
 * The single server-side definition of a customer's loyalty card.
 *
 * Every number is derived from immutable rows: verified visits allocate
 * `keepsake_cards` once, and a redemption stamps the card. The client never
 * computes progress, so two devices can never disagree.
 */
export async function loadCustomerCard(
  customerId: string,
  organizationId: string
): Promise<CustomerCard | null> {
  const admin = createAdminClient();

  const [
    customerResult,
    organizationResult,
    ruleResult,
    visitsResult,
    cardsResult,
    memoriesResult,
    vouchersResult,
    walletResult,
    openStampsResult,
    tiersResult,
    promotionResult,
  ] = await Promise.all([
    admin
      .from('customers')
      .select('id,display_name,phone,persona,created_at,organization_id,deleted_at')
      .eq('id', customerId)
      .maybeSingle(),
    admin.from('organizations').select('settings').eq('id', organizationId).maybeSingle(),
    admin
      .from('reward_rules')
      .select('id,name,threshold')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('trigger_type', 'visit_count')
      .lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    admin
      .from('visits')
      .select('id,verified_at', { count: 'exact' })
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .eq('verification_status', 'verified')
      .order('verified_at', { ascending: false })
      .limit(1),
    admin
      .from('keepsake_cards')
      .select('id,reward_name,threshold,unlocked_at,redeemed_at')
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .order('sequence_number', { ascending: true })
      .limit(60),
    admin
      .from('memories')
      .select('id,original_url,optimized_url,thumbnail_url,caption,status,visibility,created_at')
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(24),
    admin
      .from('vouchers')
      .select('id,code,title,description,status,source,expires_at,created_at')
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .eq('status', 'issued')
      .order('created_at', { ascending: false })
      .limit(12),
    admin
      .from('wallet_passes')
      .select('status,share_url')
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .maybeSingle(),
    admin
      .from('stamp_ledger')
      .select('id', { head: true, count: 'exact' })
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .is('card_id', null),
    admin
      .from('reward_ladder_tiers')
      .select('id,threshold,title,description,reward_kind')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('threshold', { ascending: true }),
    admin.rpc('active_stamp_multiplier', {
      p_organization_id: organizationId,
      p_branch_id: null,
      p_at: new Date().toISOString(),
    }),
  ]);

  if (customerResult.error) throw new Error('Customer lookup failed');
  const customer = customerResult.data;
  if (
    !customer ||
    customer.deleted_at ||
    (customer.organization_id && customer.organization_id !== organizationId)
  ) {
    return null;
  }

  if (organizationResult.error) throw new Error('Organization lookup failed');
  if (visitsResult.error) throw new Error('Visit lookup failed');
  if (cardsResult.error) throw new Error('Reward lookup failed');
  if (memoriesResult.error) throw new Error('Memory lookup failed');
  if (vouchersResult.error) throw new Error('Voucher lookup failed');
  if (openStampsResult.error) throw new Error('Stamp balance lookup failed');
  if (tiersResult.error) throw new Error('Reward ladder lookup failed');

  const settings = mergeOrganizationSettings(
    organizationResult.data?.settings as Record<string, unknown> | null | undefined
  );
  const rule = ruleResult.data ?? null;
  const maxSlots = rule?.threshold ?? settings.loyaltyMaxVisits ?? 5;

  const cards = (cardsResult.data ?? []) as Array<{
    id: string;
    reward_name: string;
    threshold: number;
    unlocked_at: string;
    redeemed_at: string | null;
  }>;
  const openRewards = cards.filter((card) => !card.redeemed_at);
  const totalVerifiedVisits = visitsResult.count ?? 0;
  const stampedCount = Math.max(0, Math.min(maxSlots, openStampsResult.count ?? 0));
  const lastVerifiedAt = (visitsResult.data ?? [])[0]?.verified_at ?? null;

  const tiers = (tiersResult.data ?? []) as Array<{
    id: string;
    threshold: number;
    title: string;
    description: string | null;
    reward_kind: 'voucher' | 'card';
  }>;
  const nextTierRow = tiers.find((tier) => tier.threshold > stampedCount) ?? null;
  const ladder: CustomerCardTier[] = tiers.map((tier) => ({
    id: tier.id,
    threshold: tier.threshold,
    title: tier.title,
    description: tier.description,
    rewardKind: tier.reward_kind,
    unlocked: stampedCount >= tier.threshold,
    isNext: nextTierRow?.id === tier.id,
  }));

  const promotionRow = promotionResult.data as {
    id?: string;
    title?: string;
    description?: string | null;
    multiplier?: number;
    endsAt?: string;
  } | null;
  const promotion: CustomerCardPromotion | null =
    promotionRow && promotionRow.id && promotionRow.title && promotionRow.multiplier
      ? {
          id: promotionRow.id,
          title: promotionRow.title,
          description: promotionRow.description ?? null,
          multiplier: promotionRow.multiplier,
          endsAt: promotionRow.endsAt ?? '',
        }
      : null;

  const memories = (memoriesResult.data ?? []) as Array<{
    id: string;
    original_url: string;
    optimized_url: string | null;
    thumbnail_url: string | null;
    caption: string | null;
    status: string;
    visibility: string;
    created_at: string;
  }>;

  // The bucket is private: hand the client one-hour signed URLs instead of
  // leaking storage keys or long-lived public links.
  const memoryUrls = await signedMemoryUrlMap(
    memories.flatMap((memory) => [memory.thumbnail_url, memory.optimized_url, memory.original_url])
  );

  return {
    customer: {
      id: customer.id,
      displayName: customer.display_name ?? 'ضيف مميز',
      phone: customer.phone ?? null,
      persona: customer.persona ?? null,
      createdAt: customer.created_at,
    },
    loyalty: {
      stampedCount,
      maxSlots,
      completedCardsCount: cards.length,
      totalVerifiedVisits,
      lastStampedAt: lastVerifiedAt,
      rewardName: rule?.name ?? cards[0]?.reward_name ?? null,
      nextTier: nextTierRow
        ? {
            threshold: nextTierRow.threshold,
            title: nextTierRow.title,
            remaining: Math.max(0, nextTierRow.threshold - stampedCount),
          }
        : null,
    },
    rewards: openRewards.map((card) => ({
      id: card.id,
      name: card.reward_name,
      threshold: card.threshold,
      unlockedAt: card.unlocked_at,
    })),
    stamps: memories
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(0, 10)
      .map((memory) => ({
        memoryId: memory.id,
        takenAt: memory.created_at,
        thumbnailUrl: pickSigned(
          memoryUrls,
          memory.thumbnail_url,
          memory.optimized_url,
          memory.original_url
        ),
      }))
      .filter((stamp) => stamp.thumbnailUrl.length > 0),
    vouchers: (vouchersResult.data ?? []).map((voucher) => ({
      id: voucher.id,
      code: voucher.code,
      title: voucher.title,
      description: voucher.description ?? null,
      status: voucher.status,
      source: voucher.source ?? 'manual',
      expiresAt: voucher.expires_at ?? null,
      createdAt: voucher.created_at,
    })),
    ladder,
    promotion,
    memories: memories.slice(0, 12).map((memory) => ({
      id: memory.id,
      originalUrl: pickSigned(memoryUrls, memory.original_url, memory.optimized_url),
      thumbnailUrl: pickSigned(
        memoryUrls,
        memory.thumbnail_url,
        memory.optimized_url,
        memory.original_url
      ),
      caption: memory.caption,
      status: memory.status,
      visibility: memory.visibility,
      createdAt: memory.created_at,
    })),
    walletPass: walletResult.data
      ? { status: walletResult.data.status, shareUrl: walletResult.data.share_url ?? null }
      : null,
  };
}

/** Confirm a customer id belongs to the organization and is not deleted. */
export async function customerBelongsToOrganization(
  customerId: string,
  organizationId: string
): Promise<boolean> {
  const { data } = await createAdminClient()
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .maybeSingle();
  return Boolean(data);
}
