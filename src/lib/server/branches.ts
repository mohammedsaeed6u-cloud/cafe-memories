import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export interface PublicBranch {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  organizationSlug: string;
  organizationName: string;
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/i;

/**
 * Resolve a public venue slug to its branch.
 *
 * The customer app uses the branch slug when it exists, and falls back to the
 * organization slug (first active branch) so a single-branch venue only needs
 * one link.
 */
export async function resolvePublicBranch(slug: string | null | undefined): Promise<PublicBranch | null> {
  const clean = (slug ?? '').trim();
  if (!clean || !SLUG_PATTERN.test(clean)) return null;

  const admin = createAdminClient();

  const { data: branch } = await admin
    .from('branches')
    .select('id,organization_id,slug,name,status,organizations!inner(id,slug,name,status)')
    .eq('slug', clean)
    .maybeSingle();

  if (branch) {
    const organization = Array.isArray(branch.organizations)
      ? branch.organizations[0]
      : branch.organizations;
    if (branch.status === 'active' && organization?.status === 'active') {
      return {
        id: branch.id,
        organizationId: branch.organization_id,
        slug: branch.slug,
        name: branch.name,
        organizationSlug: organization.slug,
        organizationName: organization.name,
      };
    }
  }

  const { data: organization } = await admin
    .from('organizations')
    .select('id,slug,name,status')
    .eq('slug', clean)
    .eq('status', 'active')
    .maybeSingle();

  if (!organization) return null;

  const { data: primaryBranch } = await admin
    .from('branches')
    .select('id,organization_id,slug,name,status')
    .eq('organization_id', organization.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!primaryBranch) return null;

  return {
    id: primaryBranch.id,
    organizationId: organization.id,
    slug: primaryBranch.slug,
    name: primaryBranch.name,
    organizationSlug: organization.slug,
    organizationName: organization.name,
  };
}

/** Branch must belong to the organization and be active. */
export async function branchBelongsToOrganization(
  branchId: string,
  organizationId: string
): Promise<boolean> {
  if (!branchId || !organizationId) return false;
  const { data } = await createAdminClient()
    .from('branches')
    .select('id')
    .eq('id', branchId)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .maybeSingle();
  return Boolean(data);
}
