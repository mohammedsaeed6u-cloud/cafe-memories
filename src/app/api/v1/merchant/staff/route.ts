/**
 * Merchant staff roster.
 *
 * GET    list members of the caller's organization (never PIN hashes)
 * POST   create a staff/manager membership and an optional tablet PIN
 * PATCH  update display name, role, branch, staff code, or reset the PIN
 * DELETE remove a membership (owners cannot be removed here)
 *
 * A PIN is a tablet convenience gate; the signed cookie is the authorization
 * boundary. Hashes live in `staff_pin_credentials`, which no browser role can
 * read.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';
import { hashPin, isValidPinFormat } from '@/lib/staff-session';

export const runtime = 'nodejs';

const staffCodeSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[A-Za-z0-9-]+$/, 'Staff code may contain letters, numbers, and dashes');

const createSchema = z.object({
  email: z.string().trim().email().max(254),
  displayName: z.string().trim().min(2).max(80),
  role: z.enum(['staff', 'manager']).default('staff'),
  branchId: z.string().uuid().optional().nullable(),
  staffCode: staffCodeSchema,
  pin: z.string().regex(/^\d{4,8}$/),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().trim().min(2).max(80).optional(),
  role: z.enum(['staff', 'manager']).optional(),
  branchId: z.string().uuid().nullable().optional(),
  staffCode: staffCodeSchema.optional(),
  pin: z.string().regex(/^\d{4,8}$/).optional(),
});

async function assertBranch(
  organizationId: string,
  branchId: string | null | undefined
): Promise<boolean> {
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
    .from('organization_members')
    .select(
      'id,user_id,role,branch_id,display_name,staff_code,created_at,staff_pin_credentials(member_id),users(email)'
    )
    .eq('organization_id', operator.organization.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('staff list failed:', error.code ?? 'unknown');
    return jsonError(503, 'staff_unavailable', 'Staff list is temporarily unavailable');
  }

  return jsonOk({
    members: (data ?? []).map((member) => {
      const credential = Array.isArray(member.staff_pin_credentials)
        ? member.staff_pin_credentials[0]
        : member.staff_pin_credentials;
      const user = Array.isArray(member.users) ? member.users[0] : member.users;
      return {
        id: member.id,
        userId: member.user_id,
        displayName: member.display_name ?? null,
        email: user?.email ?? null,
        role: member.role,
        branchId: member.branch_id,
        staffCode: member.staff_code,
        hasPin: Boolean(credential),
        createdAt: member.created_at,
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = createSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid staff member details');
  const input = parsed.data;

  if (!(await assertBranch(operator.organization.id, input.branchId))) {
    return jsonError(400, 'invalid_branch', 'Branch is not available');
  }

  const admin = createAdminClient();
  const email = input.email.toLowerCase();

  const { data: existingUser } = await admin
    .from('users')
    .select('id,email')
    .eq('email', email)
    .maybeSingle();

  let userId: string | null = typeof existingUser?.id === 'string' ? existingUser.id : null;

  if (!userId) {
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: input.displayName },
    });
    if (authError || !created.user) {
      return jsonError(409, 'email_unavailable', 'تعذر إنشاء حساب الموظف بهذا البريد');
    }
    userId = created.user.id;
  }

  const { error: userError } = await admin.from('users').upsert(
    { id: userId, email, name: input.displayName, role: 'user' },
    { onConflict: 'id' }
  );
  if (userError) return jsonError(503, 'staff_unavailable', 'Could not prepare the staff account');

  const { data: member, error: memberError } = await admin
    .from('organization_members')
    .insert({
      organization_id: operator.organization.id,
      user_id: userId,
      role: input.role,
      branch_id: input.branchId ?? null,
      display_name: input.displayName,
      staff_code: input.staffCode,
    })
    .select('id')
    .single();

  if (memberError || !member) {
    if (memberError?.code === '23505') {
      return jsonError(409, 'already_member', 'هذا الحساب عضو بالفعل أو رمز الموظف مستخدم');
    }
    return jsonError(503, 'staff_unavailable', 'Could not add the staff member');
  }

  if (!isValidPinFormat(input.pin)) {
    await admin.from('organization_members').delete().eq('id', member.id);
    return jsonError(400, 'invalid_pin', 'PIN must be 4 to 8 digits');
  }

  const { error: pinError } = await admin.from('staff_pin_credentials').insert({
    member_id: member.id,
    pin_hash: await hashPin(input.pin),
  });

  if (pinError) {
    await admin.from('organization_members').delete().eq('id', member.id);
    return jsonError(503, 'staff_unavailable', 'Could not store the staff PIN');
  }

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'staff.created',
    entityType: 'organization_members',
    entityId: member.id,
    metadata: { role: input.role, branchId: input.branchId ?? null },
  });

  return jsonOk({ memberId: member.id }, 201);
}

export async function PATCH(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(400, 'invalid_payload', 'Invalid staff update');

  const admin = createAdminClient();
  const { data: member } = await admin
    .from('organization_members')
    .select('id,organization_id,role,user_id')
    .eq('id', parsed.data.id)
    .maybeSingle();

  if (!member || member.organization_id !== operator.organization.id) {
    return jsonError(404, 'staff_not_found', 'Staff member not found');
  }
  if (member.role === 'owner') {
    return jsonError(403, 'owner_protected', 'Owner membership cannot be changed here');
  }
  if (!(await assertBranch(operator.organization.id, parsed.data.branchId))) {
    return jsonError(400, 'invalid_branch', 'Branch is not available');
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.displayName !== undefined) updates.display_name = parsed.data.displayName;
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.branchId !== undefined) updates.branch_id = parsed.data.branchId;
  if (parsed.data.staffCode !== undefined) updates.staff_code = parsed.data.staffCode;

  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from('organization_members').update(updates).eq('id', member.id);
    if (error) {
      if (error.code === '23505') {
        return jsonError(409, 'staff_code_in_use', 'رمز الموظف مستخدم بالفعل');
      }
      return jsonError(503, 'staff_update_failed', 'Could not update the staff member');
    }
  }

  if (parsed.data.pin !== undefined) {
    const { error } = await admin.from('staff_pin_credentials').upsert(
      { member_id: member.id, pin_hash: await hashPin(parsed.data.pin), updated_at: new Date().toISOString() },
      { onConflict: 'member_id' }
    );
    if (error) return jsonError(503, 'staff_update_failed', 'Could not store the staff PIN');
  }

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'staff.updated',
    entityType: 'organization_members',
    entityId: member.id,
    metadata: { fields: Object.keys(updates), pinReset: parsed.data.pin !== undefined },
  });

  return jsonOk({ memberId: member.id });
}

export async function DELETE(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const id = request.nextUrl.searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success) {
    return jsonError(400, 'invalid_id', 'A valid member id is required');
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from('organization_members')
    .select('id,organization_id,role,user_id')
    .eq('id', id)
    .maybeSingle();

  if (!member || member.organization_id !== operator.organization.id) {
    return jsonError(404, 'staff_not_found', 'Staff member not found');
  }
  if (member.role === 'owner') {
    return jsonError(403, 'owner_protected', 'Owner membership cannot be removed');
  }
  if (member.id === operator.memberId) {
    return jsonError(403, 'self_removal', 'You cannot remove your own membership');
  }

  const { error } = await admin.from('organization_members').delete().eq('id', member.id);
  if (error) return jsonError(503, 'staff_delete_failed', 'Could not remove the staff member');

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'staff.removed',
    entityType: 'organization_members',
    entityId: member.id,
    metadata: {},
  });

  return jsonOk({ memberId: member.id });
}
