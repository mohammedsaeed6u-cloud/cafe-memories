/**
 * GET /api/v1/merchant/context
 *
 * Everything the dashboard needs to render for the signed-in operator: the
 * organization, its branches, the active branch, validated photobooth settings,
 * and the active loyalty rule. All identifiers come from the verified session.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonOk } from '@/lib/server/route-helpers';
import { businessSettingsFromOrganization, mergeOrganizationSettings } from '@/lib/server/settings';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/constants/photobooth-presets';
import { isBrandLogoKey } from '@/lib/brand';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get('branchId') ?? undefined;
  const result = await requireOperator(request, { branchId });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const admin = createAdminClient();
  const [organizationResult, branchesResult, ruleResult] = await Promise.all([
    admin
      .from('organizations')
      .select(
        'id,slug,name,logo_url,brand_tagline,primary_color,secondary_color,frame_style,wallet_color_preset,social_links,timezone,currency,status,settings'
      )
      .eq('id', operator.organization.id)
      .maybeSingle(),
    admin
      .from('branches')
      .select('id,slug,name,address,status')
      .eq('organization_id', operator.organization.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true }),
    admin
      .from('reward_rules')
      .select('id,name,threshold,reward_type,reward_value,reward_description,is_active')
      .eq('organization_id', operator.organization.id)
      .eq('is_active', true)
      .eq('trigger_type', 'visit_count')
      .lte('starts_at', new Date().toISOString())
      .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const organization = organizationResult.data;
  if (!organization) return contextFailure({ status: 403, code: 'organization_inactive', message: 'Organization is not active' });

  const branches = (branchesResult.data ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    address: string | null;
  }>;
  const activeBranch = operator.branchId
    ? branches.find((branch) => branch.id === operator.branchId) ?? null
    : branches[0] ?? null;

  const logoUrl = isBrandLogoKey(organization.logo_url, organization.id)
    ? `/api/v1/brand/${organization.id}/logo?v=${organization.logo_url!.split('/').at(-1)}`
    : null;

  const settings = {
    ...DEFAULT_BUSINESS_SETTINGS,
    ...businessSettingsFromOrganization({
      slug: organization.slug,
      name: organization.name,
      logo_url: logoUrl,
      brand_tagline: organization.brand_tagline,
      primary_color: organization.primary_color,
      secondary_color: organization.secondary_color,
      settings: mergeOrganizationSettings(organization.settings) as unknown as Record<string, unknown>,
    }),
    branding: {
      ...DEFAULT_BUSINESS_SETTINGS.branding,
      name: organization.name,
      logoUrl: logoUrl ?? undefined,
      tagline: organization.brand_tagline ?? undefined,
    },
  };

  return jsonOk({
    source: operator.source,
    memberId: operator.memberId,
    role: operator.role,
    organization: {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      logoUrl,
      tagline: organization.brand_tagline,
      primaryColor: organization.primary_color,
      secondaryColor: organization.secondary_color,
      frameStyle: organization.frame_style,
      walletColorPreset: organization.wallet_color_preset,
      socialLinks: organization.social_links,
      timezone: organization.timezone,
      currency: organization.currency,
    },
    branch: activeBranch,
    branches,
    settings,
    rewardRule: ruleResult.data ?? null,
  });
}
