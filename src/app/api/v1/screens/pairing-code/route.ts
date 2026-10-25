/**
 * POST /api/v1/screens/pairing-code
 *
 * A merchant generates a short-lived code, then the TV screen submits it to
 * `/api/v1/screens/pair`. The code is single-use and expires after ten minutes.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator, defaultBranchId } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk, readJson } from '@/lib/server/route-helpers';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  branchId: z.string().uuid().optional(),
  screenName: z.string().trim().max(100).optional(),
});

const TTL_MINUTES = 10;

export async function POST(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = schema.safeParse((await readJson(request)) ?? {});
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid pairing request');

  const limit = await consumeRateLimit(
    rateLimitKey(request, 'pairing-code', operator.organization.id),
    10,
    60 * 60
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  const branchId = await defaultBranchId(
    operator.organization.id,
    parsed.data.branchId ?? operator.branchId
  );
  if (!branchId) return jsonError(409, 'branch_required', 'No active branch');

  const admin = createAdminClient();
  await admin
    .from('screen_pairing_codes')
    .update({ is_used: true })
    .eq('organization_id', operator.organization.id)
    .eq('is_used', false)
    .lte('expires_at', new Date().toISOString());

  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0];
    const code = String(100_000 + (random % 900_000));
    const { data, error } = await admin
      .from('screen_pairing_codes')
      .insert({
        organization_id: operator.organization.id,
        branch_id: branchId,
        code,
        screen_name: parsed.data.screenName ?? null,
        expires_at: expiresAt,
      })
      .select('id,code,expires_at')
      .single();

    if (!error && data) {
      return jsonOk({ pairingCode: data.code, expiresAt: data.expires_at });
    }
    if (error?.code !== '23505') {
      console.error('pairing code insert failed:', error?.code ?? 'unknown');
      return jsonError(503, 'pairing_unavailable', 'Could not create a pairing code');
    }
  }

  return jsonError(503, 'pairing_unavailable', 'Could not allocate a unique pairing code');
}
