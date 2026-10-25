/**
 * POST /api/v1/memories/upload
 *
 * Receives the guest's composed strip, stores it privately, and returns storage
 * keys. The keys are later passed to `capture_guest_memory`; no URL is ever
 * trusted from the browser.
 *
 * Only a signed customer session may upload, the venue must be active, and the
 * file must really be an image (magic bytes, not the client-supplied MIME).
 *
 * There is no server-side re-encoding: Workers cannot run native image codecs,
 * the browser already encoded the strip, and a second lossy pass would only
 * hurt quality. Metadata is stripped before the bytes reach storage.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { readCustomerSession } from '@/lib/customer-session';
import { loadPublicVenue } from '@/lib/server/public-venue';
import { processImageDerivatives } from '@/lib/services/images';
import { signedMemoryUrl } from '@/lib/server/memory-urls';
import { jsonError, jsonOk } from '@/lib/server/route-helpers';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await readCustomerSession(request);
  if (!session) return jsonError(401, 'unauthenticated', 'Customer session required');

  const limit = await consumeRateLimit(rateLimitKey(request, 'memory-upload'), 30, 60 * 60);
  if (!limit.allowed) return rateLimitResponse(limit);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, 'invalid_form', 'Expected multipart form data');
  }

  const file = form.get('file');
  const cafeSlug = form.get('cafeSlug');
  if (!(file instanceof File)) return jsonError(400, 'file_required', 'No image file provided');
  if (typeof cafeSlug !== 'string' || !cafeSlug.trim()) {
    return jsonError(400, 'cafe_slug_required', 'cafeSlug is required');
  }
  if (file.size === 0) return jsonError(400, 'empty_file', 'The uploaded file is empty');
  if (file.size > MAX_BYTES) return jsonError(413, 'file_too_large', 'File exceeds 10MB');

  let venue;
  try {
    venue = await loadPublicVenue(cafeSlug);
  } catch {
    return jsonError(503, 'venue_unavailable', 'Venue lookup failed');
  }
  if (!venue) return jsonError(404, 'venue_not_found', 'Venue not available');

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from('customers')
    .select('id,organization_id')
    .eq('id', session.customerId)
    .is('deleted_at', null)
    .maybeSingle();

  if (
    !customer ||
    (customer.organization_id && customer.organization_id !== venue.organization.id)
  ) {
    return jsonError(403, 'customer_scope', 'Session does not belong to this venue');
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let derivatives;
  try {
    derivatives = processImageDerivatives(inputBuffer);
  } catch {
    return jsonError(415, 'unsupported_image', 'Only JPEG, PNG, and WebP images are allowed');
  }

  const id = crypto.randomUUID();
  const prefix = `${venue.organization.id}/${new Date().toISOString().slice(0, 7)}/${id}`;
  // One stored object serves as original, optimized, and thumbnail until a
  // transforming image service (e.g. Cloudflare Images) is introduced.
  const storageKey = `${prefix}.${derivatives.extension}`;

  const bucket = admin.storage.from('memories');
  const { error } = await bucket.upload(storageKey, derivatives.optimizedBuffer, {
    contentType: derivatives.mimeType,
    upsert: false,
  });

  if (error) {
    await bucket.remove([storageKey]);
    return jsonError(503, 'upload_failed', 'Image storage is unavailable');
  }

  const url = await signedMemoryUrl(storageKey);

  return jsonOk({
    storageKey,
    optimizedKey: storageKey,
    thumbnailKey: storageKey,
    originalUrl: url,
    optimizedUrl: url,
    thumbnailUrl: url,
    width: derivatives.width,
    height: derivatives.height,
    format: derivatives.extension,
  });
}
