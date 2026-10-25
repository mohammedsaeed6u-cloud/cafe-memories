/**
 * Merchant stamp promotions.
 *
 * A promotion multiplies the stamps earned in a window (×2–×5), optionally
 * limited to certain weekdays and opening hours in the venue timezone. The
 * multiplier is resolved inside the tap/visit transaction, so the customer app
 * and the receipt always agree with what was actually awarded.
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

export const runtime = 'nodejs';

const windowSchema = z
  .object({
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7).optional().nullable(),
    startHour: z.number().int().min(0).max(23).optional().nullable(),
    endHour: z.number().int().min(1).max(24).optional().nullable(),
  })
  .refine((value) => Date.parse(value.endsAt) > Date.parse(value.startsAt), {
    message: 'endsAt must be after startsAt',
  })
  .refine(
    (value) =>
      value.startHour === null ||
      value.startHour === undefined ||
      value.endHour === null ||
      value.endHour === undefined ||
      value.startHour !== value.endHour,
    { message: 'The hour window cannot be empty' }
  );

const createSchema = windowSchema.and(
  z.object({
    title: z.string().trim().min(2).max(80),
    description: z.string().trim().max(240).optional().nullable(),
    multiplier: z.number().int().min(2).max(5),
    branchId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().default(true),
  })
);

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(240).nullable().optional(),
  multiplier: z.number().int().min(2).max(5).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7).nullable().optional(),
  startHour: z.number().int().min(0).max(23).nullable().optional(),
  endHour: z.number().int().min(1).max(24).nullable().optional(),
  branchId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

interface PromotionRow {
  id: string;
  branch_id: string | null;
  title: string;
  description: string | null;
  multiplier: number;
  starts_at: string;
  ends_at: string;
  days_of_week: number[] | null;
  start_hour: number | null;
  end_hour: number | null;
  is_active: boolean;
  created_at: string;
  branches: { name?: string } | Array<{ name?: string }> | null;
}

function shape(row: PromotionRow) {
  const branch = Array.isArray(row.branches) ? row.branches[0] : row.branches;
  return {
    id: row.id,
    branchId: row.branch_id,
    branchName: branch?.name ?? null,
    title: row.title,
    description: row.description,
    multiplier: row.multiplier,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    daysOfWeek: row.days_of_week,
    startHour: row.start_hour,
    endHour: row.end_hour,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

const COLUMNS =
  'id,branch_id,title,description,multiplier,starts_at,ends_at,days_of_week,start_hour,end_hour,is_active,created_at,branches(name)';

async function assertBranch(organizationId: string, branchId: string | null | undefined) {
  if (!branchId) return true;
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
    .from('stamp_promotions')
    .select(COLUMNS)
    .eq('organization_id', operator.organization.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('promotion list failed:', error.code ?? 'unknown');
    return jsonError(503, 'promotions_unavailable', 'Promotions are temporarily unavailable');
  }

  return jsonOk({ promotions: ((data ?? []) as PromotionRow[]).map(shape) });
}

export async function POST(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = createSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid promotion');
  const input = parsed.data;

  if (!(await assertBranch(operator.organization.id, input.branchId))) {
    return jsonError(400, 'invalid_branch', 'Branch is not available');
  }

  const { data, error } = await createAdminClient()
    .from('stamp_promotions')
    .insert({
      organization_id: operator.organization.id,
      branch_id: input.branchId ?? null,
      title: input.title,
      description: input.description ?? null,
      multiplier: input.multiplier,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      days_of_week: input.daysOfWeek ?? null,
      start_hour: input.startHour ?? null,
      end_hour: input.endHour ?? null,
      is_active: input.isActive,
    })
    .select(COLUMNS)
    .single();

  if (error || !data) {
    console.error('promotion create failed:', error?.code ?? 'unknown');
    return jsonError(503, 'promotion_unavailable', 'Could not create the promotion');
  }

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'promotion.created',
    entityType: 'stamp_promotions',
    entityId: data.id,
    metadata: { multiplier: input.multiplier },
  });

  return jsonOk({ promotion: shape(data as PromotionRow) }, 201);
}

export async function PATCH(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid promotion update');
  const input = parsed.data;

  if (!(await assertBranch(operator.organization.id, input.branchId))) {
    return jsonError(400, 'invalid_branch', 'Branch is not available');
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.multiplier !== undefined) updates.multiplier = input.multiplier;
  if (input.startsAt !== undefined) updates.starts_at = input.startsAt;
  if (input.endsAt !== undefined) updates.ends_at = input.endsAt;
  if (input.daysOfWeek !== undefined) updates.days_of_week = input.daysOfWeek;
  if (input.startHour !== undefined) updates.start_hour = input.startHour;
  if (input.endHour !== undefined) updates.end_hour = input.endHour;
  if (input.branchId !== undefined) updates.branch_id = input.branchId;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data, error } = await createAdminClient()
    .from('stamp_promotions')
    .update(updates)
    .eq('id', input.id)
    .eq('organization_id', operator.organization.id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    console.error('promotion update failed:', error.code ?? 'unknown');
    return jsonError(503, 'promotion_unavailable', 'Could not update the promotion');
  }
  if (!data) return jsonError(404, 'promotion_not_found', 'Promotion not found');

  return jsonOk({ promotion: shape(data as PromotionRow) });
}

export async function DELETE(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const id = request.nextUrl.searchParams.get('id') ?? '';
  if (!z.string().uuid().safeParse(id).success) {
    return jsonError(400, 'invalid_promotion', 'A valid promotion id is required');
  }

  const { data, error } = await createAdminClient()
    .from('stamp_promotions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', operator.organization.id)
    .select('id')
    .maybeSingle();

  if (error || !data) return jsonError(404, 'promotion_not_found', 'Promotion not found');

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'promotion.archived',
    entityType: 'stamp_promotions',
    entityId: id,
  });

  return jsonOk({ archived: true });
}
