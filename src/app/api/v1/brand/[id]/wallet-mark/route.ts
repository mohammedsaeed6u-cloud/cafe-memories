/**
 * GET /api/v1/brand/[id]/wallet-mark
 *
 * The same validated PNG as `/logo`, served under the path WalletWallet fetches
 * for pass artwork. No customer data is involved.
 */

import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/server/route-helpers';
import { BRAND_LOGO_CACHE, loadBrandLogo } from '@/lib/server/brand-logo';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return jsonError(404, 'logo_not_found', 'Logo not found');

  const logo = await loadBrandLogo(id);
  if (!logo) return jsonError(404, 'logo_not_found', 'Logo not found');

  return new Response(logo.bytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(logo.bytes.byteLength),
      'Cache-Control': BRAND_LOGO_CACHE,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
