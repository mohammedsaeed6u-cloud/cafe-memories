import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireMerchant } from '@/lib/server/context';

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get('customerId');
  const branchId = request.nextUrl.searchParams.get('branchId');
  if (!customerId || !branchId || !z.uuid().safeParse(customerId).success || !z.uuid().safeParse(branchId).success) {
    return apiError('Customer ID and branch required', 400);
  }
  const auth = await requireMerchant({ branchId });
  if (auth.error) return auth.error;
  const orgId = auth.context.membership.organizationId;
  const admin = createAdminClient();
  // A UUID from another tenant is not a guest lookup credential. The guest must
  // have explicitly opened this branch's page within the last two hours.
  const { data: checkin, error: checkinError } = await admin.from('customer_checkins').select('customer_id')
    .eq('customer_id', customerId).eq('organization_id', orgId).eq('branch_id', branchId)
    .gte('checked_in_at', new Date(Date.now() - 2 * 60 * 60_000).toISOString()).maybeSingle();
  if (checkinError) return apiError('Could not check guest presence', 503);
  if (!checkin) return apiError('Guest has not checked in to this branch', 404);
  const [customer, visits, rules] = await Promise.all([
    admin.from('customers').select('id, display_name').eq('id', customerId).is('deleted_at', null).maybeSingle(),
    admin.from('visits').select('*', { head: true, count: 'exact' }).eq('customer_id', customerId)
      .eq('organization_id', orgId).eq('verification_status', 'verified'),
    admin.from('reward_rules').select('id, name, threshold').eq('organization_id', orgId)
      .eq('trigger_type', 'visit_count').eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: true }).limit(1),
  ]);
  if (customer.error || visits.error || rules.error) return apiError('Could not load customer', 503);
  if (!customer.data) return apiError('Customer not found', 404);
  const rule = rules.data?.[0] ?? null;
  const { count, error } = rule ? await admin.from('reward_events').select('*', { head: true, count: 'exact' })
    .eq('customer_id', customerId).eq('organization_id', orgId).eq('type', 'reward_redeemed')
    .eq('reference_id', rule.id) : { count: 0, error: null };
  if (error) return apiError('Could not load customer rewards', 503);
  const verifiedVisits = visits.count ?? 0;
  return NextResponse.json({ customer: { id: customer.data.id, displayName: customer.data.display_name },
    verifiedVisits, rule, availableRewards: rule ? Math.max(0, Math.floor(verifiedVisits / rule.threshold) - (count ?? 0)) : 0 },
    { headers: { 'Cache-Control': 'no-store' } });
}
