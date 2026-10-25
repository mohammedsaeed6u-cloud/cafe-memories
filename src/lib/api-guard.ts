/**
 * Unified authentication guard for API route handlers.
 *
 * Every route must declare the identity it accepts:
 *   merchant   – a signed-in merchant account (Supabase Auth / Better Auth)
 *   staff      – a signed staff tablet session, a merchant account, or an API key
 *   customer   – a signed-in customer account
 *   any-auth   – any of the above, plus the integration API key
 *   any-staff  – staff session, merchant account, or integration API key
 *
 * The guard returns a discriminated result instead of throwing so each route
 * can decide between 401 and a domain-specific error. Authorization (which
 * organization, branch, or role) is a separate step in `server/context`.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import {
  STAFF_SESSION_COOKIE,
  verifyStaffSessionValue,
  type StaffSessionClaims,
} from '@/lib/staff-session';
import { timingSafeEqual } from '@/lib/signed-token';

export { STAFF_SESSION_COOKIE };

export type ApiAuthMode = 'merchant' | 'staff' | 'customer' | 'any-auth' | 'any-staff';

export interface ApiAuthSuccess {
  ok: true;
  method: 'better-auth' | 'staff-cookie' | 'api-key';
  userId: string | null;
  email: string | null;
  staffId: string | null;
  claims: StaffSessionClaims | null;
}

export interface ApiAuthFailure {
  ok: false;
  status: 401;
  error: string;
}

export type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure;

export function isAuthFailure(result: ApiAuthResult): result is ApiAuthFailure {
  return result.ok === false;
}

function success(
  method: ApiAuthSuccess['method'],
  values: Partial<Pick<ApiAuthSuccess, 'userId' | 'email' | 'staffId' | 'claims'>> = {}
): ApiAuthSuccess {
  return {
    ok: true,
    method,
    userId: values.userId ?? null,
    email: values.email ?? null,
    staffId: values.staffId ?? null,
    claims: values.claims ?? null,
  };
}

function failure(error = 'Authentication required'): ApiAuthFailure {
  return { ok: false, status: 401, error };
}

function matchesIntegrationKey(candidate: string | null): boolean {
  const expected = process.env.STAMPY_INTEGRATION_API_KEY;
  if (!expected || expected.length < 16 || !candidate) return false;
  return timingSafeEqual(candidate, expected);
}

export async function requireApiAuth(
  request: NextRequest,
  mode: ApiAuthMode = 'any-auth'
): Promise<ApiAuthResult> {
  const acceptsApiKey = mode === 'merchant' || mode === 'staff' || mode === 'any-auth' || mode === 'any-staff';
  if (acceptsApiKey && matchesIntegrationKey(request.headers.get('x-api-key'))) {
    return success('api-key');
  }

  const acceptsStaffCookie = mode === 'staff' || mode === 'any-auth' || mode === 'any-staff';
  if (acceptsStaffCookie) {
    const claims = await verifyStaffSessionValue(request.cookies.get(STAFF_SESSION_COOKIE)?.value);
    if (claims) {
      return success('staff-cookie', {
        staffId: claims.staffId,
        userId: claims.staffId,
        claims,
      });
    }
  }

  const acceptsAccount = mode !== 'any-staff';
  if (acceptsAccount) {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      const user = session?.user as { id?: unknown; email?: unknown } | undefined;
      if (user && typeof user.id === 'string' && user.id.length > 0) {
        return success('better-auth', {
          userId: user.id,
          email: typeof user.email === 'string' ? user.email : null,
        });
      }
    } catch {
      // A failed session lookup is indistinguishable from no session.
    }
  }

  if (mode === 'staff' || mode === 'any-staff') return failure('A staff session is required');
  if (mode === 'merchant') return failure('A merchant account is required');
  if (mode === 'customer') return failure('A customer account is required');
  return failure();
}

/** Convert a guard failure into a JSON response; keeps error shapes uniform. */
export function unauthorizedResponse(result: ApiAuthFailure): NextResponse {
  return NextResponse.json({ error: result.error }, { status: result.status });
}
