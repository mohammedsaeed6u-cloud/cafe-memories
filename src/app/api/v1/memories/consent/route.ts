/**
 * POST /api/v1/memories/consent
 *
 * A guest can change their mind about the live wall, social sharing, or
 * marketing. Only the signed session that owns the memory may change it.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { readCustomerSession } from '@/lib/customer-session';
import { jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';

export const runtime = 'nodejs';

const schema = z.object({
  memoryId: z.string().uuid(),
  liveWallConsent: z.boolean().optional(),
  socialShareConsent: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = await readCustomerSession(request);
  if (!session) return jsonError(401, 'unauthenticated', 'Customer session required');

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid consent update');

  const admin = createAdminClient();
  const { data: memory, error: memoryError } = await admin
    .from('memories')
    .select('id,customer_id,organization_id,visibility,status')
    .eq('id', parsed.data.memoryId)
    .is('deleted_at', null)
    .maybeSingle();

  if (memoryError) return jsonError(503, 'memory_unavailable', 'Could not load memory');
  if (!memory || memory.customer_id !== session.customerId) {
    return jsonError(404, 'memory_not_found', 'Memory not found');
  }

  const consentUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.liveWallConsent !== undefined) {
    consentUpdate.live_wall_consent = parsed.data.liveWallConsent;
  }
  if (parsed.data.socialShareConsent !== undefined) {
    consentUpdate.social_share_consent = parsed.data.socialShareConsent;
  }
  if (parsed.data.marketingConsent !== undefined) {
    consentUpdate.marketing_consent = parsed.data.marketingConsent;
  }

  const { error: consentError } = await admin
    .from('memory_consents')
    .upsert(
      {
        memory_id: memory.id,
        customer_id: session.customerId,
        ...consentUpdate,
      },
      { onConflict: 'memory_id' }
    );

  if (consentError) return jsonError(503, 'consent_update_failed', 'Could not update consent');

  if (parsed.data.liveWallConsent !== undefined) {
    const now = new Date().toISOString();
    const { error: visibilityError } = await admin
      .from('memories')
      .update({
        visibility: parsed.data.liveWallConsent ? 'live_wall' : 'private',
        // Re-sharing always passes moderation again.
        status: parsed.data.liveWallConsent ? 'pending' : memory.status,
        updated_at: now,
      })
      .eq('id', memory.id);
    if (visibilityError) {
      return jsonError(503, 'visibility_update_failed', 'Could not update visibility');
    }
  }

  await writeAuditLog({
    actorId: null,
    organizationId: memory.organization_id,
    action: 'memory.consent_changed',
    entityType: 'memories',
    entityId: memory.id,
    metadata: parsed.data,
  });

  return jsonOk({ memoryId: memory.id });
}
