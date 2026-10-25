import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { isBrandLogoKey } from '@/lib/brand';
import { mergeOrganizationSettings, type OrganizationSettingsInput } from '@/lib/server/settings';

export interface PublicVenue {
  organization: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    tagline: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    frameStyle: string;
    walletColorPreset: string;
    socialLinks: Record<string, unknown>;
  };
  branch: {
    id: string;
    slug: string;
    name: string;
    address: string | null;
  };
  settings: OrganizationSettingsInput;
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/i;

/**
 * Everything a public surface (customer app, wall, QR landing) needs to render
 * a venue. It never exposes member data, billing, wallet credentials, or any
 * customer record. A branch slug wins; an organization slug falls back to the
 * oldest active branch so a single-branch venue needs one link only.
 */
export async function loadPublicVenue(
  slug: string | null | undefined
): Promise<PublicVenue | null> {
  const clean = (slug ?? '').trim();
  if (!clean || !SLUG_PATTERN.test(clean)) return null;

  const admin = createAdminClient();
  const orgColumns =
    'id,slug,name,logo_url,brand_tagline,primary_color,secondary_color,frame_style,wallet_color_preset,social_links,status,settings';

  const { data: branch, error: branchError } = await admin
    .from('branches')
    .select(`id,slug,name,address,status,organization_id,organizations!inner(${orgColumns})`)
    .eq('slug', clean)
    .maybeSingle();

  if (branchError) throw new Error('Venue lookup failed');

  if (branch) {
    const organization = Array.isArray(branch.organizations)
      ? branch.organizations[0]
      : branch.organizations;
    if (branch.status === 'active' && organization?.status === 'active') {
      return shape(branch, organization);
    }
  }

  const { data: organization, error: organizationError } = await admin
    .from('organizations')
    .select(orgColumns)
    .eq('slug', clean)
    .eq('status', 'active')
    .maybeSingle();

  if (organizationError) throw new Error('Venue lookup failed');
  if (!organization) return null;

  const { data: primaryBranch } = await admin
    .from('branches')
    .select('id,slug,name,address,status,organization_id')
    .eq('organization_id', organization.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!primaryBranch) return null;
  return shape(primaryBranch, organization);
}

interface BranchRow {
  id: string;
  slug: string;
  name: string;
  address: string | null;
}

interface OrganizationRow {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  brand_tagline: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  frame_style: string;
  wallet_color_preset: string;
  social_links: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
}

function shape(branch: BranchRow, organization: OrganizationRow): PublicVenue {
  return {
    organization: {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      logoUrl: isBrandLogoKey(organization.logo_url, organization.id)
        ? `/api/v1/brand/${organization.id}/logo?v=${organization.logo_url!.split('/').at(-1)}`
        : null,
      tagline: organization.brand_tagline,
      primaryColor: organization.primary_color,
      secondaryColor: organization.secondary_color,
      frameStyle: organization.frame_style,
      walletColorPreset: organization.wallet_color_preset,
      socialLinks: organization.social_links ?? {},
    },
    branch: {
      id: branch.id,
      slug: branch.slug,
      name: branch.name,
      address: branch.address,
    },
    settings: mergeOrganizationSettings(organization.settings),
  };
}

/** Stable cache header for public venue configuration. */
export const PUBLIC_VENUE_CACHE = 'public, max-age=30, s-maxage=120, stale-while-revalidate=600';
