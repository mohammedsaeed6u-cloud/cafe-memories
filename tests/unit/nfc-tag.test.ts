import { describe, it, expect } from 'vitest';
import {
  READER_PUBLIC_ID_PATTERN,
  READER_SECRET_PATTERN,
  buildTagUrl,
  readTagSecret,
} from '@/lib/nfc-tag';

/**
 * The tag URL is a bearer credential: the secret must live in the fragment so
 * it never reaches the server, the CDN, or a referrer header. These tests pin
 * that contract and the strict formats the API validates against.
 */

const SECRET = 'Zm9vYmFyYmF6cXV4MTIzNDU2Nzg5MGFiY2RlZg';
const PUBLIC_ID = 'a1b2c3d4e5f60718';

describe('NFC tag URL', () => {
  it('puts the secret in the fragment, never the query string', () => {
    const url = buildTagUrl('https://stampy.example', PUBLIC_ID, SECRET);
    expect(url).toBe(`https://stampy.example/t/${PUBLIC_ID}#${SECRET}`);
    expect(new URL(url).search).toBe('');
    expect(new URL(url).hash).toBe(`#${SECRET}`);
  });

  it('normalises trailing slashes on the origin', () => {
    expect(buildTagUrl('https://stampy.example///', PUBLIC_ID, SECRET)).toBe(
      `https://stampy.example/t/${PUBLIC_ID}#${SECRET}`
    );
  });

  it('round-trips through readTagSecret', () => {
    const url = new URL(buildTagUrl('https://stampy.example', PUBLIC_ID, SECRET));
    expect(readTagSecret(url.hash)).toBe(SECRET);
  });

  it('accepts the legacy s= prefix used by some writers', () => {
    expect(readTagSecret(`#s=${SECRET}`)).toBe(SECRET);
  });

  it('returns null for an empty or missing fragment', () => {
    expect(readTagSecret('')).toBeNull();
    expect(readTagSecret('#')).toBeNull();
    expect(readTagSecret('#   ')).toBeNull();
  });

  it('rejects secrets that are too short to be a credential', () => {
    expect(readTagSecret('#short')).toBeNull();
    expect(readTagSecret('#s=')).toBeNull();
  });

  it('rejects secrets with characters outside the base64url alphabet', () => {
    expect(readTagSecret(`#${SECRET.slice(0, -1)}!`)).toBeNull();
    expect(readTagSecret(`#${SECRET} with space`)).toBeNull();
  });

  it('accepts 12–32 character lowercase public ids only', () => {
    expect(READER_PUBLIC_ID_PATTERN.test(PUBLIC_ID)).toBe(true);
    expect(READER_PUBLIC_ID_PATTERN.test('short')).toBe(false);
    expect(READER_PUBLIC_ID_PATTERN.test('A1B2C3D4E5F60718')).toBe(false);
    expect(READER_PUBLIC_ID_PATTERN.test('a1b2-c3d4-e5f60718')).toBe(false);
  });

  it('requires at least 24 secret characters', () => {
    expect(READER_SECRET_PATTERN.test('a'.repeat(23))).toBe(false);
    expect(READER_SECRET_PATTERN.test('a'.repeat(24))).toBe(true);
    expect(READER_SECRET_PATTERN.test('a'.repeat(65))).toBe(false);
  });
});
