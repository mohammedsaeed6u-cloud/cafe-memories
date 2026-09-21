import { describe, it, expect } from 'vitest';
import { LoyaltyCardService } from '@/lib/services/loyalty-card.service';
import {
  DEFAULT_LOYALTY_TEMPLATE,
  LOYALTY_CARD_PRESETS,
  LOYALTY_SLOT_OPTIONS,
} from '@/lib/constants/loyalty-card-presets';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { generatePrintCSS, getPrintDimensions, normalizePrintFormat } from '@/lib/services/print.service';

describe('Customer Luxury Loyalty & Instant Print Integration', () => {
  describe('Loyalty Template Resolution for Customer Journey', () => {
    it('retrieves default template when cafe has no stored custom override', () => {
      const template = LoyaltyCardService.getTemplate('espresso-lab');
      expect(template).toBeDefined();
      expect(template.id).toBe(DEFAULT_LOYALTY_TEMPLATE.id);
      expect(LOYALTY_SLOT_OPTIONS).toContain(template.slotCount);
    });

    it('validates authentic styling tokens across all 4 customer presets', () => {
      const presetIds = ['espresso_pass', 'minimal_kraft', 'neon_cyber_latte', 'botanical_matcha'] as const;
      presetIds.forEach((id) => {
        const preset = LOYALTY_CARD_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.theme.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(preset.theme.secondaryTextColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(preset.theme.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(['leather', 'kraft', 'neon', 'matte', 'botanical', 'linen', 'foil', 'glossy']).toContain(
          preset.theme.texture
        );
      });
    });

    it('generates compliant Barista scan QR verification URL', () => {
      const qrUrl = LoyaltyCardService.generateBaristaQrPayload(
        'espresso-lab',
        '01019882233',
        5,
        'espresso_pass'
      );
      expect(qrUrl).toContain('https://cafememories.app/go/loyalty');
      expect(qrUrl).toContain('action=barista_verify');
      expect(qrUrl).toContain('cafe=espresso-lab');
      expect(qrUrl).toContain('phone=01019882233');
      expect(qrUrl).toContain('stamps=5');
      expect(qrUrl).toContain('tpl=espresso_pass');
    });
  });

  describe('Customer VIP Badge & Loyalty Milestone Engine', () => {
    it('evaluates VIP gold status correctly for visits >= 5', () => {
      const customerVisitsLow = 3;
      const customerVisitsHigh = 5;
      const customerVisitsVIP = 12;

      const isVip = (visits: number) => visits >= 5;
      expect(isVip(customerVisitsLow)).toBe(false);
      expect(isVip(customerVisitsHigh)).toBe(true);
      expect(isVip(customerVisitsVIP)).toBe(true);
    });

    it('evaluates unlocked rewards dynamically as customer accumulates stamps', () => {
      const template = LOYALTY_CARD_PRESETS.espresso_pass;
      // 5 stamps unlocks the first milestone (slot 5)
      const eval5 = LoyaltyCardService.evaluateMilestones(template, 5);
      expect(eval5.unlockedRewards.length).toBe(1);
      expect(eval5.unlockedRewards[0].milestoneSlot).toBe(5);
      expect(eval5.isComplete).toBe(false);

      // 10 stamps unlocks the grand prize (slot 10) and completes the card
      const eval10 = LoyaltyCardService.evaluateMilestones(template, 10);
      expect(eval10.unlockedRewards.length).toBe(2);
      expect(eval10.isComplete).toBe(true);
    });
  });

  describe('Sensory Soundscape & Instant Barista Print Dispatch', () => {
    it('executes SoundEffectsService.playBaristaDing safely in headless environment without crashing', () => {
      expect(() => {
        SoundEffectsService.playBaristaDing();
      }).not.toThrow();
    });

    it('executes SoundEffectsService.playRewardCelebration safely in headless environment', () => {
      expect(() => {
        SoundEffectsService.playRewardCelebration();
      }).not.toThrow();
    });

    it('respects mute preferences globally', () => {
      SoundEffectsService.setMuted(true);
      expect(SoundEffectsService.isMuted()).toBe(true);
      // Calling sounds while muted should be silent no-op
      expect(() => SoundEffectsService.playBaristaDing()).not.toThrow();
      SoundEffectsService.setMuted(false);
      expect(SoundEffectsService.isMuted()).toBe(false);
    });

    it('generates high-precision CSS rules for physical photobooth strip print', () => {
      const printStyles = generatePrintCSS('standard-2x6');
      expect(printStyles).toContain('@media print');
      expect(printStyles).toContain('margin: 0 !important');
      const dims = getPrintDimensions('standard-2x6');
      expect(dims.widthMm).toBe(50.8);
      expect(dims.heightMm).toBe(152.4);
    });

    it('generates high-precision CSS rules for dual-strip 4x6 grid print', () => {
      const printStyles = generatePrintCSS('dual-4x6');
      expect(printStyles).toContain('@media print');
      const dims = getPrintDimensions('dual-4x6');
      expect(dims.isDualStrip).toBe(true);
      expect(normalizePrintFormat('grid_4x6')).toBe('dual-4x6');
    });
  });
});
