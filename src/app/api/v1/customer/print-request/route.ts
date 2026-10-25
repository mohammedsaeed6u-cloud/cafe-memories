/**
 * POST /api/v1/customer/print-request
 *
 * A signed-in guest asks the counter to print one of their own memories. The
 * memory id is validated against the session, so a customer can never queue
 * another tenant's or another guest's photo. The merchant print station picks
 * the job up from `print_jobs`.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { readCustomerSession } from '@/lib/customer-session';
import { jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  memoryId: z.string().uuid(),
  copies: z.number().int().min(1).max(5).default(1),
});

export async function POST(request: NextRequest) {
  const session = await readCustomerSession(request);
  if (!session) return jsonError(401, 'unauthenticated', 'Customer session required');

  const limit = await consumeRateLimit(
    rateLimitKey(request, 'customer-print', session.customerId),
    6,
    60 * 60
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid print request');

  const admin = createAdminClient();
  const { data: memory, error } = await admin
    .from('memories')
    .select('id,customer_id,organization_id,branch_id,optimized_url,original_url,status')
    .eq('id', parsed.data.memoryId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) return jsonError(503, 'print_unavailable', 'Print queue is temporarily unavailable');
  if (!memory || memory.customer_id !== session.customerId || memory.status === 'deleted') {
    return jsonError(404, 'memory_not_found', 'Memory not found');
  }

  const { data: existing } = await admin
    .from('print_jobs')
    .select('id')
    .eq('organization_id', memory.organization_id)
    .eq('memory_id', memory.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing?.id) {
    return jsonOk({ jobId: existing.id, duplicate: true });
  }

  const { data: job, error: insertError } = await admin
    .from('print_jobs')
    .insert({
      organization_id: memory.organization_id,
      branch_id: memory.branch_id,
      memory_id: memory.id,
      customer_id: memory.customer_id,
      status: 'pending',
      format: '4x6',
      copies: parsed.data.copies,
      photo_url: memory.optimized_url || memory.original_url,
      requested_by: null,
    })
    .select('id,status,created_at')
    .single();

  if (insertError || !job) {
    console.error('customer print request failed:', insertError?.code ?? 'unknown');
    return jsonError(503, 'print_unavailable', 'Could not queue the print job');
  }

  await writeAuditLog({
    actorId: null,
    organizationId: memory.organization_id,
    action: 'print.requested_by_customer',
    entityType: 'print_jobs',
    entityId: job.id,
    metadata: { memoryId: memory.id, copies: parsed.data.copies },
  });

  return jsonOk({ jobId: job.id, status: job.status, duplicate: false }, 201);
}
