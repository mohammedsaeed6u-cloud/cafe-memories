import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { auth } from '@/lib/auth/auth';
import {
  verifyStaffSessionValue,
  STAFF_SESSION_COOKIE,
} from '@/lib/staff-session';

/**
 * Unified API authentication guard (CWE-306 / CWE-862).
 *
 * Resolution order:
 *   1. Better Auth session (httpOnly cookie cache or Bearer token).
 *   2. Signed staff terminal cookie (`stampy_staff_session`) — HMAC-SHA256,
 *      server-verifiable, issued exclusively by POST /api/v1/staff-session
 *      after `verifyPinOnly` succeeds. Replaces the forgeable
 *      `memories_staff_session=1` client-side cookie.
 *   3. `x-api-key` / Bearer `ww_` integration keys (server env only).
 *
 * Every guard branch is server-side verifiable; no client-writable value
 * is trusted on its own. Edge middleware imports the shared cookie
 * helpers from `@/lib/staff-session` directly (Web Crypto, no Node APIs).
 */

export { STAFF_SESSION_COOKIE, createStaffSessionValue, verifyStaffSessionValue } from '@/lib/staff-session';

export interface AuthContext {
  method: 'better-auth' | 'staff-cookie' | 'api-key';
  userId: string | null;
  staffId: string | null;
}

/** Constant-time string comparison to prevent timing attacks. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

async function hasBetterAuthSession(request: NextRequest): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) return session.user.id;
    return null;
  } catch {
    return null;
  }
}

function hasIntegrationApiKey(request: NextRequest): boolean {
  const configured = process.env.STAMPY_INTEGRATION_API_KEY;
  if (!configured) return false;
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && safeEqual(apiKey, configured)) return true;
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ww_') && safeEqual(authHeader.slice(7), configured)) return true;
  return false;
}

export type GuardMode = 'any-staff' | 'any-auth';

/**
 * Unified guard. Returns NextResponse 401 on failure, AuthContext on success.
 *   - 'any-auth'    : Better Auth session OR staff cookie OR integration key.
 *   - 'any-staff'   : staff cookie OR integration key (terminal flows).
 */
export async function requireApiAuth(
  request: NextRequest,
  mode: GuardMode = 'any-auth'
): Promise<AuthContext | NextResponse> {
  // 1. Better Auth (merchant dashboard user)
  const userId = await hasBetterAuthSession(request);
  if (userId) return { method: 'better-auth', userId, staffId: null };

  // 2. Signed staff terminal cookie
  const staffClaims = await verifyStaffSessionValue(
    request.cookies.get(STAFF_SESSION_COOKIE)?.value
  );
  if (staffClaims) {
    return { method: 'staff-cookie', userId: null, staffId: staffClaims.staffId };
  }

  // 3. Server-configured integration key
  if (mode === 'any-auth' && hasIntegrationApiKey(request)) {
    return { method: 'api-key', userId: null, staffId: null };
  }

  return NextResponse.json(
    { error: 'Unauthorized: valid session, staff cookie, or API key required' },
    { status: 401 }
  );
}

/** True when the guard result is a 401 response. */
export function isAuthFailure(result: AuthContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
