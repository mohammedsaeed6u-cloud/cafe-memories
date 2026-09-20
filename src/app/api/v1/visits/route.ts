import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateVisitEligibility } from '@/lib/services/anti-fraud';
import { calculateRewardProgress } from '@/lib/services/rewards';
import { z } from 'zod';

const createVisitRequestSchema = z.object({
  customerId: z.string().uuid(),
  branchId: z.string().uuid(),
  organizationId: z.string().uuid(),
  qrCodeId: z.string().uuid().optional().nullable(),
  deviceFingerprint: z.string().max(128).optional().nullable(),
  source: z.string().default('qr_scan'),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = createVisitRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const { customerId, branchId, organizationId, qrCodeId, deviceFingerprint, source } = parsed.data;
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

    const supabase = createAdminClient();

    // 1. Fetch recent visits for anti-fraud evaluation
    const { data: recentVisitsData } = await supabase
      .from('visits')
      .select('created_at, device_fingerprint, ip_hash')
      .eq('customer_id', customerId)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })
      .limit(10);

    const mappedVisits = (recentVisitsData || []).map(v => ({
      createdAt: v.created_at,
      deviceFingerprint: v.device_fingerprint,
      ipHash: v.ip_hash,
    }));

    // 2. Evaluate Anti-Fraud Rules
    const fraudEvaluation = evaluateVisitEligibility({
      customerId,
      branchId,
      deviceFingerprint,
      ipAddress: clientIp,
      recentVisits: mappedVisits,
    });

    if (fraudEvaluation.status === 'cooldown_rejected') {
      return NextResponse.json(
        {
          success: false,
          error: fraudEvaluation.reason,
          cooldownRemainingMinutes: fraudEvaluation.cooldownRemainingMinutes,
        },
        { status: 429 }
      );
    }

    // 3. Record visit
    const { data: newVisit, error: visitError } = await supabase
      .from('visits')
      .insert({
        customer_id: customerId,
        branch_id: branchId,
        organization_id: organizationId,
        qr_code_id: qrCodeId || null,
        source,
        verification_status: fraudEvaluation.status,
        device_fingerprint: deviceFingerprint || null,
        ip_hash: fraudEvaluation.ipHash,
      })
      .select()
      .single();

    if (visitError) {
      return NextResponse.json({ error: 'Failed to record visit', details: visitError.message }, { status: 500 });
    }

    // 4. Calculate loyalty progression & active rewards
    const { count: totalVisits } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .eq('branch_id', branchId)
      .eq('verification_status', 'verified');

    const visitCount = totalVisits || 1;

    // Check branch reward rules
    const { data: rules } = await supabase
      .from('reward_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('threshold', { ascending: true });

    const activeRule = rules && rules.length > 0 ? rules[0] : { id: 'default', threshold: 5, reward_type: 'free_item' };
    const rewardProgress = calculateRewardProgress({
      currentVisitCount: visitCount,
      threshold: activeRule.threshold || 5,
      rewardType: activeRule.reward_type || 'free_item',
      ruleId: activeRule.id || 'default',
    });

    return NextResponse.json({
      success: true,
      visitId: newVisit.id,
      verificationStatus: fraudEvaluation.status,
      currentVisits: visitCount,
      rewardProgress,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
