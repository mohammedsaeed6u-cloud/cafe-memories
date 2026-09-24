export function generateStaticParams() {
  return [{ qrSlug: 'table-01' }, { qrSlug: 'counter' }, { qrSlug: 'main' }];
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrSlug: string }> }
) {
  const { qrSlug } = await params;

  try {
    const supabase = createAdminClient();

    const { data: qrCode } = await supabase
      .from('qr_codes')
      .select('id, branch_id, source, is_active, scan_count, branches(slug, name)')
      .eq('slug', qrSlug)
      .maybeSingle();

    if (qrCode && qrCode.is_active) {
      // Increment scan count atomically
      await supabase
        .from('qr_codes')
        .update({ scan_count: (qrCode.scan_count || 0) + 1, updated_at: new Date().toISOString() })
        .eq('id', qrCode.id);

      const branchSlug = (qrCode.branches as any)?.slug || 'memories';
      const targetUrl = new URL(`/c/${branchSlug}?ref=${qrSlug}&src=${qrCode.source}`, request.url);
      return NextResponse.redirect(targetUrl);
    }
  } catch (err) {
    console.error('QR Resolution error:', err);
  }

  // Fallback to default active café
  const fallbackUrl = new URL(`/c/memories?ref=${qrSlug || 'default'}`, request.url);
  return NextResponse.redirect(fallbackUrl);
}
