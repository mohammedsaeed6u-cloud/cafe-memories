import { describe, it, expect } from 'vitest';
import * as ArkSuite from '@/components/ui/ark';
import { AppleLuxuryShowcase } from '@/components/photobooth/AppleLuxuryShowcase';
import { PHOTOBOOTH_CARD_MODES, PRESET_COLOR_PALETTES, DEFAULT_PHOTOBOOTH_FRAMES } from '@/lib/constants/photobooth-presets';
import { LOYALTY_CARD_PRESETS } from '@/lib/constants/loyalty-card-presets';

describe('Ark UI Apple Primitives Suite', () => {
  it('exports all 7 Apple HIG Ark UI components', () => {
    expect(ArkSuite.AppleDialog).toBeDefined();
    expect(ArkSuite.AppleDialogContent).toBeDefined();
    expect(ArkSuite.AppleTabs).toBeDefined();
    expect(ArkSuite.AppleTabsList).toBeDefined();
    expect(ArkSuite.AppleTabTrigger).toBeDefined();
    expect(ArkSuite.AppleTabContent).toBeDefined();
    expect(ArkSuite.AppleSwitch).toBeDefined();
    expect(ArkSuite.AppleAccordion).toBeDefined();
    expect(ArkSuite.AppleAccordionItem).toBeDefined();
    expect(ArkSuite.ApplePinInput).toBeDefined();
    expect(ArkSuite.AppleTooltip).toBeDefined();
    expect(ArkSuite.AppleMenu).toBeDefined();
    expect(ArkSuite.AppleMenuItem).toBeDefined();
  });
});

describe('Apple Luxury Theme & Palette Presets', () => {
  it('includes luxury_glass in PHOTOBOOTH_CARD_MODES with exact palette colors', () => {
    const luxuryMode = PHOTOBOOTH_CARD_MODES.find((m) => m.id === 'luxury_glass');
    expect(luxuryMode).toBeDefined();
    expect(luxuryMode?.defaultBg).toBe('#08080B');
    expect(luxuryMode?.defaultAccent).toBe('#DD0200');
    expect(luxuryMode?.defaultText).toBe('#D9D9D9');
  });

  it('contains luxury-glass-cherry palette in PRESET_COLOR_PALETTES', () => {
    const palette = PRESET_COLOR_PALETTES.find((p) => p.id === 'luxury-glass-cherry');
    expect(palette).toBeDefined();
    expect(palette?.accentColor).toBe('#DD0200');
    expect(palette?.textColor).toBe('#D9D9D9');
  });

  it('registers luxury glass frame in DEFAULT_PHOTOBOOTH_FRAMES', () => {
    const frame = DEFAULT_PHOTOBOOTH_FRAMES.find((f) => f.id === 'luxury-glass-cherry');
    expect(frame).toBeDefined();
    expect(frame?.cardMode).toBe('luxury_glass');
  });

  it('provides loyalty card preset luxury_glass_crimson', () => {
    const loyaltyPreset = LOYALTY_CARD_PRESETS['luxury_glass_crimson'];
    expect(loyaltyPreset).toBeDefined();
    expect(loyaltyPreset.theme.accentColor).toBe('#DD0200');
    expect(loyaltyPreset.theme.textColor).toBe('#D9D9D9');
  });

  it('exports AppleLuxuryShowcase component', () => {
    expect(AppleLuxuryShowcase).toBeDefined();
  });
});
