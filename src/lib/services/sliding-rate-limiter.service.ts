'use client';

interface WindowRecord {
  timestamps: number[];
  lockedUntil?: number;
}

export class SlidingRateLimiter {
  private static store = new Map<string, WindowRecord>();

  /**
   * Evaluates a sliding window rate limit.
   * @param key Identifier (e.g., 'pin:127.0.0.1' or 'stamp:tenant:phone')
   * @param limit Max allowed requests in the window
   * @param windowMs Window duration in milliseconds
   */
  public static check(
    key: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetMs: number; isLocked: boolean } {
    const now = Date.now();
    const record = this.store.get(key) || { timestamps: [] };

    // Check if locked
    if (record.lockedUntil && record.lockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetMs: record.lockedUntil - now,
        isLocked: true,
      };
    }

    // Filter timestamps within sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetMs: windowMs - (now - record.timestamps[0]),
        isLocked: false,
      };
    }

    record.timestamps.push(now);
    this.store.set(key, record);

    return {
      allowed: true,
      remaining: limit - record.timestamps.length,
      resetMs: windowMs,
      isLocked: false,
    };
  }

  /**
   * Anti-Brute-Force check for Staff PIN.
   * Lockout device/user after 5 failed attempts for 15 minutes.
   */
  public static recordFailedPinAttempt(deviceKey: string): { locked: boolean; remainingAttempts: number } {
    const key = `pin_fail:${deviceKey}`;
    const now = Date.now();
    const record = this.store.get(key) || { timestamps: [] };

    record.timestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
    record.timestamps.push(now);

    if (record.timestamps.length >= 5) {
      record.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
      this.store.set(key, record);
      return { locked: true, remainingAttempts: 0 };
    }

    this.store.set(key, record);
    return { locked: false, remainingAttempts: 5 - record.timestamps.length };
  }

  public static resetPinAttempts(deviceKey: string): void {
    this.store.delete(`pin_fail:${deviceKey}`);
  }
}
