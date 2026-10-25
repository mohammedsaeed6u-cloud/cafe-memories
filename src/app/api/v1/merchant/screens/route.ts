/**
 * GET    /api/v1/merchant/screens          list paired screens
 * DELETE /api/v1/merchant/screens?id=...   revoke a screen's device token
 *
 * Revoking clears the device token and returns the row to `pending`, so the
 * screen can no longer heartbeat until it is paired again.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk, writeAuditLog } from '@/lib/server/route-helpers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get('branchId') ?? undefined;
  const result = await requireOperator(request, { branchId });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const admin = createAdminClient();
  let query = admin
    .from('screens')
    .select('id,name,status,orientation,resolution,last_heartbeat_at,paired_at,created_at,branch_id')
    .eq('organization_id', operator.organization.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (operator.branchId) query = query.eq('branch_id', operator.branchId);

  const { data, error } = await query;
  if (error) {
    console.error('screen list failed:', error.code ?? 'unknown');
    return jsonError(503, 'screens_unavailable', 'Screens are temporarily unavailable');
  }

  return jsonOk({
    screens: (data ?? []).map((screen) => ({
      id: screen.id,
      name: screen.name,
      status: screen.status,
      orientation: screen.orientation,
      resolution: screen.resolution,
      lastHeartbeatAt: screen.last_heartbeat_at,
      pairedAt: screen.paired_at,
      createdAt: screen.created_at,
      branchId: screen.branch_id,
      online:
        screen.status === 'online' &&
        Boolean(
          screen.last_heartbeat_at &&
            Date.now() - new Date(screen.last_heartbeat_at).getTime() < 2 * 60 * 1000
        ),
    })),
  });
}

export async function DELETE(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const id = request.nextUrl.searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success) {
    return jsonError(400, 'invalid_id', 'A valid screen id is required');
  }

  const admin = createAdminClient();
  const { data: screen } = await admin
    .from('screens')
    .select('id,organization_id,branch_id,name')
    .eq('id', id)
    .maybeSingle();

  if (!screen || screen.organization_id !== operator.organization.id) {
    return jsonError(404, 'screen_not_found', 'Screen not found');
  }
  if (operator.branchId && screen.branch_id !== operator.branchId) {
    return jsonError(403, 'branch_scope', 'Screen belongs to another branch');
  }

  const { error } = await admin
    .from('screens')
    .update({
      status: 'pending',
      device_token: null,
      paired_at: null,
      last_heartbeat_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', screen.id);

  if (error) return jsonError(503, 'screen_update_failed', 'Could not unpair the screen');

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'screen.unpaired',
    entityType: 'screens',
    entityId: screen.id,
    metadata: { name: screen.name },
  });

  return jsonOk({ screenId: screen.id, status: 'pending' });
}
