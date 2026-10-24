/**
 * Keeps issued Wallet passes in sync with the loyalty card.
 *
 * The stamps route derives the card purely from memories (one stamp per
 * captured memory, oldest-first, capped by the active reward rule's
 * threshold). This service recomputes the same count and pushes it to the
 * customer's already-issued pass via WalletWallet's PUT endpoint, so devices
 * that installed the pass receive an APNs push and refresh in place with a
 * lock-screen banner (changeMessage on the header field).
 *
 * All failures are non-fatal: callers (e.g. the capture route) must never
 * break because pass updates failed.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { phoneLookupVariants } from '@/lib/services/phone';
import {
  buildWalletWalletRequest,
  isWalletOutsourcingEnabled,
  WALLETWALLET_API_BASE,
} from './wallet-pass.service';
import type { DigitalWalletPassData } from './digital-wallet.service';

/** Same card-size fallback as the stamps route. */
const TOTAL_SLOTS_FALLBACK = 5;

const BRANCHES_CACHE_TTL_MS = 300_000;
let branchRowsCache: { rows: { id: string; slug: string | null }[]; expiresAt: number } | null = null;

interface EmbeddedMemory {
  original_url: string | null;
  optimized_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  status: string | null;
  branches: { id: string } | null;
}

export interface PassSyncInput {
  cafeSlug: string;
  phone: string;
  customerName?: string | null;
  giftTitle?: string | null;
  instagramHandle?: string | null;
}

export interface PassSyncResult {
  attempted: boolean;
  updated: boolean;
  reason?: 'outsourcing_disabled' | 'no_customer' | 'no_pass' | 'unchanged';
  serial?: string;
}

/**
 * Mirror of the stamps route's card math: non-deleted memories of the
 * customer's allowed branches, oldest-first, capped at the card size.
 */
export function computeStampedCount(
  memories: Pick<EmbeddedMemory, 'created_at' | 'status' | 'branches'>[],
  allowedBranchIds: Set<string>,
  totalSlots: number
): number {
  return memories
    .filter((m) => m.status !== 'deleted' && allowedBranchIds.has(m.branches?.id ?? ''))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(0, Math.max(1, totalSlots)).length;
}

/** Same primary-branch fallback as the stamps route. */
function resolveBranchAllowlist(rows: { id: string; slug: string | null }[], cafeSlug: string): Set<string> {
  const exact = rows.find((r) => r.slug === cafeSlug);
  if (exact) return new Set([exact.id]);
  return new Set(rows.slice(0, 1).map((r) => r.id));
}

/**
 * Pushes the current stamp count to the customer's installed pass.
 * Throws only on upstream/database errors the caller may want to log;
 * the three "nothing to do" outcomes return quietly.
 */
export async function syncWalletPassForCount(input: PassSyncInput): Promise<PassSyncResult> {
  if (!isWalletOutsourcingEnabled()) {
    return { attempted: false, updated: false, reason: 'outsourcing_disabled' };
  }

  const supabase = createAdminClient();

  const [{ data: customer, error: customerError }, branchRows, rewardRule] = await Promise.all([
    supabase
      .from('customers')
      .select(
        'id, memories!inner(original_url, optimized_url, thumbnail_url, created_at, status, branches!inner(id))'
      )
      .in('anonymous_id', phoneLookupVariants(input.phone))
      .maybeSingle(),
    (async () => {
      if (branchRowsCache && branchRowsCache.expiresAt > Date.now()) return branchRowsCache.rows;
      const { data } = await supabase.from('branches').select('id, slug').order('created_at', { ascending: true });
      if (!data) return [];
      branchRowsCache = { rows: data as { id: string; slug: string | null }[], expiresAt: Date.now() + BRANCHES_CACHE_TTL_MS };
      return branchRowsCache.rows;
    })(),
    supabase
      .from('reward_rules')
      .select('threshold')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (customerError || !customer) {
    return { attempted: false, updated: false, reason: 'no_customer' };
  }

  const totalSlots =
    rewardRule?.data && typeof rewardRule.data.threshold === 'number' && rewardRule.data.threshold > 0
      ? rewardRule.data.threshold
      : TOTAL_SLOTS_FALLBACK;
  const allowlist = resolveBranchAllowlist(branchRows, input.cafeSlug);
  const memories = ((customer as unknown as { memories: EmbeddedMemory[] | null } | null)?.memories ?? []);
  const stampedCount = computeStampedCount(memories, allowlist, totalSlots);

  const { data: link, error: linkError } = await supabase
    .from('wallet_pass_links')
    .select('id, pass_serial, last_stamped_count')
    .eq('customer_id', (customer as { id: string }).id)
    .eq('cafe_slug', input.cafeSlug)
    .maybeSingle();

  if (linkError || !link?.pass_serial) {
    return { attempted: false, updated: false, reason: 'no_pass' };
  }
  if (link.last_stamped_count === stampedCount) {
    return { attempted: false, updated: false, reason: 'unchanged' };
  }

  const passData: DigitalWalletPassData = {
    cafeSlug: input.cafeSlug,
    cafeName: 'Memories',
    customerPhone: input.phone,
    customerName: input.customerName || 'ضيف مميز',
    stampedCount,
    maxSlots: totalSlots,
    giftTitle: input.giftTitle || 'هدية خاصة مجانية',
    instagramHandle: input.instagramHandle || undefined,
  };
  const body = buildWalletWalletRequest(passData, stampedCount);

  const res = await fetch(`${WALLETWALLET_API_BASE}/api/passes/${encodeURIComponent(link.pass_serial)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.WALLETWALLET_API_KEY}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`walletwallet pass update failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  await supabase
    .from('wallet_pass_links')
    .update({ last_stamped_count: stampedCount, updated_at: new Date().toISOString() })
    .eq('id', link.id);

  return { attempted: true, updated: true, serial: link.pass_serial };
}
