/**
 * GET /api/v1/wallet/pass?cafeSlug=...
 *
 * Issues (or reuses) the real WalletWallet pass for the signed customer. The
 * provider key never reaches the browser, and no `.pkpass` is fabricated
 * locally: the response is the provider's verified install URL.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { readCustomerSession } from '@/lib/customer-session';
import { loadPublicVenue } from '@/lib/server/public-venue';
import { issuePlatformWalletPass } from '@/lib/server/wallet-service';
import { jsonError, jsonOk } from '@/lib/server/route-helpers';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const limit = await consumeRateLimit(rateLimitKey(request, 'wallet-pass'), 10, 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  const session = await readCustomerSession(request);
  if (!session) return jsonError(401, 'unauthenticated', 'Customer session required');

  const cafeSlug = request.nextUrl.searchParams.get('cafeSlug');
  if (!cafeSlug) return jsonError(400, 'cafe_slug_required', 'cafeSlug is required');

  const venue = await loadPublicVenue(cafeSlug).catch(() => null);
  if (!venue) return jsonError(404, 'venue_not_found', 'Venue not available');

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from('customers')
    .select('id,organization_id')
    .eq('id', session.customerId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!customer || customer.organization_id !== venue.organization.id) {
    return jsonError(403, 'customer_scope', 'Session does not belong to this venue');
  }

  try {
    const pass = await issuePlatformWalletPass(venue.organization.id, customer.id);
    return jsonOk({
      serialNumber: pass.serialNumber,
      shareUrl: pass.shareUrl,
      reused: pass.reused,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Wallet pass unavailable';
    if (message.includes('not configured') || message.includes('credentials') || message.includes('key')) {
      return jsonError(503, 'wallet_unavailable', 'المحفظة غير مهيأة لهذا المتجر بعد');
    }
    if (message.includes('quota') || message.includes('429')) {
      return jsonError(429, 'wallet_quota', 'تم الوصول إلى حد إصدار بطاقات المحفظة');
    }
    console.error('wallet pass issue failed:', message);
    return jsonError(503, 'wallet_unavailable', 'تعذر إصدار بطاقة المحفظة الآن');
  }
}
