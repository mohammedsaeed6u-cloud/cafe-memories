/**
 * Merchant NFC readers.
 *
 * GET    list readers, their branch, status, and last tap
 * POST   create a reader and return the tag URL exactly once
 * PATCH  rename, pause, resume, or rotate the secret
 * DELETE retire a reader (tap history is preserved)
 *
 * The secret is shown once, at creation or rotation. It is never stored in
 * plaintext and cannot be read back from this API.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import {
  contextFailure,
  jsonError,
  jsonOk,
  readJson,
  writeAuditLog,
} from '@/lib/server/route-helpers';
import {
  buildTagUrl,
  generateReaderCredentials,
  siteOrigin,
} from '@/lib/server/nfc';

export const runtime = 'nodejs';

const createSchema = z.object({
  label: z.string().trim().min(2).max(60),
  branchId: z.string().uuid(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['rename', 'pause', 'activate', 'rotate']),
  label: z.string().trim().min(2).max(60).optional(),
});

interface ReaderRow {
  id: string;
  label: string;
  public_id: string;
  status: string;
  last_tap_at: string | null;
  created_at: string;
  branch_id: string;
  branches: { name?: string; slug?: string } | Array<{ name?: string; slug?: string }> | null;
}

function branchName(row: ReaderRow): string {
  const branch = Array.isArray(row.branches) ? row.branches[0] : row.branches;
  return branch?.name ?? '';
}

async function assertBranch(organizationId: string, branchId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from('branches')
    .select('id')
    .eq('id', branchId)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .maybeSingle();
  return Boolean(data);
}

export async function GET(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const { data, error } = await createAdminClient()
    .from('nfc_readers')
    .select('id,label,public_id,status,last_tap_at,created_at,branch_id,branches(name,slug)')
    .eq('organization_id', operator.organization.id)
    .match(operator.branchId ? { branch_id: operator.branchId } : {})
    .order('created_at', { ascending: true });

  if (error) {
    console.error('reader list failed:', error.code ?? 'unknown');
    return jsonError(503, 'readers_unavailable', 'Readers are temporarily unavailable');
  }

  return jsonOk({
    readers: ((data ?? []) as ReaderRow[]).map((row) => ({
      id: row.id,
      label: row.label,
      publicId: row.public_id,
      status: row.status,
      branchId: row.branch_id,
      branchName: branchName(row),
      lastTapAt: row.last_tap_at,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = createSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid reader details');

  if (operator.branchId && operator.branchId !== parsed.data.branchId) {
    return jsonError(403, 'branch_scope', 'This branch is outside your scope');
  }
  if (!(await assertBranch(operator.organization.id, parsed.data.branchId))) {
    return jsonError(400, 'invalid_branch', 'Branch is not available');
  }

  const credentials = generateReaderCredentials();
  const { data, error } = await createAdminClient()
    .from('nfc_readers')
    .insert({
      organization_id: operator.organization.id,
      branch_id: parsed.data.branchId,
      label: parsed.data.label,
      public_id: credentials.publicId,
      secret_hash: credentials.secretHash,
      status: 'active',
    })
    .select('id,label,public_id,status,branch_id,created_at')
    .single();

  if (error || !data) {
    console.error('reader create failed:', error?.code ?? 'unknown');
    return jsonError(503, 'reader_unavailable', 'Could not create the reader');
  }

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'reader.created',
    entityType: 'nfc_readers',
    entityId: data.id,
    metadata: { branchId: parsed.data.branchId },
  });

  return jsonOk(
    {
      reader: {
        id: data.id,
        label: data.label,
        publicId: data.public_id,
        status: data.status,
        branchId: data.branch_id,
        createdAt: data.created_at,
      },
      tagUrl: buildTagUrl(siteOrigin(), credentials.publicId, credentials.secret),
      secretShownOnce: true,
    },
    201
  );
}

export async function PATCH(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid reader update');

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('nfc_readers')
    .select('id,public_id,status,label,branch_id')
    .eq('id', parsed.data.id)
    .eq('organization_id', operator.organization.id)
    .maybeSingle();

  if (!existing) return jsonError(404, 'reader_not_found', 'Reader not found');
  if (operator.branchId && existing.branch_id !== operator.branchId) {
    return jsonError(403, 'branch_scope', 'This reader is outside your scope');
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  let credentials: ReturnType<typeof generateReaderCredentials> | null = null;

  if (parsed.data.action === 'rename') {
    if (!parsed.data.label) return jsonError(400, 'invalid_payload', 'A label is required');
    updates.label = parsed.data.label;
  } else if (parsed.data.action === 'pause') {
    updates.status = 'paused';
  } else if (parsed.data.action === 'activate') {
    updates.status = 'active';
  } else {
    credentials = generateReaderCredentials();
    updates.public_id = credentials.publicId;
    updates.secret_hash = credentials.secretHash;
    updates.status = 'active';
  }

  const { data, error } = await admin
    .from('nfc_readers')
    .update(updates)
    .eq('id', parsed.data.id)
    .eq('organization_id', operator.organization.id)
    .select('id,label,public_id,status,branch_id,last_tap_at,created_at')
    .single();

  if (error || !data) {
    console.error('reader update failed:', error?.code ?? 'unknown');
    return jsonError(503, 'reader_unavailable', 'Could not update the reader');
  }

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: `reader.${parsed.data.action}`,
    entityType: 'nfc_readers',
    entityId: data.id,
  });

  return jsonOk({
    reader: {
      id: data.id,
      label: data.label,
      publicId: data.public_id,
      status: data.status,
      branchId: data.branch_id,
      lastTapAt: data.last_tap_at,
      createdAt: data.created_at,
    },
    tagUrl: credentials
      ? buildTagUrl(siteOrigin(), credentials.publicId, credentials.secret)
      : null,
    secretShownOnce: Boolean(credentials),
  });
}

export async function DELETE(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const id = request.nextUrl.searchParams.get('id') ?? '';
  if (!z.string().uuid().safeParse(id).success) {
    return jsonError(400, 'invalid_reader', 'A valid reader id is required');
  }

  const { data, error } = await createAdminClient()
    .from('nfc_readers')
    .update({ status: 'retired', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', operator.organization.id)
    .match(operator.branchId ? { branch_id: operator.branchId } : {})
    .select('id')
    .maybeSingle();

  if (error || !data) return jsonError(404, 'reader_not_found', 'Reader not found');

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'reader.retired',
    entityType: 'nfc_readers',
    entityId: id,
  });

  return jsonOk({ retired: true });
}
