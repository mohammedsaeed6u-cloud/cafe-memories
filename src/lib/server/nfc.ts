import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  READER_PUBLIC_ID_PATTERN,
  READER_SECRET_PATTERN,
  buildTagUrl,
  readTagSecret,
} from '@/lib/nfc-tag';

/**
 * NFC tag credentials.
 *
 * A passive NTAG cannot sign a request, so the tag itself carries a bearer
 * secret. The database only ever stores SHA-256(secret): a leaked database
 * backup cannot be replayed against a reader. The secret lives in the URL
 * fragment (`#…`) so it is never sent to the server in a request line, never
 * appears in referrer headers, and never lands in CDN or access logs.
 *
 * The reader id is public (it appears in the path and in the dashboard). The
 * secret is what proves the tap came from the physical tag.
 */

export { READER_PUBLIC_ID_PATTERN, READER_SECRET_PATTERN, buildTagUrl, readTagSecret };

export interface ReaderCredentials {
  publicId: string;
  secret: string;
  secretHash: string;
}

/** 80 bits of public id + 192 bits of secret. */
export function generateReaderCredentials(): ReaderCredentials {
  const publicId = randomBytes(10).toString('hex');
  const secret = randomBytes(24).toString('base64url');
  return { publicId, secret, secretHash: hashReaderSecret(secret) };
}

export function hashReaderSecret(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

/** Constant-time comparison so a wrong secret cannot be brute-forced by timing. */
export function readerSecretMatches(secret: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashReaderSecret(secret), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/** Stable site origin for tag printing, with a safe localhost fallback in dev. */
export function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`;
  return 'http://localhost:3000';
}
