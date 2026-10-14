import { describe, it, expect } from 'vitest';
import { canonicalizePhone, phoneKey, phoneLookupVariants } from '@/lib/services/phone';

describe('canonical phone identity', () => {
  it('upgrades Egyptian local numbers to the +2 form', () => {
    expect(canonicalizePhone('01012345678')).toBe('+201012345678');
    expect(canonicalizePhone('٠١٠١٢٣٤٥٦٧٨')).toBe('+201012345678');
    expect(canonicalizePhone('01212345678')).toBe('+201212345678');
  });

  it('keeps already-international numbers as-is', () => {
    expect(canonicalizePhone('+201012345678')).toBe('+201012345678');
  });

  it('normalizes bare Egyptian international numbers to the + form', () => {
    expect(canonicalizePhone('201012345678')).toBe('+201012345678');
    expect(canonicalizePhone('201599988877')).toBe('+201599988877');
  });

  it('does not touch non-Egyptian or non-mobile numbers', () => {
    expect(canonicalizePhone('966501234567')).toBe('966501234567');
    expect(canonicalizePhone('0223334444')).toBe('0223334444');
  });

  it('collapses every convention to one lookup variant set', () => {
    const a = phoneLookupVariants('01012345678');
    const b = phoneLookupVariants('+201012345678');
    const c = phoneLookupVariants('201012345678');
    expect(a).toEqual(b);
    expect(b).toEqual(c);
    expect(a).toContain('+201012345678');
  });

  it('phoneKey is digits-only regardless of convention', () => {
    expect(phoneKey('+201012345678')).toBe('201012345678');
    expect(phoneKey('٠١٠١٢٣٤٥٦٧٨')).toBe('01012345678');
  });
});
