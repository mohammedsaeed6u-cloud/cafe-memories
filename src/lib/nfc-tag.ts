/**
 * Tag URL helpers shared by the public tap page and the server.
 *
 * This module must stay free of Node built-ins and `server-only`: the browser
 * reads the secret from the URL fragment, while the server only ever sees the
 * SHA-256 hash produced in `server/nfc.ts`.
 */

export const READER_PUBLIC_ID_PATTERN = /^[a-z0-9]{12,32}$/;
export const READER_SECRET_PATTERN = /^[A-Za-z0-9_-]{24,64}$/;

/** The URL written to the physical tag. The secret is a fragment, not a query. */
export function buildTagUrl(origin: string, publicId: string, secret: string): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}/t/${publicId}#${secret}`;
}

/** Read the secret from `#<secret>` (some writers use `#s=<secret>`). */
export function readTagSecret(hash: string): string | null {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw) return null;
  const value = raw.startsWith('s=') ? raw.slice(2) : raw;
  return READER_SECRET_PATTERN.test(value) ? value : null;
}
