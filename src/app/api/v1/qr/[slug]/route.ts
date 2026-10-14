import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError } from '@/lib/server/context';

/** Public QR resolution; the DB increments scan_count atomically. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-zA-Z0-9_-]{2,80}$/.test(slug)) return apiError('QR not found', 404);
  const { data, error } = await createAdminClient().rpc('record_qr_scan', { p_slug: slug });
  if (error) {
    console.error('QR resolution failed:', error);
    return apiError('QR unavailable', 503);
  }
  const qr = data?.[0];
  if (!qr) return apiError('QR not found or inactive', 404);
  const destinationUrl = `/c/${encodeURIComponent(qr.org_slug)}?branch=${encodeURIComponent(qr.branch_slug)}&ref=${encodeURIComponent(slug)}`;
  return NextResponse.json({ destinationUrl, source: qr.qr_source },
    { headers: { 'Cache-Control': 'no-store' } });
}
