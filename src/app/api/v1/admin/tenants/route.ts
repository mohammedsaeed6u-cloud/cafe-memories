/**
 * GET   /api/v1/admin/tenants   real platform tenant overview
 * PATCH /api/v1/admin/tenants   suspend or reactivate a tenant
 *
 * Access is an explicit email allow-list (`SUPER_ADMIN_EMAILS`); an empty list
 * denies everyone. No tenant data is read before that check.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';

export const runtime = 'nodejs';

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['active', 'suspended']),
});

export async function GET() {
  const result = await requireSuperAdmin();
  if (!result.context) return contextFailure(result.error!);

  const { data, error } = await createAdminClient().rpc('platform_tenant_overview');
  if (error) {
    console.error('platform_tenant_overview failed:', error.code ?? 'unknown');
    return jsonError(503, 'tenants_unavailable', 'Tenant overview is temporarily unavailable');
  }

  type Row = {
    id: string;
    name: string;
    slug: string;
    status: string;
    created_at: string;
    customers: number | string;
    memories: number | string;
    visits: number | string;
  };

  const rows = (data ?? []) as Row[];
  const totals = rows.reduce(
    (acc, row) => ({
      customers: acc.customers + Number(row.customers || 0),
      memories: acc.memories + Number(row.memories || 0),
      visits: acc.visits + Number(row.visits || 0),
    }),
    { customers: 0, memories: 0, visits: 0 }
  );

  return jsonOk({
    tenants: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      createdAt: row.created_at,
      customers: Number(row.customers || 0),
      memories: Number(row.memories || 0),
      visits: Number(row.visits || 0),
    })),
    telemetry: {
      totalTenants: rows.length,
      activeTenants: rows.filter((row) => row.status === 'active').length,
      ...totals,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const result = await requireSuperAdmin();
  if (!result.context) return contextFailure(result.error!);
  const admin = result.context;

  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid tenant update');

  const client = createAdminClient();
  const { data: organization, error } = await client
    .from('organizations')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .select('id,name,slug,status')
    .maybeSingle();

  if (error) return jsonError(503, 'tenant_update_failed', 'Could not update the tenant');
  if (!organization) return jsonError(404, 'tenant_not_found', 'Tenant not found');

  await writeAuditLog({
    actorId: admin.userId,
    organizationId: organization.id,
    action: 'platform.tenant_status_changed',
    entityType: 'organizations',
    entityId: organization.id,
    metadata: { status: parsed.data.status, actorEmail: admin.email },
  });

  return jsonOk({ tenant: organization });
}
