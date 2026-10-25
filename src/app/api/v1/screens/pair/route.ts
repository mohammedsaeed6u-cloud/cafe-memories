/**
 * POST /api/v1/screens/pair
 *
 * Public endpoint used by a TV screen. The screen generates a long random
 * device token locally, submits the six-digit code shown by the merchant, and
 * receives its screen id. The token is required for every heartbeat, so a
 * guessed screen id is useless on its own.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonError, jsonOk, readJson } from '@/lib/server/route-helpers';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, 'Pairing code must be 6 digits'),
  deviceToken: z
    .string()
    .trim()
    .min(32)
    .max(200)
    .regex(/^[A-Za-z0-9_-]+$/),
  screenName: z.string().trim().max(100).optional(),
  resolution: z.string().trim().max(30).default('1920x1080'),
  orientation: z.enum(['landscape', 'portrait']).default('landscape'),
});

export async function POST(request: NextRequest) {
  const limit = await consumeRateLimit(rateLimitKey(request, 'screen-pair'), 10, 15 * 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid pairing request');

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('pair_screen', {
    p_code: parsed.data.code,
    p_device_token: parsed.data.deviceToken,
    p_screen_name: parsed.data.screenName ?? null,
    p_resolution: parsed.data.resolution,
    p_orientation: parsed.data.orientation,
  });

  if (error) {
    console.error('pair_screen failed:', error.code ?? 'unknown');
    return jsonError(503, 'pairing_unavailable', 'Pairing is temporarily unavailable');
  }

  const payload = (data ?? null) as
    | {
        screen: {
          id: string;
          organization_id: string;
          branch_id: string;
          name: string;
          orientation: string;
          resolution: string | null;
        };
      }
    | null;

  if (!payload?.screen?.id) {
    return jsonError(404, 'invalid_pairing_code', 'الرمز غير صحيح أو منتهي الصلاحية');
  }

  const { data: branch } = await admin
    .from('branches')
    .select('slug,name,organizations(name,slug)')
    .eq('id', payload.screen.branch_id)
    .maybeSingle();

  const organization = Array.isArray(branch?.organizations)
    ? branch?.organizations[0]
    : branch?.organizations;

  return jsonOk({
    screenId: payload.screen.id,
    screenName: payload.screen.name,
    orientation: payload.screen.orientation,
    resolution: payload.screen.resolution,
    cafeSlug: branch?.slug ?? organization?.slug ?? null,
    branchName: branch?.name ?? null,
    organizationName: organization?.name ?? null,
  });
}
