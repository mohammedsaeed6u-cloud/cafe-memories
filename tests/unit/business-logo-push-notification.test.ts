import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { buildWalletWalletRequest } from '@/lib/services/wallet-pass.service';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';

const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
  key: (i: number) => Object.keys(storage)[i] ?? null,
  length: 0,
};

if (typeof global.localStorage === 'undefined') {
  (global as any).localStorage = mockLocalStorage;
}
(global as any).window = {
  dispatchEvent: vi.fn(),
  localStorage: mockLocalStorage,
};

describe('Business Logo & Lock-Screen Push Notifications', () => {
  const logoUrl = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400';
  const brandName = 'محمصة وقهوة النخبة';

  beforeEach(() => {
    vi.restoreAllMocks();
    (global as any).localStorage.clear();
  });

  describe('buildWalletWalletRequest with Business Logo', () => {
    it('sets both logoURL and iconURL to the business logo for Apple Wallet APNs lock-screen notifications', () => {
      const requestBody = buildWalletWalletRequest({
        cafeSlug: 'slug-req-test',
        cafeName: brandName,
        customerPhone: '0501234567',
        stampedCount: 4,
        maxSlots: 6,
        logoUrl,
        color: '#231C18',
      });

      expect(requestBody.logoText).toBe(brandName);
      expect(requestBody.organizationName).toBe(brandName);
      expect(requestBody.logoURL).toBe(logoUrl);
      expect(requestBody.iconURL).toBe(logoUrl); // Required for iOS lock screen notification icon!
      expect(requestBody.color).toBe('#231C18');
    });
  });

  describe('updateCustomerCardComprehensive with Business Logo & Identity', () => {
    it('sends updated body containing business logo and organization name to WalletWallet API', async () => {
      const cafeSlug = 'slug-update-test';

      // Mock issued pass
      DigitalWalletService.recordIssuedPass({
        serialNumber: 'pass-logo-test-001',
        cafeSlug,
        cafeName: brandName,
        customerPhone: '0501234567',
        customerName: 'سارة خالد',
        issuedAt: new Date().toISOString(),
      });

      // Save venue settings with logo
      BusinessSettingsService.saveSettings({
        cafeSlug,
        branding: {
          name: brandName,
          logoUrl,
          primaryColor: '#231C18',
        },
      });

      // Mock fetch GET body and PUT update
      const initialBody = {
        headerFields: [{ label: 'الأختام', value: '1/5' }],
        primaryFields: [{ label: 'المكافأة القادمة', value: 'كوب مجاني' }],
        secondaryFields: [{ label: 'العميل', value: 'سارة خالد' }],
        backFields: [],
      };

      let putPayload: any = null;
      global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/body')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ body: initialBody }),
          } as Response);
        }
        if (init?.method === 'PUT') {
          putPayload = JSON.parse(init.body as string);
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, notifiedDevices: 1 }),
          } as Response);
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
      });

      // Set mock API key
      vi.spyOn(DigitalWalletService as any, 'getWalletWalletApiKey').mockReturnValue('mock-api-key');

      const result = await DigitalWalletService.updateCustomerCardComprehensive({
        cafeSlug,
        customerPhone: '0501234567',
        customerName: 'سارة خالد',
        stampedCount: 4,
        maxSlots: 5,
        giftTitle: 'مشروب مجاني مميز',
        colorHex: '#B45309',
        stampIcon: '⭐',
        pushMessage: '⭐ تم ختم زيارتك الرابعة بنجاح!',
        logoUrl,
        cafeName: brandName,
      });

      expect(result.success).toBe(true);
      expect(result.notifiedDevices).toBe(1);
      expect(putPayload).toBeDefined();
      expect(putPayload.logoURL).toBe(logoUrl);
      expect(putPayload.iconURL).toBe(logoUrl);
      expect(putPayload.logoText).toBe(brandName);
      expect(putPayload.organizationName).toBe(brandName);
      expect(putPayload.backgroundColor).toBe('#B45309');
    });
  });

  describe('broadcastBulkCardUpdate with Business Branding', () => {
    it('preserves individual customer visits while pushing business logo and broadcast message', async () => {
      const cafeSlug = 'slug-broadcast-test';

      // 1. Register customer in registry
      CustomerRegistryService.registerCustomer('0509998877', 'فيصل العتيبي', 'vip', cafeSlug);
      CustomerRegistryService.updateCustomerRecord('0509998877', { totalVisits: 3 }, cafeSlug);

      // 2. Issue pass
      DigitalWalletService.recordIssuedPass({
        serialNumber: 'pass-broadcast-001',
        cafeSlug,
        cafeName: brandName,
        customerPhone: '0509998877',
        customerName: 'فيصل العتيبي',
        issuedAt: new Date().toISOString(),
      });

      const spyUpdate = vi.spyOn(DigitalWalletService, 'updateCustomerCardComprehensive')
        .mockResolvedValue({
          success: true,
          notifiedDevices: 1,
          message: 'OK',
          serialNumber: 'pass-broadcast-001',
        });

      const bulkResult = await DigitalWalletService.broadcastBulkCardUpdate({
        cafeSlug,
        pushMessage: '🎉 عرض نهاية الأسبوع الخاص!',
        colorHex: '#064E3B',
        logoUrl,
        cafeName: brandName,
      });

      expect(bulkResult.sentCount).toBeGreaterThanOrEqual(1);
      expect(bulkResult.notifiedDevices).toBeGreaterThanOrEqual(1);
      expect(spyUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          cafeSlug,
          customerPhone: '0509998877',
          stampedCount: 3, // Preserves the customer's 3 visits!
          pushMessage: '🎉 عرض نهاية الأسبوع الخاص!',
          colorHex: '#064E3B',
          logoUrl,
          cafeName: brandName,
        })
      );
    });
  });
});
