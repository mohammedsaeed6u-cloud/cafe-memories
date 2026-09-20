const STORAGE_KEY = 'memories_visit_cooldowns_v1';
const COOLDOWN_HOURS = 24;

interface CooldownEntry {
  lastSessionTime: number;
  unlockedUntil?: number; // timestamp until which barista granted override
}

export class CooldownService {
  private static getStore(): Record<string, CooldownEntry> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
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
   * Checks if customer is allowed to start a photobooth session or is locked by 24h rule.
   */
  static checkAccess(
    identifier: string,
    cafeSlug: string = 'espresso-lab'
  ): { allowed: boolean; remainingHours?: number; lastSessionTime?: string } {
    if (!identifier) return { allowed: true };

    const store = this.getStore();
    const key = this.makeKey(identifier, cafeSlug);
    const entry = store[key];

    if (!entry) {
      return { allowed: true };
    }

    const now = Date.now();

    // Check if barista granted an override that is still active
    if (entry.unlockedUntil && entry.unlockedUntil > now) {
      return { allowed: true };
    }

    const diffMs = now - entry.lastSessionTime;
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

    if (diffMs < cooldownMs) {
      const remainingHours = Math.ceil((cooldownMs - diffMs) / (60 * 60 * 1000));
      return {
        allowed: false,
        remainingHours,
        lastSessionTime: new Date(entry.lastSessionTime).toISOString(),
      };
    }

    return { allowed: true };
  }

  /**
   * Records that customer took a photobooth session now.
   */
  static recordSession(identifier: string, cafeSlug: string = 'espresso-lab'): void {
    if (!identifier) return;
    const store = this.getStore();
    const key = this.makeKey(identifier, cafeSlug);

    store[key] = {
      lastSessionTime: Date.now(),
      unlockedUntil: undefined,
    };

    this.saveStore(store);
  }

  /**
   * Admin / Barista manual unlock: Grants customer permission to take another session today.
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
      ...(store[key] || { lastSessionTime: Date.now() }),
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
