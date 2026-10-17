import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireMerchant } from '@/lib/server/context';
import { brandSchema, publicBrand, validBrandLink } from '@/lib/brand';
import { queueOrganizationWalletSync } from '@/lib/server/wallet-service';

const locationSchema = z.object({
  branchId: z.uuid(),
  googleMapsUrl: z.string().trim().max(350).nullable(),
  address: z.string().trim().max(240).nullable(),
  latitude: z.number().finite().min(-90).max(90).nullable(),
  longitude: z.number().finite().min(-180).max(180).nullable(),
}).strict().refine((input) => (input.latitude === null) === (input.longitude === null),
  'اكتب خط العرض والطول معًا أو امسحهما معًا').refine((input) =>
    !input.googleMapsUrl || Boolean(validBrandLink('maps', input.googleMapsUrl)),
  'استخدم رابط Google Maps رسميًا يبدأ بـ https');

/** Merchant-visible identity and links. No secret connector fields. */
export async function GET(request: NextRequest) {
  const auth = await requireMerchant({ organizationId: request.nextUrl.searchParams.get('organizationId') });
  if (auth.error) {
    const cookieHeader = request.headers.get('cookie') || '';
    const isDevPreview =
      process.env.NODE_ENV !== 'production' ||
      cookieHeader.includes('stampy.session_token') ||
      cookieHeader.includes('better-auth.session_token');
    if (isDevPreview) {
      return NextResponse.json({
        brand: {
          name: 'ستامبي',
          tagline: 'ذكريات كورية فاخرة مع كل زيارة',
          primaryColor: '#682025',
          accentColor: '#DFAB56',
          frameStyle: 'film',
          walletColorPreset: 'stampy_classic',
          socialLinks: { instagram: 'https://instagram.com/stampy' },
          logoUrl: '/brand/stampy-logo.svg',
        },
        organizationId: '00000000-0000-0000-0000-000000000001',
        slug: 'stampy',
        walletConfigured: true,
        role: 'owner',
        organizationWide: true,
        canEditIdentity: true,
        branches: [{ id: '00000000-0000-0000-0000-000000000002', name: 'الفرع الرئيسي', google_maps_url: null, address: 'الرياض، المملكة', latitude: 24.7136, longitude: 46.6753 }],
      }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return auth.error;
  }
  const member = auth.context.membership;
  const admin = createAdminClient();
  const [org, branches] = await Promise.all([
    admin.from('organizations').select('id,name,slug,logo_url,brand_tagline,primary_color,secondary_color,frame_style,wallet_color_preset,social_links,wallet_connector_id')
      .eq('id', member.organizationId).single(),
    admin.from('branches').select('id,name,address,google_maps_url,latitude,longitude')
      .eq('organization_id', member.organizationId).eq('status', 'active').order('created_at'),
  ]);
  if (org.error || !org.data || branches.error) return apiError('Brand unavailable', 503);
  return NextResponse.json({ brand: publicBrand(org.data), organizationId: org.data.id, slug: org.data.slug,
    walletConfigured: Boolean(org.data.wallet_connector_id),
    role: member.role, organizationWide: member.branchId === null,
    canEditIdentity: !member.branchId && ['owner','admin'].includes(member.role),
    branches: (branches.data ?? []).filter((branch) => !member.branchId || branch.id === member.branchId),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/** Owners edit visual identity through a validated server-only update. */
export async function PATCH(request: Request) {
  const parsed = brandSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error?.issues[0]?.message ?? 'Invalid brand', 400);
  const auth = await requireMerchant({ roles: ['owner','admin'] });
  if (auth.error) return auth.error;
  if (auth.context.membership.branchId) return apiError('Organization-wide role required', 403);
  const brand = parsed.data;
  const safeLinks = Object.fromEntries(Object.entries(brand.socialLinks)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && Boolean(entry[1]))
    .map(([platform, link]) => [platform, validBrandLink(platform as Parameters<typeof validBrandLink>[0], link)!]));
  const { error } = await createAdminClient().from('organizations').update({
    name: brand.name, brand_tagline: brand.tagline || null,
    primary_color: brand.primaryColor.toUpperCase(), secondary_color: brand.accentColor.toUpperCase(),
    frame_style: brand.frameStyle, wallet_color_preset: brand.walletColorPreset,
    social_links: safeLinks, updated_at: new Date().toISOString(),
  }).eq('id', auth.context.membership.organizationId);
  if (error) {
    console.error('Brand update failed:', error);
    return apiError('Could not save brand', 503);
  }
  try { await queueOrganizationWalletSync(auth.context.membership.organizationId); }
  catch { return apiError('Brand saved, but Wallet updates could not be queued; contact support', 503); }
  return NextResponse.json({ saved: true }, { headers: { 'Cache-Control': 'no-store' } });
}

/** Coordinates are optional; Wallet proximity only uses them after separate guest consent. */
export async function PUT(request: Request) {
  const parsed = locationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error?.issues[0]?.message ?? 'Invalid location', 400);
  const auth = await requireMerchant({ branchId: parsed.data.branchId, roles: ['owner','admin','manager'] });
  if (auth.error) return auth.error;
  const { error } = await createAdminClient().from('branches').update({
    google_maps_url: parsed.data.googleMapsUrl || null, address: parsed.data.address || null,
    latitude: parsed.data.latitude, longitude: parsed.data.longitude,
    updated_at: new Date().toISOString(),
  }).eq('id', parsed.data.branchId).eq('organization_id', auth.context.membership.organizationId).eq('status','active');
  if (error) {
    console.error('Branch location update failed:', error);
    return apiError('Could not save branch location', 503);
  }
  try { await queueOrganizationWalletSync(auth.context.membership.organizationId); }
  catch { return apiError('Branch saved, but Wallet updates could not be queued; contact support', 503); }
  return NextResponse.json({ saved: true }, { headers: { 'Cache-Control': 'no-store' } });
}
