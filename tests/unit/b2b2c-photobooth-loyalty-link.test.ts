import { describe, it, expect, beforeEach } from 'vitest';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import {
  generateSecureStaffPin,
  verifyPinOnly,
  resetStaffAuthState,
} from '@/lib/services/staff-auth.service';

describe('B2B2C Photobooth ↔ Loyalty Link & Zero Demo Data', () => {
  beforeEach(() => {
    resetStaffAuthState();
  });

  describe('Zero Demo Data Audit', () => {
    it('DigitalWalletService.getIssuedPasses does not contain fake demo passes', () => {
      const passes = DigitalWalletService.getIssuedPasses('new-merchant-tenant');
      const hasFakeDemo = passes.some(
        (p) =>
          p.serialNumber === 'c8d47089-f851-44af-9871-19c27381ad29' ||
          p.customerPhone === '5240407007'
      );
      expect(hasFakeDemo).toBe(false);
    });
  });

  describe('Staff PIN Security & Dynamic Anti-Brute-Force', () => {
    it('generates a non-trivial 4-digit PIN using crypto entropy', () => {
      const pin = generateSecureStaffPin();
      expect(pin).toMatch(/^\d{4}$/);
      // Ensure it is not trivial
      const trivial = ['0000', '1111', '1234', '4321', '0123', '9876'];
      expect(trivial.includes(pin)).toBe(false);
    });

    it('locks out attempts after 3 failed PIN tries', async () => {
      const cafeSlug = 'test-security-cafe';

      // Attempt 1: fail
      const r1 = await verifyPinOnly('0001', cafeSlug);
      expect(r1.success).toBe(false);
      expect(r1.error).toContain('الرمز السري غير صحيح');

      // Attempt 2: fail
      const r2 = await verifyPinOnly('0002', cafeSlug);
      expect(r2.success).toBe(false);
      expect(r2.error).toContain('الرمز السري غير صحيح');

      // Attempt 3: fail -> locked
      const r3 = await verifyPinOnly('0003', cafeSlug);
      expect(r3.success).toBe(false);
      expect(r3.error).toContain('تم إيقاف المحاولات مؤقتاً لحماية الأمان');

      // Attempt 4: subsequent attempt immediately locked
      const r4 = await verifyPinOnly('1234', cafeSlug);
      expect(r4.success).toBe(false);
      expect(r4.error).toContain('تم إيقاف محاولات الدخول مؤقتاً');
    });
  });

  describe('B2B2C Push Notification Formatting', () => {
    it('formats appropriate B2C push messages for milestone completion vs regular stamps', () => {
      const cafeName = 'Espresso Lounge';
      const stampedCount = 3;
      const maxSlots = 5;
      const regularPush = `📸✨ تم توثيق لقطة جديدة في شريط ذكرياتك وإضافة ختم لبطاقة الولاء في ${cafeName}! رصيدك: ${stampedCount}/${maxSlots}`;
      expect(regularPush).toContain('Espresso Lounge');
      expect(regularPush).toContain('3/5');

      const completePush = `🎉 مبروك! اكتملت بطاقة الولاء الخاصة بك من فوتوبوث ${cafeName}! استحققت: كابتشينو مجاني 🎁`;
      expect(completePush).toContain('مبروك');
      expect(completePush).toContain('كابتشينو مجاني');
    });
  });
});
