import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError } from '@/lib/server/context';
import { isBrandLogoKey } from '@/lib/brand';

export const runtime = 'nodejs';
/** Two real marks in one provider logo slot; only our fixed SVG and vetted PNG are composited. */
export async function GET(_request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  if (!z.uuid().safeParse(organizationId).success) return apiError('Not found', 404);
  const admin = createAdminClient();
  const { data: org, error } = await admin.from('organizations').select('logo_url,status')
    .eq('id', organizationId).maybeSingle();
  if (error || !org || org.status === 'deleted' || !isBrandLogoKey(org.logo_url, organizationId)) {
    return apiError('Not found', 404);
  }
  try {
    const [platform, stored] = await Promise.all([
      readFile(path.join(process.cwd(), 'public/icon.svg')),
      admin.storage.from('brand-logos').download(org.logo_url!),
    ]);
    if (stored.error || !stored.data) return apiError('Logo unavailable', 404);
    const business = Buffer.from(await stored.data.arrayBuffer());
    const base = Buffer.from(`<svg width="320" height="320" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="320" rx="62" fill="#183a32"/><rect x="168" y="110" width="132" height="132" rx="22" fill="#ffffff"/><path d="M159 165v22m-11-11h22" stroke="#f2c77f" stroke-width="4" stroke-linecap="round"/></svg>`);
    const output = await sharp(base).composite([
      { input: await sharp(platform).resize(132,132).png().toBuffer(), left: 20, top: 110 },
      { input: await sharp(business, { limitInputPixels: 1_000_000 })
        .resize(120,120,{ fit:'contain', background: '#ffffff00' }).png().toBuffer(), left: 174, top: 116 },
    ]).png().toBuffer();
    if (output.length > 1024 * 1024) return apiError('Logo unavailable', 404);
    return new NextResponse(new Uint8Array(output), { headers: { 'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff' } });
  } catch (cause) {
    console.error('Wallet brand mark unavailable:', cause);
    return apiError('Logo unavailable', 404);
  }
}
