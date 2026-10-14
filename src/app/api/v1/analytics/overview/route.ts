import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireMerchant } from '@/lib/server/context';

export async function GET(request: NextRequest) {
  const auth = await requireMerchant({
    organizationId: request.nextUrl.searchParams.get('organizationId'),
    branchId: request.nextUrl.searchParams.get('branchId'),
  });
  if (auth.error) return auth.error;
  const branchId = auth.context.membership.branchId ?? request.nextUrl.searchParams.get('branchId');
  const { data, error } = await auth.context.db.rpc('merchant_overview', {
    p_organization_id: auth.context.membership.organizationId, p_branch_id: branchId ?? null,
  });
  if (error) {
    console.error('Overview query failed:', error);
    return apiError('Overview unavailable', 503);
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
