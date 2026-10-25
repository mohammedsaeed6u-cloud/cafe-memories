/**
 * GET /api/v1/merchant/customers/[id]/card
 *
 * The staff-facing loyalty card for one customer in the caller's organization.
 * The customer id is validated against the tenant before any data is read.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk } from '@/lib/server/route-helpers';
import { loadCustomerCard } from '@/lib/server/customer-card';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireOperator(_request);
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return jsonError(400, 'invalid_customer', 'A valid customer id is required');
  }

  const { data: customer } = await createAdminClient()
    .from('customers')
    .select('id,organization_id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!customer || customer.organization_id !== operator.organization.id) {
    return jsonError(404, 'customer_not_found', 'Customer not found');
  }

  const card = await loadCustomerCard(id, operator.organization.id);
  if (!card) return jsonError(404, 'card_not_found', 'Loyalty card not found');

  return jsonOk({ card });
}
