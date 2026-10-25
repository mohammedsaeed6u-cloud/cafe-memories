import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Memory images live in a private bucket. The database stores a storage key
 * (or, for rows created before the hardening migration, an absolute https URL).
 * Every read mints a short-lived signed URL so a leaked page source cannot be
 * used to browse another guest's photos.
 */

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export function isAbsoluteHttpUrl(value: string): boolean {
  return /^https:\/\//i.test(value);
}

export async function signedMemoryUrl(value: string | null | undefined): Promise<string | null> {
  const clean = (value ?? '').trim();
  if (!clean) return null;
  if (isAbsoluteHttpUrl(clean)) return clean;
  if (!/^[A-Za-z0-9][A-Za-z0-9/_.-]{1,400}$/.test(clean)) return null;

  const { data, error } = await createAdminClient()
    .storage.from('memories')
    .createSignedUrl(clean, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Sign a batch, returning a lookup keyed by the stored value. */
export async function signedMemoryUrlMap(
  values: Array<string | null | undefined>
): Promise<Map<string, string>> {
  const unique = [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))];
  const pairs = await Promise.all(
    unique.map(async (value) => [value, await signedMemoryUrl(value)] as const)
  );
  const map = new Map<string, string>();
  for (const [value, url] of pairs) {
    if (url) map.set(value, url);
  }
  return map;
}

/** First usable value from a derivative chain, already signed. */
export function pickSigned(
  map: Map<string, string>,
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const signed = map.get(candidate);
    if (signed) return signed;
  }
  return '';
}
