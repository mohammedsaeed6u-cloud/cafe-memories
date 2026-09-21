import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const redeemRewardSchema = z.object({
  customerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().optional().nullable(),
  rewardRuleId: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = redeemRewardSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const { customerId, organizationId, branchId, rewardRuleId, idempotencyKey } = parsed.data;
    const supabase = createAdminClient();

    // 1. Idempotency Check: Return prior transaction if already processed
    const { data: existingEvent } = await supabase
      .from('reward_events')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingEvent) {
      return NextResponse.json({
        success: true,
        replayed: true,
        rewardEventId: existingEvent.id,
        redeemedAt: existingEvent.created_at,
      });
    }

    // 2. Fetch reward rule
    const { data: rule, error: ruleError } = await supabase
      .from('reward_rules')
      .select('*')
      .eq('id', rewardRuleId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (ruleError || !rule) {
      return NextResponse.json({ error: 'Reward rule not found or inactive' }, { status: 404 });
    }

    // 3. Strict Server-Side Eligibility Verification
    const { count: verifiedVisits } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .eq('verification_status', 'verified');

    const totalVisits = verifiedVisits || 0;

    // Check past redemptions count for this rule
    const { count: pastRedemptions } = await supabase
      .from('reward_events')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .eq('organization_id', organizationId)
      .eq('reference_id', rule.id)
      .eq('type', 'reward_redeemed');

    const redeemedCount = pastRedemptions || 0;
    const eligibleRedemptions = Math.floor(totalVisits / (rule.threshold || 5));

    if (redeemedCount >= eligibleRedemptions) {
      return NextResponse.json(
        {
          error: 'العميل لا يمتلك زيارات كافية لصرف هذه المكافأة',
          requiredVisits: rule.threshold,
          currentVisits: totalVisits,
          redeemedCount,
        },
        { status: 403 }
      );
    }

    // 4. Atomically record redemption event
    const { data: newEvent, error: insertError } = await supabase
      .from('reward_events')
      .insert({
        customer_id: customerId,
        organization_id: organizationId,
        branch_id: branchId || null,
        type: 'reward_redeemed',
        value: 1,
        reference_type: 'reward_rules',
        reference_id: rule.id,
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Redemption failed', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rewardEventId: newEvent.id,
      rewardName: rule.name,
      rewardValue: rule.reward_value,
      redeemedAt: newEvent.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
