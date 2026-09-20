export type StripOrientation = 'vertical' | 'horizontal';
export type ShotCount = 1 | 2 | 3 | 4 | 6;

export interface CornerEmojiConfig {
  topRight: string;
  bottomLeft: string;
  enabled: boolean;
}

export interface BusinessBranding {
  name: string;
  logoUrl?: string;
  tagline?: string;
}

export interface FreeGiftOffer {
  title: string;
  subtitle: string;
  icon: string;
}

export interface PhotoboothFrame {
  id: string;
  name: string;
  nameAr: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  accentColor?: string;
  cornerEmojis: CornerEmojiConfig;
  orientation: StripOrientation;
  shotCount: ShotCount;
  badgeText?: string;
  isCustom?: boolean;
}

export interface BusinessSettings {
  cafeSlug: string;
  cafeName: string;
  branding: BusinessBranding;
  defaultShotCount: ShotCount;
  defaultOrientation: StripOrientation;
  freeGiftOffer: FreeGiftOffer;
  activeFrameId: string;
  frames: PhotoboothFrame[];
}

export type CustomerPersonaKey =
  | 'tech_freelancer'
  | 'creator_creative'
  | 'student_researcher'
  | 'business_founder'
  | 'coffee_lover'
  | 'other';

export interface CustomerPersonaInfo {
  key: CustomerPersonaKey;
  label: string;
  icon: string;
  badgeColor: string;
}

export interface PhotoboothCaptureResult {
  photos: string[];
  stripDataUrl?: string;
  frameId: string;
  giftCode: string;
  timestamp: string;
}
