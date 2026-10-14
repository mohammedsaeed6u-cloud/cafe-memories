/**
 * Canonical customer phone identity.
 *
 * The capture route used to store the phone exactly as the customer typed it
 * ("+2010…" or "2010…"), which let the same person exist as TWO customer rows
 * and silently split their loyalty card. Every writer must now store the
 * canonical form produced here, and every reader must look it up by
 * `canonicalizePhone` / `phoneKey`.
 */

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Egyptian mobile prefixes when written locally (11 digits, leading 0). */
const EGYPT_LOCAL_PREFIXES = ['010', '011', '012', '015'];

function toLatinDigits(input: string): string {
  let out = input;
  ARABIC_DIGITS.forEach((digit, index) => {
    out = out.replaceAll(digit, String(index));
  });
  return out;
}

/**
 * Canonical storage form for a phone number:
 * - Egyptian local numbers ("01012345678", ٠١٠…) → "+201012345678"
 * - Numbers already carrying a "+" → kept as-is (digits only)
 * - Anything else → digits only (best effort, preserves legacy behavior)
 */
export function canonicalizePhone(raw: string): string {
  const cleaned = toLatinDigits((raw || '').trim());
  const hasPlus = cleaned.startsWith('+');
  const digitsOnly = cleaned.replace(/\D/g, '');

  if (!hasPlus && digitsOnly.length === 11 && EGYPT_LOCAL_PREFIXES.includes(digitsOnly.slice(0, 3))) {
    return `+2${digitsOnly}`;
  }
  if (!hasPlus && digitsOnly.length === 13 && digitsOnly.startsWith('20') && EGYPT_LOCAL_PREFIXES.includes(`0${digitsOnly.slice(2, 4)}`)) {
    return `+${digitsOnly}`;
  }
  // Egyptian international form without the plus ("201088880001") is
  // unambiguous: normalize it to the canonical + form too.
  if (!hasPlus && digitsOnly.length === 12 && digitsOnly.startsWith('20') && digitsOnly.slice(2, 3) === '1') {
    return `+${digitsOnly}`;
  }
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/** Cache/lookup key form: digits only, convention-agnostic. */
export function phoneKey(raw: string): string {
  return toLatinDigits((raw || '').trim()).replace(/\D/g, '');
}

/** Storage + lookup variants to try for a user-supplied phone. */
export function phoneLookupVariants(raw: string): string[] {
  const canonical = canonicalizePhone(raw);
  return [...new Set([canonical, phoneKey(canonical)])];
}
