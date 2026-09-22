import { describe, it, expect } from 'vitest';
import {
  DigitalWalletService,
  createZipArchive,
  type DigitalWalletPassData,
} from '@/lib/services/digital-wallet.service';

describe('DigitalWalletService — Apple Wallet (.pkpass) & Google Wallet', () => {
  const sampleData: DigitalWalletPassData = {
    cafeSlug: 'espresso-lab',
    cafeName: 'Espresso Lab Roastery',
    customerPhone: '01012345678',
    customerName: 'أحمد محمود',
    stampedCount: 4,
    maxSlots: 5,
    giftTitle: 'كوب فلات وايت مجاني',
    instagramHandle: '@espressolab.om',
  };

  describe('Pure JS PKZip Generation', () => {
    it('creates a binary buffer with valid PKZip signature 0x04034b50', () => {
      const encoder = new TextEncoder();
      const files = [
        { name: 'test.txt', data: encoder.encode('Hello World') },
      ];
      const zipBytes = createZipArchive(files);
      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(50);

      const view = new DataView(zipBytes.buffer);
      // Local header signature
      expect(view.getUint32(0, true)).toBe(0x04034b50);
    });
  });

  describe('Apple Wallet Pass Generation (.pkpass)', () => {
    it('generates a compliant Apple PassKit storeCard structure', () => {
      const pass = DigitalWalletService.generateApplePassJson(sampleData) as any;

      expect(pass.formatVersion).toBe(1);
      expect(pass.passTypeIdentifier).toBe('pass.com.memories.loyalty');
      expect(pass.organizationName).toBe('Espresso Lab Roastery');
      expect(pass.storeCard).toBeDefined();

      // Barcode validation
      expect(pass.barcode.format).toBe('PKBarcodeFormatQR');
      expect(pass.barcode.message).toContain('espresso-lab');
      expect(pass.barcode.message).toContain('01012345678');

      // Primary fields (stamps and rewards)
      expect(pass.storeCard.headerFields[0].value).toBe('4 / 5');
      expect(pass.storeCard.primaryFields[0].value).toBe('كوب فلات وايت مجاني');

      // Back fields (Instagram and retention links)
      const igField = pass.storeCard.backFields.find((f: any) => f.key === 'instagram');
      expect(igField.value).toBe('@espressolab.om');
    });

    it('creates an Apple Pass Blob with application/vnd.apple.pkpass MIME type', () => {
      const blob = DigitalWalletService.createApplePassBlob(sampleData);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/vnd.apple.pkpass');
      expect(blob.size).toBeGreaterThan(100);
    });
  });

  describe('Google Wallet Pass Generation', () => {
    it('generates a compliant Google Wallet Passes payload', () => {
      const googlePass = DigitalWalletService.generateGoogleWalletPass(sampleData) as any;

      expect(googlePass.typ).toBe('savetowallet');
      expect(googlePass.payload.loyaltyObjects).toHaveLength(1);

      const loyaltyObj = googlePass.payload.loyaltyObjects[0];
      expect(loyaltyObj.classId).toContain('espresso-lab');
      expect(loyaltyObj.loyaltyPoints.balance.string).toBe('4 / 5');
      expect(loyaltyObj.secondaryLoyaltyPoints.balance.string).toBe('كوب فلات وايت مجاني');
      expect(loyaltyObj.barcode.type).toBe('QR_CODE');
    });

    it('constructs a valid Save to Google Wallet deep-link URL', () => {
      const url = DigitalWalletService.generateGoogleWalletSaveUrl(sampleData);
      expect(url).toContain('https://pay.google.com/gp/v/save');
      expect(url).toContain('stamps=4');
      expect(url).toContain('Espresso%20Lab%20Roastery');
    });
  });
});
