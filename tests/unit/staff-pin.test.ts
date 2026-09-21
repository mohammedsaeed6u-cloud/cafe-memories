import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  STAFF_PIN_CREDENTIALS,
  getActiveStaffSession,
  getRemainingLockoutSeconds,
  resetStaffAuthState,
  verifyStaffPin,
} from '@/lib/services/staff-auth.service';
import { staffPinSchema } from '@/lib/validations/staff';

describe('staffPinSchema (4-digit PIN validation)', () => {
  it('accepts a valid 4-digit PIN', () => {
    const result = staffPinSchema.safeParse('1234');
    expect(result.success).toBe(true);
  });

  it('rejects PINs that are too short', () => {
    expect(staffPinSchema.safeParse('123').success).toBe(false);
    expect(staffPinSchema.safeParse('1').success).toBe(false);
    expect(staffPinSchema.safeParse('').success).toBe(false);
  });

  it('rejects PINs that are too long', () => {
    expect(staffPinSchema.safeParse('12345').success).toBe(false);
    expect(staffPinSchema.safeParse('123456').success).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(staffPinSchema.safeParse('12a4').success).toBe(false);
    expect(staffPinSchema.safeParse('abcd').success).toBe(false);
    expect(staffPinSchema.safeParse('--4!').success).toBe(false);
  });

  it('rejects non-string types', () => {
    expect(staffPinSchema.safeParse(1234).success).toBe(false);
    expect(staffPinSchema.safeParse(null).success).toBe(false);
    expect(staffPinSchema.safeParse(undefined).success).toBe(false);
  });
});

describe('verifyStaffPin', () => {
  beforeEach(() => {
    resetStaffAuthState();
  });

  afterEach(() => {
    resetStaffAuthState();
  });

  it('returns the staff member on successful verification', async () => {
    const result = await verifyStaffPin('staff-1', '1234');
    expect(result.success).toBe(true);
    expect(result.staff?.id).toBe('staff-1');
    expect(result.staff?.name).toBe('Layla Haddad');
    expect(result.staff?.role).toBe('barista');
  });

  it('activates the session on success', async () => {
    await verifyStaffPin('staff-3', '3456');
    const session = getActiveStaffSession();
    expect(session?.staffId).toBe('staff-3');
    expect(typeof session?.switchedAt).toBe('number');
  });

  it('rejects a wrong PIN without returning the staff member', async () => {
    const result = await verifyStaffPin('staff-1', '9999');
    expect(result.success).toBe(false);
    expect(result.staff).toBeUndefined();
    expect(result.error).toMatch(/Incorrect PIN/i);
  });

  it('rejects malformed PINs before checking credentials', async () => {
    const result = await verifyStaffPin('staff-1', '12');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/4 digits/i);
    // Malformed PIN should not increment the lockout counter
    expect(getRemainingLockoutSeconds('staff-1')).toBe(0);
  });

  it('rejects unknown staff id', async () => {
    const result = await verifyStaffPin('ghost', '1234');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Unknown staff/i);
  });

  it('rejects missing staff id', async () => {
    const result = await verifyStaffPin('', '1234');
    expect(result.success).toBe(false);
  });
});

describe('lockout counter', () => {
  beforeEach(() => {
    resetStaffAuthState();
  });

  afterEach(() => {
    resetStaffAuthState();
  });

  it('exposes MAX_FAILED_ATTEMPTS=3 and LOCKOUT_DURATION_MS=30s constants', () => {
    expect(MAX_FAILED_ATTEMPTS).toBe(3);
    expect(LOCKOUT_DURATION_MS).toBe(30_000);
  });

  it('allows first two failures and reports attempts remaining', async () => {
    const first = await verifyStaffPin('staff-2', '0000');
    expect(first.success).toBe(false);
    expect(first.error).toMatch(/2 attempts remaining/);

    const second = await verifyStaffPin('staff-2', '0000');
    expect(second.success).toBe(false);
    expect(second.error).toMatch(/1 attempt remaining/);
    expect(getRemainingLockoutSeconds('staff-2')).toBe(0);
  });

  it('locks out after 3 failed attempts', async () => {
    await verifyStaffPin('staff-2', '0000');
    await verifyStaffPin('staff-2', '0000');
    const third = await verifyStaffPin('staff-2', '0000');
    expect(third.success).toBe(false);
    expect(third.error).toMatch(/Locked for/i);
    expect(getRemainingLockoutSeconds('staff-2')).toBeGreaterThan(0);
  });

  it('rejects attempts during lockout even with the correct PIN', async () => {
    await verifyStaffPin('staff-4', '0000');
    await verifyStaffPin('staff-4', '0000');
    await verifyStaffPin('staff-4', '0000'); // triggers lockout
    const duringLockout = await verifyStaffPin('staff-4', '4567'); // correct PIN
    expect(duringLockout.success).toBe(false);
    expect(duringLockout.error).toMatch(/Try again in/i);
  });

  it('does not count lockout-rejected attempts toward the counter', async () => {
    for (let i = 0; i < 3; i++) {
      await verifyStaffPin('staff-2', '0000');
    }
    expect(getRemainingLockoutSeconds('staff-2')).toBeGreaterThan(0);

    // Additional attempts during lockout must not extend or mutate state
    await verifyStaffPin('staff-2', '0000');
    await verifyStaffPin('staff-2', '0000');
    expect(getRemainingLockoutSeconds('staff-2')).toBeGreaterThan(0);
  });

  it('locks out staff members independently', async () => {
    await verifyStaffPin('staff-1', '0000');
    await verifyStaffPin('staff-1', '0000');
    // staff-1 has 2 failures; staff-3 is untouched and can still log in
    const other = await verifyStaffPin('staff-3', '3456');
    expect(other.success).toBe(true);
    expect(getRemainingLockoutSeconds('staff-1')).toBe(0);
    expect(getRemainingLockoutSeconds('staff-3')).toBe(0);
  });

  it('resets the failure counter after successful verification', async () => {
    await verifyStaffPin('staff-2', '0000');
    // Correct PIN succeeds despite 1 prior failure
    const ok = await verifyStaffPin('staff-2', '2345');
    expect(ok.success).toBe(true);
    // Counter was cleared: a fresh run of failures starts from zero
    const first = await verifyStaffPin('staff-2', '0000');
    expect(first.error).toMatch(/2 attempts remaining/);
  });

  it('resets lockout and session on resetStaffAuthState', async () => {
    await verifyStaffPin('staff-2', '0000');
    await verifyStaffPin('staff-2', '0000');
    await verifyStaffPin('staff-2', '0000');
    expect(getRemainingLockoutSeconds('staff-2')).toBeGreaterThan(0);

    resetStaffAuthState();
    expect(getRemainingLockoutSeconds('staff-2')).toBe(0);
    expect(getActiveStaffSession()).toBeNull();
  });
});

describe('STAFF_PIN_CREDENTIALS sanity', () => {
  it('has one credential per roster member', () => {
    expect(Object.keys(STAFF_PIN_CREDENTIALS).sort()).toEqual(
      ['staff-1', 'staff-2', 'staff-3', 'staff-4'].sort()
    );
  });
});
