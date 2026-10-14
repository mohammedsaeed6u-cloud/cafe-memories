/**
 * Sizing presets: emoji pairs, dimension presets, shot-count options.
 * Split out of photobooth-presets.ts; the barrel file re-exports everything.
 */
import { StripOrientation } from '@/types/photobooth';


export const PRESET_EMOJI_PAIRS = [
  { label: 'كلاسيك واستوديو', topRight: 'EST', bottomLeft: 'FILM' },
  { label: 'طوكيو وكارد', topRight: 'TOKYO', bottomLeft: 'LOVE' },
  { label: 'قهوة ومخبوزات', topRight: 'ROAST', bottomLeft: 'BAKE' },
  { label: 'فلاش ونوار', topRight: 'FLASH', bottomLeft: 'OLED' },
  { label: 'كاميرا وتوثيق', topRight: 'SNAP', bottomLeft: 'CAM' },
  { label: 'عصري وناعم', topRight: 'CHIC', bottomLeft: 'MINT' },
  { label: 'عنبر دافئ', topRight: 'HONEY', bottomLeft: 'AMBER' },
  { label: 'ذهبي ملكي', topRight: 'ROYAL', bottomLeft: 'GOLD' },
];

export interface DimensionPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  dimensions: string;
  dimensionsCm: string;
  widthCm: number;
  heightCm: number;
  orientation: StripOrientation;
  aspectRatioLabel: string;
  descriptionAr: string;
}

export const DIMENSION_PRESETS: DimensionPreset[] = [
  {
    id: 'strip_2x6',
    nameAr: 'شريط فوتوبوث كلاسيكي (2×6 بوصة)',
    nameEn: 'Classic Photobooth Strip (2x6 in)',
    dimensions: '2x6 in',
    dimensionsCm: '5 × 15.2 سم',
    widthCm: 5,
    heightCm: 15.2,
    orientation: 'vertical',
    aspectRatioLabel: '1:3 (رأسي طولي)',
    descriptionAr: 'الشريط الطولي الأكثر شهرة في استوديوهات كوريا (Seoul 4-Cuts)',
  },
  {
    id: 'grid_4x6',
    nameAr: 'كارت بوستكارد / شبكة (4×6 بوصة)',
    nameEn: 'Postcard / Grid Card (4x6 in)',
    dimensions: '4x6 in',
    dimensionsCm: '10 × 15.2 سم',
    widthCm: 10,
    heightCm: 15.2,
    orientation: 'vertical',
    aspectRatioLabel: '2:3 (بوستكارد قياسي)',
    descriptionAr: 'مقاس الصور القياسي المفضل للطباعة وشبكات 2×2 و2×3 المدمجة',
  },
  {
    id: 'wide_4x3',
    nameAr: 'كارت مكتبي عريض (4×3 بوصة)',
    nameEn: 'Wide Duo Card (4x3 in)',
    dimensions: '4x3 in',
    dimensionsCm: '10 × 7.6 سم',
    widthCm: 10,
    heightCm: 7.6,
    orientation: 'horizontal',
    aspectRatioLabel: '4:3 (أفقي عريض)',
    descriptionAr: 'كارت عريض وقصير مريح للعرض المكتبي ومناسب لصورتين جنباً إلى جنب',
  },
  {
    id: 'polaroid_vintage',
    nameAr: 'بولارويد كلاسيكي (3.5×4.2 بوصة)',
    nameEn: 'Vintage Polaroid (3.5x4.2 in)',
    dimensions: '3.5x4.2 in',
    dimensionsCm: '8.8 × 10.7 سم',
    widthCm: 8.8,
    heightCm: 10.7,
    orientation: 'vertical',
    aspectRatioLabel: '1:1.2 (ذقن عريض)',
    descriptionAr: 'حجم الكاميرات الفورية الأيقوني مع الذقن الأبيض العريض الشهير',
  },
  {
    id: 'cinema_6x2',
    nameAr: 'شريط سينمائي بانورامي (6×2 بوصة)',
    nameEn: 'Cinema Panoramic Strip (6x2 in)',
    dimensions: '6x2 in',
    dimensionsCm: '15.2 × 5 سم',
    widthCm: 15.2,
    heightCm: 5,
    orientation: 'horizontal',
    aspectRatioLabel: '16:9 سينمائي',
    descriptionAr: '3 كادرات سينمائية عريضة بتنسيق لقطات الأفلام والشاشات',
  },
  {
    id: 'custom',
    nameAr: 'أبعاد مخصصة (Custom Dimensions)',
    nameEn: 'Custom Dimensions (cm)',
    dimensions: 'Custom',
    dimensionsCm: 'مخصص',
    widthCm: 7.5,
    heightCm: 12,
    orientation: 'vertical',
    aspectRatioLabel: 'مخصص حسب الرغبة',
    descriptionAr: 'حدد العرض والارتفاع بالسنتيمتر بحرية تامة حسب نوع الطابعة أو الورق',
  },
];

export interface ShotCountOption {
  count: number;
  labelAr: string;
  nameEn: string;
  badge: string;
  descriptionAr: string;
}

export const SHOT_COUNT_OPTIONS: ShotCountOption[] = [
  {
    count: 1,
    labelAr: '1 لقطة واحدة (Grand Solo)',
    nameEn: 'Single Grand Shot',
    badge: '1-CUT',
    descriptionAr: 'صورة واحدة مميزة وبارزة بحجم كامل تبرز تفاصيل اللحظة',
  },
  {
    count: 2,
    labelAr: '2 لقطتان (Double Shot / Duo)',
    nameEn: 'Duo Shots',
    badge: '2-CUTS',
    descriptionAr: 'صورتان متناسقتان جنباً إلى جنب أو رأسياً للكابلز والأصدقاء',
  },
  {
    count: 3,
    labelAr: '3 لقطات (Roastery Trio)',
    nameEn: 'Trio Classic',
    badge: '3-CUTS',
    descriptionAr: 'الشريط الثلاثي الكلاسيكي المريح للعين في كروت ولاء الكافيهات',
  },
  {
    count: 4,
    labelAr: '4 لقطات (Seoul 4-Cuts)',
    nameEn: 'Seoul 4-Cuts',
    badge: '4-CUTS',
    descriptionAr: 'النمط الكوري الشهير عالمياً على بنترست واستوديوهات الصور الفورية',
  },
  {
    count: 6,
    labelAr: '6 لقطات (Story Grid / 6-Pack)',
    nameEn: '6-Cuts Story Grid',
    badge: '6-CUTS',
    descriptionAr: 'شبكة كروت متكاملة 2×3 لتوثيق جميع تفاصيل الزيارة والتجربة',
  },
];

