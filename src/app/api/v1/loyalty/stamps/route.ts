/**
 * GET /api/v1/loyalty/stamps?cafeSlug=...
 *
 * The signed customer session is the only identity. The old `phone` query
 * parameter let anyone read another guest's stamp card by guessing a number;
 * it is no longer accepted.
 *
 * The card is derived from immutable rows: verified visits allocate keepsake
 * cards once, and a redeemed card consumes one. The client never computes
 * progress.
 */

import { NextRequest } from 'next/server';
import { readCustomerSession } from '@/lib/customer-session';
import { loadPublicVenue } from '@/lib/server/public-venue';
import { loadCustomerCard } from '@/lib/server/customer-card';
import { jsonError, jsonOk } from '@/lib/server/route-helpers';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const limit = await consumeRateLimit(rateLimitKey(request, 'loyalty-stamps'), 120, 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  const session = await readCustomerSession(request);
  if (!session) return jsonError(401, 'unauthenticated', 'Customer session required');

  const cafeSlug = request.nextUrl.searchParams.get('cafeSlug');
  if (!cafeSlug) return jsonError(400, 'cafe_slug_required', 'cafeSlug is required');

  let venue;
  try {
    venue = await loadPublicVenue(cafeSlug);
  } catch {
    return jsonError(503, 'venue_unavailable', 'Venue lookup failed');
  }
  if (!venue) return jsonError(404, 'venue_not_found', 'Venue not available');

  const card = await loadCustomerCard(session.customerId, venue.organization.id);
  if (!card) return jsonError(404, 'card_not_found', 'No loyalty card for this venue');

  const totalSlots = card.loyalty.maxSlots;
  return jsonOk({
    slots: card.stamps,
    stampedCount: card.loyalty.stampedCount,
    totalSlots,
    isComplete: card.loyalty.stampedCount >= totalSlots,
    completedCardsCount: card.loyalty.completedCardsCount,
    totalVerifiedVisits: card.loyalty.totalVerifiedVisits,
    lastStampedAt: card.loyalty.lastStampedAt,
    rewardName: card.loyalty.rewardName,
  });
}
