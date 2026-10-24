'use client';

export interface CustomerLoyaltyData {
  customerPhone: string;
  cafeSlug: string;
  stampedCount: number;
  maxSlots: number;
  lastStampedAt?: string;
  completedCardsCount: number;
  version?: number;
}

const STORAGE_PREFIX = 'stampy_loyalty_purse_';

export class LoyaltyPurseService {
  private static inMemoryStore = new Map<string, string>();
  private static activeLocks = new Set<string>();

  private static getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = localStorage.getItem(key);
      if (val) return val;
      const legacy = localStorage.getItem(key.replace('stampy_', 'memories_'));
      if (legacy) return legacy;
    }
    return this.inMemoryStore.get(key) || null;
  }

  private static setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
    this.inMemoryStore.set(key, value);
  }

  private static getKey(customerPhone: string, cafeSlug: string): string {
    const cleanPhone = (customerPhone || 'guest').trim().replace(/[^0-9]/g, '') || 'guest';
    return `${STORAGE_PREFIX}${cafeSlug}_${cleanPhone}`;
  }

  public static getData(customerPhone: string, cafeSlug: string, maxSlots = 5): CustomerLoyaltyData {
    const key = this.getKey(customerPhone, cafeSlug);
    const raw = this.getItem(key);
    if (!raw) {
      const initial: CustomerLoyaltyData = {
        customerPhone,
        cafeSlug,
        stampedCount: 1,
        maxSlots,
        completedCardsCount: 0,
        lastStampedAt: new Date().toISOString(),
        version: 1,
      };
      this.setItem(key, JSON.stringify(initial));
      return initial;
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        maxSlots: maxSlots || parsed.maxSlots || 5,
        stampedCount: Math.max(parsed.stampedCount ?? 1, 1),
      };
    } catch {
      return { customerPhone, cafeSlug, stampedCount: 1, maxSlots, completedCardsCount: 0, version: 1 };
    }
  }

  public static addDirectStamp(
    customerPhone: string,
    cafeSlug: string,
    maxSlots = 5
  ): { success: boolean; newCount: number; isCardComplete: boolean; error?: string } {
    const lockKey = `stamp:${cafeSlug}:${customerPhone}`;

    // Concurrency guard: Mutex Lock
    if (this.activeLocks.has(lockKey)) {
      return {
        success: false,
        newCount: 0,
        isCardComplete: false,
        error: 'عملية إضافة ختم قيد المعالجة للعميل حالياً. يرجى الانتظار.',
      };
    }

    this.activeLocks.add(lockKey);
    try {
      const current = this.getData(customerPhone, cafeSlug, maxSlots);
      const newCount = current.stampedCount + 1;
      const isCardComplete = newCount >= maxSlots;
      const updated: CustomerLoyaltyData = {
        ...current,
        stampedCount: newCount,
        lastStampedAt: new Date().toISOString(),
        completedCardsCount: isCardComplete ? (current.completedCardsCount || 0) + 1 : current.completedCardsCount,
        version: (current.version || 1) + 1,
      };
      this.setItem(this.getKey(customerPhone, cafeSlug), JSON.stringify(updated));
      return { success: true, newCount, isCardComplete };
    } finally {
      this.activeLocks.delete(lockKey);
    }
  }

  public static addStamp(customerPhone: string, cafeSlug: string, reason?: string, maxSlots = 5): CustomerLoyaltyData {
    this.addDirectStamp(customerPhone, cafeSlug, maxSlots);
    return this.getData(customerPhone, cafeSlug, maxSlots);
  }

  public static canCustomerShoot(customerPhone?: string, cafeSlug?: string, currentPhotosCount?: number): boolean {
    return true;
  }
}
