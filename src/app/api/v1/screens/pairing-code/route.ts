import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, requireMerchant } from '@/lib/server/context';

const schema = z.object({ branchId: z.uuid(), screenName: z.string().trim().min(1).max(80) });

/** Merchant creates a short-lived code; screens cannot create their own codes. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid screen request', 400);
  const auth = await requireMerchant({ branchId: parsed.data.branchId, roles: ['owner', 'admin', 'manager'] });
  if (auth.error) return auth.error;
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = crypto.randomInt(10_000_000, 100_000_000).toString();
    const { error } = await admin.from('screen_pairing_codes').insert({
      organization_id: auth.context.membership.organizationId,
      branch_id: parsed.data.branchId, code, screen_name: parsed.data.screenName,
      expires_at: expiresAt,
    });
    if (!error) return NextResponse.json({ code, expiresAt }, { headers: { 'Cache-Control': 'no-store' } });
    if (error.code !== '23505') {
      console.error('Pairing code creation failed:', error);
      return apiError('Could not generate pairing code', 503);
    }
  }
  return apiError('Could not allocate unique pairing code', 503);
}
