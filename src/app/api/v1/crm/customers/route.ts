import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireMerchant } from '@/lib/server/context';

/** A bounded, tenant-scoped page of recent customer visits (no global table scan). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const auth = await requireMerchant({ organizationId: params.get('organizationId'), branchId: params.get('branchId') });
  if (auth.error) return auth.error;
  const member = auth.context.membership;
  const branchId = member.branchId ?? params.get('branchId');
  let query = createAdminClient().from('visits')
    .select('customer_id, created_at, customers(id, display_name)')
    .eq('organization_id', member.organizationId)
    .order('created_at', { ascending: false }).limit(101);
  if (branchId) query = query.eq('branch_id', branchId);
  const before = params.get('before');
  if (before) {
    if (Number.isNaN(Date.parse(before))) return apiError('Invalid cursor', 400);
    query = query.lt('created_at', before);
  }
  const { data, error } = await query;
  if (error) {
    console.error('CRM query failed:', error);
    return apiError('CRM unavailable', 503);
  }
  const page = (data ?? []).slice(0, 100);
  const grouped = new Map<string, { id: string; displayName: string; lastSeenAt: string; visitsOnPage: number }>();
  for (const visit of page) {
    const customer = Array.isArray(visit.customers) ? visit.customers[0] : visit.customers;
    if (!customer) continue;
    const row = grouped.get(customer.id);
    if (row) row.visitsOnPage++;
    else grouped.set(customer.id, { id: customer.id, displayName: customer.display_name ?? 'Guest',
      lastSeenAt: visit.created_at, visitsOnPage: 1 });
  }
  return NextResponse.json({ customers: [...grouped.values()],
    nextCursor: (data?.length ?? 0) > 100 ? page[page.length - 1]?.created_at : null },
    { headers: { 'Cache-Control': 'no-store' } });
}
