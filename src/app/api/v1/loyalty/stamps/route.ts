import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  LOYALTY_TOTAL_SLOTS,
  pickMemoryThumbnail,
  getStampState,
  getCachedLoyaltyStamps,
  setCachedLoyaltyStamps,
  type LoyaltyStampSlot,
} from '@/lib/services/loyalty-stamps';

/**
 * GET /api/v1/loyalty/stamps?cafeSlug=...&phone=...
 *
 * Derives the customer's loyalty stamp card from real captured memories.
 * Every non-deleted memory = one stamp; the stamp image is the memory's
 * thumbnail. Slots fill oldest-first, mirroring the physical card metaphor.
 *
 * Performance: at most one round-trip of latency. The customer->memories
 * embed and the (cached) branch list run in parallel; repeat visits within
 * the 30s TTL answer from memory without touching the database. The capture
 * route invalidates the cache explicitly, so fresh stamps are never hidden.
 *
 * Response: { ok, slots, stampedCount, totalSlots, isComplete }
 */

/** Embedded memory row (branch resolved through the memories->branches FK). */
interface EmbeddedMemory {
  original_url: string | null;
  optimized_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  status: string | null;
  branches: { id: string } | null;
}

interface BranchRow {
  id: string;
  slug: string | null;
}

/* ------------------------------------------------------------------ *
 * Branch allowlist cache — branches change rarely, cache the small
 * list for 5 minutes so the common path needs a single query.
 * ------------------------------------------------------------------ */

const BRANCHES_CACHE_TTL_MS = 300_000;
let branchRowsCache: { rows: BranchRow[]; expiresAt: number } | null = null;

async function getBranchRows(supabase: ReturnType<typeof createAdminClient>): Promise<BranchRow[]> {
  if (branchRowsCache && branchRowsCache.expiresAt > Date.now()) {
    return branchRowsCache.rows;
  }
  const { data, error } = await supabase
    .from('branches')
    .select('id, slug')
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  branchRowsCache = { rows: data as BranchRow[], expiresAt: Date.now() + BRANCHES_CACHE_TTL_MS };
  return branchRowsCache.rows;
}

/**
 * Branch ids whose memories count for `cafeSlug`: the exact slug branch when
 * it exists, otherwise the venue's primary (oldest) branch — the same
 * demo/sandbox fallback as before.
 */
function resolveBranchAllowlist(rows: BranchRow[], cafeSlug: string): Set<string> {
  const exact = rows.find((r) => r.slug === cafeSlug);
  if (exact) return new Set([exact.id]);
  return new Set(rows.slice(0, 1).map((r) => r.id));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cafeSlug = searchParams.get('cafeSlug')?.trim();
    const digitsOnly = searchParams.get('phone')?.replace(/\D/g, '') ?? '';

    if (!cafeSlug || digitsOnly.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'cafeSlug and a valid phone are required' },
        { status: 400 }
      );
    }

    // The capture route stores the phone exactly as normalized at capture
    // time ("+2010…" when the customer typed a "+", digits-only otherwise).
    // Look up both forms so the card is found regardless of convention.
    const phoneVariants = [...new Set([digitsOnly, `+${digitsOnly}`])];

    // Burst protection: same customer + cafe within the TTL answers from
    // memory without touching the database at all.
    const cached = getCachedLoyaltyStamps(cafeSlug, digitsOnly);
    if (cached) {
      const state = getStampState(cached);
      return NextResponse.json({
        ok: true,
        slots: cached,
        stampedCount: state.stampedCount,
        totalSlots: LOYALTY_TOTAL_SLOTS,
        isComplete: state.isComplete,
      });
    }

    const supabase = createAdminClient();

    // One round-trip of latency: the embed plus the (usually cached) branch
    // list fire together. No sequential query chain on any path. Sorting and
    // the 10-slot cap happen in-memory (PostgREST cannot order embedded rows
    // portably, and a card holds at most 10 stamps).
    const [{ data, error }, branchRows] = await Promise.all([
      supabase
        .from('customers')
        .select(
          'memories!inner(original_url, optimized_url, thumbnail_url, created_at, status, branches!inner(id))'
        )
        .in('anonymous_id', phoneVariants)
        .maybeSingle(),
      getBranchRows(supabase),
    ]);

    if (error) {
      console.error('loyalty/stamps query failed:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to load memories' },
        { status: 500 }
      );
    }

    const memories = ((data as { memories: EmbeddedMemory[] | null } | null)?.memories ?? [])
      .filter((m) => m.status !== 'deleted')
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(0, LOYALTY_TOTAL_SLOTS);
    const allowedBranchIds = resolveBranchAllowlist(branchRows, cafeSlug);

    const slots: LoyaltyStampSlot[] = memories
      .filter((m) => allowedBranchIds.has(m.branches?.id ?? ''))
      .map((m) => ({
        takenAt: m.created_at,
        thumbnailUrl: pickMemoryThumbnail({
          thumbnailUrl: m.thumbnail_url,
          optimizedUrl: m.optimized_url,
          originalUrl: m.original_url,
        }),
      }))
      .filter((s) => s.thumbnailUrl.length > 0);

    setCachedLoyaltyStamps(cafeSlug, digitsOnly, slots);

    const state = getStampState(slots);

    return NextResponse.json({
      ok: true,
      slots,
      stampedCount: state.stampedCount,
      totalSlots: LOYALTY_TOTAL_SLOTS,
      isComplete: state.isComplete,
    });
  } catch (err) {
    console.error('loyalty/stamps unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
