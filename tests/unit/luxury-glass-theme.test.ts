import { describe, it, expect } from 'vitest';
import { PHOTOBOOTH_CARD_MODES, PRESET_COLOR_PALETTES, DEFAULT_PHOTOBOOTH_FRAMES } from '../../src/lib/constants/photobooth-presets';
import { LOYALTY_CARD_PRESETS } from '../../src/lib/constants/loyalty-card-presets';

describe('Luxury Glass Crimson & Alabaster Theme Suite', () => {
  it('registers luxury_glass in PHOTOBOOTH_CARD_MODES with exact hex palette', () => {
    const mode = PHOTOBOOTH_CARD_MODES.find((m) => m.id === 'luxury_glass');
    expect(mode).toBeDefined();
    expect(mode?.defaultAccent).toBe('#DD0200'); // Racing Red
    expect(mode?.defaultText).toBe('#D9D9D9');   // Alabaster Grey
    expect(mode?.defaultBg).toBe('#08080B');     // Coffee Bean / Deep Obsidian
  });

  it('includes luxury-glass-cherry in PRESET_COLOR_PALETTES', () => {
    const palette = PRESET_COLOR_PALETTES.find((p) => p.id === 'luxury-glass-cherry');
    expect(palette).toBeDefined();
    expect(palette?.accentColor).toBe('#DD0200');
    expect(palette?.textColor).toBe('#D9D9D9');
  });

  it('includes luxury-glass-cherry in DEFAULT_PHOTOBOOTH_FRAMES', () => {
    const frame = DEFAULT_PHOTOBOOTH_FRAMES.find((f) => f.id === 'luxury-glass-cherry');
    expect(frame).toBeDefined();
    expect(frame?.cardMode).toBe('luxury_glass');
  });

  it('provides luxury_glass_crimson in LOYALTY_CARD_PRESETS with glass styling', () => {
    const preset = LOYALTY_CARD_PRESETS['luxury_glass_crimson'];
    expect(preset).toBeDefined();
    expect(preset.theme.accentColor).toBe('#DD0200');
    expect(preset.theme.textColor).toBe('#D9D9D9');
    expect(preset.theme.background).toContain('rgba(221, 2, 0');
    expect(preset.theme.background).toContain('rgba(217, 217, 217');
  });
});
