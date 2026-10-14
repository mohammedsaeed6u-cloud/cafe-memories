import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { DigitalWalletService, DigitalWalletPassData } from '@/lib/services/digital-wallet.service';
import { VenueLocationConfig, WalletPassCustomizationConfig } from '@/types/photobooth';

describe('WalletWallet Full Services & Geofencing System', () => {
  const cafeSlug = 'test-venue-wallet-services';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('VenueLocationConfig Persistence & Geofencing', () => {
    it('returns default location configuration', () => {
      const settings = BusinessSettingsService.getSettings(cafeSlug);
      expect(settings.locationConfig).toBeDefined();
      expect(settings.locationConfig?.enabled).toBe(true);
      expect(settings.locationConfig?.latitude).toBeDefined();
      expect(settings.locationConfig?.longitude).toBeDefined();
      expect(settings.locationConfig?.relevantText).toContain('كارت الولاء جاهز للختم');
    });

    it('updates and persists venue GPS coordinates and lock-screen relevantText', () => {
      const loc: VenueLocationConfig = {
        enabled: true,
        latitude: 24.7136,
        longitude: 46.6753,
        altitude: 612,
        relevantText: 'أهلاً بك في فرع الرياض! كارتك جاهز للختم ☕✨',
      };

      const updated = BusinessSettingsService.updateLocationConfig(cafeSlug, loc);
      expect(updated.locationConfig?.latitude).toBe(24.7136);
      expect(updated.locationConfig?.longitude).toBe(46.6753);
      expect(updated.locationConfig?.altitude).toBe(612);
      expect(updated.locationConfig?.relevantText).toBe('أهلاً بك في فرع الرياض! كارتك جاهز للختم ☕✨');

      // Re-fetch to ensure persistence
      const fetched = BusinessSettingsService.getSettings(cafeSlug);
      expect(fetched.locationConfig?.latitude).toBe(24.7136);
      expect(fetched.locationConfig?.longitude).toBe(46.6753);
    });

    it('persists wallet pass customization config (barcode format, color preset)', () => {
      const config: WalletPassCustomizationConfig = {
        colorPreset: 'orange',
        colorHex: '#8B4513',
        barcodeFormat: 'Aztec',
        sharingProhibited: true,
      };

      const updated = BusinessSettingsService.updateWalletPassConfig(cafeSlug, config);
      expect(updated.walletPassConfig?.colorPreset).toBe('orange');
      expect(updated.walletPassConfig?.colorHex).toBe('#8B4513');
      expect(updated.walletPassConfig?.barcodeFormat).toBe('Aztec');

      const fetched = BusinessSettingsService.getSettings(cafeSlug);
      expect(fetched.walletPassConfig?.barcodeFormat).toBe('Aztec');
    });
  });

  describe('Pass Generation with Locations (~100m Lock Screen)', () => {
    it('embeds locations array into local Apple PassKit pass.json for lock-screen relevance', () => {
      const passData: DigitalWalletPassData = {
        cafeSlug,
        cafeName: 'استوديو الذكريات',
        customerPhone: '0555555555',
        stampedCount: 2,
        maxSlots: 5,
        locations: [
          {
            latitude: 30.0444,
            longitude: 31.2357,
            altitude: 0,
            relevantText: 'أهلاً بك في مقهى الذكريات! كارت الولاء جاهز للختم ☕',
          },
        ],
      };

      const appleJson = DigitalWalletService.generateApplePassJson(passData);
      expect((appleJson as any).locations).toBeDefined();
      expect((appleJson as any).locations).toHaveLength(1);
      expect((appleJson as any).locations[0].latitude).toBe(30.0444);
      expect((appleJson as any).locations[0].longitude).toBe(31.2357);
      expect((appleJson as any).locations[0].relevantText).toBe(
        'أهلاً بك في مقهى الذكريات! كارت الولاء جاهز للختم ☕'
      );
    });

    it('sends locations and custom barcode format in issueSignedPass payload', async () => {
      const fakeFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          serialNumber: 'ww-signed-12345',
          googleSaveUrl: 'https://pay.google.com/gp/v/save/test',
          applePass: 'dGVzdA==',
          shareUrl: 'https://api.walletwallet.dev/p/ww-signed-12345',
        }),
      });
      global.fetch = fakeFetch;

      const passData: DigitalWalletPassData = {
        cafeSlug,
        cafeName: 'استوديو الذكريات',
        customerPhone: '0501234567',
        stampedCount: 3,
        maxSlots: 5,
        barcodeFormat: 'Aztec',
        colorPreset: 'orange',
        locations: [
          {
            latitude: 24.7136,
            longitude: 46.6753,
            relevantText: 'مرحباً بك! امسح كارتك الآن',
          },
        ],
      };

      const result = await DigitalWalletService.issueSignedPass(passData);
      expect(result.serialNumber).toBe('ww-signed-12345');
      expect(fakeFetch).toHaveBeenCalledTimes(1);

      const requestBody = JSON.parse(fakeFetch.mock.calls[0][1].body);
      expect(requestBody.barcodeFormat).toBe('Aztec');
      expect(requestBody.locations).toBeDefined();
      expect(requestBody.locations[0].latitude).toBe(24.7136);
      expect(requestBody.locations[0].relevantText).toBe('مرحباً بك! امسح كارتك الآن');
    });
  });

  describe('WalletWallet Management Services (CRUD & Usage)', () => {
    it('lists passes via listPasses API', async () => {
      const fakeFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          passes: [
            {
              serialNumber: 'p1',
              title: 'Test Pass',
              appleDevices: 1,
              googleSaves: 0,
            },
          ],
          total: 1,
          limit: 10,
          offset: 0,
        }),
      });
      global.fetch = fakeFetch;

      const res = await DigitalWalletService.listPasses({ limit: 10 });
      expect(res.passes).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.passes[0].serialNumber).toBe('p1');
    });

    it('retrieves pass body via getPassBody API', async () => {
      const fakeFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          body: {
            organizationName: 'Memories Studio',
            barcodeValue: 'https://memories-c9w.pages.dev/c/memories',
            locations: [{ latitude: 30.0444, longitude: 31.2357 }],
          },
        }),
      });
      global.fetch = fakeFetch;

      const res = await DigitalWalletService.getPassBody('p1');
      expect(res.body.organizationName).toBe('Memories Studio');
      expect(res.body.locations).toHaveLength(1);
    });

    it('updates pass via updatePass API, cleaning server-owned fields', async () => {
      const fakeFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          serialNumber: 'p1',
          lastUpdated: Date.now(),
          notifiedDevices: 2,
          unchanged: false,
        }),
      });
      global.fetch = fakeFetch;

      const res = await DigitalWalletService.updatePass('p1', {
        serialNumber: 'p1',
        authenticationToken: 'token-xyz',
        logoText: 'Updated Name',
      });

      expect(res.notifiedDevices).toBe(2);
      const sentPayload = JSON.parse(fakeFetch.mock.calls[0][1].body);
      expect(sentPayload.serialNumber).toBeUndefined();
      expect(sentPayload.authenticationToken).toBeUndefined();
      expect(sentPayload.logoText).toBe('Updated Name');
    });

    it('revokes pass via revokePass API', async () => {
      const fakeFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          serialNumber: 'p1',
          deleted: true,
          googleRevoked: true,
          notifiedDevices: 1,
          lastUpdated: Date.now(),
        }),
      });
      global.fetch = fakeFetch;

      const res = await DigitalWalletService.revokePass('p1');
      expect(res.deleted).toBe(true);
      expect(res.googleRevoked).toBe(true);
      expect(fakeFetch.mock.calls[0][1].method).toBe('DELETE');
    });

    it('retrieves account quota and usage via getUsage', async () => {
      const sseText =
        'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"{\\"count\\":15,\\"limit\\":1000,\\"remaining\\":985,\\"resetDate\\":\\"2026-10-01\\",\\"plan\\":\\"trial\\"}"}]}}\n\n';
      const fakeFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => sseText,
      });
      global.fetch = fakeFetch;

      const usage = await DigitalWalletService.getUsage();
      expect(usage.count).toBe(15);
      expect(usage.limit).toBe(1000);
      expect(usage.remaining).toBe(985);
      expect(usage.plan).toBe('trial');
    });
  });
});
