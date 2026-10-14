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
    const redemptions = rule ? admin.from('reward_events').select('*', { head: true, count: 'exact' })
      .eq('customer_id', auth.context.customerId).eq('organization_id', venue.organizationId)
      .eq('reference_id', rule.id).eq('type', 'reward_redeemed') : Promise.resolve({ count: 0, error: null });
    const [visitResult, redemptionResult] = await Promise.all([visits, redemptions]);
    if (visitResult.error || redemptionResult.error) return apiError('Could not load progress', 503);
    const verifiedVisits = visitResult.count ?? 0;
    const threshold = rule?.threshold ?? 0;
    const availableRewards = rule ? Math.max(0, Math.floor(verifiedVisits / threshold) - (redemptionResult.count ?? 0)) : 0;
    return NextResponse.json({ verifiedVisits, totalSlots: threshold,
      stampedCount: threshold ? verifiedVisits % threshold : 0, availableRewards, rewardRule: rule ?? null,
      isComplete: availableRewards > 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Loyalty progress failed:', error);
    return apiError('Progress unavailable', 503);
  }
}
