import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { BusinessStampConfig } from '@/types/photobooth';

describe('Custom Stamp Engine & Wallet Push Notifications', () => {
  const cafeSlug = 'test-venue-stamp';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('BusinessStampConfig & Persistence', () => {
    it('returns default stamp configuration when none is saved', () => {
      const settings = BusinessSettingsService.getSettings(cafeSlug);
      expect(settings.stampConfig).toBeDefined();
      expect(settings.stampConfig?.shape).toBe('circle');
    });

    it('updates and persists custom stamp configuration for a venue (logo cutout, text, emoji)', () => {
      const customStamp: BusinessStampConfig = {
        type: 'logo',
        logoUrl: 'https://example.com/cafe-logo.png',
        knockoutLogo: true,
        inkColor: '#C89D7C',
        shape: 'vintage_seal',
      };

      const updated = BusinessSettingsService.updateStampConfig(cafeSlug, customStamp);
      expect(updated.stampConfig?.type).toBe('logo');
      expect(updated.stampConfig?.logoUrl).toBe('https://example.com/cafe-logo.png');
      expect(updated.stampConfig?.knockoutLogo).toBe(true);
      expect(updated.stampConfig?.inkColor).toBe('#C89D7C');

      // Re-fetch to ensure persistence
      const fetched = BusinessSettingsService.getSettings(cafeSlug);
      expect(fetched.stampConfig?.type).toBe('logo');
      expect(fetched.stampConfig?.logoUrl).toBe('https://example.com/cafe-logo.png');
    });

    it('supports custom emoji stamp for the project', () => {
      const emojiStamp: BusinessStampConfig = {
        type: 'emoji',
        customEmoji: '☕',
        inkColor: '#231C18',
        shape: 'circle',
      };

      const updated = BusinessSettingsService.updateStampConfig(cafeSlug, emojiStamp);
      expect(updated.stampConfig?.type).toBe('emoji');
      expect(updated.stampConfig?.customEmoji).toBe('☕');
    });
  });

  describe('DigitalWalletService Push Notifications', () => {
    it('records and retrieves issued passes for merchant broadcast', () => {
      DigitalWalletService.recordIssuedPass({
        serialNumber: 'test-serial-123',
        cafeSlug: 'test-cafe',
        cafeName: 'Test Cafe',
        customerName: 'سارة',
        customerPhone: '0100000000',
        issuedAt: new Date().toISOString(),
      });

      const passes = DigitalWalletService.getIssuedPasses('test-cafe');
      expect(passes.some((p) => p.serialNumber === 'test-serial-123')).toBe(true);
    });

    it('sends pass notification by calling WalletWallet API with changeMessage anchor', async () => {
      const fakeFetch = vi.fn();

      // Mock GET pass body
      fakeFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          serialNumber: 'test-serial-123',
          body: {
            backFields: [{ label: 'حساب الإنستجرام', value: '@test' }],
          },
        }),
      });

      // Mock PUT pass update
      fakeFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          serialNumber: 'test-serial-123',
          lastUpdated: Date.now(),
          notifiedDevices: 1,
          unchanged: false,
        }),
      });

      global.fetch = fakeFetch;

      const result = await DigitalWalletService.sendPassNotification(
        'test-serial-123',
        'قهوتك اليوم مجانية بمناسبة عطلة الأسبوع! ☕✨'
      );

      expect(result.success).toBe(true);
      expect(result.notifiedDevices).toBe(1);
      expect(fakeFetch).toHaveBeenCalledTimes(2);

      // Verify PUT body contained the notification with changeMessage
      const putCall = fakeFetch.mock.calls[1];
      expect(putCall[1].method).toBe('PUT');
      const sentBody = JSON.parse(putCall[1].body);
      const notifField = sentBody.backFields.find((f: any) => f.label === 'إشعارات المنشأة');
      expect(notifField).toBeDefined();
      expect(notifField.value).toBe('قهوتك اليوم مجانية بمناسبة عطلة الأسبوع! ☕✨');
      expect(notifField.changeMessage).toBe('%@');
    });

    it('broadcasts venue notification to all issued passes for a cafe', async () => {
      const fakeFetch = vi.fn();

      fakeFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          serialNumber: 'bcast-pass-1',
          body: { backFields: [] },
          notifiedDevices: 2,
        }),
      });

      global.fetch = fakeFetch;

      DigitalWalletService.recordIssuedPass({
        serialNumber: 'bcast-pass-1',
        cafeSlug: 'bcast-venue',
        cafeName: 'Bcast Venue',
        customerName: 'أحمد',
        customerPhone: '0111111111',
        issuedAt: new Date().toISOString(),
      });

      const bcastResult = await DigitalWalletService.broadcastVenueNotification(
        'عرض حصري للمشتركين!',
        'bcast-venue'
      );

      expect(bcastResult.sentCount).toBeGreaterThanOrEqual(1);
      expect(bcastResult.notifiedDevices).toBeGreaterThanOrEqual(2);
    });

    it('supports custom emoji stamp configuration for projects', () => {
      const emojiStamp: BusinessStampConfig = {
        type: 'emoji',
        customEmoji: '🌸',
        inkColor: '#8B2635',
        shape: 'vintage_seal',
      };

      const updated = BusinessSettingsService.updateStampConfig('bcast-venue', emojiStamp);
      expect(updated.stampConfig?.type).toBe('emoji');
      expect(updated.stampConfig?.customEmoji).toBe('🌸');
      expect(updated.stampConfig?.inkColor).toBe('#8B2635');
      expect(updated.stampConfig?.shape).toBe('vintage_seal');
    });
  });
});
