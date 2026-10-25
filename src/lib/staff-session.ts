/**
 * Signed staff session cookie — Edge-safe (Web Crypto only).
 *
 * Format: base64url(JSON claims).hex(HMAC-SHA256)
 * Claims: { staffId, cafeSlug, role, iat, exp, aud: 'staff' }
 *
 * Issued exclusively by POST /api/v1/staff-session after a server-side PIN
 * verification. The legacy `memories_staff_session=1` cookie is never read.
 */

import { isProduction } from '@/lib/env';
import { base64UrlToBytes, bytesToBase64Url, signToken, timingSafeEqual, verifyToken } from '@/lib/signed-token';

export const STAFF_SESSION_COOKIE = 'stampy_staff_session';

/** One work shift. */
export const STAFF_SESSION_TTL_SECONDS = 60 * 60 * 12;

const DEV_SECRET = 'development-secret-entropy-key-32-chars-long-cafe-memories';
const PIN_ALGORITHM = 'pbkdf2-sha256';
const PIN_ITERATIONS = 120_000;
const MIN_PIN_ITERATIONS = 100_000;

const encoder = new TextEncoder();

export interface StaffSessionClaims {
  staffId: string;
  cafeSlug: string;
  role: string;
  iat: number;
  exp: number;
  aud: 'staff';
}

export type StaffSessionInput = Pick<StaffSessionClaims, 'staffId' | 'cafeSlug' | 'role'>;

/**
 * Production requires a dedicated secret. Development and tests keep the
 * deterministic chain below so a fresh clone works without configuration.
 */
function getStaffSecret(): string {
  const dedicated = process.env.STAFF_SESSION_SECRET;
  if (dedicated && dedicated.length >= 32) return dedicated;

  if (isProduction()) {
    const shared = process.env.BETTER_AUTH_SECRET;
    if (shared && shared.length >= 32) return shared;
    throw new Error('STAFF_SESSION_SECRET must be set to at least 32 characters in production');
  }

  return process.env.BETTER_AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || DEV_SECRET;
}

export async function createStaffSessionValue(claims: StaffSessionInput): Promise<string> {
  const now = Date.now();
  const full: StaffSessionClaims = {
    staffId: claims.staffId,
    cafeSlug: claims.cafeSlug,
    role: claims.role,
    iat: now,
    exp: now + STAFF_SESSION_TTL_SECONDS * 1000,
    aud: 'staff',
  };
  return signToken(full, getStaffSecret());
}

export async function verifyStaffSessionValue(
  value: string | undefined | null
): Promise<StaffSessionClaims | null> {
  const claims = await verifyToken<StaffSessionClaims>(value, getStaffSecret());
  if (!claims) return null;
  if (claims.aud !== 'staff') return null;
  if (typeof claims.staffId !== 'string' || claims.staffId.length === 0) return null;
  if (typeof claims.cafeSlug !== 'string' || claims.cafeSlug.length === 0) return null;
  if (typeof claims.role !== 'string' || claims.role.length === 0) return null;
  return claims;
}

/* -------------------------------------------------------------------------- */
/* PIN hashing                                                                */
/* -------------------------------------------------------------------------- */

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

async function derivePinBits(pin: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    // Web Crypto requires an ArrayBuffer-backed view; callers may pass a view
    // over a larger buffer, so hand it a fresh copy.
    { name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(salt) as BufferSource, iterations },
    key,
    256
  );
  return new Uint8Array(bits);
}

/** Returns `pbkdf2-sha256$<iterations>$<salt>$<hash>`, all base64url. */
export async function hashPin(pin: string, salt?: Uint8Array): Promise<string> {
  if (!isValidPinFormat(pin)) throw new Error('PIN must be 4 to 8 digits');
  const actualSalt = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePinBits(pin, actualSalt, PIN_ITERATIONS);
  return `${PIN_ALGORITHM}$${PIN_ITERATIONS}$${bytesToBase64Url(actualSalt)}$${bytesToBase64Url(hash)}`;
}

export async function verifyPin(pin: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored || !isValidPinFormat(pin)) return false;
  const [algorithm, rawIterations, rawSalt, rawHash] = stored.split('$');
  if (algorithm !== PIN_ALGORITHM || !rawSalt || !rawHash) return false;

  const iterations = Number(rawIterations);
  if (!Number.isSafeInteger(iterations) || iterations < MIN_PIN_ITERATIONS || iterations > 1_000_000) {
    return false;
  }

  const salt = base64UrlToBytes(rawSalt);
  const expected = base64UrlToBytes(rawHash);
  if (!salt || !expected || expected.length !== 32) return false;

  const actual = await derivePinBits(pin, salt, iterations);
  let diff = actual.length ^ expected.length;
  for (let i = 0; i < Math.min(actual.length, expected.length); i++) {
    diff |= actual[i] ^ expected[i];
  }
  return diff === 0 && timingSafeEqual(bytesToBase64Url(actual), bytesToBase64Url(expected));
}

/** Cookie attributes for the issued session. `secure` is on outside development. */
export function staffSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: STAFF_SESSION_TTL_SECONDS,
  };
}
