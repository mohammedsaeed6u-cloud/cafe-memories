import { describe, it, expect } from 'vitest';
import {
  LOYALTY_CARD_PRESETS,
  LOYALTY_DIMENSIONS,
  LOYALTY_SLOT_OPTIONS,
  DEFAULT_LOYALTY_TEMPLATE,
  getLoyaltyTemplateById,
} from '@/lib/constants/loyalty-card-presets';
import { LoyaltyCardService } from '@/lib/services/loyalty-card.service';
import {
  LoyaltyCardTemplate,
  LoyaltySlotCount,
  LoyaltyCardDimensionType,
} from '@/types/loyalty-card';

describe('Loyalty Card Templates & Preset Engine', () => {
  it('contains all 4 required distinctive authentic presets plus photobooth strip', () => {
    const presetKeys = Object.keys(LOYALTY_CARD_PRESETS);
    expect(presetKeys).toContain('espresso_pass');
    expect(presetKeys).toContain('minimal_kraft');
    expect(presetKeys).toContain('neon_cyber_latte');
    expect(presetKeys).toContain('botanical_matcha');
    expect(presetKeys).toContain('photobooth_strip');
  });

  describe('Dimension Standards Conformance', () => {
    it('verifies ISO/IEC 7810 ID-1 standard wallet card dimensions (85.6 x 53.98 mm)', () => {
      const walletDim = LOYALTY_DIMENSIONS.wallet;
      expect(walletDim.widthMm).toBe(85.6);
      expect(walletDim.heightMm).toBe(53.98);
      expect(walletDim.type).toBe('wallet');
      expect(walletDim.aspectRatio).toBe('85.6 / 53.98');
    });

    it('verifies Square punch card dimensions (70 x 70 mm)', () => {
      const squareDim = LOYALTY_DIMENSIONS.square;
      expect(squareDim.widthMm).toBe(70);
      expect(squareDim.heightMm).toBe(70);
      expect(squareDim.aspectRatio).toBe('1 / 1');
    });

    it('verifies Photobooth Strip ticket dimensions (50 x 140 mm)', () => {
      const stripDim = LOYALTY_DIMENSIONS.strip;
      expect(stripDim.widthMm).toBe(50);
      expect(stripDim.heightMm).toBe(140);
      expect(stripDim.aspectRatio).toBe('50 / 140');
    });
  });

  describe('Slot Count Options', () => {
    it('supports slot counts [4, 6, 8, 10, 12]', () => {
      expect(LOYALTY_SLOT_OPTIONS).toEqual([4, 6, 8, 10, 12]);
    });

    it('each preset has a slotCount that belongs to LOYALTY_SLOT_OPTIONS', () => {
      Object.values(LOYALTY_CARD_PRESETS).forEach((preset) => {
        expect(LOYALTY_SLOT_OPTIONS).toContain(preset.slotCount);
      });
    });
  });

  describe('Preset Themes & Textures', () => {
    it('espresso_pass features dark matte leather texture and bronze foil effect', () => {
      const preset = LOYALTY_CARD_PRESETS.espresso_pass;
      expect(preset.theme.texture).toBe('leather');
      expect(preset.theme.foilEffect).toBe('bronze');
      expect(preset.slotCount).toBe(10);
      expect(preset.milestones.length).toBeGreaterThanOrEqual(2);
    });

    it('minimal_kraft features kraft paper texture with rustic typewriter styling', () => {
      const preset = LOYALTY_CARD_PRESETS.minimal_kraft;
      expect(preset.theme.texture).toBe('kraft');
      expect(preset.dimensionType).toBe('square');
      expect(preset.slotCount).toBe(8);
      expect(preset.theme.foilEffect).toBe('none');
    });

    it('neon_cyber_latte features neon texture with high-contrast glowing styling', () => {
      const preset = LOYALTY_CARD_PRESETS.neon_cyber_latte;
      expect(preset.theme.texture).toBe('neon');
      expect(preset.theme.foilEffect).toBe('neon');
      expect(preset.slotCount).toBe(6);
      expect(preset.theme.accentColor).toBe('#00F2FE');
    });

    it('botanical_matcha features botanical motif with soft sage tones', () => {
      const preset = LOYALTY_CARD_PRESETS.botanical_matcha;
      expect(preset.theme.texture).toBe('botanical');
      expect(preset.theme.foilEffect).toBe('gold');
      expect(preset.theme.textColor).toBe('#1B3523');
    });
  });

  describe('Fallback & Retrieval', () => {
    it('returns default template when requested preset is unknown', () => {
      const template = getLoyaltyTemplateById('non_existent_preset_123');
      expect(template.id).toBe(DEFAULT_LOYALTY_TEMPLATE.id);
    });

    it('returns correct template when valid ID is provided', () => {
      const template = getLoyaltyTemplateById('minimal_kraft');
      expect(template.id).toBe('minimal_kraft');
      expect(template.nameEn).toBe('Minimal Kraft');
    });
  });
});

describe('Loyalty Milestone Engine & Progression Logic', () => {
  const template: LoyaltyCardTemplate = LOYALTY_CARD_PRESETS.espresso_pass;
  // espresso_pass has slotCount = 10, milestones at slot 5 and slot 10

  it('evaluates zero stamps with 0% progress and no unlocked rewards', () => {
    const result = LoyaltyCardService.evaluateMilestones(template, 0);
    expect(result.unlockedRewards).toHaveLength(0);
    expect(result.isComplete).toBe(false);
    expect(result.progressPercent).toBe(0);
    expect(result.nextMilestone?.slot).toBe(5);
    expect(result.stampsToNext).toBe(5);
  });

  it('evaluates 3 stamps: remaining 2 stamps to first milestone', () => {
    const result = LoyaltyCardService.evaluateMilestones(template, 3);
    expect(result.unlockedRewards).toHaveLength(0);
    expect(result.isComplete).toBe(false);
    expect(result.progressPercent).toBe(30);
    expect(result.nextMilestone?.slot).toBe(5);
    expect(result.stampsToNext).toBe(2);
  });

  it('unlocks first milestone when reaching exactly slot 5', () => {
    const result = LoyaltyCardService.evaluateMilestones(template, 5);
    expect(result.unlockedRewards).toHaveLength(1);
    expect(result.unlockedRewards[0].milestoneSlot).toBe(5);
    expect(result.unlockedRewards[0].code).toContain('5X');
    expect(result.isComplete).toBe(false);
    expect(result.progressPercent).toBe(50);
    expect(result.nextMilestone?.slot).toBe(10);
    expect(result.stampsToNext).toBe(5);
  });

  it('unlocks all milestones and marks card complete at 10 stamps', () => {
    const result = LoyaltyCardService.evaluateMilestones(template, 10);
    expect(result.unlockedRewards).toHaveLength(2);
    expect(result.unlockedRewards[1].milestoneSlot).toBe(10);
    expect(result.unlockedRewards[1].isGrandPrize).toBe(true);
    expect(result.isComplete).toBe(true);
    expect(result.progressPercent).toBe(100);
    expect(result.nextMilestone).toBeNull();
    expect(result.stampsToNext).toBe(0);
  });

  it('clamps stamps if currentStamps exceeds total slotCount', () => {
    const result = LoyaltyCardService.evaluateMilestones(template, 99);
    expect(result.unlockedRewards).toHaveLength(2);
    expect(result.isComplete).toBe(true);
    expect(result.progressPercent).toBe(100);
  });

  it('clamps negative stamp counts safely to 0', () => {
    const result = LoyaltyCardService.evaluateMilestones(template, -5);
    expect(result.unlockedRewards).toHaveLength(0);
    expect(result.progressPercent).toBe(0);
    expect(result.isComplete).toBe(false);
  });
});

describe('Loyalty Card State Transitions & Barista QR Engine', () => {
  const cafeSlug = 'espresso-lab';
  const customerPhone = '01019882233';
  const template = LOYALTY_CARD_PRESETS.neon_cyber_latte; // 6 slots, milestones at 3 and 6

  it('creates initial card state with 0 active stamps and valid Barista QR URL', () => {
    const state = LoyaltyCardService.createInitialCardState(
      cafeSlug,
      customerPhone,
      template,
      'سارة المهندس'
    );

    expect(state.cafeSlug).toBe(cafeSlug);
    expect(state.customerPhone).toBe(customerPhone);
    expect(state.activeStamps).toBe(0);
    expect(state.totalSlots).toBe(6);
    expect(state.stamps).toHaveLength(0);
    expect(state.unlockedRewards).toHaveLength(0);
    expect(state.isCompleted).toBe(false);

    // Verify QR payload is a valid URL containing parameters
    const parsedUrl = new URL(state.qrPayload);
    expect(parsedUrl.searchParams.get('action')).toBe('barista_verify');
    expect(parsedUrl.searchParams.get('cafe')).toBe(cafeSlug);
    expect(parsedUrl.searchParams.get('phone')).toBe(customerPhone);
    expect(parsedUrl.searchParams.get('stamps')).toBe('0');
  });

  it('adds stamps iteratively and unlocks rewards seamlessly', () => {
    let state = LoyaltyCardService.createInitialCardState(cafeSlug, customerPhone, template);

    // Stamp 1
    state = LoyaltyCardService.addStampToCardState(state, template, {
      staffName: 'عمر الباريستا',
    });
    expect(state.activeStamps).toBe(1);
    expect(state.stamps).toHaveLength(1);
    expect(state.stamps[0].slotNumber).toBe(1);
    expect(state.stamps[0].staffName).toBe('عمر الباريستا');
    expect(state.unlockedRewards).toHaveLength(0);

    // Stamp 2
    state = LoyaltyCardService.addStampToCardState(state, template);
    expect(state.activeStamps).toBe(2);

    // Stamp 3 (Milestone unlock!)
    state = LoyaltyCardService.addStampToCardState(state, template);
    expect(state.activeStamps).toBe(3);
    expect(state.unlockedRewards).toHaveLength(1);
    expect(state.unlockedRewards[0].milestoneSlot).toBe(3);
    expect(state.isCompleted).toBe(false);

    // Stamps 4, 5
    state = LoyaltyCardService.addStampToCardState(state, template);
    state = LoyaltyCardService.addStampToCardState(state, template);
    expect(state.activeStamps).toBe(5);
    expect(state.unlockedRewards).toHaveLength(1);

    // Stamp 6 (Grand Prize Completion!)
    state = LoyaltyCardService.addStampToCardState(state, template);
    expect(state.activeStamps).toBe(6);
    expect(state.unlockedRewards).toHaveLength(2);
    expect(state.isCompleted).toBe(true);

    // Verify QR payload reflects updated stamps count
    const qrUrl = new URL(state.qrPayload);
    expect(qrUrl.searchParams.get('stamps')).toBe('6');

    // Attempting to add past slotCount does not increment
    const extraState = LoyaltyCardService.addStampToCardState(state, template);
    expect(extraState.activeStamps).toBe(6);
    expect(extraState.stamps).toHaveLength(6);
  });
});
