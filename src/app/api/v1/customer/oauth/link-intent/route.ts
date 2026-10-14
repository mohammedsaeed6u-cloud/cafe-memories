import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireCustomer } from '@/lib/server/context';
import { customerLinkIntent, makeOAuthNonce, sameOrigin, setOAuthIntent } from '@/lib/server/oauth-intent';

/** Bind a manual Google link to the guest's CURRENT authenticated user ID. */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return apiError('Invalid origin', 403);
  const auth = await requireCustomer();
  if (auth.error) return auth.error;
  const nonce = makeOAuthNonce();
  const response = NextResponse.json({ nonce }, { headers: { 'Cache-Control': 'no-store' } });
  setOAuthIntent(response, customerLinkIntent, `${nonce}:${auth.context.userId}`);
  return response;
}
