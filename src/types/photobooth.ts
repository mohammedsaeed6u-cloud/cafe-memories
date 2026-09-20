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

export type FrameShapeStyle = 'rounded' | 'sharp' | 'polaroid';

export interface CardColorPalette {
  id: string;
  nameAr: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
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
  shotCount: number; // Configurable freely by merchant (e.g. 2, 3, 4, 5...)
  frameShape?: FrameShapeStyle;
  badgeText?: string;
  isCustom?: boolean;
}

export type WallDisplayMode = 'board' | 'grid' | 'slideshow';

export interface WallDisplaySettings {
  mode: WallDisplayMode;
  slideIntervalSeconds: number; // e.g. 5, 10, 15, 30
  boardTheme?: 'warm_cork' | 'dark_slate' | 'espresso_wood';
}

export interface BusinessSettings {
  cafeSlug: string;
  cafeName: string;
  branding: BusinessBranding;
  defaultShotCount: number; // Strictly determined by merchant
  defaultOrientation: StripOrientation; // Strictly determined by merchant
  defaultFrameShape?: FrameShapeStyle; // Rounded, sharp, or polaroid
  freeGiftOffer: FreeGiftOffer;
  activeFrameId: string;
  frames: PhotoboothFrame[];
  wallSettings?: WallDisplaySettings;
  // Color controls:
  activeColorPaletteId?: string;
  allowCustomerColorChoice?: boolean;
  allowedColorIds?: string[];
  customPalette?: CardColorPalette;
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
