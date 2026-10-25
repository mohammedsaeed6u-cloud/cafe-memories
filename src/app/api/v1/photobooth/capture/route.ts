/**
 * POST /api/v1/photobooth/capture
 *
 * One transaction records the verified visit, the memory, and the consent
 * record (`capture_guest_memory`). The customer comes from the signed session
 * cookie, never from the request body. A 60-minute cooldown is enforced in SQL.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { readCustomerSession } from '@/lib/customer-session';
import { loadPublicVenue } from '@/lib/server/public-venue';
import { signedMemoryUrl } from '@/lib/server/memory-urls';
import { contextFailure, jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';
import { hashIpAddress } from '@/lib/services/anti-fraud';
import { phoneKey } from '@/lib/services/phone';
import { requireOperator } from '@/lib/server/context';
import { defaultBranchId } from '@/lib/server/context';

export const runtime = 'nodejs';

/**
 * Kept for callers and tests that normalize a typed phone number. Phone data
 * is only ever contact information; it is not used to authenticate.
 */
export function normalizePhoneNumber(raw: string): string {
  const digits = phoneKey(raw);
  return raw.trim().startsWith('+') ? `+${digits}` : digits;
}

const storageKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(400)
  .regex(/^[A-Za-z0-9][A-Za-z0-9/_.-]*$/, 'Invalid storage key');

export const captureSchema = z.object({
  cafeSlug: z.string().trim().min(1).max(80),
  caption: z.string().trim().max(280).optional().nullable(),
  storageKey: storageKeySchema.optional(),
  originalUrl: storageKeySchema.optional(),
  optimizedUrl: storageKeySchema.optional(),
  thumbnailUrl: storageKeySchema.optional(),
  liveWallConsent: z.boolean().default(false),
  socialShareConsent: z.boolean().default(false),
  marketingConsent: z.boolean().default(false),
  deviceFingerprint: z.string().trim().max(128).optional().nullable(),
  idempotencyKey: z.string().uuid(),
  // Legacy fields accepted for the staff-assisted flow. They are ignored as
  // identity: the session cookie is the only customer identity.
  name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  role: z.string().trim().max(100).optional(),
  frameId: z.string().trim().max(60).optional(),
  organizationId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  customer: z
    .object({
      name: z.string().trim().max(100).optional(),
      phone: z.string().trim().max(30).optional(),
      role: z.string().trim().max(100).optional(),
    })
    .optional(),
});

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(request: NextRequest) {
  const limit = await consumeRateLimit(rateLimitKey(request, 'photobooth-capture'), 12, 60 * 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  const session = await readCustomerSession(request);
  if (!session) return jsonError(401, 'unauthenticated', 'Customer session required');

  const parsed = captureSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid capture payload');
  const input = parsed.data;

  let venue;
  try {
    venue = await loadPublicVenue(input.cafeSlug);
  } catch {
    return jsonError(503, 'venue_unavailable', 'Venue lookup failed');
  }
  if (!venue) return jsonError(404, 'venue_not_found', 'Venue not available');

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from('customers')
    .select('id,organization_id')
    .eq('id', session.customerId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!customer) return jsonError(401, 'no_session', 'Customer session expired');
  if (customer.organization_id && customer.organization_id !== venue.organization.id) {
    return jsonError(403, 'customer_scope', 'Session does not belong to this venue');
  }

  const storageKey = input.storageKey ?? input.originalUrl;
  if (!storageKey) return jsonError(400, 'storage_key_required', 'Upload the image first');

  const ipHash = hashIpAddress(clientIp(request));
  const { data, error } = await admin.rpc('capture_guest_memory', {
    p_customer_id: session.customerId,
    p_organization_id: venue.organization.id,
    p_branch_id: venue.branch.id,
    p_original_url: storageKey,
    p_optimized_url: input.optimizedUrl ?? storageKey,
    p_thumbnail_url: input.thumbnailUrl ?? storageKey,
    p_caption: input.caption ?? null,
    p_live_wall_consent: input.liveWallConsent,
    p_social_share_consent: input.socialShareConsent,
    p_marketing_consent: input.marketingConsent,
    p_device_fingerprint: input.deviceFingerprint ?? null,
    p_ip_hash: ipHash,
    p_idempotency_key: input.idempotencyKey,
  });

  if (error) {
    if (error.code === '22023') {
      return jsonError(409, 'capture_rejected', 'The capture could not be accepted');
    }
    console.error('capture_guest_memory failed:', error.code ?? 'unknown');
    return jsonError(503, 'capture_unavailable', 'Capture is temporarily unavailable');
  }

  const result = (data ?? {}) as {
    status?: string;
    duplicate?: boolean;
    cooldownMinutes?: number;
    memory?: { id?: string; status?: string; visibility?: string; caption?: string; created_at?: string };
    visit?: { id?: string; created_at?: string };
    balance?: { usedVisits?: number; availableRewards?: number; oldestRewardName?: string };
  };

  if (result.status === 'cooldown') {
    return jsonError(
      429,
      'visit_cooldown',
      `يمكنك الحصول على ختم جديد بعد ${result.cooldownMinutes ?? 60} دقيقة`
    );
  }

  const memory = result.memory;
  const imageUrl = memory ? await signedMemoryUrl(storageKey) : null;

  if (memory?.id) {
    await writeAuditLog({
      actorId: null,
      organizationId: venue.organization.id,
      action: 'memory.captured',
      entityType: 'memories',
      entityId: memory.id,
      metadata: { branchId: venue.branch.id, liveWallConsent: input.liveWallConsent },
    });
  }

  return jsonOk({
    duplicate: Boolean(result.duplicate),
    visit: result.visit ?? null,
    memory: memory
      ? {
          id: memory.id,
          status: memory.status,
          visibility: memory.visibility,
          caption: memory.caption,
          createdAt: memory.created_at,
          imageUrl,
        }
      : null,
    balance: result.balance ?? null,
  });
}

/**
 * Staff-assisted capture for a customer who has no phone of their own.
 * The operator must belong to the venue; the customer must already exist in
 * the same tenant. This route never creates a customer from a phone number.
 */
export async function PUT(request: NextRequest) {
  const context = await requireOperator(request);
  if (!context.context) return contextFailure(context.error!);
  const operator = context.context;

  const body = (await readJson(request)) as Record<string, unknown> | null;
  const schema = z.object({
    customerId: z.string().uuid(),
    storageKey: storageKeySchema,
    caption: z.string().trim().max(280).optional().nullable(),
    liveWallConsent: z.boolean().default(false),
    socialShareConsent: z.boolean().default(false),
    marketingConsent: z.boolean().default(false),
    idempotencyKey: z.string().uuid(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid capture payload');

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from('customers')
    .select('id,organization_id')
    .eq('id', parsed.data.customerId)
    .is('deleted_at', null)
    .maybeSingle();
  if (!customer || customer.organization_id !== operator.organization.id) {
    return jsonError(404, 'customer_not_found', 'Customer not found');
  }

  const branchId = await defaultBranchId(operator.organization.id, operator.branchId);
  if (!branchId) return jsonError(409, 'branch_required', 'No active branch');

  const { data, error } = await admin.rpc('capture_guest_memory', {
    p_customer_id: customer.id,
    p_organization_id: operator.organization.id,
    p_branch_id: branchId,
    p_original_url: parsed.data.storageKey,
    p_optimized_url: parsed.data.storageKey,
    p_thumbnail_url: parsed.data.storageKey,
    p_caption: parsed.data.caption ?? null,
    p_live_wall_consent: parsed.data.liveWallConsent,
    p_social_share_consent: parsed.data.socialShareConsent,
    p_marketing_consent: parsed.data.marketingConsent,
    p_device_fingerprint: null,
    p_ip_hash: hashIpAddress(clientIp(request)),
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) return jsonError(503, 'capture_unavailable', 'Capture is temporarily unavailable');

  const result = (data ?? {}) as { status?: string; cooldownMinutes?: number; memory?: { id?: string } };
  if (result.status === 'cooldown') {
    return jsonError(429, 'visit_cooldown', 'Visit cooldown is still active');
  }

  return jsonOk({
    memoryId: result.memory?.id ?? null,
    customerId: customer.id,
    imageUrl: await signedMemoryUrl(parsed.data.storageKey),
  });
}
