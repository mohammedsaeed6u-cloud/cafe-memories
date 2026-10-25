/**
 * GET /api/v1/analytics/overview
 *
 * Today's verified visits, live-wall activity, redemptions, and screen health
 * for the caller's own organization/branch. The tenant comes from the verified
 * session, never from a query string.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk } from '@/lib/server/route-helpers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get('branchId') ?? undefined;
  const result = await requireOperator(request, { branchId });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const { data, error } = await createAdminClient().rpc('merchant_overview', {
    p_organization_id: operator.organization.id,
    p_branch_id: operator.branchId,
  });

  if (error) {
    if (error.code === '22023') {
      return jsonError(404, 'branch_not_found', 'Branch not available');
    }
    console.error('merchant_overview failed:', error.code ?? 'unknown');
    return jsonError(503, 'analytics_unavailable', 'Analytics are temporarily unavailable');
  }

  return jsonOk({ metrics: data ?? null });
}
