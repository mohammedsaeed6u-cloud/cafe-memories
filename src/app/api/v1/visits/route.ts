/**
 * POST /api/v1/visits
 *
 * A staff tablet (or a signed-in merchant) adds a verified visit. The customer
 * and branch are validated against the caller's organization; the visit is
 * recorded by the idempotent `register_visit` SQL function, which also owns the
 * 60-minute cooldown and velocity checks.
 *
 * Guests never call this route: their visit is created by `capture_guest_memory`.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator, defaultBranchId } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';
import { hashIpAddress } from '@/lib/services/anti-fraud';

export const runtime = 'nodejs';

const SOURCES = [
  'table',
  'counter',
  'entrance',
  'poster',
  'receipt',
  'instagram',
  'campaign',
  'staff',
  'other',
] as const;

const schema = z.object({
  customerId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  source: z.enum(SOURCES).default('staff'),
  qrCodeId: z.string().uuid().optional().nullable(),
  deviceFingerprint: z.string().trim().max(128).optional().nullable(),
  idempotencyKey: z.string().uuid(),
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
  const context = await requireOperator(request);
  if (!context.context) return contextFailure(context.error!);
  const operator = context.context;

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid visit payload');

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

  const branchId = await defaultBranchId(
    operator.organization.id,
    parsed.data.branchId ?? operator.branchId
  );
  if (!branchId) return jsonError(409, 'branch_required', 'No active branch');

  const { data, error } = await admin.rpc('register_visit', {
    p_customer_id: customer.id,
    p_organization_id: operator.organization.id,
    p_branch_id: branchId,
    p_qr_code_id: parsed.data.qrCodeId ?? null,
    p_source: parsed.data.source,
    p_device_fingerprint: parsed.data.deviceFingerprint ?? null,
    p_ip_hash: hashIpAddress(clientIp(request)),
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) {
    if (error.code === '22023') {
      return jsonError(409, 'visit_rejected', 'Customer or branch is not available');
    }
    return jsonError(503, 'visit_unavailable', 'Visit registration is unavailable');
  }

  const result = (data ?? {}) as {
    status?: string;
    duplicate?: boolean;
    cooldownMinutes?: number;
    visit?: { id?: string; verification_status?: string; created_at?: string };
  };

  if (result.status === 'cooldown') {
    return jsonError(429, 'visit_cooldown', 'A visit was already recorded in the last hour');
  }

  if (result.visit?.id) {
    await writeAuditLog({
      actorId: operator.memberId,
      organizationId: operator.organization.id,
      action: 'visit.registered',
      entityType: 'visits',
      entityId: result.visit.id,
      metadata: { source: operator.source, branchId },
    });
  }

  return jsonOk({
    duplicate: Boolean(result.duplicate),
    visit: result.visit ?? null,
    verificationStatus: result.visit?.verification_status ?? 'verified',
  });
}
