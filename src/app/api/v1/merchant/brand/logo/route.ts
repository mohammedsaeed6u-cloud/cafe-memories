import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireMerchant } from '@/lib/server/context';
import { validateImageMagicBytes } from '@/lib/services/images';
import { isBrandLogoKey } from '@/lib/brand';
import { queueOrganizationWalletSync } from '@/lib/server/wallet-service';

export const runtime = 'nodejs';

/** Re-encode only real raster uploads; never store untrusted SVG/EXIF in the logo bucket. */
export async function POST(request: NextRequest) {
  const size = Number(request.headers.get('content-length'));
  if (Number.isFinite(size) && size > 6 * 1024 * 1024) return apiError('Logo request too large', 413);
  const form = await request.formData().catch(() => null);
  const organizationId = form?.get('organizationId');
  const file = form?.get('file');
  if (typeof organizationId !== 'string' || !z.uuid().safeParse(organizationId).success ||
      !(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024) {
    return apiError('Choose a JPG, PNG or WebP logo under 5 MB', 400);
  }
  const auth = await requireMerchant({ organizationId, roles: ['owner', 'admin'] });
  if (auth.error) return auth.error;
  if (auth.context.membership.branchId) return apiError('Organization-wide role required', 403);
  try {
    const input = Buffer.from(await file.arrayBuffer());
    if (!validateImageMagicBytes(input)) return apiError('Only JPG, PNG and WebP logos are allowed', 400);
    const image = sharp(input, { limitInputPixels: 16_000_000 }).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > 16_000_000 ||
        !['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) return apiError('Invalid logo image', 400);
    const output = await image.resize(512, 512, { fit: 'contain', background: '#ffffff00',
      withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
    if (output.length > 2 * 1024 * 1024) return apiError('Optimized logo must be under 2 MB', 413);
    const admin = createAdminClient();
    const { data: existing, error: lookupError } = await admin.from('organizations').select('logo_url')
      .eq('id', organizationId).single();
    if (lookupError || !existing) return apiError('Business unavailable', 503);
    const key = `${organizationId}/logo-${randomUUID()}.png`;
    const { error: uploadError } = await admin.storage.from('brand-logos').upload(key, output,
      { contentType: 'image/png', upsert: false });
    if (uploadError) {
      console.error('Logo upload failed:', uploadError);
      return apiError('Could not store logo', 503);
    }
    let update = admin.from('organizations').update({ logo_url: key, updated_at: new Date().toISOString() })
      .eq('id', organizationId);
    update = existing.logo_url ? update.eq('logo_url', existing.logo_url) : update.is('logo_url', null);
    const { data, error } = await update.select('id').maybeSingle();
    if (error || !data) {
      await admin.storage.from('brand-logos').remove([key]);
      return apiError('Logo changed in another tab; retry', 409);
    }
    if (isBrandLogoKey(existing.logo_url, organizationId)) {
      const { error: cleanupError } = await admin.storage.from('brand-logos').remove([existing.logo_url!]);
      if (cleanupError) console.error('Old logo cleanup failed:', cleanupError);
    }
    try { await queueOrganizationWalletSync(organizationId); }
    catch { return apiError('Logo saved, but Wallet updates could not be queued; contact support', 503); }
    return NextResponse.json({ logoUrl: `/api/v1/brand/${organizationId}/logo?v=${key.split('/').at(-1)}` },
      { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Logo processing failed:', error);
    return apiError('Could not process logo', 400);
  }
}
