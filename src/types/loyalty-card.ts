/**
 * Types & Domain Models for Digital Loyalty Card Templates & Milestone Engine
 * Cafe Memories Platform
 */

export type LoyaltyCardDimensionType = 'wallet' | 'square' | 'strip';

export interface LoyaltyCardDimensions {
  type: LoyaltyCardDimensionType;
  nameEn: string;
  nameAr: string;
  widthMm: number;
  heightMm: number;
  aspectRatio: string;
  cssAspectRatio: string;
  descriptionEn: string;
  descriptionAr: string;
}

export type LoyaltySlotCount = 4 | 6 | 8 | 10 | 12;

export type LoyaltyMilestoneIcon =
  | 'coffee'
  | 'gift'
  | 'sparkles'
  | 'cake'
  | 'star'
  | 'cookie'
  | 'crown'
  | 'tag';

export interface LoyaltyMilestone {
  /** 1-indexed slot number where this reward triggers (e.g. 5 or 10) */
  slot: number;
  rewardTitle: string;
  rewardTitleEn?: string;
  rewardDescription?: string;
  icon?: LoyaltyMilestoneIcon;
  discountPercent?: number;
  codePrefix?: string;
  isGrandPrize?: boolean;
}

export type LoyaltyCardTexture =
  | 'leather'
  | 'kraft'
  | 'neon'
  | 'matte'
  | 'botanical'
  | 'linen'
  | 'foil'
  | 'glossy';

export type LoyaltyFontFamily = 'cairo' | 'tajawal' | 'sans' | 'serif' | 'mono' | 'playfair';

export type LoyaltyFoilEffect = 'bronze' | 'gold' | 'silver' | 'neon' | 'holographic' | 'none';

export interface LoyaltyCardThemeStyling {
  id: string;
  nameEn: string;
  nameAr: string;
  background: string; // CSS gradient or hex string
  textColor: string;
  secondaryTextColor: string;
  accentColor: string;
  borderColor: string;
  stampBorderColor: string;
  stampActiveBg: string;
  stampActiveColor: string;
  stampInactiveBg: string;
  stampInactiveColor: string;
  texture: LoyaltyCardTexture;
  foilEffect: LoyaltyFoilEffect;
  fontFamily: LoyaltyFontFamily;
  glowColor?: string;
  badgeBg?: string;
  badgeTextColor?: string;
  patternSvg?: string;
}

export interface LoyaltyCardTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  dimensionType: LoyaltyCardDimensionType;
  dimensions: LoyaltyCardDimensions;
  slotCount: LoyaltySlotCount;
  milestones: LoyaltyMilestone[];
  theme: LoyaltyCardThemeStyling;
  badgeText?: string;
  badgeTextAr?: string;
  tagline?: string;
  taglineAr?: string;
  termsAndConditions?: string[];
  termsAndConditionsAr?: string[];
  customizable?: boolean;
}

export interface LoyaltyCardStampRecord {
  slotIndex: number; // 0-based
  slotNumber: number; // 1-based (1..slotCount)
  stampedAt: string; // ISO string
  thumbnailUrl?: string; // photo thumbnail if photobooth stamp
  staffName?: string;
  note?: string;
}

export interface LoyaltyUnlockedReward {
  id: string;
  milestoneSlot: number;
  rewardTitle: string;
  rewardTitleAr: string;
  code: string;
  unlockedAt: string;
  claimed: boolean;
  claimedAt?: string;
  isGrandPrize?: boolean;
}

export interface LoyaltyCardState {
  cardId: string;
  cafeSlug: string;
  cafeName?: string;
  customerPhone: string;
  customerName?: string;
  templateId: string;
  activeStamps: number; // current count of stamped slots
  totalSlots: LoyaltySlotCount;
  stamps: LoyaltyCardStampRecord[];
  unlockedRewards: LoyaltyUnlockedReward[];
  isCompleted: boolean;
  lastStampedAt?: string;
  qrPayload: string; // Payload string for Barista scanner QR
}

export interface MilestoneEvaluationResult {
  unlockedRewards: LoyaltyUnlockedReward[];
  nextMilestone: LoyaltyMilestone | null;
  stampsToNext: number;
  isComplete: boolean;
  progressPercent: number;
}
