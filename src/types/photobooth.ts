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
  instagramHandle?: string;
}

export interface FreeGiftOffer {
  title: string;
  subtitle: string;
  icon: string;
}

export type FrameShapeStyle = 'rounded' | 'sharp' | 'polaroid' | 'pill';

export type PhotoboothCardMode =
  | 'ticket_express'
  | 'spotify_player'
  | 'ios_gallery_light'
  | 'ios_gallery_dark'
  | 'ios_camera'
  | 'ios_imessage'
  | 'korean_noir'
  | 'cafe_latte'
  | 'retro_film'
  | 'sakura_y2k'
  | 'polaroid_classic'
  | 'wide_duo_2cut'
  | 'kinfolk_minimal'
  | 'cinema_horizontal'
  | 'arabica_monochrome'
  | 'arabica_luxury_gold'
  | 'film_35mm'
  | 'polaroid_vintage'
  | 'tokyo_pastel';

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
  | 'strip_1'           // 1 vertical cut
  | 'grid_2x2'          // 4x6 in (10x15 cm) - 4 cuts grid (2x2)
  | 'grid_2x3'          // 4x6 in (10x15 cm) - 6 cuts grid (2x3)
  | 'grid_3x2'          // 4x6 in (10x15 cm) - 6 cuts grid (3x2)
  | 'twin_strip'        // 4x6 in (10x15 cm) - Dual 2x6 strips with cut line
  | 'polaroid_square'   // 3.5x4.2 in (8.8x10.7 cm) - 1 square cut with chin
  | 'polaroid_wide'     // 4.2x3.5 in (10.7x8.8 cm) - 1 wide cut with chin
  | 'cinema_horizontal' // 6x2 in (15x5 cm) - 3 widescreen cuts
  | 'film_35mm'         // 2x6 in (5x15 cm) - 4 cuts with 35mm sprocket holes
  | 'wide_duo_2cut'    // 4x3 in (10x7.6 cm) - Wide short card with 2 photos side by side
  | 'wide_duo_4cut'    // 4x3.5 in - Wide compact card with 4 photos (2x2)
  | 'kinfolk_minimal'   // 2x6 in - 3 cuts with wide negative space
  | 'arabica_monochrome' // 2x6 in - stark monochrome typography
  | 'arabica_luxury_gold'
  | 'tokyo_pastel'
  | 'polaroid_vintage';

export interface PhotoboothFrameTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  dimensions: string;
  dimensionsCm: string;
  widthCm?: number;
  heightCm?: number;
  orientation: StripOrientation;
  shotCount: number;
  layoutType: PhotoboothLayoutType;
  cardMode?: PhotoboothCardMode;
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
  widthCm?: number;
  heightCm?: number;
  borderRadius?: number | string;
  customText?: string;
  isCustom?: boolean;
  songTitle?: string;
  songArtist?: string;
  ticketLabel?: string;
  ticketSeat?: string;
  dimensionsPreset?: 'strip_2x6' | 'grid_4x6' | 'wide_4x3' | 'polaroid_vintage' | 'cinema_6x2' | 'custom';
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
  defaultBorderRadius?: number;
  defaultDimensionsPreset?: string;
  defaultCardMode?: PhotoboothCardMode;
  defaultTemplateId?: string;
  defaultWidthCm?: number;
  defaultHeightCm?: number;
  defaultLayoutType?: PhotoboothLayoutType; // Korean, Latte, Film, Sakura, Polaroid
  freeGiftOffer: FreeGiftOffer;
  loyaltyMaxVisits?: number;
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
  lockFrameForCustomers?: boolean; // When true, customer cannot change the business's enforced frame layout, shotCount, or orientation
  businessType?: BusinessType;
}

export type BusinessType =
  | 'cafe'           // كافيهات ومحامص
  | 'restaurant'     // مطاعم ومفاهيم طعام
  | 'retail'         // متاجر ملابس وأزياء وبوتيكات
  | 'salon'          // صالونات تجميل وحلاقة وعناية
  | 'entertainment'  // مساحات ترفيه وملاهي وبولينج
  | 'events'         // معارض وفعاليات ومؤتمرات
  | 'general';       // عام / مساحات أخرى

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
