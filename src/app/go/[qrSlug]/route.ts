import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ qrSlug: string }> }) {
  const { qrSlug } = await params;
  if (!/^[a-zA-Z0-9_-]{2,80}$/.test(qrSlug)) return new NextResponse('QR not found', { status: 404 });
  const { data, error } = await createAdminClient().rpc('record_qr_scan', { p_slug: qrSlug });
  if (error) {
    console.error('QR redirect failed:', error);
    return new NextResponse('QR unavailable', { status: 503 });
  }
  const qr = data?.[0];
  if (!qr) return new NextResponse('QR not found', { status: 404 });
  const destination = new URL(`/c/${encodeURIComponent(qr.org_slug)}`, request.url);
  destination.searchParams.set('branch', qr.branch_slug);
  destination.searchParams.set('ref', qrSlug);
  return NextResponse.redirect(destination, { status: 302, headers: { 'Cache-Control': 'no-store' } });
}
