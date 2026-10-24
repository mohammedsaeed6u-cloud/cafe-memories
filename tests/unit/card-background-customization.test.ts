import { describe, it, expect } from 'vitest';
import {
  CURATED_CARD_PRESETS,
  CardImageService,
  CardBackgroundPreset,
} from '@/lib/services/card-image.service';
import { CustomerCustomizationData } from '@/features/customization/customer-themes';
import { WalletPassCustomizationConfig } from '@/types/photobooth';

describe('Card Background Customization Engine', () => {
  it('should provide 5 curated luxury presets with valid SVG data URIs', () => {
    expect(CURATED_CARD_PRESETS).toHaveLength(5);

    const ids = CURATED_CARD_PRESETS.map((p) => p.id);
    expect(ids).toContain('espresso_noir');
    expect(ids).toContain('artisan_oak');
    expect(ids).toContain('royal_linen');
    expect(ids).toContain('emerald_matcha');
    expect(ids).toContain('midnight_velvet');

    CURATED_CARD_PRESETS.forEach((preset) => {
      expect(preset.nameAr).toBeTruthy();
      expect(preset.backgroundUrl).toContain('data:image/svg+xml');
      expect(preset.thumbnailUrl).toContain('data:image/svg+xml');
      expect(preset.recommendedOverlayOpacity).toBeGreaterThanOrEqual(0.3);
      expect(preset.recommendedOverlayOpacity).toBeLessThanOrEqual(0.9);
      expect(preset.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should support customBackgroundUrl and overlayOpacity in CustomerCustomizationData', () => {
    const customerCustom: CustomerCustomizationData = {
      themeId: 'royal_ivory',
      customerName: 'سارة أحمد',
      badgeTitle: 'متذوق القهوة',
      stampEmoji: '☕',
      customBackgroundUrl: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASo...',
      backgroundPresetId: 'artisan_oak',
      overlayOpacity: 0.6,
    };

    expect(customerCustom.customBackgroundUrl).toBeTruthy();
    expect(customerCustom.backgroundPresetId).toBe('artisan_oak');
    expect(customerCustom.overlayOpacity).toBe(0.6);
  });

  it('should support cardBackgroundUrl and cardOverlayOpacity in WalletPassCustomizationConfig', () => {
    const merchantConfig: WalletPassCustomizationConfig = {
      colorPreset: 'dark',
      colorHex: '#1C1917',
      barcodeFormat: 'QR',
      sharingProhibited: true,
      cardBackgroundUrl: 'data:image/svg+xml;utf8,<svg></svg>',
      cardOverlayOpacity: 0.65,
      cardBackgroundPresetId: 'espresso_noir',
    };

    expect(merchantConfig.cardBackgroundUrl).toBeTruthy();
    expect(merchantConfig.cardOverlayOpacity).toBe(0.65);
    expect(merchantConfig.cardBackgroundPresetId).toBe('espresso_noir');
  });

  it('should handle offline image storage gracefully in test environment', async () => {
    const testKey = 'test_card_art_123';
    const testData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII=';

    await expect(CardImageService.saveCustomImage(testKey, testData)).resolves.not.toThrow();
  });
});
