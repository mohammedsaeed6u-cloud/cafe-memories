import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { isBrandLogoKey } from '@/lib/brand';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BYTES = 2 * 1024 * 1024;

/** Read a validated PNG logo from the private `brand-logos` bucket. */
export async function loadBrandLogo(
  organizationId: string
): Promise<{ bytes: Uint8Array; key: string } | null> {
  if (!UUID.test(organizationId)) return null;

  const admin = createAdminClient();
  const { data: organization, error } = await admin
    .from('organizations')
    .select('id,logo_url')
    .eq('id', organizationId)
    .maybeSingle();

  if (error || !organization || !isBrandLogoKey(organization.logo_url, organization.id)) {
    return null;
  }

  const key = organization.logo_url as string;
  const { data: file, error: downloadError } = await admin.storage.from('brand-logos').download(key);
  if (downloadError || !file) return null;

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;
  return { bytes, key };
}

export const BRAND_LOGO_CACHE = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
