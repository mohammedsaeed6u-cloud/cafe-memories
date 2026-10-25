/**
 * GET /api/v1/merchant/insights?days=30&branchId=…
 *
 * One round trip for the growth dashboard: taps, stamps, new vs returning
 * customers, reward claims, a daily series, a weekday×hour heatmap, a branch
 * comparison, and the top customers. Everything is computed inside the
 * database so the Worker stays small and the numbers stay consistent.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk } from '@/lib/server/route-helpers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const branchId = params.get('branchId') ?? undefined;
  const days = Number(params.get('days') ?? 30);

  const result = await requireOperator(request, { branchId });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const { data, error } = await createAdminClient().rpc('merchant_insights', {
    p_organization_id: operator.organization.id,
    p_branch_id: operator.branchId,
    p_days: Number.isFinite(days) ? Math.round(days) : 30,
  });

  if (error) {
    if (error.code === '22023') {
      return jsonError(404, 'branch_not_found', 'Branch not available');
    }
    console.error('merchant_insights failed:', error.code ?? 'unknown');
    return jsonError(503, 'insights_unavailable', 'Insights are temporarily unavailable');
  }

  return jsonOk({ insights: data ?? null });
}
