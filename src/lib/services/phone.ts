/**
 * Phone numbers are contact data, never an authentication factor.
 *
 * These helpers only normalize what a customer typed so that the same number
 * is stored in one canonical form. They deliberately do not merge accounts:
 * a phone match is never proof that two browsers belong to the same person.
 */

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹';

export function normalizeDigits(input: string): string {
  let result = (input ?? '').trim();
  for (let index = 0; index < 10; index++) {
    result = result
      .replaceAll(ARABIC_INDIC[index], String(index))
      .replaceAll(EASTERN_ARABIC[index], String(index));
  }
  return result;
}

/** Digits only, no plus, no separators. */
export function phoneKey(input: string): string {
  return normalizeDigits(input).replace(/\D/g, '');
}

/**
 * Canonical storage form.
 *
 * Egyptian mobiles are stored as `+20XXXXXXXXXX`; other international numbers
 * keep their `+` when supplied; anything else is stored as plain digits.
 */
export function canonicalizePhone(input: string): string {
  const raw = normalizeDigits(input);
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('01')) return `+20${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('20') && digits[2] === '1') return `+${digits}`;
  if (hasPlus) return `+${digits}`;
  return digits;
}

/** Accepts a plausible mobile number in any of the conventions we see. */
export function isValidPhone(input: string): boolean {
  const digits = phoneKey(input);
  return digits.length >= 8 && digits.length <= 15;
}

/**
 * Every stored form a legacy row may use for the same number. Used for
 * one-way reconciliation, never to authenticate a customer.
 */
export function phoneLookupVariants(input: string): string[] {
  const canonical = canonicalizePhone(input);
  const digits = canonical.replace(/\D/g, '');
  const values = new Set<string>([canonical, digits, `+${digits}`]);
  if (digits.startsWith('20') && digits.length === 12) {
    values.add(`0${digits.slice(2)}`);
  }
  return [...values].filter(Boolean);
}
