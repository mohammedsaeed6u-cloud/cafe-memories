/**
 * POST /api/v1/screens/heartbeat
 *
 * The screen proves possession of its paired device token. Without that proof
 * anyone could mark an arbitrary screen online or keep a revoked screen alive.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonError, jsonOk, readJson } from '@/lib/server/route-helpers';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  screenId: z.string().uuid(),
  deviceToken: z.string().trim().min(32).max(200),
  currentMemoryId: z.string().uuid().optional().nullable(),
  batteryLevel: z.number().min(0).max(100).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const limit = await consumeRateLimit(rateLimitKey(request, 'screen-heartbeat'), 240, 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid heartbeat');

  const admin = createAdminClient();
  const { data: screen, error } = await admin
    .from('screens')
    .select('id,organization_id,branch_id,status,orientation,device_token')
    .eq('id', parsed.data.screenId)
    .maybeSingle();

  if (error) return jsonError(503, 'heartbeat_unavailable', 'Heartbeat is temporarily unavailable');
  if (!screen || screen.device_token !== parsed.data.deviceToken) {
    return jsonError(401, 'invalid_device', 'Screen is not paired');
  }

  const { error: updateError } = await admin
    .from('screens')
    .update({
      status: 'online',
      last_heartbeat_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', screen.id);

  if (updateError) return jsonError(503, 'heartbeat_unavailable', 'Heartbeat is temporarily unavailable');

  const { data: branch } = await admin
    .from('branches')
    .select('slug,name')
    .eq('id', screen.branch_id)
    .maybeSingle();

  return jsonOk({
    screenId: screen.id,
    status: 'online',
    orientation: screen.orientation,
    cafeSlug: branch?.slug ?? null,
    branchName: branch?.name ?? null,
  });
}
