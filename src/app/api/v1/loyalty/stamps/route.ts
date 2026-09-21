import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  LOYALTY_TOTAL_SLOTS,
  pickMemoryThumbnail,
  getStampState,
  type LoyaltyStampSlot,
} from '@/lib/services/loyalty-stamps';

/**
 * GET /api/v1/loyalty/stamps?cafeSlug=...&phone=...
 *
 * Derives the customer's loyalty stamp card from real captured memories.
 * Every non-deleted memory = one stamp; the stamp image is the memory's
 * thumbnail. Slots fill oldest-first, mirroring the physical card metaphor.
 *
 * Response: { ok, slots, stampedCount, totalSlots, isComplete }
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cafeSlug = searchParams.get('cafeSlug')?.trim();
    const phone = searchParams.get('phone')?.trim().replace(/[^0-9]/g, '');

    if (!cafeSlug || !phone || phone.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'cafeSlug and a valid phone are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Resolve branch by slug (same pattern as the capture route).
    // Fallback to the venue's primary branch when the slug has no exact row
    // (demo/sandbox slugs don't exist in the branches table).
    let branchId: string | undefined;
    {
      const { data: branchBySlug } = await supabase
        .from('branches')
        .select('id, organization_id')
        .eq('slug', cafeSlug)
        .maybeSingle();
      branchId = branchBySlug?.id;

      if (!branchId) {
        const { data: primaryBranch } = await supabase
          .from('branches')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        branchId = primaryBranch?.id;
      }
    }

    // The capture route stores the normalized phone on the customer record
    // (anonymous_id keeps the digits-only form). Look up the customer first.
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('anonymous_id', phone)
      .maybeSingle();

    if (!customer || !branchId) {
      // No cloud history yet — the client falls back to local stamps.
      return NextResponse.json({
        ok: true,
        slots: [] as LoyaltyStampSlot[],
        stampedCount: 0,
        totalSlots: LOYALTY_TOTAL_SLOTS,
        isComplete: false,
      });
    }

    const { data: memories, error } = await supabase
      .from('memories')
      .select('original_url, optimized_url, thumbnail_url, created_at, status')
      .eq('customer_id', customer.id)
      .eq('branch_id', branchId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: true })
      .limit(LOYALTY_TOTAL_SLOTS);

    if (error) {
      console.error('loyalty/stamps query failed:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Failed to load memories' },
        { status: 500 }
      );
    }

    const slots: LoyaltyStampSlot[] = (memories || [])
      .map((m) => ({
        takenAt: m.created_at,
        thumbnailUrl: pickMemoryThumbnail({
          thumbnailUrl: m.thumbnail_url,
          optimizedUrl: m.optimized_url,
          originalUrl: m.original_url,
        }),
      }))
      .filter((s) => s.thumbnailUrl.length > 0);

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
