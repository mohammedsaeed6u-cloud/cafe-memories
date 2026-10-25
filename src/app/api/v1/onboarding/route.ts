/**
 * POST /api/v1/onboarding
 *
 * Provisions a brand-new tenant for the signed-in Supabase user: organization,
 * first branch, owner membership, and the initial visit-count reward rule. It
 * is idempotent per user — a user who already owns a tenant receives it instead
 * of a duplicate.
 *
 * Nothing is accepted from localStorage: the caller must present a real session
 * cookie, and the slug must be unique across organizations and branches.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';
import { mergeOrganizationSettings } from '@/lib/server/settings';

export const runtime = 'nodejs';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,79}$/;

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  businessName: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80).regex(SLUG_PATTERN, 'Use lowercase letters, numbers, and dashes'),
  branchName: z.string().trim().min(2).max(120).default('الفرع الرئيسي'),
  category: z.string().trim().max(60).optional(),
  country: z.string().trim().length(2).default('SA'),
  currency: z.string().trim().length(3).default('SAR'),
  timezone: z.string().trim().max(60).default('Asia/Riyadh'),
  totalStamps: z.number().int().min(2).max(30).default(5),
  rewardTitle: z.string().trim().min(2).max(120),
  rewardDescription: z.string().trim().max(300).optional().nullable(),
});

const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'dashboard',
  'terminal',
  'barista',
  'login',
  'signup',
  'wall',
  'c',
  'go',
  'auth',
  'privacy',
  'terms',
]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  let {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // The browser client may not have flushed its cookies yet right after sign-up,
  // so a freshly minted access token is also accepted — verified server-side.
  if ((authError || !user) && request.headers.get('authorization')?.startsWith('Bearer ')) {
    const token = request.headers.get('authorization')!.slice('Bearer '.length).trim();
    const { data: tokenUser, error: tokenError } = await createAdminClient().auth.getUser(token);
    if (!tokenError && tokenUser.user) {
      user = tokenUser.user;
      authError = null;
    }
  }

  if (authError || !user) {
    return jsonError(401, 'unauthenticated', 'Sign in before creating a venue');
  }

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(400, 'invalid_payload', 'Invalid onboarding details');
  }
  const input = parsed.data;
  if (RESERVED_SLUGS.has(input.slug)) {
    return jsonError(409, 'slug_reserved', 'This link is reserved');
  }

  const admin = createAdminClient();

  // Already provisioned? Return the existing tenant so a refresh is harmless.
  const { data: existingMember } = await admin
    .from('organization_members')
    .select('organization_id,role')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingMember?.organization_id) {
    const { data: organization } = await admin
      .from('organizations')
      .select('id,slug,name')
      .eq('id', existingMember.organization_id)
      .maybeSingle();
    return jsonOk({
      organization: organization ?? null,
      existing: true,
    });
  }

  const [{ data: slugTaken }, { data: branchSlugTaken }] = await Promise.all([
    admin.from('organizations').select('id').eq('slug', input.slug).maybeSingle(),
    admin.from('branches').select('id').eq('slug', input.slug).maybeSingle(),
  ]);
  if (slugTaken || branchSlugTaken) {
    return jsonError(409, 'slug_taken', 'This link is already in use');
  }

  const settings = mergeOrganizationSettings({
    businessType: 'general',
    loyaltyMaxVisits: input.totalStamps,
    freeGiftOffer: {
      title: input.rewardTitle,
      subtitle: input.rewardDescription ?? '',
      icon: 'gift',
    },
  });

  const { data: organization, error: organizationError } = await admin
    .from('organizations')
    .insert({
      name: input.businessName,
      slug: input.slug,
      country: input.country.toUpperCase(),
      currency: input.currency.toUpperCase(),
      timezone: input.timezone,
      status: 'active',
      settings,
    })
    .select('id,slug,name')
    .single();

  if (organizationError || !organization) {
    console.error('organization provisioning failed:', organizationError?.code ?? 'unknown');
    return jsonError(503, 'onboarding_unavailable', 'Could not create the venue');
  }

  const { data: branch, error: branchError } = await admin
    .from('branches')
    .insert({
      organization_id: organization.id,
      name: input.branchName,
      slug: input.slug,
      timezone: input.timezone,
      status: 'active',
    })
    .select('id,slug,name')
    .single();

  if (branchError || !branch) {
    await admin.from('organizations').delete().eq('id', organization.id);
    console.error('branch provisioning failed:', branchError?.code ?? 'unknown');
    return jsonError(503, 'onboarding_unavailable', 'Could not create the branch');
  }

  const { error: userError } = await admin.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      name: input.name,
      role: 'user',
    },
    { onConflict: 'id' }
  );
  if (userError) {
    await admin.from('organizations').delete().eq('id', organization.id);
    return jsonError(503, 'onboarding_unavailable', 'Could not prepare the owner account');
  }

  const { data: membership, error: memberError } = await admin
    .from('organization_members')
    .insert({
      organization_id: organization.id,
      user_id: user.id,
      role: 'owner',
      branch_id: null,
      display_name: input.name,
    })
    .select('id')
    .single();

  if (memberError || !membership) {
    await admin.from('organizations').delete().eq('id', organization.id);
    console.error('owner membership failed:', memberError?.code ?? 'unknown');
    return jsonError(503, 'onboarding_unavailable', 'Could not link the owner account');
  }

  const { error: ruleError } = await admin.from('reward_rules').insert({
    organization_id: organization.id,
    name: input.rewardTitle,
    description: input.rewardDescription ?? null,
    trigger_type: 'visit_count',
    threshold: input.totalStamps,
    reward_type: 'free_item',
    reward_description: input.rewardDescription ?? null,
    is_active: true,
    starts_at: new Date().toISOString(),
  });

  if (ruleError) {
    console.error('reward rule provisioning failed:', ruleError.code ?? 'unknown');
  }

  await writeAuditLog({
    actorId: membership.id,
    organizationId: organization.id,
    action: 'organization.provisioned',
    entityType: 'organizations',
    entityId: organization.id,
    metadata: { slug: organization.slug, branchId: branch.id, threshold: input.totalStamps },
  });

  return jsonOk({ organization, branch, existing: false }, 201);
}
