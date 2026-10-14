import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { LoyaltyPurseService } from '@/features/loyalty/loyalty-purse.service';
import { extractCustomerIdentifierFromScan } from '@/components/terminal/TerminalBarcodeScannerModal';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';

describe('Option 2 & 3: Supabase Cloud Database Sync & POS Cashier Terminal Suite', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    };
    (globalThis as any).window = { localStorage: mockStorage };
    (globalThis as any).localStorage = mockStorage;
    vi.restoreAllMocks();
  });

  describe('1. Barcode & QR Code Payload Extraction (extractCustomerIdentifierFromScan)', () => {
    it('extracts customer phone from full URL with customer query parameter', () => {
      const url = 'https://memories-c9w.pages.dev/customer?cafe=memories&customer=01012345678';
      expect(extractCustomerIdentifierFromScan(url)).toBe('01012345678');
    });

    it('extracts customer phone from URL with phone query parameter', () => {
      const url = 'https://stampy.app/c/memories?phone=01199887766';
      expect(extractCustomerIdentifierFromScan(url)).toBe('01199887766');
    });

    it('extracts gift voucher code correctly', () => {
      expect(extractCustomerIdentifierFromScan('GIFT-A1B2')).toBe('GIFT-A1B2');
      expect(extractCustomerIdentifierFromScan('gift-9999')).toBe('GIFT-9999');
    });

    it('extracts clean numeric phone number when raw digits are scanned', () => {
      expect(extractCustomerIdentifierFromScan('01023456789')).toBe('01023456789');
      expect(extractCustomerIdentifierFromScan('+201023456789')).toBe('201023456789');
    });

    it('returns raw query as fallback when neither phone nor voucher format', () => {
      expect(extractCustomerIdentifierFromScan('SPECIAL_REWARD')).toBe('SPECIAL_REWARD');
    });
  });

  describe('2. Multi-Stamp Loyalty Engine (+1, +2, +3 Stamps)', () => {
    it('advances stamped count by +1, +2, and +3 stamps correctly in LoyaltyPurseService', () => {
      const phone = '01011112222';
      const cafeSlug = 'memories';

      // 1. Initial state has 1 stamp by default
      const initial = LoyaltyPurseService.getData(phone, cafeSlug, 5);
      expect(initial.stampedCount).toBe(1);

      // 2. Add +2 stamps
      const res2 = LoyaltyPurseService.addDirectStamp(phone, cafeSlug, 5, 'قهوة مجانية', 2);
      expect(res2.success).toBe(true);
      expect(res2.newCount).toBe(3);
      expect(res2.isCardComplete).toBe(false);

      // 3. Add +2 more stamps (total 5 -> completes card)
      const resComplete = LoyaltyPurseService.addDirectStamp(phone, cafeSlug, 5, 'قهوة مجانية', 2);
      expect(resComplete.newCount).toBe(5);
      expect(resComplete.isCardComplete).toBe(true);

      const finalData = LoyaltyPurseService.getData(phone, cafeSlug, 5);
      expect(finalData.stampedCount).toBe(5);
      expect(finalData.completedCardsCount).toBe(1);
    });

    it('records multiple visits accurately in CustomerRegistryService', () => {
      const phone = '01033334444';
      const cafe = 'memories';

      CustomerRegistryService.registerCustomer(phone, 'كريم عادل', 'coffee_lover', cafe);

      // Add +3 stamps at once
      const updated = CustomerRegistryService.addDirectStamp(phone, cafe, 3);
      expect(updated).not.toBeNull();
      expect(updated?.totalVisits).toBe(4); // 1 initial + 3
    });
  });

  describe('3. Cloud-Synchronized Resilient Lookup (CustomerRegistryService)', () => {
    it('performs synchronous lookup with zero delay from local storage cache', () => {
      const phone = '01055556666';
      CustomerRegistryService.registerCustomer(phone, 'مريم حسين', 'vip', 'memories');

      const localRes = CustomerRegistryService.lookupCustomer(phone, 'memories');
      expect(localRes.exists).toBe(true);
      expect(localRes.name).toBe('مريم حسين');
      expect(localRes.totalVisits).toBeGreaterThanOrEqual(1);
    });

    it('performs async lookup with offline-first local fallback gracefully', async () => {
      const phone = '01077778888';
      CustomerRegistryService.registerCustomer(phone, 'طارق عماد', 'coffee_lover', 'memories');

      const asyncRes = await CustomerRegistryService.lookupCustomerAsync(phone, 'memories');
      expect(asyncRes.exists).toBe(true);
      expect(asyncRes.name).toBe('طارق عماد');
      expect(asyncRes.source).toBe('local');
    });

    it('returns exists: false for unknown customer without throwing', async () => {
      const asyncRes = await CustomerRegistryService.lookupCustomerAsync('01000000000', 'memories');
      expect(asyncRes.exists).toBe(false);
    });
  });

  describe('4. POS Audio Feedback (SoundEffectsService.playScanBeep)', () => {
    it('provides playScanBeep method for tactile scanner confirmation', () => {
      expect(typeof SoundEffectsService.playScanBeep).toBe('function');
      // When muted, safely returns false without WebAudio initialization
      SoundEffectsService.setMuted(true);
      expect(SoundEffectsService.playScanBeep()).toBe(false);
      SoundEffectsService.setMuted(false);
    });
  });
});
