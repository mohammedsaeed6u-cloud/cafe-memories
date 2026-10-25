/**
 * GET /api/v1/crm/customers
 *
 * Cursor-paginated customer list built only from verified visits. The SQL
 * function never scans private photo content, pending uploads, phone numbers,
 * or unconfirmed presences. The caller's organization and branch come from the
 * verified operator session.
 *
 * Query: limit, before (ISO), beforeCustomer (uuid), search
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk } from '@/lib/server/route-helpers';

export const runtime = 'nodejs';

const cursorSchema = z.object({
  before: z.string().datetime(),
  beforeCustomer: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const branchId = params.get('branchId') ?? undefined;

  const result = await requireOperator(request, {
    branchId,
    roles: ['owner', 'admin', 'manager'],
  });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const rawLimit = Number.parseInt(params.get('limit') ?? '30', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;

  const before = params.get('before');
  const beforeCustomer = params.get('beforeCustomer');
  let cursor: { before: string; beforeCustomer: string } | null = null;
  if (before || beforeCustomer) {
    const parsed = cursorSchema.safeParse({ before, beforeCustomer });
    if (!parsed.success) {
      return jsonError(400, 'invalid_cursor', 'before and beforeCustomer must be supplied together');
    }
    cursor = parsed.data;
  }

  const search = params.get('search')?.trim() ?? null;
  if (search && search.length > 80) {
    return jsonError(400, 'search_too_long', 'Search is limited to 80 characters');
  }

  const { data, error } = await createAdminClient().rpc('merchant_crm_customers', {
    p_org: operator.organization.id,
    p_branch: operator.branchId,
    p_limit: limit,
    p_before: cursor?.before ?? null,
    p_before_customer: cursor?.beforeCustomer ?? null,
    p_search: search,
  });

  if (error) {
    if (error.code === '42501') {
      return jsonError(403, 'crm_forbidden', 'CRM access required');
    }
    console.error('merchant_crm_customers failed:', error.code ?? 'unknown');
    return jsonError(503, 'crm_unavailable', 'Customer data is temporarily unavailable');
  }

  type Row = {
    customer_id: string;
    display_name: string;
    last_visit_at: string;
    verified_visits: number | string;
    rewards_redeemed: number | string;
    wallet_issued: boolean;
    wallet_marketing_opt_in: boolean;
  };

  const rows = (data ?? []) as Row[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return jsonOk({
    customers: page.map((row) => ({
      id: row.customer_id,
      displayName: row.display_name,
      totalVisits: Number(row.verified_visits) || 0,
      lastSeenAt: row.last_visit_at,
      rewardsCount: Number(row.rewards_redeemed) || 0,
      memoriesCount: 0,
      walletIssued: Boolean(row.wallet_issued),
      marketingOptIn: Boolean(row.wallet_marketing_opt_in),
    })),
    nextCursor:
      hasMore && last ? { before: last.last_visit_at, beforeCustomer: last.customer_id } : null,
  });
}
