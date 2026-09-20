import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Fetch QR code details
  const { data: qrCode, error } = await supabase
    .from('qr_codes')
    .select('id, organization_id, branch_id, source, label, is_active, scan_count')
    .eq('slug', slug)
    .single();

  if (error || !qrCode) {
    return NextResponse.json({ error: 'QR Code not found' }, { status: 404 });
  }

  if (!qrCode.is_active) {
    return NextResponse.json({ error: 'QR Code is deactivated' }, { status: 410 });
  }

  // 2. Fetch associated branch
  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, slug, organization_id')
    .eq('id', qrCode.branch_id)
    .single();

  // 3. Atomically increment scan_count
  await supabase
    .from('qr_codes')
    .update({ scan_count: qrCode.scan_count + 1, updated_at: new Date().toISOString() })
    .eq('id', qrCode.id);

  const destination = branch ? `/c/${branch.slug}?ref=${slug}&src=${qrCode.source}` : `/c/demo-cafe?ref=${slug}`;

  return NextResponse.json({
    success: true,
    qrCodeId: qrCode.id,
    branchId: qrCode.branch_id,
    organizationId: qrCode.organization_id,
    source: qrCode.source,
    destinationUrl: destination,
  });
}
