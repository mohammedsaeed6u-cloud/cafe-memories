import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { CURATED_CARD_PRESETS, CardImageService } from '@/lib/services/card-image.service';
import { BusinessSettings } from '@/types/photobooth';
import { CustomerCustomizationData } from '@/features/customization/customer-themes';

describe('E2E Merchant & Customer Card Customization Flow', () => {
  const cafeSlug = 'stampy_e2e_test';

  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        serialNumber: 'ww-e2e-pass-999',
        googleSaveUrl: 'https://pay.google.com/gp/v/save/test-e2e',
        applePass: 'dGVzdA==',
        shareUrl: 'https://api.walletwallet.dev/p/ww-e2e-pass-999',
      }),
    });
  });

  it('Step 1-5: Merchant configures custom background texture and opacity in Dashboard', () => {
    // 1. Merchant fetches initial settings
    const initialSettings = BusinessSettingsService.getSettings(cafeSlug);
    expect(initialSettings).toBeDefined();

    // 2. Merchant picks a luxury preset (Artisan Oak)
    const selectedPreset = CURATED_CARD_PRESETS.find((p) => p.id === 'artisan_oak');
    expect(selectedPreset).toBeDefined();

    // 3. Merchant updates walletPassConfig with custom background & opacity
    const updatedSettings: BusinessSettings = {
      ...initialSettings,
      walletPassConfig: {
        ...initialSettings.walletPassConfig,
        colorPreset: 'dark',
        barcodeFormat: 'QR',
        sharingProhibited: true,
        cardBackgroundUrl: selectedPreset!.backgroundUrl,
        cardBackgroundPresetId: selectedPreset!.id,
        cardOverlayOpacity: 0.62,
      },
    };

    BusinessSettingsService.saveSettings(updatedSettings);

    // 4. Verify settings persistence
    const saved = BusinessSettingsService.getSettings(cafeSlug);
    expect(saved.walletPassConfig?.cardBackgroundUrl).toBe(selectedPreset!.backgroundUrl);
    expect(saved.walletPassConfig?.cardOverlayOpacity).toBe(0.62);
    expect(saved.walletPassConfig?.cardBackgroundPresetId).toBe('artisan_oak');
  });

  it('Step 6-7: End-customer loads card and inherits store luxury background', () => {
    const merchantSettings = BusinessSettingsService.getSettings(cafeSlug);

    // Initial customer customization has no override
    const customerCustomization: CustomerCustomizationData = {
      themeId: 'royal_ivory',
      customerName: 'ضيف مميز',
      badgeTitle: 'عضو مميز',
      stampEmoji: '☕',
    };

    // Effective background resolution logic
    const effectiveBgUrl =
      customerCustomization.customBackgroundUrl || merchantSettings.walletPassConfig?.cardBackgroundUrl;
    const effectiveOpacity =
      customerCustomization.overlayOpacity ?? merchantSettings.walletPassConfig?.cardOverlayOpacity ?? 0.65;

    expect(effectiveBgUrl).toBe(merchantSettings.walletPassConfig?.cardBackgroundUrl);
    expect(effectiveOpacity).toBe(0.62);
  });

  it('Step 8-10: End-customer customizes card with personal photo and issues signed pass', async () => {
    const merchantSettings = BusinessSettingsService.getSettings(cafeSlug);

    // Customer personal photo (compressed data URI)
    const customerPhotoDataUri = 'data:image/svg+xml;utf8,<svg id="personal-photo"></svg>';

    const customerCustomization: CustomerCustomizationData = {
      themeId: 'warm_latte',
      customerName: 'عمر القحطاني',
      badgeTitle: 'ضيف VIP مميز',
      stampEmoji: '⭐',
      customBackgroundUrl: customerPhotoDataUri,
      overlayOpacity: 0.55,
    };

    // Effective background now prioritizes customer's personal photo
    const effectiveBgUrl =
      customerCustomization.customBackgroundUrl || merchantSettings.walletPassConfig?.cardBackgroundUrl;
    const effectiveOpacity =
      customerCustomization.overlayOpacity ?? merchantSettings.walletPassConfig?.cardOverlayOpacity ?? 0.65;

    expect(effectiveBgUrl).toBe(customerPhotoDataUri);
    expect(effectiveOpacity).toBe(0.55);

    // Issue signed pass payload
    const passPayload = {
      cafeSlug,
      cafeName: merchantSettings.branding?.name || 'مقهى ولاء',
      customerPhone: '0501234567',
      customerName: customerCustomization.customerName,
      customerTitle: customerCustomization.badgeTitle,
      backgroundUrl: effectiveBgUrl,
      stampIcon: customerCustomization.stampEmoji,
      stampedCount: 3,
      maxSlots: 5,
      giftTitle: 'كوب قهوة مجاني',
    };

    const passResult = await DigitalWalletService.issueSignedPass(passPayload);
    expect(passResult).toBeDefined();
    expect(passResult.serialNumber).toBeTruthy();
    expect(passResult.pkpassUrl).toBeTruthy();
    expect(passResult.shareUrl).toBeTruthy();
  });
});
