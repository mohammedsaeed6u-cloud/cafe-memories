import { describe, it, expect, vi } from 'vitest';
import { getIndustryProfile, BUSINESS_INDUSTRY_OPTIONS } from '@/lib/constants/photobooth-presets';
import { DEFAULT_BUSINESS_CONFIG } from '@/lib/config/business-settings';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { ImageSaveService } from '@/lib/services/image-save.service';
import { CardCanvasExportService } from '@/lib/services/card-canvas-export.service';

describe('Multi-Industry Architecture & Safari Save Engine', () => {
  describe('Industry Profile Profiles (De-Cafefication)', () => {
    it('provides tailored metadata for all 7 industry profiles', () => {
      expect(BUSINESS_INDUSTRY_OPTIONS.length).toBe(7);

      const salon = getIndustryProfile('salon');
      expect(salon.staffLabel).toBe('الاستقبال');
      expect(salon.nameAr).toContain('صالون');

      const retail = getIndustryProfile('retail');
      expect(retail.staffLabel).toBe('الكاشير');
      expect(retail.nameAr).toContain('متجر');

      const restaurant = getIndustryProfile('restaurant');
      expect(restaurant.staffLabel).toBe('مقدم الخدمة');

      const entertainment = getIndustryProfile('entertainment');
      expect(entertainment.staffLabel).toBe('مشرف الألعاب');

      const events = getIndustryProfile('events');
      expect(events.staffLabel).toBe('منظم الفعالية');

      const general = getIndustryProfile('general');
      expect(general.staffLabel).toBe('فريق المكان');

      const cafe = getIndustryProfile('cafe');
      expect(cafe.staffLabel).toBe('موظف الكاونتر');
    });

    it('defaults gracefully to general for undefined or unknown business types', () => {
      const fallback = getIndustryProfile('unknown_custom_sector');
      expect(fallback.id).toBe('general');
      expect(fallback.staffLabel).toBe('فريق المكان');
    });

    it('ensures DEFAULT_BUSINESS_CONFIG is industry-agnostic', () => {
      expect(DEFAULT_BUSINESS_CONFIG.freeGift.title).not.toContain('كوكيز');
      expect(DEFAULT_BUSINESS_CONFIG.freeGift.title).toContain('هدية أو مكافأة');
    });
  });

  describe('Digital Wallet Pass Industry Generalization', () => {
    it('creates Apple Wallet pass without assuming coffee when giftTitle is empty', () => {
      const pass = DigitalWalletService.generateApplePassJson({
        cafeSlug: 'boutique-chic',
        cafeName: 'Boutique Chic',
        customerPhone: '0551234567',
        customerName: 'سارة أحمد',
        stampedCount: 2,
        maxSlots: 5,
      });

      const fields = pass.storeCard.primaryFields;
      expect(fields[0].value).toBe('هدية خاصة مجانية');
    });

    it('creates Google Wallet pass with general business label', () => {
      const pass = DigitalWalletService.generateGoogleWalletPass({
        cafeSlug: 'salon-viva',
        cafeName: 'Salon Viva',
        customerPhone: '0559876543',
        customerName: 'نورة علي',
        stampedCount: 3,
        maxSlots: 6,
      });

      const payload = (pass.payload as any).loyaltyObjects[0];
      const rows = payload.infoModuleData.labelValueRows[0].columns;
      expect(rows[0].label).toBe('المنشأة');
      expect(rows[0].value).toBe('Salon Viva');
    });
  });

  describe('Safari iOS Image Saving Engine', () => {
    const sampleDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    it('passes options.text or options.description to navigator.share', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      const mockCanShare = vi.fn().mockReturnValue(true);

      const origDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: mockShare,
          canShare: mockCanShare,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        },
        configurable: true,
        writable: true,
      });

      const result = await ImageSaveService.saveImage({
        dataUrl: sampleDataUrl,
        filename: 'loyalty-card.png',
        title: 'كارت الولاء',
        text: 'كارت ولائي في استوديو الذكريات',
      });

      expect(result.success).toBe(true);
      expect(result.method).toBe('share');
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'كارت الولاء',
          text: 'كارت ولائي في استوديو الذكريات',
        })
      );

      if (origDesc) {
        Object.defineProperty(globalThis, 'navigator', origDesc);
      }
    });

    it('CardCanvasExportService.shareCardImage invokes ImageSaveService.saveImage', async () => {
      const saveSpy = vi.spyOn(ImageSaveService, 'saveImage').mockResolvedValue({
        success: true,
        method: 'share',
      });

      const origDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: vi.fn(),
          canShare: vi.fn().mockReturnValue(true),
        },
        configurable: true,
        writable: true,
      });

      const success = await CardCanvasExportService.shareCardImage(sampleDataUrl, 'كارت الذكريات');
      expect(success).toBe(true);
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'كارت الذكريات',
          filename: 'memories-loyalty-card.png',
        })
      );

      saveSpy.mockRestore();
      if (origDesc) {
        Object.defineProperty(globalThis, 'navigator', origDesc);
      }
    });
  });
});
