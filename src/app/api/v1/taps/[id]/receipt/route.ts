/**
 * GET /api/v1/taps/[id]/receipt
 *
 * A tap receipt is readable only by the signed customer session that owns it.
 * Merchants already see the same event in `merchant_insights`; a customer id is
 * never accepted from the client.
 */

import { NextRequest } from 'next/server';
import { jsonError, jsonOk } from '@/lib/server/route-helpers';
import { loadTapReceipt } from '@/lib/server/tap-service';
import { readCustomerSession } from '@/lib/customer-session';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return jsonError(400, 'invalid_receipt', 'Invalid receipt');

  const claims = await readCustomerSession(_request);
  if (!claims) return jsonError(401, 'no_session', 'Tap the tag again to open this receipt');

  const receipt = await loadTapReceipt(id, claims.customerId);
  if (!receipt) return jsonError(404, 'receipt_not_found', 'Receipt not found');

  return jsonOk({ receipt });
}
