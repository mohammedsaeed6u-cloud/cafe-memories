import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireCustomer, resolveVenue } from '@/lib/server/context';
import { processImageDerivatives } from '@/lib/services/images';

export const runtime = 'nodejs';

/** One authenticated ingestion path: private media + pending visit + memory + consent. */
export async function POST(request: NextRequest) {
  const auth = await requireCustomer();
  if (auth.error) return auth.error;
  // A quick rejection only; the Node reverse proxy must also enforce a hard body limit.
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > 11 * 1024 * 1024) {
    return apiError('Upload request too large', 413);
  }
  let form: FormData;
  try { form = await request.formData(); } catch { return apiError('Invalid multipart form', 400); }
  const file = form.get('file');
  const cafeSlug = form.get('cafeSlug');
  const branchSlug = form.get('branchSlug');
  const caption = form.get('caption');
  if (!(file instanceof File) || typeof cafeSlug !== 'string' || cafeSlug.length > 40 ||
      (branchSlug !== null && typeof branchSlug !== 'string') ||
      (caption !== null && (typeof caption !== 'string' || caption.length > 280)) ||
      !['true', 'false', null].includes(form.get('liveWallConsent') as string | null)) {
    return apiError('Invalid upload fields', 400);
  }
  if (!file.size || file.size > 10 * 1024 * 1024) return apiError('Image must be under 10 MB', 413);
  try {
    const venue = await resolveVenue(cafeSlug, branchSlug as string | null);
    if (!venue) return apiError('Venue not found', 404);
    const admin = createAdminClient();
    const { count, error: quotaError } = await admin.from('memories')
      .select('*', { head: true, count: 'exact' }).eq('customer_id', auth.context.customerId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60_000).toISOString());
    if (quotaError) return apiError('Upload quota unavailable', 503);
    if ((count ?? 0) >= 20) return apiError('Daily photo limit reached', 429);
    let derivatives;
    try { derivatives = await processImageDerivatives(Buffer.from(await file.arrayBuffer())); }
    catch { return apiError('Invalid or unprocessable image', 400); }
    const prefix = `${venue.organizationId}/${auth.context.customerId}/${crypto.randomUUID()}`;
    const keys = [`${prefix}/original.webp`, `${prefix}/optimized.webp`, `${prefix}/thumbnail.webp`];
    const contents = [derivatives.originalBuffer, derivatives.optimizedBuffer, derivatives.thumbnailBuffer];
    const results = await Promise.allSettled(keys.map((key, index) => admin.storage.from('memories').upload(key, contents[index], {
      contentType: 'image/webp', upsert: false,
    })));
    const storageError = results.find((result) => result.status === 'rejected' || result.value.error);
    if (storageError) {
      const cleanup = await admin.storage.from('memories').remove(keys);
      if (cleanup.error) console.error('Private media cleanup failed:', cleanup.error);
      console.error('Private media upload failed:', storageError);
      return apiError('Could not store image', 503);
    }
    const { data: memoryId, error: dbError } = await admin.rpc('create_customer_memory', {
      p_customer_id: auth.context.customerId, p_branch_id: venue.branchId,
      p_original_key: keys[0], p_optimized_key: keys[1], p_thumbnail_key: keys[2],
      p_caption: caption || null, p_live_wall_consent: form.get('liveWallConsent') === 'true',
    });
    if (dbError || !memoryId) {
      const cleanup = await admin.storage.from('memories').remove(keys);
      if (cleanup.error) console.error('Failed to clean up orphaned image objects:', cleanup.error);
      if (dbError?.code === '23514') return apiError('Daily photo limit reached', 429);
      console.error('Memory transaction failed:', dbError);
      return apiError('Could not save memory', 503);
    }
    return NextResponse.json({ memoryId, status: 'pending',
      imageUrl: `/api/v1/media/${memoryId}?variant=optimized` },
    { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Memory ingestion failed:', error);
    return apiError('Upload service unavailable', 503);
  }
}
