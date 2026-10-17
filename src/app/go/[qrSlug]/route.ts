export function generateStaticParams() {
  return [{ qrSlug: 'table-01' }, { qrSlug: 'counter' }, { qrSlug: 'main' }];
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-static';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrSlug: string }> }
) {
  const { qrSlug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stampy.app';

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

      const branchSlug = (qrCode.branches as any)?.slug || 'stampy';
      const targetUrl = new URL(`/c/${branchSlug}?ref=${qrSlug}&src=${qrCode.source}`, baseUrl);
      return NextResponse.redirect(targetUrl);
    }
  } catch (err) {
    console.error('QR Resolution error:', err);
  }

  // Fallback to default active café
  const tableMatch = qrSlug ? qrSlug.match(/^table-(\d+)$/i) : null;
  const tableParam = tableMatch ? `&table=${tableMatch[1]}` : '';
  const fallbackUrl = new URL(`/c/stampy?ref=${qrSlug || 'default'}${tableParam}`, baseUrl);
  return NextResponse.redirect(fallbackUrl);
}
