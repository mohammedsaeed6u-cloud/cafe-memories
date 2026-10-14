import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError } from '@/lib/server/context';
import { getPairedScreen } from '@/lib/server/screen';
import { publicBrand } from '@/lib/brand';

/** Device-bound, branch-scoped feed; never return pending or revoked media. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ screenId: string }> }) {
  const { screenId } = await params;
  const screen = await getPairedScreen(screenId);
  if (!screen) return apiError('Screen not paired or revoked', 401);
  const admin = createAdminClient();
  const { data: organization } = await admin.from('organizations')
    .select('id,name,logo_url,brand_tagline,primary_color,secondary_color,frame_style,wallet_color_preset,social_links')
    .eq('id', screen.organization_id).maybeSingle();
  const { data, error } = await admin.from('memories')
    .select('id, caption, created_at, customers(display_name), memory_consents!inner(live_wall_consent)')
    .eq('organization_id', screen.organization_id).eq('branch_id', screen.branch_id)
    .eq('status', 'approved').eq('visibility', 'live_wall').is('deleted_at', null)
    .eq('memory_consents.live_wall_consent', true).is('memory_consents.revoked_at', null)
    .order('created_at', { ascending: false }).limit(30);
  if (error) {
    console.error('Screen feed failed:', error);
    return apiError('Screen feed unavailable', 503);
  }
  return NextResponse.json({ screen: { name: screen.name, id: screen.id,
    organizationName: organization?.name ?? '',
    brand: organization ? publicBrand(organization) : null }, memories: (data ?? []).map((row) => ({
    id: row.id, caption: row.caption, createdAt: row.created_at,
    customerName: (row.customers as { display_name?: string } | null)?.display_name ?? 'ضيف',
    imageUrl: `/api/v1/media/${row.id}?variant=optimized&screenId=${screen.id}`,
  })) }, { headers: { 'Cache-Control': 'no-store' } });
}
