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

export type PhotoboothCardMode =
  | 'korean_noir'
  | 'cafe_latte'
  | 'retro_film'
  | 'sakura_y2k'
  | 'polaroid_classic';

export interface PlacedSticker {
  id: string;
  emoji: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  rotation?: number; // rotation in degrees
  scale?: number;
}

export interface CardColorPalette {
  id: string;
  nameAr: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
}


export type PhotoboothLayoutType =
  | 'strip_4'           // 2x6 in (5x15 cm) - 4 vertical cuts
  | 'strip_3'           // 2x6 in (5x15 cm) - 3 vertical cuts
  | 'strip_2'           // 2x6 in (5x15 cm) - 2 vertical cuts (Double Shot)
  | 'grid_2x2'          // 4x6 in (10x15 cm) - 4 cuts grid (2x2)
  | 'grid_2x3'          // 4x6 in (10x15 cm) - 6 cuts grid (2x3)
  | 'twin_strip'        // 4x6 in (10x15 cm) - Dual 2x6 strips with cut line
  | 'polaroid_square'   // 3.5x4.2 in (8.8x10.7 cm) - 1 square cut with chin
  | 'polaroid_wide'     // 4.2x3.5 in (10.7x8.8 cm) - 1 wide cut with chin
  | 'cinema_horizontal' // 6x2 in (15x5 cm) - 3 widescreen cuts
  | 'film_35mm';        // 2x6 in (5x15 cm) - 4 cuts with 35mm sprocket holes

export interface PhotoboothFrameTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  dimensions: string;
  dimensionsCm: string;
  orientation: StripOrientation;
  shotCount: number;
  layoutType: PhotoboothLayoutType;
  description: string;
  badge: string;
  icon: string;
  defaultBg: string;
  defaultBorder: string;
  defaultText: string;
  defaultAccent: string;
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
  cardMode?: PhotoboothCardMode;
  stickers?: PlacedSticker[];
  badgeText?: string;
  templateId?: string;
  layoutType?: PhotoboothLayoutType;
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
  defaultCardMode?: PhotoboothCardMode;
  defaultTemplateId?: string;
  defaultLayoutType?: PhotoboothLayoutType; // Korean, Latte, Film, Sakura, Polaroid
  freeGiftOffer: FreeGiftOffer;
  activeFrameId: string;
  frames: PhotoboothFrame[];
  wallSettings?: WallDisplaySettings;
  // Color & Mode controls:
  activeColorPaletteId?: string;
  allowCustomerColorChoice?: boolean;
  allowedColorIds?: string[];
  customPalette?: CardColorPalette;
  allowCustomerStickers?: boolean;
  allowCustomerModeChoice?: boolean;
  allowedModes?: PhotoboothCardMode[];
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
