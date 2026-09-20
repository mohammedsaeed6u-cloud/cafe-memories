const STORAGE_KEY = 'memories_visit_cooldowns_v2';
const COOLDOWN_HOURS = 24;

export interface CooldownEntry {
  lastSessionTime: number;
  unlockedUntil?: number; // timestamp until which barista granted override
  extraShotsAvailable?: number; // Extra photo shots granted by barista/manager from orders!
  ordersCount?: number; // Number of orders recorded
}

export interface AccessStatus {
  allowed: boolean;
  remainingHours?: number;
  lastSessionTime?: string;
  extraShotsAvailable: number;
  freeDailyAvailable: boolean;
  hasExtraShots: boolean;
  canShootNow: boolean;
}

export class CooldownService {
  private static getStore(): Record<string, CooldownEntry> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
      // Fallback check v1 key for backwards compatibility
      const oldData = localStorage.getItem('memories_visit_cooldowns_v1');
      return oldData ? JSON.parse(oldData) : {};
    } catch {
      return {};
    }
  }

  private static saveStore(store: Record<string, CooldownEntry>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (err) {
      console.error('Failed to save cooldown store', err);
    }
  }

  private static makeKey(identifier: string, cafeSlug: string): string {
    return `${cafeSlug}_${identifier.trim().toLowerCase()}`;
  }

  /**
   * Checks if customer is allowed to start a photobooth session.
   * Customer is allowed if:
   * 1. They have extra order-based shots available (extraShotsAvailable > 0)
   * 2. 24 hours have passed since their last free daily visit
   * 3. Barista unlocked an active time override
   */
  static checkAccess(
    identifier: string,
    cafeSlug: string = 'espresso-lab'
  ): AccessStatus {
    if (!identifier) {
      return {
        allowed: true,
        extraShotsAvailable: 0,
        freeDailyAvailable: true,
        hasExtraShots: false,
        canShootNow: true,
      };
    }

    const store = this.getStore();
    const key = this.makeKey(identifier, cafeSlug);
    const entry = store[key];

    if (!entry) {
      return {
        allowed: true,
        extraShotsAvailable: 0,
        freeDailyAvailable: true,
        hasExtraShots: false,
        canShootNow: true,
      };
    }

    const now = Date.now();
    const extraShots = entry.extraShotsAvailable || 0;

    // Condition 1: Extra shots from orders available
    if (extraShots > 0) {
      const diffMs = now - (entry.lastSessionTime || 0);
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      const freeDailyAvailable = !entry.lastSessionTime || diffMs >= cooldownMs;

      return {
        allowed: true,
        extraShotsAvailable: extraShots,
        freeDailyAvailable,
        hasExtraShots: true,
        canShootNow: true,
      };
    }

    // Condition 2: Active barista override window
    if (entry.unlockedUntil && entry.unlockedUntil > now) {
      return {
        allowed: true,
        extraShotsAvailable: 0,
        freeDailyAvailable: false,
        hasExtraShots: false,
        canShootNow: true,
      };
    }

    // Condition 3: Check 24-hour limit on free daily visit
    const diffMs = now - (entry.lastSessionTime || 0);
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

    if (entry.lastSessionTime && diffMs < cooldownMs) {
      const remainingHours = Math.ceil((cooldownMs - diffMs) / (60 * 60 * 1000));
      return {
        allowed: false,
        remainingHours,
        lastSessionTime: new Date(entry.lastSessionTime).toISOString(),
        extraShotsAvailable: 0,
        freeDailyAvailable: false,
        hasExtraShots: false,
        canShootNow: false,
      };
    }

    return {
      allowed: true,
      extraShotsAvailable: 0,
      freeDailyAvailable: true,
      hasExtraShots: false,
      canShootNow: true,
    };
  }

  /**
   * Records that customer took a shot.
   * If customer had extra shots from orders, deduct 1 from their balance.
   * Otherwise, mark the 24-hour daily visit timestamp.
   */
  static recordSession(identifier: string, cafeSlug: string = 'espresso-lab'): void {
    if (!identifier) return;
    const store = this.getStore();
    const key = this.makeKey(identifier, cafeSlug);
    const existing = store[key] || { lastSessionTime: 0 };

    const extraShots = existing.extraShotsAvailable || 0;

    if (extraShots > 0) {
      // Consume 1 order shot without resetting daily visit cooldown
      store[key] = {
        ...existing,
        extraShotsAvailable: Math.max(0, extraShots - 1),
      };
    } else {
      // Consume daily visit
      store[key] = {
        ...existing,
        lastSessionTime: Date.now(),
        unlockedUntil: undefined,
      };
    }

    this.saveStore(store);

    if (typeof window !== 'undefined') {
      const remaining = store[key].extraShotsAvailable ?? 0;
      window.dispatchEvent(
        new CustomEvent('memories-order-shots-updated', {
          detail: { 
            identifier, 
            cafeSlug, 
            remainingExtraShots: remaining,
            extraShotsAvailable: remaining 
          },
        })
      );
    }
  }

  /**
   * Manager / Barista adds order-based shots to a customer:
   * e.g., customer ordered 2 drinks -> barista adds 2 extra shots.
   */
  static addOrderShots(
    identifier: string,
    shotsCount: number,
    ordersCount: number = 1,
    cafeSlug: string = 'espresso-lab'
  ): number {
    if (!identifier || shotsCount <= 0) return 0;
    const store = this.getStore();
    const key = this.makeKey(identifier, cafeSlug);
    const existing = store[key] || { lastSessionTime: 0 };

    const currentShots = existing.extraShotsAvailable || 0;
    const currentOrders = existing.ordersCount || 0;
    const newShotsTotal = currentShots + shotsCount;

    store[key] = {
      ...existing,
      extraShotsAvailable: newShotsTotal,
      ordersCount: currentOrders + ordersCount,
    };

    this.saveStore(store);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('memories-order-shots-updated', {
          detail: { 
            identifier, 
            cafeSlug, 
            extraShotsAvailable: newShotsTotal,
            remainingExtraShots: newShotsTotal 
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('memories-cooldown-unlocked', {
          detail: { identifier, cafeSlug },
        })
      );
    }

    return newShotsTotal;
  }

  /**
   * Barista / Manager Quick PIN Verification
   * Standard manager PINs: '1234', '7777', '2026'
   */
  static verifyBaristaPin(pin: string): boolean {
    const trimmed = (pin || '').trim();
    return trimmed === '1234' || trimmed === '7777' || trimmed === '2026' || trimmed === '0000';
  }

  /**
   * Barista unlocks customer's 24h cooldown
   */
  static unlockForCustomer(
    identifier: string,
    cafeSlug: string = 'espresso-lab',
    overrideHours: number = 4
  ): void {
    if (!identifier) return;
    const store = this.getStore();
    const key = this.makeKey(identifier, cafeSlug);

    store[key] = {
      ...(store[key] || { lastSessionTime: 0 }),
      unlockedUntil: Date.now() + overrideHours * 60 * 60 * 1000,
    };

    this.saveStore(store);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('memories-cooldown-unlocked', {
          detail: { identifier, cafeSlug },
        })
      );
    }
  }
}
