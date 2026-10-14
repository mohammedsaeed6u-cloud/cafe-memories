import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError } from '@/lib/server/context';
import { isBrandLogoKey } from '@/lib/brand';

/** A public business logo, not the private guest-photo bucket. */
export async function GET(_request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  if (!z.uuid().safeParse(organizationId).success) return apiError('Not found', 404);
  const admin = createAdminClient();
  const { data: org, error } = await admin.from('organizations').select('logo_url,status')
    .eq('id', organizationId).maybeSingle();
  if (error || !org || org.status === 'deleted' || !isBrandLogoKey(org.logo_url, organizationId)) {
    return apiError('Not found', 404);
  }
  const { data: blob, error: storageError } = await admin.storage.from('brand-logos').download(org.logo_url!);
  if (storageError || !blob) return apiError('Logo unavailable', 404);
  return new NextResponse(await blob.arrayBuffer(), { headers: {
    'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=60',
    'X-Content-Type-Options': 'nosniff',
  } });
}
