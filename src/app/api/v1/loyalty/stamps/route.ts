import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireCustomer, resolveVenue } from '@/lib/server/context';

/** The authenticated guest's verified visits, never a phone-keyed public lookup. */
export async function GET(request: NextRequest) {
  const auth = await requireCustomer();
  if (auth.error) return auth.error;
  const cafeSlug = request.nextUrl.searchParams.get('cafeSlug');
  const branchSlug = request.nextUrl.searchParams.get('branchSlug');
  if (!cafeSlug) return apiError('cafeSlug is required', 400);
  try {
    const venue = await resolveVenue(cafeSlug, branchSlug);
    if (!venue) return apiError('Venue not found', 404);
    const admin = createAdminClient();
    const { data: rules, error: ruleError } = await admin.from('reward_rules')
      .select('id, name, threshold').eq('organization_id', venue.organizationId)
      .eq('is_active', true).eq('trigger_type', 'visit_count')
      .lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: true }).limit(1);
    if (ruleError) return apiError('Could not load reward rule', 503);
    const rule = rules?.[0];
    const visits = admin.from('visits').select('*', { head: true, count: 'exact' })
      .eq('customer_id', auth.context.customerId).eq('organization_id', venue.organizationId)
      .eq('verification_status', 'verified');
    const [visitResult, balanceResult] = await Promise.all([visits,
      admin.rpc('get_keepsake_balance', {
        p_customer_id: auth.context.customerId, p_organization_id: venue.organizationId,
      }),
    ]);
    if (visitResult.error || balanceResult.error || !balanceResult.data ||
        typeof balanceResult.data !== 'object' || Array.isArray(balanceResult.data)) {
      return apiError('Could not load progress', 503);
    }
    const balance = balanceResult.data as {
      usedVisits?: number; availableRewards?: number; oldestRewardName?: string | null;
    };
    if (typeof balance.usedVisits !== 'number' || !Number.isSafeInteger(balance.usedVisits) ||
        typeof balance.availableRewards !== 'number' || !Number.isSafeInteger(balance.availableRewards)) {
      return apiError('Could not load progress', 503);
    }
    const verifiedVisits = visitResult.count ?? 0;
    const threshold = rule?.threshold ?? 0;
    const availableRewards = rule ? balance.availableRewards : 0;
    const stampedCount = threshold ? Math.min(threshold, Math.max(0, verifiedVisits - balance.usedVisits)) : 0;
    return NextResponse.json({ verifiedVisits, totalSlots: threshold,
      stampedCount, availableRewards, rewardRule: rule ?? null,
      pendingRewardName: availableRewards ? balance.oldestRewardName ?? rule?.name ?? null : null,
      isComplete: availableRewards > 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Loyalty progress failed:', error);
    return apiError('Progress unavailable', 503);
  }
}
