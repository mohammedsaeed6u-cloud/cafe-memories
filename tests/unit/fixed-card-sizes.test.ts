import { describe, it, expect } from 'vitest';
import {
  resolveFixedCardSize,
  getFixedCardCanvasSize,
  getPrintDimensions,
} from '@/lib/services/print.service';

describe('resolveFixedCardSize — snaps everything to the two fixed sizes', () => {
  it('maps the classic 2x6 strip (either orientation) to strip_2x6', () => {
    expect(resolveFixedCardSize({ widthCm: 5, heightCm: 15.2 })).toBe('strip_2x6');
    expect(resolveFixedCardSize({ widthCm: 15.2, heightCm: 5 })).toBe('strip_2x6');
  });

  it('maps 4x6 and all postcard-like legacy sizes to card_4x6', () => {
    expect(resolveFixedCardSize({ widthCm: 10, heightCm: 15.2 })).toBe('card_4x6');
    expect(resolveFixedCardSize({ widthCm: 8.8, heightCm: 10.7 })).toBe('card_4x6');
    expect(resolveFixedCardSize({ widthCm: 7.5, heightCm: 12 })).toBe('card_4x6');
    expect(resolveFixedCardSize({ widthCm: 15.2, heightCm: 5.08 })).toBe('strip_2x6');
  });

  it('lets explicit presets win over dimensions', () => {
    expect(resolveFixedCardSize({ dimensionsPreset: 'grid_4x6', widthCm: 5, heightCm: 15.2 })).toBe('card_4x6');
    expect(resolveFixedCardSize({ dimensionsPreset: 'strip_2x6', widthCm: 8.8, heightCm: 10.7 })).toBe('strip_2x6');
  });

  it('defaults to the 2x6 strip when nothing is known', () => {
    expect(resolveFixedCardSize({})).toBe('strip_2x6');
  });
});

describe('getFixedCardCanvasSize — true 300 DPI geometry, both orientations', () => {
  it('returns the four physical combinations', () => {
    expect(getFixedCardCanvasSize('strip_2x6', 'vertical')).toEqual({ width: 600, height: 1800 });
    expect(getFixedCardCanvasSize('strip_2x6', 'horizontal')).toEqual({ width: 1800, height: 600 });
    expect(getFixedCardCanvasSize('card_4x6', 'vertical')).toEqual({ width: 1200, height: 1800 });
    expect(getFixedCardCanvasSize('card_4x6', 'horizontal')).toEqual({ width: 1800, height: 1200 });
  });

  it('never produces an unprintable rectangle (width or height off the 600/1200/1800 grid)', () => {
    for (const size of ['strip_2x6', 'card_4x6'] as const) {
      for (const o of ['vertical', 'horizontal'] as const) {
        const { width, height } = getFixedCardCanvasSize(size, o);
        expect([600, 1200, 1800]).toContain(width);
        expect([600, 1200, 1800]).toContain(height);
        expect(width * height).toBeGreaterThan(0);
      }
    }
  });

  it('stays consistent with the print authority (getPrintDimensions)', () => {
    const strip = getPrintDimensions('standard-2x6');
    expect(getFixedCardCanvasSize('strip_2x6', 'vertical')).toEqual({
      width: strip.widthPx300Dpi,
      height: strip.heightPx300Dpi,
    });
    const sheet = getPrintDimensions('dual-4x6');
    expect(getFixedCardCanvasSize('card_4x6', 'vertical')).toEqual({
      width: sheet.widthPx300Dpi,
      height: sheet.heightPx300Dpi,
    });
  });
});
