import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/server/context';
import { makeOAuthNonce, merchantIntent, sameOrigin, setOAuthIntent } from '@/lib/server/oauth-intent';

/** Short-lived, same-browser intent: a customer OAuth callback may never create a merchant. */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError('Invalid origin', 403);
  const nonce = makeOAuthNonce();
  const response = NextResponse.json({ nonce }, { headers: { 'Cache-Control': 'no-store' } });
  setOAuthIntent(response, merchantIntent, nonce);
  return response;
}
