/**
 * Signed staff session cookie — Edge-safe (Web Crypto only).
 *
 * Shared by the Edge middleware and Node route handlers. Format:
 *   base64url(JSON claims).hex(HMAC-SHA256)
 * Claims: { staffId, cafeSlug, role, iat, exp }
 *
 * Issued exclusively by POST /api/v1/staff-session after a server-side
 * PIN verification; replaces the forgeable memories_staff_session=1
 * client-side cookie (CWE-308 / CWE-347).
 */

export const STAFF_SESSION_COOKIE = 'stampy_staff_session';

/** One work shift. */
export const STAFF_SESSION_TTL_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();

export interface StaffSessionClaims {
  staffId: string;
  cafeSlug: string;
  role: string;
  iat: number;
  exp: number;
}

function getAuthSecret(): string {
  return (
    process.env.BETTER_AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'development-secret-entropy-key-32-chars-long-cafe-memories'
  );
}

async function signPayload(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Constant-time comparison of equal-length hex strings. */
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createStaffSessionValue(
  claims: Omit<StaffSessionClaims, 'iat' | 'exp'>
): Promise<string> {
  const now = Date.now();
  const full: StaffSessionClaims = {
    ...claims,
    iat: now,
    exp: now + STAFF_SESSION_TTL_SECONDS * 1000,
  };
  const payload = btoa(JSON.stringify(full))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${payload}.${await signPayload(payload)}`;
}

export async function verifyStaffSessionValue(
  value: string | undefined | null
): Promise<StaffSessionClaims | null> {
  if (!value || !value.includes('.')) return null;
  const dotIndex = value.lastIndexOf('.');
  const payload = value.slice(0, dotIndex);
  const sig = value.slice(dotIndex + 1);
  if (!payload || !sig) return null;

  const expected = await signPayload(payload);
  if (!safeEqualHex(sig, expected)) return null;

  try {
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const claims = JSON.parse(atob(padded)) as StaffSessionClaims;
    if (typeof claims.exp !== 'number' || claims.exp < Date.now()) return null;
    if (!claims.staffId || typeof claims.staffId !== 'string') return null;
    return claims;
  } catch {
    return null;
  }
}
