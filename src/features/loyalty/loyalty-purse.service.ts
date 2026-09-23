'use client';

export interface CustomerLoyaltyData {
  customerPhone: string;
  cafeSlug: string;
  stampedCount: number;
  maxSlots: number;
  lastStampedAt?: string;
  completedCardsCount: number;
}

const STORAGE_PREFIX = 'memories_loyalty_purse_';

export class LoyaltyPurseService {
  private static inMemoryStore = new Map<string, string>();

  private static getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
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
      return { customerPhone, cafeSlug, stampedCount: 1, maxSlots, completedCardsCount: 0 };
    }
  }

  public static addDirectStamp(customerPhone: string, cafeSlug: string, maxSlots = 5): { success: boolean; newCount: number; isCardComplete: boolean } {
    const current = this.getData(customerPhone, cafeSlug, maxSlots);
    const newCount = current.stampedCount + 1;
    const isCardComplete = newCount >= maxSlots;
    const updated: CustomerLoyaltyData = {
      ...current,
      stampedCount: newCount,
      lastStampedAt: new Date().toISOString(),
      completedCardsCount: isCardComplete ? (current.completedCardsCount || 0) + 1 : current.completedCardsCount,
    };
    this.setItem(this.getKey(customerPhone, cafeSlug), JSON.stringify(updated));
    return { success: true, newCount, isCardComplete };
  }

  public static canCustomerShoot(customerPhone?: string, cafeSlug?: string, currentPhotosCount?: number): boolean {
    // Customer photobooth sessions are open to capture all strip photos
    return true;
  }
}