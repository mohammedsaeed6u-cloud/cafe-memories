/**
 * Print queue.
 *
 * GET    ?status=pending|printing|printed|failed|dismissed|all
 * POST   { memoryId } or { storageKey }   enqueue a private image
 * PATCH  { id, status, error? }           advance the job
 * DELETE ?id=                             dismiss (soft delete)
 *
 * The old route kept the queue in a per-isolate Map, so jobs vanished on the
 * next cold start and any caller could read every venue's queue. Jobs now live
 * in `print_jobs`, scoped to the verified operator's organization and branch.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';
import { signedMemoryUrl, signedMemoryUrlMap } from '@/lib/server/memory-urls';

export const runtime = 'nodejs';

const STATUSES = ['pending', 'printing', 'printed', 'failed', 'dismissed'] as const;

const enqueueSchema = z
  .object({
    memoryId: z.string().uuid().optional(),
    storageKey: z
      .string()
      .trim()
      .min(3)
      .max(400)
      .regex(/^[A-Za-z0-9][A-Za-z0-9/_.-]*$/)
      .optional(),
    format: z.string().trim().max(40).default('4x6'),
    copies: z.number().int().min(1).max(20).default(1),
  })
  .refine((value) => Boolean(value.memoryId || value.storageKey), {
    message: 'memoryId or storageKey is required',
  });

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['printing', 'printed', 'failed', 'dismissed']),
  error: z.string().trim().max(300).optional(),
});

interface MemoryRow {
  id: string;
  original_url: string;
  optimized_url: string | null;
  thumbnail_url: string | null;
  customer_id: string | null;
}

function storageKeyFor(memory: MemoryRow): string {
  return memory.optimized_url || memory.original_url;
}

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get('branchId') ?? undefined;
  const result = await requireOperator(request, { branchId });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const rawStatus = request.nextUrl.searchParams.get('status') ?? 'pending';
  const status = rawStatus === 'all' ? null : rawStatus;
  if (status && !(STATUSES as readonly string[]).includes(status)) {
    return jsonError(400, 'invalid_status', 'Unknown print status');
  }

  const rawLimit = Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50;

  const admin = createAdminClient();
  let query = admin
    .from('print_jobs')
    .select(
      'id,status,format,copies,photo_url,created_at,printed_at,error,memory_id,customer_id,customers(display_name,phone)'
    )
    .eq('organization_id', operator.organization.id)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (operator.branchId) query = query.eq('branch_id', operator.branchId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error('print jobs lookup failed:', error.code ?? 'unknown');
    return jsonError(503, 'print_queue_unavailable', 'Print queue is temporarily unavailable');
  }

  type Row = {
    id: string;
    status: string;
    format: string;
    copies: number;
    photo_url: string;
    created_at: string;
    printed_at: string | null;
    error: string | null;
    memory_id: string | null;
    customer_id: string | null;
    customers?: { display_name: string | null; phone: string | null } | { display_name: string | null; phone: string | null }[] | null;
  };

  const rows = (data ?? []) as Row[];
  const urls = await signedMemoryUrlMap(rows.map((row) => row.photo_url));

  return jsonOk({
    success: true,
    jobs: rows.map((row) => {
      const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
      return {
        id: row.id,
        venueSlug: operator.organization.slug,
        name: customer?.display_name?.trim() || 'ضيف مميز',
        phone: customer?.phone ?? '',
        photoStripUrl: urls.get(row.photo_url) ?? '',
        format: row.format,
        copies: row.copies,
        status: row.status,
        createdAt: row.created_at,
        printedAt: row.printed_at,
        error: row.error,
        memoryId: row.memory_id,
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  const result = await requireOperator(request);
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = enqueueSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(400, 'invalid_payload', 'Upload the image first, then enqueue its memory');
  }

  const admin = createAdminClient();
  let memory: MemoryRow | null = null;
  let photoKey = parsed.data.storageKey ?? null;

  if (parsed.data.memoryId) {
    const { data } = await admin
      .from('memories')
      .select('id,original_url,optimized_url,thumbnail_url,customer_id,organization_id,branch_id')
      .eq('id', parsed.data.memoryId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!data || data.organization_id !== operator.organization.id) {
      return jsonError(404, 'memory_not_found', 'Memory not found');
    }
    if (operator.branchId && data.branch_id !== operator.branchId) {
      return jsonError(403, 'branch_scope', 'Memory belongs to another branch');
    }
    memory = data as MemoryRow;
    photoKey = storageKeyFor(memory);
  }

  if (!photoKey) return jsonError(400, 'image_required', 'No printable image was provided');
  if (!photoKey.startsWith(`${operator.organization.id}/`)) {
    return jsonError(400, 'invalid_image', 'Image does not belong to this organization');
  }

  if (memory) {
    const { data: existing } = await admin
      .from('print_jobs')
      .select('id')
      .eq('organization_id', operator.organization.id)
      .eq('memory_id', memory.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (existing?.id) {
      return jsonOk({
        job: { id: existing.id, status: 'pending', photoUrl: await signedMemoryUrl(photoKey) },
        duplicate: true,
      });
    }
  }

  const { data: job, error } = await admin
    .from('print_jobs')
    .insert({
      organization_id: operator.organization.id,
      branch_id: operator.branchId,
      memory_id: memory?.id ?? null,
      customer_id: memory?.customer_id ?? null,
      status: 'pending',
      format: parsed.data.format,
      copies: parsed.data.copies,
      photo_url: photoKey,
      requested_by: operator.userId,
    })
    .select('id,status,format,copies,created_at')
    .single();

  if (error || !job) {
    console.error('print job insert failed:', error?.code ?? 'unknown');
    return jsonError(503, 'print_enqueue_failed', 'Could not enqueue the print job');
  }

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'print.enqueued',
    entityType: 'print_jobs',
    entityId: job.id,
    metadata: { memoryId: memory?.id ?? null, format: job.format, copies: job.copies },
  });

  return jsonOk({
    duplicate: false,
    job: { ...job, photoUrl: await signedMemoryUrl(photoKey) },
  });
}

export async function PATCH(request: NextRequest) {
  const result = await requireOperator(request);
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid print update');

  const admin = createAdminClient();
  const { data: job } = await admin
    .from('print_jobs')
    .select('id,organization_id,branch_id,status')
    .eq('id', parsed.data.id)
    .maybeSingle();

  if (!job || job.organization_id !== operator.organization.id) {
    return jsonError(404, 'print_job_not_found', 'Print job not found');
  }
  if (operator.branchId && job.branch_id && job.branch_id !== operator.branchId) {
    return jsonError(403, 'branch_scope', 'Print job belongs to another branch');
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status: parsed.data.status,
    updated_at: now,
  };
  if (parsed.data.status === 'printing') updates.claimed_at = now;
  if (parsed.data.status === 'printed') updates.printed_at = now;
  if (parsed.data.status === 'failed') updates.error = parsed.data.error ?? 'print_failed';

  const { error } = await admin.from('print_jobs').update(updates).eq('id', job.id);
  if (error) return jsonError(503, 'print_update_failed', 'Could not update the print job');

  return jsonOk({ jobId: job.id, status: parsed.data.status });
}

export async function DELETE(request: NextRequest) {
  const result = await requireOperator(request);
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const id = request.nextUrl.searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success) {
    return jsonError(400, 'invalid_id', 'A valid print job id is required');
  }

  const admin = createAdminClient();
  const { data: job } = await admin
    .from('print_jobs')
    .select('id,organization_id,branch_id')
    .eq('id', id)
    .maybeSingle();

  if (!job || job.organization_id !== operator.organization.id) {
    return jsonError(404, 'print_job_not_found', 'Print job not found');
  }
  if (operator.branchId && job.branch_id && job.branch_id !== operator.branchId) {
    return jsonError(403, 'branch_scope', 'Print job belongs to another branch');
  }

  const { error } = await admin
    .from('print_jobs')
    .update({ status: 'dismissed', updated_at: new Date().toISOString() })
    .eq('id', job.id);

  if (error) return jsonError(503, 'print_update_failed', 'Could not dismiss the print job');
  return jsonOk({ jobId: job.id, status: 'dismissed' });
}
