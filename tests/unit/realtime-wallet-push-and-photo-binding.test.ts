// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoyaltyPurseService } from '@/features/loyalty/loyalty-purse.service';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { extractStampSlots } from '@/lib/services/stamp-slots';
import { mapLocalPhotosToSlots } from '@/lib/services/loyalty-stamps';
import { readFileSync } from 'fs';
import path from 'path';

describe('Real-Time Wallet Push & Photo-Bound Loyalty System', () => {
  const cafeSlug = 'test-roastery';
  const customerPhone = '0501234567';

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('1. Real-Time APNs Push on Stamp Update', () => {
    it('automatically triggers DigitalWalletService.syncPassToWallet when addDirectStamp is called', () => {
      const syncSpy = vi.spyOn(DigitalWalletService, 'syncPassToWallet').mockResolvedValue({
        success: true,
        updated: true,
        serialNumber: 'ww-test-123',
        notifiedDevices: 1,
      });

      const result = LoyaltyPurseService.addDirectStamp(
        customerPhone,
        cafeSlug,
        5,
        'كوب قهوة V60 إثيوبي مجاناً'
      );

      expect(result.success).toBe(true);
      expect(result.newCount).toBe(2);
      expect(syncSpy).toHaveBeenCalledTimes(1);
      expect(syncSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          cafeSlug,
          customerPhone,
          stampedCount: 2,
          maxSlots: 5,
          giftTitle: 'كوب قهوة V60 إثيوبي مجاناً',
        })
      );
    });

    it('offline sync queue captures failed updates and flushes on network restore', async () => {
      const job = {
        cafeSlug,
        customerPhone,
        stampedCount: 3,
        maxSlots: 5,
        giftTitle: 'كوكيز طازج',
      };

      DigitalWalletService.enqueueOfflineWalletSync(job);

      const raw = localStorage.getItem('stampy_pending_wallet_syncs');
      expect(raw).toBeTruthy();
      const queue = JSON.parse(raw!);
      expect(queue).toHaveLength(1);
      expect(queue[0].stampedCount).toBe(3);

      const syncSpy = vi.spyOn(DigitalWalletService, 'syncPassToWallet').mockResolvedValue({
        success: true,
        updated: true,
        serialNumber: 'ww-test-123',
      });

      await DigitalWalletService.flushOfflineWalletSyncQueue();
      expect(syncSpy).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('stampy_pending_wallet_syncs')).toBeNull();
    });

    it('builds lockscreen alert changeMessages with stamp progress and gift alert', async () => {
      const passInfo = {
        serialNumber: 'pass-test-999',
        cafeSlug,
        cafeName: 'محمصة ستامبي',
        customerPhone,
        customerName: 'سارة خالد',
        issuedAt: new Date().toISOString(),
      };
      DigitalWalletService.recordIssuedPass(passInfo);

      const fakePassBody = {
        serialNumber: 'pass-test-999',
        headerFields: [{ label: 'الأختام', value: '1/5' }],
        primaryFields: [{ label: 'المكافأة القادمة', value: 'هدية ترحيبية' }],
        secondaryFields: [{ label: 'العميل', value: 'سارة خالد' }],
        backFields: [],
      };

      let putBodySent: any = null;

      global.fetch = vi.fn().mockImplementation(async (url: string, opts?: any) => {
        if (url.includes('/body')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ body: fakePassBody }),
          };
        }
        if (opts?.method === 'PUT') {
          putBodySent = JSON.parse(opts.body);
          return {
            ok: true,
            status: 200,
            json: async () => ({ notifiedDevices: 2 }),
          };
        }
        return { ok: true, status: 200, json: async () => ({}) };
      });

      const syncRes = await DigitalWalletService.syncPassToWallet({
        cafeSlug,
        customerPhone,
        stampedCount: 4,
        maxSlots: 5,
        giftTitle: 'كوب فلات وايت مجاناً',
        customerName: 'سارة خالد',
      });

      expect(syncRes.success).toBe(true);
      expect(syncRes.updated).toBe(true);
      expect(putBodySent).toBeDefined();

      const stampHeader = putBodySent.headerFields.find((f: any) => f.label === 'الأختام');
      expect(stampHeader.value).toBe('4/5');
      expect(stampHeader.changeMessage).toContain('تم ختم زيارتك بنجاح');

      const completeRes = await DigitalWalletService.syncPassToWallet({
        cafeSlug,
        customerPhone,
        stampedCount: 5,
        maxSlots: 5,
        giftTitle: 'كوب فلات وايت مجاناً',
      });

      expect(completeRes.success).toBe(true);
      const completeHeader = putBodySent.headerFields.find((f: any) => f.label === 'الأختام');
      expect(completeHeader.value).toBe('5/5');
      expect(completeHeader.changeMessage).toContain('مبروك! اكملت بطاقة الولاء واستحققت هديتك');
    });
  });

  describe('2. Photo-Bound Loyalty Stamps Logic', () => {
    it('binds photos directly to stamp slots in sequence', () => {
      const samplePhotos = [
        'data:image/jpeg;base64,samplephoto1',
        'data:image/jpeg;base64,samplephoto2',
        'data:image/jpeg;base64,samplephoto3',
      ];

      const slots = mapLocalPhotosToSlots(samplePhotos, 5);
      expect(slots).toHaveLength(3);
      expect(slots[0].thumbnailUrl).toBe(samplePhotos[0]);
      expect(slots[1].thumbnailUrl).toBe(samplePhotos[1]);
      expect(slots[2].thumbnailUrl).toBe(samplePhotos[2]);

      const extracted = extractStampSlots(
        samplePhotos.map((url) => ({ thumbnailUrl: url, takenAt: new Date().toISOString() })),
        5
      );
      expect(extracted).toHaveLength(3);
      expect(extracted[0].thumbnailUrl).toBe(samplePhotos[0]);
    });
  });

  describe('3. Pure Cloud SaaS Compliance (Zero Device / Hardware Sales)', () => {
    const ROOT = path.resolve(__dirname, '../..');
    const readSrc = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

    it('marketing header contains login and signup links and zero hardware sales claims', () => {
      const headerCode = readSrc('src/features/marketing/components/MarketingHeader.tsx');
      expect(headerCode).toContain('/login?tab=signin');
      expect(headerCode).toContain('/login?tab=signup');
      expect(headerCode).toContain('تسجيل الدخول');
      expect(headerCode).toContain('إنشاء حساب مجاناً');
      expect(headerCode).not.toContain('استلم جهازك');
    });

    it('contact section invites free trial onboarding instead of device trial visits', () => {
      const contactCode = readSrc('src/features/marketing/components/StampyContactSection.tsx');
      expect(contactCode).not.toContain('جهاز تجريبي');
      expect(contactCode).not.toContain('طلب تركيب الجهاز');
      expect(contactCode).toContain('بدء التجربة المجانية');
    });

    it('marketing hero has direct SaaS start CTA buttons', () => {
      const heroCode = readSrc('src/features/marketing/components/MarketingHero.tsx');
      expect(heroCode).toContain('/login?tab=signup');
      expect(heroCode).toContain('/login?tab=signin');
      expect(heroCode).toContain('تفعيل فوري سحابي');
    });
  });
});
