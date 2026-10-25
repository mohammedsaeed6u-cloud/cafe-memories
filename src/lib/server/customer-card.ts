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
  code: string;
  title: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
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
  };
  rewards: CustomerCardReward[];
  stamps: CustomerCardStamp[];
  vouchers: CustomerCardVoucher[];
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
      .is('redeemed_at', null)
      .order('sequence_number', { ascending: true }),
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
      .select('code,title,status,expires_at,created_at')
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .eq('status', 'issued')
      .order('created_at', { ascending: false })
      .limit(10),
    admin
      .from('wallet_passes')
      .select('status,share_url')
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .maybeSingle(),
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
  }>;
  const usedVisits = cards.reduce((total, card) => total + (card.threshold || 0), 0);
  const totalVerifiedVisits = visitsResult.count ?? 0;
  const stampedCount = Math.max(0, Math.min(maxSlots, totalVerifiedVisits - usedVisits));
  const lastVerifiedAt = (visitsResult.data ?? [])[0]?.verified_at ?? null;

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
      rewardName: cards[0]?.reward_name ?? rule?.name ?? null,
    },
    rewards: cards.map((card) => ({
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
      code: voucher.code,
      title: voucher.title,
      status: voucher.status,
      expiresAt: voucher.expires_at ?? null,
      createdAt: voucher.created_at,
    })),
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
