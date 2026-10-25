/**
 * GET /go/[qrSlug]
 *
 * Resolves a physical QR code to the venue's customer page and increments the
 * scan counter atomically in SQL (`increment_qr_scan`). Route handlers are
 * always dynamic — there are no demo slugs and no static params to prerender.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface QrScanResult {
  branch_slug: string | null;
  source: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrSlug: string }> }
) {
  const { qrSlug } = await params;

  try {
    const { data, error } = await createAdminClient().rpc('increment_qr_scan', {
      p_slug: qrSlug,
    });
    if (!error && data) {
      const scan = data as QrScanResult;
      if (scan.branch_slug) {
        const target = new URL(`/c/${encodeURIComponent(scan.branch_slug)}`, request.url);
        target.searchParams.set('ref', qrSlug);
        if (scan.source) target.searchParams.set('src', scan.source);
        return NextResponse.redirect(target);
      }
    }
  } catch (err) {
    console.error('QR Resolution error:', err instanceof Error ? err.message : 'unknown');
  }

  // Unknown or inactive code: show the "scan the table code" screen instead of
  // silently redirecting to a demo venue.
  return NextResponse.redirect(new URL('/c', request.url));
}
