/**
 * GET /api/v1/public/settings?cafeSlug=...
 *
 * Public venue configuration for the customer app and the wall. It returns
 * branding, photobooth settings, and the active reward rule — never customer
 * records, staff data, billing, or wallet credentials.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadPublicVenue, PUBLIC_VENUE_CACHE } from '@/lib/server/public-venue';
import { jsonError } from '@/lib/server/route-helpers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const cafeSlug = request.nextUrl.searchParams.get('cafeSlug');
  if (!cafeSlug) return jsonError(400, 'cafe_slug_required', 'cafeSlug is required');

  let venue;
  try {
    venue = await loadPublicVenue(cafeSlug);
  } catch {
    return jsonError(503, 'venue_unavailable', 'Venue lookup failed');
  }
  if (!venue) return jsonError(404, 'venue_not_found', 'Venue not available');

  const { data: rule } = await createAdminClient()
    .from('reward_rules')
    .select('name,description,threshold,reward_description')
    .eq('organization_id', venue.organization.id)
    .eq('is_active', true)
    .eq('trigger_type', 'visit_count')
    .lte('starts_at', new Date().toISOString())
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return Response.json(
    {
      ok: true,
      venue,
      reward: rule
        ? {
            name: rule.name,
            description: rule.description,
            threshold: rule.threshold,
            rewardDescription: rule.reward_description,
          }
        : null,
    },
    { headers: { 'Cache-Control': PUBLIC_VENUE_CACHE } }
  );
}
