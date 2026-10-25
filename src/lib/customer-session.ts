/**
 * Signed customer session cookie.
 *
 * Anonymous guests get a server-issued identity: the cookie carries a customer
 * UUID that was created by the server, never an `anonymousId` supplied by the
 * browser. A phone number is contact data, not proof of identity, so it is
 * never used to look up a session.
 */

import type { NextRequest } from 'next/server';
import { isProduction } from '@/lib/env';
import { signToken, verifyToken } from '@/lib/signed-token';

export const CUSTOMER_SESSION_COOKIE = 'stampy_customer_session';

/** Long-lived: a guest keeps their stamp card across visits. */
export const CUSTOMER_SESSION_TTL_SECONDS = 90 * 24 * 60 * 60;

/**
 * A guest is tenant-scoped: one `customers` row per organization. The cookie
 * keeps every card the browser has earned so the "my cards" screen can list
 * them, while `customerId` stays the card most recently used.
 */
export const MAX_CUSTOMER_CARDS = 20;

const DEV_SECRET = 'development-customer-session-key-32-chars-minimum';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CustomerSessionClaims {
  customerId: string;
  customerIds: string[];
  iat: number;
  exp: number;
  aud: 'customer';
}

function normalizeCustomerIds(primary: string, additional: readonly string[] = []): string[] {
  const ids = [primary, ...additional].filter((id) => UUID_PATTERN.test(id));
  return [...new Set(ids)].slice(0, MAX_CUSTOMER_CARDS);
}

function getCustomerSecret(): string {
  const dedicated = process.env.CUSTOMER_SESSION_SECRET;
  if (dedicated && dedicated.length >= 32) return dedicated;

  const staff = process.env.STAFF_SESSION_SECRET;
  if (staff && staff.length >= 32) return `${staff}:customer`;

  if (isProduction()) {
    const shared = process.env.BETTER_AUTH_SECRET;
    if (shared && shared.length >= 32) return `${shared}:customer`;
    throw new Error('CUSTOMER_SESSION_SECRET must be set to at least 32 characters in production');
  }

  return process.env.BETTER_AUTH_SECRET || DEV_SECRET;
}

export async function createCustomerSessionValue(
  customerId: string,
  additionalCustomerIds: readonly string[] = []
): Promise<string> {
  const now = Date.now();
  const claims: CustomerSessionClaims = {
    customerId,
    customerIds: normalizeCustomerIds(customerId, additionalCustomerIds),
    iat: now,
    exp: now + CUSTOMER_SESSION_TTL_SECONDS * 1000,
    aud: 'customer',
  };
  return signToken(claims, getCustomerSecret());
}

export async function verifyCustomerSessionValue(
  value: string | undefined | null
): Promise<CustomerSessionClaims | null> {
  const claims = await verifyToken<CustomerSessionClaims>(value, getCustomerSecret());
  if (!claims || claims.aud !== 'customer') return null;
  if (typeof claims.customerId !== 'string' || !UUID_PATTERN.test(claims.customerId)) return null;

  // Cookies minted before multi-card support only carry `customerId`.
  const previous = Array.isArray(claims.customerIds) ? claims.customerIds : [];
  return {
    ...claims,
    customerIds: normalizeCustomerIds(claims.customerId, previous),
  };
}

export async function readCustomerSession(request: NextRequest): Promise<CustomerSessionClaims | null> {
  return verifyCustomerSessionValue(request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value);
}

export function customerSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: CUSTOMER_SESSION_TTL_SECONDS,
  };
}
