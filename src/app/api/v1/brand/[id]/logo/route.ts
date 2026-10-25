/**
 * GET  /api/v1/brand/[id]/logo   serve the organization's PNG logo
 * POST /api/v1/brand/[id]/logo   upload a replacement (owner/admin/manager)
 *
 * The bucket is private, so the public route streams validated bytes instead of
 * exposing a long-lived storage URL. Only the organization itself may upload.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOperator } from '@/lib/server/context';
import { contextFailure, jsonError, jsonOk } from '@/lib/server/route-helpers';
import { BRAND_LOGO_CACHE, loadBrandLogo } from '@/lib/server/brand-logo';
import { isBrandLogoKey } from '@/lib/brand';
import { consumeRateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MAX_BYTES = 2 * 1024 * 1024;

function isPng(bytes: Uint8Array): boolean {
  return bytes.length >= PNG_MAGIC.length && PNG_MAGIC.every((byte, index) => bytes[index] === byte);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return jsonError(404, 'logo_not_found', 'Logo not found');

  const logo = await loadBrandLogo(id);
  if (!logo) return jsonError(404, 'logo_not_found', 'Logo not found');

  return new Response(logo.bytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(logo.bytes.byteLength),
      'Cache-Control': BRAND_LOGO_CACHE,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return jsonError(404, 'organization_not_found', 'Organization not found');

  const result = await requireOperator(request, { roles: ['owner', 'admin', 'manager'] });
  if (!result.context) return contextFailure(result.error!);
  const operator = result.context;
  if (operator.organization.id !== id) {
    return jsonError(403, 'organization_scope', 'You can only change your own logo');
  }

  const limit = await consumeRateLimit(
    rateLimitKey(request, 'brand-logo', operator.organization.id),
    10,
    60 * 60
  );
  if (!limit.allowed) return rateLimitResponse(limit);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, 'invalid_form', 'Expected multipart form data');
  }

  const file = form.get('file');
  if (!(file instanceof File)) return jsonError(400, 'file_required', 'No logo file provided');
  if (file.size === 0) return jsonError(400, 'empty_file', 'The logo file is empty');
  if (file.size > MAX_BYTES) return jsonError(413, 'file_too_large', 'Logo must be 2MB or smaller');

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPng(bytes)) return jsonError(415, 'png_required', 'Logo must be a PNG image');

  const admin = createAdminClient();
  const { data: current } = await admin
    .from('organizations')
    .select('logo_url')
    .eq('id', id)
    .maybeSingle();

  const key = `${id}/logo-${crypto.randomUUID()}.png`;

  const { error: uploadError } = await admin.storage
    .from('brand-logos')
    .upload(key, bytes, { contentType: 'image/png', upsert: false });

  if (uploadError) {
    console.error('brand logo upload failed:', uploadError.message);
    return jsonError(503, 'upload_failed', 'Logo storage is unavailable');
  }

  const { data: organization, error: updateError } = await admin
    .from('organizations')
    .update({ logo_url: key, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('logo_url')
    .single();

  if (updateError || !organization) {
    await admin.storage.from('brand-logos').remove([key]);
    return jsonError(503, 'logo_update_failed', 'Could not save the logo');
  }

  if (current?.logo_url && isBrandLogoKey(current.logo_url, id) && current.logo_url !== key) {
    await admin.storage.from('brand-logos').remove([current.logo_url]);
  }

  return jsonOk({
    logoUrl: `/api/v1/brand/${id}/logo?v=${key.split('/').at(-1)}`,
    storageKey: key,
  });
}
