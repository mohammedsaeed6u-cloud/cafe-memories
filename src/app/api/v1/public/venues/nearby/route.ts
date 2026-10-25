/**
 * GET /api/v1/public/venues/nearby
 *
 * The public discovery directory. Only venues that opted in and have an active,
 * discoverable branch appear. No customer data, no membership data, no billing.
 * Distance is haversine over the existing latitude/longitude columns; PostGIS
 * is not needed on the free plan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonError } from '@/lib/server/route-helpers';
import { isBrandLogoKey } from '@/lib/brand';
import { clientIp, consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function numberParam(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: NextRequest) {
  const limit = await consumeRateLimit(rateLimitKey(request, 'venues-nearby'), 120, 60 * 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  const params = request.nextUrl.searchParams;
  const lat = numberParam(params.get('lat'));
  const lng = numberParam(params.get('lng'));
  const radius = numberParam(params.get('radius')) ?? 50;
  const limitParam = numberParam(params.get('limit')) ?? 50;
  const category = (params.get('category') ?? '').trim() || null;

  if (
    (lat !== null && (lat < -90 || lat > 90)) ||
    (lng !== null && (lng < -180 || lng > 180))
  ) {
    return jsonError(400, 'invalid_location', 'Invalid coordinates');
  }

  const { data, error } = await createAdminClient().rpc('public_nearby_venues', {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radius,
    p_limit: Math.round(limitParam),
    p_category: category,
  });

  if (error) {
    console.error('public_nearby_venues failed:', error.code ?? 'unknown');
    return jsonError(503, 'discovery_unavailable', 'Discovery is temporarily unavailable');
  }

  const payload = (data ?? {}) as Record<string, unknown>;

  // The RPC returns the private storage key. Turn it into the public brand
  // route so the directory never depends on a bucket being public.
  const venues = Array.isArray(payload.venues)
    ? payload.venues.map((entry) => {
        const venue = entry as Record<string, unknown>;
        const organizationId =
          typeof venue.organizationId === 'string' ? venue.organizationId : '';
        const logoKey = typeof venue.logoUrl === 'string' ? venue.logoUrl : null;
        return {
          ...venue,
          logoUrl:
            organizationId && isBrandLogoKey(logoKey, organizationId)
              ? `/api/v1/brand/${organizationId}/logo?v=${encodeURIComponent(
                  logoKey!.split('/').at(-1) ?? ''
                )}`
              : null,
        };
      })
    : [];

  return NextResponse.json(
    { ok: true, ...payload, venues },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=900',
      },
    }
  );
}
