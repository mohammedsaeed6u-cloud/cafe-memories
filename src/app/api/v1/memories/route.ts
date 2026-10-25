/**
 * Public wall + merchant moderation feed.
 *
 * GET  ?cafeSlug=...                  approved, live-wall memories for a venue
 * GET  ?scope=merchant&status=...     the caller's organization, all statuses
 * PATCH { memoryId, status }          moderation (merchant or staff tablet)
 * DELETE ?id=...                      soft delete (merchant or staff tablet)
 *
 * The public response never contains phone numbers, customer ids, or raw
 * storage keys. Images are signed for one hour.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { loadPublicVenue } from '@/lib/server/public-venue';
import { signedMemoryUrlMap, pickSigned } from '@/lib/server/memory-urls';
import { contextFailure, jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const STATUSES = ['pending', 'approved', 'rejected', 'hidden', 'deleted'] as const;

const patchSchema = z.object({
  memoryId: z.string().uuid(),
  status: z.enum(STATUSES),
});

function parseLimit(raw: string | null): number {
  const value = Number.parseInt(raw ?? '24', 10);
  if (!Number.isFinite(value)) return 24;
  return Math.min(Math.max(value, 1), 60);
}

interface MemoryRow {
  id: string;
  original_url: string;
  optimized_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  status: string;
  visibility: string;
  created_at: string;
  customers?: { display_name: string | null } | { display_name: string | null }[] | null;
}

function customerName(row: MemoryRow): string {
  const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
  return customer?.display_name?.trim() || 'ضيف مميز';
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const scope = params.get('scope');
  const limit = parseLimit(params.get('limit'));
  const before = params.get('before');

  const admin = createAdminClient();

  if (scope === 'merchant') {
    const context = await requireOperator(request, {
      branchId: params.get('branchId') ?? undefined,
    });
    if (!context.context) return contextFailure(context.error!);
    const operator = context.context;

    let query = admin
      .from('memories')
      .select(
        'id,original_url,optimized_url,thumbnail_url,caption,status,visibility,created_at,customers(display_name)'
      )
      .eq('organization_id', operator.organization.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (operator.branchId) query = query.eq('branch_id', operator.branchId);
    const status = params.get('status');
    if (status && status !== 'all' && (STATUSES as readonly string[]).includes(status)) {
      query = query.eq('status', status);
    }
    const visibility = params.get('visibility');
    if (visibility && visibility !== 'all') query = query.eq('visibility', visibility);
    if (before) query = query.lt('created_at', before);

    const { data, error } = await query;
    if (error) return jsonError(503, 'memories_unavailable', 'Could not load memories');

    const rows = (data ?? []) as MemoryRow[];
    const urls = await signedMemoryUrlMap(
      rows.flatMap((row) => [row.original_url, row.optimized_url, row.thumbnail_url])
    );

    return jsonOk({
      memories: rows.map((row) => ({
        id: row.id,
        customerName: customerName(row),
        imageUrl: pickSigned(urls, row.optimized_url, row.original_url),
        thumbnailUrl: pickSigned(urls, row.thumbnail_url, row.optimized_url, row.original_url),
        caption: row.caption,
        status: row.status,
        visibility: row.visibility,
        createdAt: row.created_at,
      })),
    });
  }

  const cafeSlug = params.get('cafeSlug');
  if (!cafeSlug) return jsonError(400, 'cafe_slug_required', 'cafeSlug is required');

  const limitResult = await consumeRateLimit(rateLimitKey(request, 'wall-feed'), 120, 60);
  if (!limitResult.allowed) return rateLimitResponse(limitResult);

  let venue;
  try {
    venue = await loadPublicVenue(cafeSlug);
  } catch {
    return jsonError(503, 'venue_unavailable', 'Venue lookup failed');
  }
  if (!venue) return jsonError(404, 'venue_not_found', 'Venue not available');

  let query = admin
    .from('memories')
    .select(
      'id,original_url,optimized_url,thumbnail_url,caption,status,visibility,created_at,customers(display_name)'
    )
    .eq('organization_id', venue.organization.id)
    .eq('branch_id', venue.branch.id)
    .eq('status', 'approved')
    .eq('visibility', 'live_wall')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) query = query.lt('created_at', before);

  const { data, error } = await query;
  if (error) return jsonError(503, 'memories_unavailable', 'Could not load memories');

  const rows = (data ?? []) as MemoryRow[];
  const urls = await signedMemoryUrlMap(
    rows.flatMap((row) => [row.original_url, row.optimized_url, row.thumbnail_url])
  );

  return Response.json(
    {
      ok: true,
      memories: rows.map((row) => ({
        id: row.id,
        customerName: customerName(row),
        imageUrl: pickSigned(urls, row.optimized_url, row.original_url),
        thumbnailUrl: pickSigned(urls, row.thumbnail_url, row.optimized_url, row.original_url),
        caption: row.caption,
        createdAt: row.created_at,
      })),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=120',
      },
    }
  );
}

export async function PATCH(request: NextRequest) {
  const context = await requireOperator(request);
  if (!context.context) return contextFailure(context.error!);
  const operator = context.context;

  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid memory update');

  const admin = createAdminClient();
  const { data: memory, error: readError } = await admin
    .from('memories')
    .select('id,organization_id,branch_id,status')
    .eq('id', parsed.data.memoryId)
    .is('deleted_at', null)
    .maybeSingle();

  if (readError) return jsonError(503, 'memory_unavailable', 'Could not load memory');
  if (!memory || memory.organization_id !== operator.organization.id) {
    return jsonError(404, 'memory_not_found', 'Memory not found');
  }
  if (operator.branchId && memory.branch_id !== operator.branchId) {
    return jsonError(403, 'branch_scope', 'Memory belongs to another branch');
  }

  const { error } = await admin
    .from('memories')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', memory.id);

  if (error) return jsonError(503, 'memory_update_failed', 'Could not update memory');

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'memory.status_changed',
    entityType: 'memories',
    entityId: memory.id,
    metadata: { from: memory.status, to: parsed.data.status, source: operator.source },
  });

  return jsonOk({ memoryId: memory.id, status: parsed.data.status });
}

export async function DELETE(request: NextRequest) {
  const context = await requireOperator(request);
  if (!context.context) return contextFailure(context.error!);
  const operator = context.context;

  const id = request.nextUrl.searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success) {
    return jsonError(400, 'invalid_id', 'A valid memory id is required');
  }

  const admin = createAdminClient();
  const { data: memory, error: readError } = await admin
    .from('memories')
    .select('id,organization_id,branch_id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (readError) return jsonError(503, 'memory_unavailable', 'Could not load memory');
  if (!memory || memory.organization_id !== operator.organization.id) {
    return jsonError(404, 'memory_not_found', 'Memory not found');
  }
  if (operator.branchId && memory.branch_id !== operator.branchId) {
    return jsonError(403, 'branch_scope', 'Memory belongs to another branch');
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from('memories')
    .update({ status: 'deleted', deleted_at: now, updated_at: now })
    .eq('id', memory.id);

  if (error) return jsonError(503, 'memory_delete_failed', 'Could not delete memory');

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'memory.deleted',
    entityType: 'memories',
    entityId: memory.id,
    metadata: { source: operator.source },
  });

  return jsonOk({ memoryId: memory.id });
}
