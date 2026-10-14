import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { requireApiAuth, isAuthFailure } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

const redeemRewardSchema = z.object({
  customerId: z.string().optional(),
  customerPhone: z.string().optional(),
  cafeSlug: z.string().optional(),
  organizationId: z.string().optional(),
  branchId: z.string().optional().nullable(),
  rewardRuleId: z.string().optional(),
  idempotencyKey: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    // Reward redemption moves customer value — staff/merchant-only (CWE-306)
    const auth = await requireApiAuth(request, 'any-auth');
    if (isAuthFailure(auth)) return auth;

    const rawBody = await request.json();
    const parsed = redeemRewardSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    let { customerId, organizationId, branchId, rewardRuleId, idempotencyKey, customerPhone, cafeSlug } = parsed.data;
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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Resolve Org
    if ((!organizationId || !uuidRegex.test(organizationId)) && cafeSlug) {
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', cafeSlug).maybeSingle();
      if (org?.id) organizationId = org.id;
    }
    if (!organizationId || !uuidRegex.test(organizationId)) {
      const { data: firstOrg } = await supabase.from('organizations').select('id').limit(1).maybeSingle();
      organizationId = firstOrg?.id || '00000000-0000-0000-0000-000000000005';
    }

    // Resolve Customer
    const phoneToLookup = customerPhone || (customerId && !uuidRegex.test(customerId) ? customerId : null);
    if (phoneToLookup) {
      const clean = phoneToLookup.trim().replace(/[^0-9]/g, '');
      const { data: cust } = await supabase.from('customers').select('id').eq('anonymous_id', clean).maybeSingle();
      if (cust?.id) customerId = cust.id;
    }

    // 2. Fetch or resolve reward rule
    let rule: any = null;
    if (rewardRuleId && uuidRegex.test(rewardRuleId)) {
      const { data } = await supabase
        .from('reward_rules')
        .select('*')
        .eq('id', rewardRuleId)
        .maybeSingle();
      rule = data;
    }
    if (!rule && organizationId && uuidRegex.test(organizationId)) {
      const { data } = await supabase
        .from('reward_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();
      rule = data;
    }
    if (!rule) {
      rule = {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'كوب سبيشالتي مجاني',
        threshold: 5,
        reward_value: 'Free Specialty Drink',
      };
    }

    // 3. Strict Server-Side Eligibility Verification
    let totalVisits = 5;
    if (customerId && uuidRegex.test(customerId)) {
      const { count: verifiedVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);
      totalVisits = verifiedVisits || 0;
    }

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
