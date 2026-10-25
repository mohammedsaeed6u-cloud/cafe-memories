/**
 * GET   /api/v1/merchant/settings
 * PATCH /api/v1/merchant/settings
 *
 * Settings live in `organizations.settings` (validated JSON) and brand columns
 * on the organization. The browser no longer owns configuration in
 * localStorage, so two devices and the customer app always agree.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk, readJson, writeAuditLog } from '@/lib/server/route-helpers';
import {
  businessSettingsFromOrganization,
  mergeOrganizationSettings,
  organizationSettingsSchema,
} from '@/lib/server/settings';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/constants/photobooth-presets';
import { brandPatchSchema, isBrandLogoKey } from '@/lib/brand';

export const runtime = 'nodejs';

const patchSchema = z
  .object({
    settings: organizationSettingsSchema.partial().optional(),
    brand: brandPatchSchema.optional(),
  })
  .strict();

export async function GET(request: NextRequest) {
  const result = await requireOperator(request);
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const { data: organization, error } = await createAdminClient()
    .from('organizations')
    .select(
      'id,slug,name,logo_url,brand_tagline,primary_color,secondary_color,frame_style,wallet_color_preset,social_links,timezone,currency,settings'
    )
    .eq('id', operator.organization.id)
    .maybeSingle();

  if (error || !organization) {
    return jsonError(503, 'settings_unavailable', 'Settings are temporarily unavailable');
  }

  const logoUrl = isBrandLogoKey(organization.logo_url, organization.id)
    ? `/api/v1/brand/${organization.id}/logo?v=${organization.logo_url!.split('/').at(-1)}`
    : null;

  return jsonOk({
    settings: {
      ...DEFAULT_BUSINESS_SETTINGS,
      ...businessSettingsFromOrganization({ ...organization, logo_url: logoUrl }),
      branding: {
        ...DEFAULT_BUSINESS_SETTINGS.branding,
        name: organization.name,
        logoUrl: logoUrl ?? undefined,
        tagline: organization.brand_tagline ?? undefined,
      },
    },
    organization: {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      logoUrl,
      tagline: organization.brand_tagline,
      primaryColor: organization.primary_color,
      secondaryColor: organization.secondary_color,
      timezone: organization.timezone,
      currency: organization.currency,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;

  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(400, 'invalid_settings', 'Invalid settings payload');
  }

  const admin = createAdminClient();
  const { data: current, error: readError } = await admin
    .from('organizations')
    .select('id,settings,name,brand_tagline,primary_color,secondary_color,frame_style,wallet_color_preset,social_links')
    .eq('id', operator.organization.id)
    .maybeSingle();

  if (readError || !current) {
    return jsonError(503, 'settings_unavailable', 'Settings are temporarily unavailable');
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (parsed.data.settings) {
    const merged = mergeOrganizationSettings({
      ...(current.settings ?? {}),
      ...parsed.data.settings,
    });
    updates.settings = merged;
  }

  const brand = parsed.data.brand;
  if (brand) {
    if (brand.name !== undefined) updates.name = brand.name;
    if (brand.tagline !== undefined) updates.brand_tagline = brand.tagline;
    if (brand.primaryColor !== undefined) updates.primary_color = brand.primaryColor;
    if (brand.accentColor !== undefined) updates.secondary_color = brand.accentColor;
    if (brand.frameStyle !== undefined) updates.frame_style = brand.frameStyle;
    if (brand.walletColorPreset !== undefined) updates.wallet_color_preset = brand.walletColorPreset;
    if (brand.socialLinks !== undefined) updates.social_links = brand.socialLinks;
  }

  if (Object.keys(updates).length === 1) {
    return jsonError(400, 'nothing_to_update', 'No settings were supplied');
  }

  const { data: updated, error } = await admin
    .from('organizations')
    .update(updates)
    .eq('id', operator.organization.id)
    .select(
      'id,slug,name,logo_url,brand_tagline,primary_color,secondary_color,frame_style,wallet_color_preset,social_links,timezone,currency,settings'
    )
    .single();

  if (error || !updated) {
    console.error('organization settings update failed:', error?.code ?? 'unknown');
    return jsonError(503, 'settings_update_failed', 'Could not save settings');
  }

  await writeAuditLog({
    actorId: operator.memberId,
    organizationId: operator.organization.id,
    action: 'organization.settings_updated',
    entityType: 'organizations',
    entityId: operator.organization.id,
    metadata: { keys: Object.keys(updates).filter((key) => key !== 'updated_at') },
  });

  const logoUrl = isBrandLogoKey(updated.logo_url, updated.id)
    ? `/api/v1/brand/${updated.id}/logo?v=${updated.logo_url!.split('/').at(-1)}`
    : null;

  return jsonOk({
    settings: {
      ...DEFAULT_BUSINESS_SETTINGS,
      ...businessSettingsFromOrganization({ ...updated, logo_url: logoUrl }),
      branding: {
        ...DEFAULT_BUSINESS_SETTINGS.branding,
        name: updated.name,
        logoUrl: logoUrl ?? undefined,
        tagline: updated.brand_tagline ?? undefined,
      },
    },
  });
}
