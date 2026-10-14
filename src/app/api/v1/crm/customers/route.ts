import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireMerchant } from '@/lib/server/context';

/** Aggregated, paged CRM. No photo joins and no guest contact information. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const beforeAt = params.get('beforeAt');
  const beforeCustomer = params.get('beforeCustomer');
  const search = params.get('search')?.trim() || null;
  if (Boolean(beforeAt) !== Boolean(beforeCustomer) ||
      (beforeAt && (!Number.isFinite(Date.parse(beforeAt)) || !z.iso.datetime({ offset: true }).safeParse(beforeAt).success)) ||
      (beforeCustomer && !z.uuid().safeParse(beforeCustomer).success) ||
      (search && search.length > 80)) return apiError('Invalid CRM filter', 400);
  const auth = await requireMerchant({ organizationId: params.get('organizationId'),
    branchId: params.get('branchId'), roles: ['owner','admin','manager'] });
  if (auth.error) return auth.error;
  const member = auth.context.membership;
  const { data, error } = await auth.context.db.rpc('merchant_crm_customers', {
    p_org: member.organizationId, p_branch: member.branchId ?? params.get('branchId'),
    p_limit: 30, p_before: beforeAt, p_before_customer: beforeCustomer, p_search: search,
  });
  if (error) return apiError('CRM unavailable', 503);
  const page = (data ?? []).slice(0,30);
  const last = page.at(-1);
  return NextResponse.json({ customers: page.map((row) => ({ id: row.customer_id,
    displayName: row.display_name, lastVisitAt: row.last_visit_at,
    verifiedVisits: row.verified_visits, rewardsRedeemed: row.rewards_redeemed,
    walletIssued: row.wallet_issued, walletMarketingOptIn: row.wallet_marketing_opt_in })),
  nextCursor: (data?.length ?? 0) > 30 && last
    ? { beforeAt: last.last_visit_at, beforeCustomer: last.customer_id } : null },
  { headers: { 'Cache-Control': 'no-store' } });
}
