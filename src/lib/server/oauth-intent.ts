import { randomBytes, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const merchantIntent = { name: 'merchant_oauth_intent', path: '/auth/callback' };
export const customerLinkIntent = { name: 'customer_oauth_link_intent', path: '/auth/customer/callback' };

export function makeOAuthNonce() { return randomBytes(24).toString('base64url'); }

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin === null || origin === request.nextUrl.origin) return true;
  // A deployment behind a reverse proxy may give NextRequest an internal origin.
  // Only a trusted, explicitly configured canonical origin is a safe fallback.
  try {
    return origin === new URL(process.env.NEXT_PUBLIC_SITE_URL!).origin;
  } catch { return false; }
}

export function setOAuthIntent(response: NextResponse, intent: typeof merchantIntent, value: string) {
  response.cookies.set(intent.name, value, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: intent.path, maxAge: 600,
  });
}

export function clearOAuthIntent(response: NextResponse, intent: typeof merchantIntent) {
  response.cookies.set(intent.name, '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: intent.path, maxAge: 0,
  });
  return response;
}

export function readOAuthIntent(request: NextRequest, intent: typeof merchantIntent, nonce: string | null) {
  if (!nonce || !/^[a-zA-Z0-9_-]{32}$/.test(nonce)) return null;
  const cookie = request.cookies.get(intent.name)?.value;
  if (!cookie) return null;
  const [savedNonce, userId] = cookie.split(':');
  if (!savedNonce || savedNonce.length !== nonce.length ||
      !timingSafeEqual(Buffer.from(savedNonce), Buffer.from(nonce))) return null;
  return userId ?? ''; // Merchant intent has no user ID; customer link intent does.
}
