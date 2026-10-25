/**
 * GET /api/v1/merchant/customers?query=...
 *
 * Staff lookup by canonical phone or display name inside the caller's own
 * organization. A phone is contact data: this route never authenticates a
 * customer and never returns data from another tenant.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk } from '@/lib/server/route-helpers';
import { canonicalizePhone, isValidPhone, phoneLookupVariants } from '@/lib/services/phone';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const result = await requireOperator(request);
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';
  if (query.length < 2 || query.length > 80) {
    return jsonError(400, 'invalid_query', 'Enter at least two characters');
  }

  const admin = createAdminClient();
  let requestQuery = admin
    .from('customers')
    .select('id,display_name,phone,created_at,last_seen_at')
    .eq('organization_id', operator.organization.id)
    .is('deleted_at', null)
    .limit(20);

  if (isValidPhone(query)) {
    const variants = phoneLookupVariants(query);
    const canonical = canonicalizePhone(query);
    if (!variants.includes(canonical)) variants.push(canonical);
    requestQuery = requestQuery.in('phone', variants);
  } else {
    requestQuery = requestQuery.ilike('display_name', `%${query.replace(/[%_]/g, '')}%`);
  }

  const { data: customers, error } = await requestQuery;
  if (error) {
    console.error('merchant customer lookup failed:', error.code ?? 'unknown');
    return jsonError(503, 'customers_unavailable', 'Customer lookup is temporarily unavailable');
  }

  if (!customers || customers.length === 0) {
    return jsonOk({ customers: [] });
  }

  const ids = customers.map((customer) => customer.id);
  const { data: visits } = await admin
    .from('visits')
    .select('customer_id,verified_at')
    .eq('organization_id', operator.organization.id)
    .eq('verification_status', 'verified')
    .in('customer_id', ids);

  const visitCounts = new Map<string, { count: number; last: string | null }>();
  for (const visit of visits ?? []) {
    const entry = visitCounts.get(visit.customer_id) ?? { count: 0, last: null };
    entry.count += 1;
    if (!entry.last || visit.verified_at > entry.last) entry.last = visit.verified_at;
    visitCounts.set(visit.customer_id, entry);
  }

  return jsonOk({
    customers: customers.map((customer) => ({
      id: customer.id,
      displayName: customer.display_name ?? 'ضيف مميز',
      phone: customer.phone ?? null,
      totalVisits: visitCounts.get(customer.id)?.count ?? 0,
      lastVisit: visitCounts.get(customer.id)?.last ?? customer.last_seen_at ?? customer.created_at,
    })),
  });
}
