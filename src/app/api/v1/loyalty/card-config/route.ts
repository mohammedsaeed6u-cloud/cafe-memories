import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPinOnly } from '@/lib/services/staff-auth.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/loyalty/card-config?cafeSlug=...
 *
 * The merchant-authoritative loyalty card shape lives in the active
 * `reward_rules` row ("N visits -> free gift"). The threshold IS the slot
 * count: one card, one rule, zero conflicting counters.
 *
 * Response: { ok, totalSlots, ruleName, rewardTitle }
 */

const DEFAULT_TOTAL_SLOTS = 5;

export async function GET(request: NextRequest) {
  try {
    const cafeSlug = new URL(request.url).searchParams.get('cafeSlug')?.trim();
    if (!cafeSlug) {
      return NextResponse.json({ ok: false, error: 'cafeSlug is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data } = await supabase
      .from('reward_rules')
      .select('threshold, name')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const totalSlots =
      data && typeof data.threshold === 'number' && data.threshold >= 1
        ? Math.floor(data.threshold)
        : DEFAULT_TOTAL_SLOTS;

    return NextResponse.json({
      ok: true,
      cafeSlug,
      totalSlots,
      ruleName: data?.name ?? null,
      rewardTitle: data?.name ?? null,
    });
  } catch (err) {
    console.error('loyalty/card-config GET failed:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected server error' }, { status: 500 });
  }
}

const cardConfigSchema = z.object({
  totalSlots: z.number().int().min(3).max(12),
  staffPin: z.string().min(4).max(4),
});

/**
 * POST /api/v1/loyalty/card-config
 * Body: { totalSlots, staffPin }
 *
 * Updates the active rule's threshold — i.e. the card's slot count. Not
 * rate-limited hard (it is merchant-facing, not public), but it requires a
 * valid staff Quick PIN so a stray customer cannot reshape the card.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = cardConfigSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'totalSlots (3-12) and a 4-digit staffPin are required' },
        { status: 400 }
      );
    }

    const auth = await verifyPinOnly(parsed.data.staffPin);
    if (!auth.success) {
      return NextResponse.json({ ok: false, error: auth.error ?? 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: activeRule, error } = await supabase
      .from('reward_rules')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('loyalty/card-config rule lookup failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 });
    }

    const { data: anyRule } = await supabase
      .from('reward_rules')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const targetId = activeRule?.id ?? anyRule?.id ?? null;
    if (!targetId) {
      return NextResponse.json(
        { ok: false, error: 'No reward rule exists yet; seed one first' },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from('reward_rules')
      .update({ threshold: parsed.data.totalSlots })
      .eq('id', targetId);

    if (updateError) {
      console.error('loyalty/card-config update failed:', updateError.message);
      return NextResponse.json({ ok: false, error: 'Failed to update rule' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, totalSlots: parsed.data.totalSlots });
  } catch (err) {
    console.error('loyalty/card-config POST failed:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected server error' }, { status: 500 });
  }
}
