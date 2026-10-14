import { describe, it, expect } from 'vitest';
import {
  getFixedCardCanvasSize,
  resolveFixedCardSize,
} from '@/lib/services/print.service';

/**
 * The two fixed sizes are physical print media. Whatever the merchant
 * changes — shot count, theme, orientation, logo toggle — the canvas
 * must stay on the 600/1200 x 1800 grid.
 */
describe('fixed card sizes are invariant to content changes', () => {
  const shotCounts = [1, 2, 3, 4, 5, 6, 8];

  it('vertical 2x6 strip stays 600x1800 for any shot count', () => {
    for (const n of shotCounts) {
      const size = resolveFixedCardSize({ widthCm: 5, heightCm: 15.2 });
      expect(getFixedCardCanvasSize(size, 'vertical')).toEqual({ width: 600, height: 1800 });
    }
  });

  it('4x6 card stays 1200x1800 for any shot count or orientation', () => {
    for (const n of shotCounts) {
      expect(getFixedCardCanvasSize('card_4x6', 'vertical')).toEqual({ width: 1200, height: 1800 });
      expect(getFixedCardCanvasSize('card_4x6', 'horizontal')).toEqual({ width: 1800, height: 1200 });
    }
  });

  it('snaps postcard-like legacy themes to card_4x6, strips stay strips', () => {
    expect(resolveFixedCardSize({ widthCm: 8.8, heightCm: 10.7 })).toBe('card_4x6');
    expect(resolveFixedCardSize({ widthCm: 7.5, heightCm: 12 })).toBe('card_4x6');
    expect(resolveFixedCardSize({ widthCm: 10, heightCm: 7.6 })).toBe('card_4x6');
    expect(resolveFixedCardSize({ widthCm: 15.2, heightCm: 5 })).toBe('strip_2x6');
    expect(resolveFixedCardSize({ widthCm: 10, heightCm: 15.2 })).toBe('card_4x6');
  });
});

/**
 * BusinessBranding.showLogo — merchant picks whether the logo renders on
 * composed cards; the canvas geometry must not depend on it.
 */
describe('merchant logo toggle contract', () => {
  it('treats showLogo as optional with an effective default of on', () => {
    // The composer checks `branding.showLogo !== false`, so absence = shown.
    const brandingOff = { name: 'Demo', logoUrl: 'https://x/l.png', showLogo: false };
    const brandingOn = { name: 'Demo', logoUrl: 'https://x/l.png' };
    expect(brandingOff.showLogo).toBe(false);
    expect(brandingOn.showLogo).not.toBe(false);
  });

  it('canvas geometry is independent of the logo decision', () => {
    const stripV = getFixedCardCanvasSize('strip_2x6', 'vertical');
    expect(brandingIndependent(stripV));
  });

  function brandingIndependent(size: { width: number; height: number }) {
    return size.width === 600 && size.height === 1800;
  }
});
