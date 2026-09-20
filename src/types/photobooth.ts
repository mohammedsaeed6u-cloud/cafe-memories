export type StripOrientation = 'vertical' | 'horizontal';
export type ShotCount = number;

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
  shotCount: number; // Configurable freely by merchant (e.g. 3, 4, 5...)
  badgeText?: string;
  isCustom?: boolean;
}

export interface BusinessSettings {
  cafeSlug: string;
  cafeName: string;
  branding: BusinessBranding;
  defaultShotCount: number;
  defaultOrientation: StripOrientation;
  freeGiftOffer: FreeGiftOffer;
  activeFrameId: string;
  frames: PhotoboothFrame[];
}

export type CustomerPersonaKey = string;

export interface CustomerPersonaInfo {
  key: string;
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
