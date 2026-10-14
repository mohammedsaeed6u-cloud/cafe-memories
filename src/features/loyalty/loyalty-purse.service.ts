'use client';

export interface CustomerLoyaltyData {
  customerPhone: string;
  cafeSlug: string;
  stampedCount: number;
  maxSlots: number;
  lastStampedAt?: string;
  completedCardsCount: number;
  /** Local data-URL photos for the offline photo-bound card fallback. */
  photos?: string[];
}

import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';

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
        stampedCount: typeof parsed.stampedCount === 'number' ? Math.max(0, parsed.stampedCount) : 1,
      };
    } catch {
      return { customerPhone, cafeSlug, stampedCount: 1, maxSlots, completedCardsCount: 0 };
    }
  }

  public static addDirectStamp(
    customerPhone: string,
    cafeSlug: string,
    maxSlots = 5,
    giftTitle?: string,
    count = 1
  ): { success: boolean; newCount: number; isCardComplete: boolean } {
    const stampsToAdd = Math.max(1, count);
    const current = this.getData(customerPhone, cafeSlug, maxSlots);
    const newCount = current.stampedCount + stampsToAdd;
    const isCardComplete = newCount >= maxSlots;
    const updated: CustomerLoyaltyData = {
      ...current,
      stampedCount: newCount,
      lastStampedAt: new Date().toISOString(),
      completedCardsCount: isCardComplete ? (current.completedCardsCount || 0) + 1 : current.completedCardsCount,
    };
    this.setItem(this.getKey(customerPhone, cafeSlug), JSON.stringify(updated));

    // Also update CRM and Supabase Cloud asynchronously
    CustomerRegistryService.addDirectStampAsync(customerPhone, cafeSlug, stampsToAdd).catch((err) => {
      console.error('[LoyaltyPurse] Failed to sync direct stamp to cloud:', err);
    });

    // Automated Real-Time Pass Push (Apple APNs & Google Wallet)
    if (typeof window !== 'undefined') {
      try {
        DigitalWalletService.syncPassToWallet({
          cafeSlug,
          customerPhone,
          stampedCount: newCount,
          maxSlots,
          giftTitle,
        }).catch((err) => {
          console.warn('[LoyaltyPurse] Wallet pass sync failed:', err);
        });
      } catch (err) {
        console.warn('[LoyaltyPurse] Error dispatching wallet pass sync:', err);
      }
    }

    return { success: true, newCount, isCardComplete };
  }

  public static setStampedCount(
    customerPhone: string,
    cafeSlug: string,
    count: number,
    maxSlots = 5
  ): CustomerLoyaltyData {
    const current = this.getData(customerPhone, cafeSlug, maxSlots);
    const validCount = Math.max(0, count);
    const isComplete = validCount >= maxSlots;
    const updated: CustomerLoyaltyData = {
      ...current,
      stampedCount: validCount,
      lastStampedAt: new Date().toISOString(),
      completedCardsCount: isComplete ? Math.max(1, Math.floor(validCount / maxSlots)) : current.completedCardsCount,
    };
    this.setItem(this.getKey(customerPhone, cafeSlug), JSON.stringify(updated));
    return updated;
  }

  public static canCustomerShoot(customerPhone?: string, cafeSlug?: string, currentPhotosCount?: number): boolean {
    // Customer photobooth sessions are open to capture all strip photos
    return true;
  }
}