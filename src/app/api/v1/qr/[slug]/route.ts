/**
 * GET /api/v1/qr/[slug]
 *
 * Public QR landing lookup. The scan counter is incremented atomically in SQL
 * and the response tells the client where to send the guest. Only active codes
 * are returned; a deactivated code is indistinguishable from a missing one.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadPublicVenue } from '@/lib/server/public-venue';
import { jsonError } from '@/lib/server/route-helpers';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/i;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return jsonError(400, 'invalid_slug', 'A valid QR slug is required');
  }

  const limit = await consumeRateLimit(rateLimitKey(request, 'qr-scan'), 60, 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  const { data, error } = await createAdminClient().rpc('increment_qr_scan', { p_slug: slug });
  if (error) {
    console.error('increment_qr_scan failed:', error.code ?? 'unknown');
    return jsonError(503, 'qr_unavailable', 'QR lookup is temporarily unavailable');
  }

  const scan = (data ?? null) as
    | { qr_id: string; branch_id: string; branch_slug: string | null; source: string; scan_count: number }
    | null;

  if (!scan || !scan.branch_slug) {
    return jsonError(404, 'qr_not_found', 'QR code not found');
  }

  const venue = await loadPublicVenue(scan.branch_slug).catch(() => null);
  if (!venue) return jsonError(404, 'venue_not_found', 'Venue not available');

  return Response.json(
    {
      ok: true,
      qr: {
        id: scan.qr_id,
        source: scan.source,
        scanCount: scan.scan_count,
      },
      venue: {
        organizationId: venue.organization.id,
        organizationSlug: venue.organization.slug,
        organizationName: venue.organization.name,
        branchId: venue.branch.id,
        branchSlug: venue.branch.slug,
        branchName: venue.branch.name,
      },
      redirectTo: `/c/${encodeURIComponent(venue.branch.slug)}?qr=${encodeURIComponent(slug)}`,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
