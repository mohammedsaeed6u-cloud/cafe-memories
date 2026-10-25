/**
 * Compact signed tokens shared by the staff and customer sessions.
 *
 * Format: base64url(JSON claims) + "." + hex(HMAC-SHA256)
 * Web Crypto only, so the same module runs in the Edge middleware and in Node
 * route handlers.
 */

const encoder = new TextEncoder();

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  try {
    const binary = atob(withPadding);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Constant-time comparison of two equal-length strings. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signToken(claims: object, secret: string): Promise<string> {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify(claims)));
  return `${payload}.${await hmacSha256Hex(secret, payload)}`;
}

export async function verifyToken<T extends { exp?: unknown }>(
  value: string | null | undefined,
  secret: string
): Promise<T | null> {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot <= 0 || dot === value.length - 1) return null;

  const payload = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  if (!payload || !signature) return null;

  const expected = await hmacSha256Hex(secret, payload);
  if (!timingSafeEqual(signature, expected)) return null;

  const bytes = base64UrlToBytes(payload);
  if (!bytes) return null;

  try {
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as T;
    if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp)) return null;
    if (claims.exp < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}
