import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireMerchant } from '@/lib/server/context';

const schema = z.object({ branchId: z.uuid(), source: z.enum(['table', 'counter', 'entrance', 'poster', 'receipt', 'instagram', 'campaign', 'staff', 'other']).default('table') });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid QR request', 400);
  const auth = await requireMerchant({ branchId: parsed.data.branchId, roles: ['owner', 'admin', 'manager'] });
  if (auth.error) return auth.error;
  const slug = `qr-${crypto.randomBytes(10).toString('hex')}`;
  const { data, error } = await createAdminClient().from('qr_codes').insert({
    organization_id: auth.context.membership.organizationId,
    branch_id: parsed.data.branchId, slug, source: parsed.data.source,
  }).select('slug').single();
  if (error) {
    console.error('QR creation failed:', error);
    return apiError('Could not create QR', 503);
  }
  return NextResponse.json({ slug: data.slug, destination: `/go/${data.slug}` },
    { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
