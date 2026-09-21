/**
 * Loyalty Milestone Engine & Template Service
 * Cafe Memories Platform
 */

import {
  LoyaltyCardState,
  LoyaltyCardTemplate,
  LoyaltyCardStampRecord,
  LoyaltyUnlockedReward,
  MilestoneEvaluationResult,
  LoyaltyMilestone,
} from '@/types/loyalty-card';
import {
  DEFAULT_LOYALTY_TEMPLATE,
  getLoyaltyTemplateById,
} from '@/lib/constants/loyalty-card-presets';

const STORAGE_PREFIX = 'memories_loyalty_template_';
const STATE_STORAGE_PREFIX = 'memories_loyalty_card_';

export class LoyaltyCardService {
  /**
   * Generates standard Barista scanning verification payload
   */
  static generateBaristaQrPayload(
    cafeSlug: string,
    phone: string,
    activeStamps: number,
    templateId?: string
  ): string {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const searchParams = new URLSearchParams({
      action: 'barista_verify',
      cafe: cafeSlug,
      phone: cleanPhone,
      stamps: String(activeStamps),
      tpl: templateId || 'espresso_pass',
      v: '1',
    });

    return `https://cafememories.app/go/loyalty?${searchParams.toString()}`;
  }

  /**
   * Evaluates unlocked rewards, next upcoming milestone, and completion status
   */
  static evaluateMilestones(
    template: LoyaltyCardTemplate,
    currentStamps: number
  ): MilestoneEvaluationResult {
    const clampedStamps = Math.max(0, Math.min(currentStamps, template.slotCount));
    const sortedMilestones = [...template.milestones].sort((a, b) => a.slot - b.slot);

    const unlockedRewards: LoyaltyUnlockedReward[] = sortedMilestones
      .filter((m) => clampedStamps >= m.slot)
      .map((m) => ({
        id: `reward-${m.codePrefix || 'REW'}-${m.slot}`,
        milestoneSlot: m.slot,
        rewardTitle: m.rewardTitle,
        rewardTitleEn: m.rewardTitleEn,
        rewardTitleAr: m.rewardTitle,
        code: `${m.codePrefix || 'GIFT'}-${m.slot}X`,
        unlockedAt: new Date().toISOString(),
        claimed: false,
        isGrandPrize: m.isGrandPrize || m.slot === template.slotCount,
      }));

    const nextMilestone: LoyaltyMilestone | null =
      sortedMilestones.find((m) => m.slot > clampedStamps) || null;

    const stampsToNext = nextMilestone
      ? nextMilestone.slot - clampedStamps
      : Math.max(0, template.slotCount - clampedStamps);

    const isComplete = clampedStamps >= template.slotCount;
    const progressPercent = Math.min(
      100,
      Math.round((clampedStamps / template.slotCount) * 100)
    );

    return {
      unlockedRewards,
      nextMilestone,
      stampsToNext,
      isComplete,
      progressPercent,
    };
  }

  /**
   * Creates an initial empty card state for a customer
   */
  static createInitialCardState(
    cafeSlug: string,
    phone: string,
    template: LoyaltyCardTemplate = DEFAULT_LOYALTY_TEMPLATE,
    customerName?: string
  ): LoyaltyCardState {
    const cardId = `card_${cafeSlug}_${phone.replace(/[^0-9]/g, '') || 'guest'}_${Date.now()}`;
    const qrPayload = this.generateBaristaQrPayload(cafeSlug, phone, 0, template.id);

    return {
      cardId,
      cafeSlug,
      customerPhone: phone,
      customerName,
      templateId: template.id,
      activeStamps: 0,
      totalSlots: template.slotCount,
      stamps: [],
      unlockedRewards: [],
      isCompleted: false,
      qrPayload,
    };
  }

  /**
   * Pure state transition: adds a stamp to the customer's card state
   */
  static addStampToCardState(
    currentState: LoyaltyCardState,
    template: LoyaltyCardTemplate,
    record?: Partial<LoyaltyCardStampRecord>
  ): LoyaltyCardState {
    if (currentState.activeStamps >= template.slotCount) {
      return currentState;
    }

    const nextActiveStamps = currentState.activeStamps + 1;
    const slotIndex = currentState.activeStamps;
    const slotNumber = nextActiveStamps;

    const newRecord: LoyaltyCardStampRecord = {
      slotIndex,
      slotNumber,
      stampedAt: record?.stampedAt || new Date().toISOString(),
      thumbnailUrl: record?.thumbnailUrl,
      staffName: record?.staffName,
      note: record?.note,
    };

    const newStamps = [...currentState.stamps, newRecord];
    const { unlockedRewards, isComplete } = this.evaluateMilestones(template, nextActiveStamps);
    const qrPayload = this.generateBaristaQrPayload(
      currentState.cafeSlug,
      currentState.customerPhone,
      nextActiveStamps,
      template.id
    );

    return {
      ...currentState,
      activeStamps: nextActiveStamps,
      totalSlots: template.slotCount,
      stamps: newStamps,
      unlockedRewards,
      isCompleted: isComplete,
      lastStampedAt: newRecord.stampedAt,
      qrPayload,
    };
  }

  /**
   * LocalStorage template management for Merchant
   */
  static getTemplate(cafeSlug: string): LoyaltyCardTemplate {
    return this.getTemplateForCafe(cafeSlug);
  }

  static getTemplateForCafe(cafeSlug: string): LoyaltyCardTemplate {
    if (typeof window === 'undefined') return DEFAULT_LOYALTY_TEMPLATE;
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${cafeSlug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.slotCount) {
          return parsed as LoyaltyCardTemplate;
        }
      }
    } catch (err) {
      console.warn('Failed to load loyalty template from storage:', err);
    }
    return DEFAULT_LOYALTY_TEMPLATE;
  }

  static saveTemplateForCafe(cafeSlug: string, template: LoyaltyCardTemplate): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${cafeSlug}`, JSON.stringify(template));
      window.dispatchEvent(
        new CustomEvent('memories-loyalty-template-updated', {
          detail: template,
        })
      );
    } catch (err) {
      console.error('Failed to save loyalty template:', err);
    }
  }

  /**
   * WebAudio Sound Synthesis Engine:
   * Generates a realistic stamp thump + musical chime chords
   * 100% pure client-side without external asset files.
   */
  static playStampChime(isMilestone: boolean = false, isComplete: boolean = false): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // 1. Tactile physical stamp mechanical sound (low frequency click/thump)
      const thumpOsc = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thumpOsc.type = 'sine';
      thumpOsc.frequency.setValueAtTime(140, now);
      thumpOsc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
      thumpGain.gain.setValueAtTime(0.35, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      thumpOsc.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.08);

      // 2. Chime Frequencies
      // Regular: C6 (1046.5Hz) & E6 (1318.5Hz) bell tone
      // Milestone: Pentatonic chord (G5, C6, E6, G6)
      // Complete: Grand celebratory flourish
      let notes = [1046.5, 1318.5];
      let duration = 0.45;

      if (isComplete) {
        notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
        duration = 1.2;
      } else if (isMilestone) {
        notes = [783.99, 1046.5, 1318.5, 1567.98];
        duration = 0.8;
      }

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + (isComplete || isMilestone ? idx * 0.07 : 0.02);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + duration);
      });
    } catch {
      // Audio playback fails silently if browser security blocks it
    }
  }
}
