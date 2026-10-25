/**
 * Server-side authorization context.
 *
 * Authentication answers "who is calling"; this module answers "what are they
 * allowed to touch". It always verifies the session first and only then reads
 * tenant data, so an unauthenticated request never reaches a service-role
 * query. Branch and organization identifiers supplied by the client are
 * validated against the membership row instead of being trusted.
 *
 * Two identities can reach merchant surfaces:
 *   * a Supabase Auth user (owner/admin/manager/staff) — `requireMerchant`
 *   * a signed staff-tablet session — `requireStaffMember`
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { envList } from '@/lib/env';
import { STAFF_SESSION_COOKIE, verifyStaffSessionValue } from '@/lib/staff-session';

export type MerchantRole = 'owner' | 'admin' | 'manager' | 'staff';

export interface MerchantOptions {
  organizationId?: string;
  branchId?: string;
  roles?: readonly MerchantRole[];
}

export interface MerchantContext {
  userId: string;
  email: string | null;
  membership: {
    id: string | null;
    organizationId: string;
    branchId: string | null;
    role: MerchantRole;
  };
  organization: {
    id: string;
    slug: string;
    name: string;
    status: string;
    settings: Record<string, unknown>;
  };
}

export interface StaffContext {
  staffMemberId: string;
  userId: string;
  role: string;
  membership: {
    organizationId: string;
    branchId: string | null;
  };
  organization: {
    id: string;
    slug: string;
    name: string;
    status: string;
  };
}

export interface CustomerContext {
  customerId: string;
  userId: string;
  displayName: string | null;
}

export interface SuperAdminContext {
  userId: string;
  email: string;
}

export interface OperatorContext {
  /** How the caller authenticated. Both identities are re-verified server-side. */
  source: 'merchant' | 'staff';
  /** `organization_members.id` for staff, or the member row id for merchants. */
  memberId: string | null;
  userId: string;
  email: string | null;
  role: MerchantRole;
  organization: {
    id: string;
    slug: string;
    name: string;
    status: string;
    settings: Record<string, unknown>;
  };
  branchId: string | null;
}

export interface ContextError {
  status: 400 | 401 | 403;
  code: string;
  message: string;
}

export interface ContextResult<T> {
  context: T | null;
  error: ContextError | null;
}

function fail<T>(status: ContextError['status'], code: string, message: string): ContextResult<T> {
  return { context: null, error: { status, code, message } };
}

function ok<T>(context: T): ContextResult<T> {
  return { context, error: null };
}

const MERCHANT_ROLES: readonly MerchantRole[] = ['owner', 'admin', 'manager', 'staff'];

function isMerchantRole(value: unknown): value is MerchantRole {
  return typeof value === 'string' && (MERCHANT_ROLES as readonly string[]).includes(value);
}

interface OrganizationRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  settings: Record<string, unknown> | null;
}

/**
 * Resolve a merchant account. When the caller does not name an organization,
 * the first active membership is used. The client never supplies a trusted
 * organization id; a supplied one must match a real membership row.
 */
export async function requireMerchant(
  options: MerchantOptions = {}
): Promise<ContextResult<MerchantContext>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return fail(401, 'unauthenticated', 'Authentication required');

  let organizationId = options.organizationId ?? null;

  // Validate the branch before reading membership: a branch in another tenant
  // must never become a probe into that tenant's data.
  if (options.branchId) {
    const admin = createAdminClient();
    const { data: branch, error: branchError } = await admin
      .from('branches')
      .select('id,organization_id,status')
      .eq('id', options.branchId)
      .maybeSingle();

    if (branchError || !branch) return fail(403, 'branch_not_found', 'Branch not available');
    if (branch.status && branch.status !== 'active') {
      return fail(403, 'branch_inactive', 'Branch not available');
    }
    if (organizationId && branch.organization_id !== organizationId) {
      return fail(403, 'branch_scope', 'Branch does not belong to this organization');
    }
    organizationId = branch.organization_id as string;
  }

  const membershipQuery = supabase
    .from('organization_members')
    .select('id,organization_id,role,branch_id')
    .eq('user_id', user.id);

  const { data: member, error: memberError } = organizationId
    ? await membershipQuery.eq('organization_id', organizationId).maybeSingle()
    : await membershipQuery.order('created_at', { ascending: true }).limit(1).maybeSingle();

  if (memberError || !member || !isMerchantRole(member.role)) {
    return fail(403, 'membership_required', 'Organization membership required');
  }

  organizationId = member.organization_id as string;

  // Staff are scoped to their own branch. Owners, admins, and managers may
  // operate across the organization.
  if (member.role === 'staff' && options.branchId && member.branch_id !== options.branchId) {
    return fail(403, 'branch_scope', 'Staff member is assigned to a different branch');
  }

  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select('id,slug,name,status,settings')
    .eq('id', organizationId)
    .maybeSingle();

  if (organizationError || !organization || organization.status !== 'active') {
    return fail(403, 'organization_inactive', 'Organization is not active');
  }

  if (options.roles && !options.roles.includes(member.role)) {
    return fail(403, 'role_required', 'Insufficient role');
  }

  const org = organization as OrganizationRow;
  return ok({
    userId: user.id,
    email: user.email ?? null,
    membership: {
      id: typeof member.id === 'string' ? member.id : null,
      organizationId,
      branchId: typeof member.branch_id === 'string' ? member.branch_id : null,
      role: member.role,
    },
    organization: {
      id: org.id,
      slug: org.slug,
      name: org.name,
      status: org.status,
      settings: org.settings ?? {},
    },
  });
}

/**
 * Resolve the signed staff-tablet session to a real membership row.
 *
 * The cookie is signed and carries `organization_members.id`; the row is then
 * re-read so a revoked member cannot keep a working tablet session.
 */
export async function requireStaffMember(
  request: NextRequest,
  options: { branchId?: string; roles?: readonly MerchantRole[] } = {}
): Promise<ContextResult<StaffContext>> {
  const claims = await verifyStaffSessionValue(
    request.cookies.get(STAFF_SESSION_COOKIE)?.value
  );
  if (!claims) return fail(401, 'unauthenticated', 'Staff session required');

  const admin = createAdminClient();
  const { data: member, error } = await admin
    .from('organization_members')
    .select('id,user_id,role,branch_id,organization_id,organizations!inner(id,slug,name,status)')
    .eq('id', claims.staffId)
    .maybeSingle();

  if (error || !member) return fail(401, 'unauthenticated', 'Staff session required');
  if (!isMerchantRole(member.role)) return fail(403, 'role_required', 'Insufficient role');

  const organization = Array.isArray(member.organizations)
    ? member.organizations[0]
    : member.organizations;
  if (!organization || organization.status !== 'active') {
    return fail(403, 'organization_inactive', 'Organization is not active');
  }

  if (options.branchId && member.branch_id && member.branch_id !== options.branchId) {
    return fail(403, 'branch_scope', 'Staff member is assigned to a different branch');
  }
  if (options.roles && !options.roles.includes(member.role)) {
    return fail(403, 'role_required', 'Insufficient role');
  }

  return ok({
    staffMemberId: String(member.id),
    userId: String(member.user_id),
    role: member.role,
    membership: {
      organizationId: String(member.organization_id),
      branchId: typeof member.branch_id === 'string' ? member.branch_id : null,
    },
    organization: {
      id: String(organization.id),
      slug: String(organization.slug),
      name: String(organization.name),
      status: String(organization.status),
    },
  });
}

/**
 * Accept either a signed-in merchant or a signed staff tablet.
 *
 * Merchant routes that a barista tablet must also reach use this instead of
 * duplicating the two guards. The returned role always comes from the database,
 * never from the session cookie.
 */
export async function requireOperator(
  request: NextRequest,
  options: MerchantOptions = {}
): Promise<ContextResult<OperatorContext>> {
  const merchant = await requireMerchant(options);
  if (merchant.context) {
    return ok({
      source: 'merchant',
      memberId: merchant.context.membership.id,
      userId: merchant.context.userId,
      email: merchant.context.email,
      role: merchant.context.membership.role,
      organization: merchant.context.organization,
      branchId: options.branchId ?? merchant.context.membership.branchId,
    });
  }

  const staff = await requireStaffMember(request, options);
  if (staff.context) {
    return ok({
      source: 'staff',
      memberId: staff.context.staffMemberId,
      userId: staff.context.userId,
      email: null,
      role: isMerchantRole(staff.context.role) ? staff.context.role : 'staff',
      organization: {
        ...staff.context.organization,
        settings: {},
      },
      branchId: options.branchId ?? staff.context.membership.branchId,
    });
  }

  // A missing session is 401; a valid session without the required role or
  // branch is 403. Prefer the more specific failure.
  if (merchant.error && merchant.error.status !== 401) return fail(merchant.error.status, merchant.error.code, merchant.error.message);
  if (staff.error && staff.error.status !== 401) return fail(staff.error.status, staff.error.code, staff.error.message);
  return fail(401, 'unauthenticated', 'Authentication required');
}

/** The operator's own branch, or the oldest active branch of the organization. */
export async function defaultBranchId(
  organizationId: string,
  preferredBranchId: string | null
): Promise<string | null> {
  if (preferredBranchId) return preferredBranchId;
  const { data } = await createAdminClient()
    .from('branches')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function requireCustomer(): Promise<ContextResult<CustomerContext>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return fail(401, 'unauthenticated', 'Authentication required');

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id,display_name')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (customerError || !customer) return fail(403, 'customer_required', 'Customer account required');

  return ok({
    customerId: customer.id as string,
    userId: user.id,
    displayName: typeof customer.display_name === 'string' ? customer.display_name : null,
  });
}

/**
 * Platform administration is an explicit allow-list, not a role that can be
 * granted from the dashboard. An empty list denies everyone.
 */
export async function requireSuperAdmin(): Promise<ContextResult<SuperAdminContext>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return fail(401, 'unauthenticated', 'Authentication required');

  const email = user.email?.toLowerCase() ?? '';
  if (!email || !envList('SUPER_ADMIN_EMAILS').includes(email)) {
    return fail(403, 'super_admin_required', 'Super admin access required');
  }

  return ok({ userId: user.id, email });
}

/** JSON response for a failed context resolution. */
export function contextErrorResponse(error: ContextError): NextResponse {
  return NextResponse.json(
    { ok: false, error: error.message, code: error.code },
    { status: error.status, headers: { 'Cache-Control': 'no-store' } }
  );
}
