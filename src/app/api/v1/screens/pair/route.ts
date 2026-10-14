import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError } from '@/lib/server/context';
import { hashScreenToken, screenCookieName } from '@/lib/server/screen';

const schema = z.object({ pairingCode: z.string().regex(/^\d{8}$/) });

/** The untrusted TV submits a code; only the server holds the device token. */
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError('Invalid pairing code', 400);
  const token = `scr_${crypto.randomBytes(32).toString('hex')}`;
  // Trust a client-IP header only when the operator's ingress overwrites it.
  // Otherwise all attempts share one restrictive bucket (fail closed, not spoofable).
  const header = process.env.TRUSTED_CLIENT_IP_HEADER?.toLowerCase();
  const ip = header && /^[a-z0-9-]{1,40}$/.test(header)
    ? request.headers.get(header)?.split(',')[0]?.trim() || 'unknown' : 'unknown';
  const ipHash = crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '')
    .update(ip).digest('hex');
  const { data: screenId, error } = await createAdminClient().rpc('consume_screen_pairing', {
    p_code: parsed.data.pairingCode, p_token_hash: hashScreenToken(token), p_ip_hash: ipHash,
  });
  if (error) {
    console.error('Pairing transaction failed:', error);
    return apiError('Could not pair screen', 503);
  }
  if (!screenId) return apiError('Invalid, expired or rate-limited pairing code', 400);
  const response = NextResponse.json({ screenId }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(screenCookieName(screenId), token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: 60 * 60 * 24 * 90,
  });
  return response;
}
