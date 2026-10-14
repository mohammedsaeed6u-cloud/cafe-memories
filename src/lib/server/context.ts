import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicBrand, validBrandLink } from '@/lib/brand';

export type MerchantRole = 'owner' | 'admin' | 'manager' | 'staff';
export interface Membership {
  organizationId: string;
  branchId: string | null;
  role: MerchantRole;
}
export type UserDb = Awaited<ReturnType<typeof createClient>>;

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export type AuthResult<T> = { context: T; error?: never } | { context?: never; error: NextResponse };

/** A service-role client must never be used before this user + tenant check. */
export async function requireMerchant(
  options: { organizationId?: string | null; branchId?: string | null; roles?: MerchantRole[] } = {}
): Promise<AuthResult<{ db: UserDb; userId: string; membership: Membership }>> {
  try {
    const db = await createClient();
    const { data: { user }, error } = await db.auth.getUser();
    if (error || !user) return { error: apiError('Sign in required', 401) };

    let organizationId = options.organizationId;
    if (options.branchId) {
      const { data: branch, error: branchError } = await createAdminClient().from('branches')
        .select('organization_id').eq('id', options.branchId).eq('status', 'active').maybeSingle();
      if (branchError) return { error: apiError('Branch check failed', 503) };
      if (!branch || (organizationId && branch.organization_id !== organizationId)) {
        return { error: apiError('Branch not found in your organization', 403) };
      }
      organizationId = branch.organization_id;
    }
    let query = db.from('organization_members')
      .select('organization_id, branch_id, role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);
    if (organizationId) query = query.eq('organization_id', organizationId);
    const { data, error: membershipError } = await query.maybeSingle();
    if (membershipError) {
      console.error('Member lookup failed:', membershipError);
      return { error: apiError('Membership check failed', 503) };
    }
    if (!data) return { error: apiError('Merchant membership required', 403) };
    const membership: Membership = {
      organizationId: data.organization_id,
      branchId: data.branch_id,
      role: data.role,
    };
    if (options.roles && !options.roles.includes(membership.role)) {
      return { error: apiError('Insufficient permissions', 403) };
    }
    if (options.branchId && membership.branchId && membership.branchId !== options.branchId) {
      return { error: apiError('Not assigned to this branch', 403) };
    }
    const { data: organization, error: orgError } = await db.from('organizations')
      .select('status').eq('id', membership.organizationId).maybeSingle();
    if (orgError) return { error: apiError('Organization check failed', 503) };
    if (organization?.status !== 'active') return { error: apiError('Organization unavailable', 403) };
    return { context: { db, userId: user.id, membership } };
  } catch (error) {
    console.error('Merchant authentication failed:', error);
    return { error: apiError('Authentication service unavailable', 503) };
  }
}

export async function requireCustomer(): Promise<AuthResult<{ db: UserDb; userId: string; customerId: string }>> {
  try {
    const db = await createClient();
    const { data: { user }, error } = await db.auth.getUser();
    if (error || !user) return { error: apiError('Customer session required', 401) };
    const { data: customer, error: lookupError } = await db.from('customers')
      .select('id').eq('auth_user_id', user.id).is('deleted_at', null).maybeSingle();
    if (lookupError) {
      console.error('Customer lookup failed:', lookupError);
      return { error: apiError('Customer lookup failed', 503) };
    }
    if (!customer) return { error: apiError('Start a customer session first', 401) };
    return { context: { db, userId: user.id, customerId: customer.id } };
  } catch (error) {
    console.error('Customer authentication failed:', error);
    return { error: apiError('Authentication service unavailable', 503) };
  }
}

/** A public slug only resolves an active venue; it grants no user permissions. */
export async function resolveVenue(cafeSlug: string, branchSlug?: string | null) {
  const admin = createAdminClient();
  const { data: org, error: orgError } = await admin.from('organizations')
    .select('id,name,slug,logo_url,brand_tagline,primary_color,secondary_color,frame_style,wallet_color_preset,social_links')
    .eq('slug', cafeSlug).eq('status', 'active').maybeSingle();
  if (orgError || !org) return null;
  let query = admin.from('branches').select('id,name,slug,organization_id,google_maps_url,latitude,longitude')
    .eq('organization_id', org.id).eq('status', 'active').order('created_at', { ascending: true }).limit(1);
  if (branchSlug) query = query.eq('slug', branchSlug);
  const { data: branch, error: branchError } = await query.maybeSingle();
  if (branchError || !branch) return null;
  const mapsUrl = branch.google_maps_url && validBrandLink('maps', branch.google_maps_url);
  const coordinatesUrl = branch.latitude !== null && branch.longitude !== null
    ? `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}` : null;
  return { organizationId: org.id as string, organizationName: org.name as string,
    organizationSlug: org.slug as string, branchId: branch.id as string,
    branchName: branch.name as string, branchSlug: branch.slug as string,
    brand: publicBrand(org), mapsUrl: mapsUrl || coordinatesUrl };
}
