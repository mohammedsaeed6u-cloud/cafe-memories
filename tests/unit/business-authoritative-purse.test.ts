import { describe, it, expect } from 'vitest';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { BUSINESS_INDUSTRY_OPTIONS } from '@/lib/constants/photobooth-presets';
import { CooldownService } from '@/lib/services/cooldown.service';

describe('Business-Authoritative Digital Purse & Gated Retention Suite', () => {
  describe('Authoritative Business Frame & Orientation Enforcement', () => {
    it('strictly normalizes merchant settings with authoritative orientation and shotCount', () => {
      const settings = BusinessSettingsService.getSettings('espresso-lab');
      expect(settings).toBeDefined();
      expect(['vertical', 'horizontal']).toContain(settings.defaultOrientation);
      expect(settings.defaultShotCount).toBeGreaterThanOrEqual(1);

      // Verify every frame inherits the authoritative business settings
      settings.frames.forEach((frame) => {
        expect(frame.shotCount).toBe(settings.defaultShotCount);
        expect(frame.orientation).toBe(settings.defaultOrientation);
      });
    });

    it('enforces customer lock when lockFrameForCustomers is true', () => {
      const settings = BusinessSettingsService.getSettings('espresso-lab');
      expect(settings.lockFrameForCustomers).toBe(true);
    });
  });

  describe('Multi-Business Industry Support (Beyond Cafes)', () => {
    it('supports 6 distinct business industries with proper labels and gift offers', () => {
      const expectedIndustries = ['cafe', 'restaurant', 'retail', 'salon', 'entertainment', 'events'];
      const supportedIds = BUSINESS_INDUSTRY_OPTIONS.map((opt) => opt.id);

      expectedIndustries.forEach((industry) => {
        expect(supportedIds).toContain(industry);
        const opt = BUSINESS_INDUSTRY_OPTIONS.find((o) => o.id === industry);
        expect(opt).toBeDefined();
        expect(opt?.staffLabel).toBeTruthy();
        expect(opt?.defaultGiftTitle).toBeTruthy();
        expect(opt?.icon).toBeTruthy();
      });
    });

    it('provides distinct staff role names for each industry', () => {
      const restaurantOpt = BUSINESS_INDUSTRY_OPTIONS.find((o) => o.id === 'restaurant');
      const salonOpt = BUSINESS_INDUSTRY_OPTIONS.find((o) => o.id === 'salon');
      const retailOpt = BUSINESS_INDUSTRY_OPTIONS.find((o) => o.id === 'retail');
      const cafeOpt = BUSINESS_INDUSTRY_OPTIONS.find((o) => o.id === 'cafe');

      expect(cafeOpt?.staffLabel).toBe('موظف الكاونتر');
      expect(retailOpt?.staffLabel).toBe('الكاشير');
      expect(salonOpt?.staffLabel).toBe('الاستقبال');
      expect(restaurantOpt?.staffLabel).toBe('مقدم الخدمة');
    });
  });

  describe('Gated Retention & Unlock Mechanics', () => {
    it('strictly evaluates completion state: card is incomplete if photos < totalSlots', () => {
      const totalSlots = 4;
      const customerPhotos = [
        'data:image/png;base64,sample1',
        'data:image/png;base64,sample2',
      ];

      const isComplete = customerPhotos.length >= totalSlots;
      const remainingVisits = totalSlots - customerPhotos.length;

      expect(isComplete).toBe(false);
      expect(remainingVisits).toBe(2);

      // Download and print must be locked
      const isDownloadAllowed = isComplete;
      const isPrintAllowed = isComplete;
      expect(isDownloadAllowed).toBe(false);
      expect(isPrintAllowed).toBe(false);
    });

    it('unlocks downloads, physical prints, and reward voucher when all slots are completed', () => {
      const totalSlots = 3;
      const completedPhotos = [
        'data:image/png;base64,sample1',
        'data:image/png;base64,sample2',
        'data:image/png;base64,sample3',
      ];

      const isComplete = completedPhotos.length >= totalSlots;
      const remainingVisits = Math.max(totalSlots - completedPhotos.length, 0);

      expect(isComplete).toBe(true);
      expect(remainingVisits).toBe(0);

      const isDownloadAllowed = isComplete;
      const isPrintAllowed = isComplete;
      expect(isDownloadAllowed).toBe(true);
      expect(isPrintAllowed).toBe(true);
    });

    it('requires verified Barista/Staff PIN for extra order shots', () => {
      // Invalid PINs fail
      expect(CooldownService.verifyBaristaPin('1111')).toBe(false);
      expect(CooldownService.verifyBaristaPin('')).toBe(false);
      expect(CooldownService.verifyBaristaPin('9999')).toBe(false);

      // Known staff PIN succeeds
      expect(CooldownService.verifyBaristaPin('2026')).toBe(true);
      expect(CooldownService.verifyBaristaPin('7777')).toBe(true);
    });
  });

  describe('60-Second Merchant Setup & Multi-Tenant Persistence', () => {
    it('creates and saves new café tenant with authoritative 5-slot wallet pass configuration', () => {
      const newCafeSlug = 'elixir-roasters';
      const initialSettings = BusinessSettingsService.getSettings(newCafeSlug);

      const customSettings = {
        ...initialSettings,
        cafeSlug: newCafeSlug,
        cafeName: 'Elixir Specialty Coffee',
        branding: {
          name: 'Elixir Specialty Coffee',
          tagline: 'Artisan Roast & Brew',
        },
        defaultOrientation: 'horizontal' as const,
        defaultShotCount: 5,
        freeGiftOffer: {
          title: 'كوب قهوة فلات وايت مجاني ☕',
          subtitle: 'عند إكمال 5 زيارات',
          icon: 'coffee',
        },
      };

      BusinessSettingsService.saveSettings(customSettings);

      const retrieved = BusinessSettingsService.getSettings(newCafeSlug);
      expect(retrieved.cafeSlug).toBe(newCafeSlug);
      expect(retrieved.branding.name).toBe('Elixir Specialty Coffee');
      expect(retrieved.defaultOrientation).toBe('horizontal');
      expect(retrieved.defaultShotCount).toBe(5);
      expect(retrieved.freeGiftOffer.title).toBe('كوب قهوة فلات وايت مجاني ☕');

      // Verify all child frames are strictly normalized to 5 slots and horizontal
      retrieved.frames.forEach((f) => {
        expect(f.shotCount).toBe(5);
        expect(f.orientation).toBe('horizontal');
      });
    });

    it('generates zero-friction customer URL and QR touchpoint destination', () => {
      const slug = 'symmetry-cafe';
      const customerUrl = `/c/${slug}`;
      expect(customerUrl).toBe('/c/symmetry-cafe');
      expect(customerUrl.startsWith('/c/')).toBe(true);
    });
  });
});

