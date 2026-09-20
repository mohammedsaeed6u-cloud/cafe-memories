import { BusinessSettings, CustomerPersonaInfo, PhotoboothFrame } from '@/types/photobooth';

export const CUSTOMER_PERSONAS: CustomerPersonaInfo[] = [
  {
    key: 'tech_freelancer',
    label: 'تقني / فريلانسر',
    icon: '💻',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    key: 'creator_creative',
    label: 'صانع محتوى / مبدع',
    icon: '🎨',
    badgeColor: 'bg-pink-50 text-pink-800 border-pink-200',
  },
  {
    key: 'student_researcher',
    label: 'طالب / باحث',
    icon: '🎓',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    key: 'business_founder',
    label: 'أعمال / ريادة',
    icon: '💼',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    key: 'coffee_lover',
    label: 'زائر ومحب للقهوة',
    icon: '☕',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
  },
  {
    key: 'other',
    label: 'تصنيف آخر',
    icon: '✨',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
  },
];

export const PRESET_COLOR_PALETTES: {
  id: string;
  nameAr: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
}[] = [
  {
    id: 'classic-latte',
    nameAr: '☕ كافيه لاتيه كلاسيك',
    bgColor: '#F5F0EB',
    borderColor: '#E6DCCF',
    textColor: '#2A1810',
    accentColor: '#C67D34',
  },
  {
    id: 'noir-korean',
    nameAr: '🖤 أسود نوار فخم',
    bgColor: '#18181B',
    borderColor: '#27272A',
    textColor: '#FAFAFA',
    accentColor: '#A1A1AA',
  },
  {
    id: 'warm-amber',
    nameAr: '🍯 عنبر القهوة الدافئ',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#78350F',
    accentColor: '#B45309',
  },
  {
    id: 'terracotta-clay',
    nameAr: '🧱 طمي وتيراكوتا',
    bgColor: '#FAF5F0',
    borderColor: '#E2C4B1',
    textColor: '#431407',
    accentColor: '#C2410C',
  },
  {
    id: 'olive-garden',
    nameAr: '🌿 زيتوني هادئ وطبيعي',
    bgColor: '#F4F6F0',
    borderColor: '#D5DDD0',
    textColor: '#1C2818',
    accentColor: '#4D7C0F',
  },
  {
    id: 'sakura-blush',
    nameAr: '🌸 وردي ساكورا ناعم',
    bgColor: '#FFF0F3',
    borderColor: '#FFCCD5',
    textColor: '#591C2B',
    accentColor: '#E11D48',
  },
  {
    id: 'ivory-cream',
    nameAr: '🤍 عاجي كريمي نقي',
    bgColor: '#FAF8F5',
    borderColor: '#E7E2D9',
    textColor: '#1C1917',
    accentColor: '#D97706',
  },
];

export const DEFAULT_PHOTOBOOTH_FRAMES: PhotoboothFrame[] = [
  {
    id: 'classic-latte',
    name: 'Classic Latte',
    nameAr: 'كافيه لاتيه كلاسيك',
    bgColor: '#F5F0EB',
    textColor: '#2A1810',
    borderColor: '#E6DCCF',
    accentColor: '#C67D34',
    cornerEmojis: {
      topRight: '☕',
      bottomLeft: '✨',
      enabled: true,
    },
    orientation: 'vertical',
    shotCount: 3,
    frameShape: 'rounded',
    badgeText: 'MEMORIES STUDIO',
    isCustom: false,
  },
  {
    id: 'noir-korean',
    name: 'Korean Noir',
    nameAr: 'كوريان نوار فخم',
    bgColor: '#18181B',
    textColor: '#FAFAFA',
    borderColor: '#27272A',
    accentColor: '#A1A1AA',
    cornerEmojis: {
      topRight: '⚡',
      bottomLeft: '🖤',
      enabled: true,
    },
    orientation: 'vertical',
    shotCount: 3,
    frameShape: 'rounded',
    badgeText: 'SEOUL 4-CUTS',
    isCustom: false,
  },
  {
    id: 'warm-amber',
    name: 'Warm Amber',
    nameAr: 'عنبر القهوة المختصة',
    bgColor: '#FFFBEB',
    textColor: '#78350F',
    borderColor: '#FDE68A',
    accentColor: '#B45309',
    cornerEmojis: {
      topRight: '☕',
      bottomLeft: '🥐',
      enabled: true,
    },
    orientation: 'vertical',
    shotCount: 3,
    frameShape: 'rounded',
    badgeText: 'SPECIALTY ROASTERS',
    isCustom: false,
  },
  {
    id: 'ivory-cream',
    name: 'Ivory Cream',
    nameAr: 'العاجي الفاخر',
    bgColor: '#FAF8F5',
    textColor: '#1C1917',
    borderColor: '#E7E2D9',
    accentColor: '#D97706',
    cornerEmojis: {
      topRight: '✨',
      bottomLeft: '🎞️',
      enabled: true,
    },
    orientation: 'vertical',
    shotCount: 3,
    frameShape: 'rounded',
    badgeText: 'MEMORIES STUDIO',
    isCustom: false,
  },
  {
    id: 'terracotta-clay',
    name: 'Terracotta',
    nameAr: 'طمي وتيراكوتا',
    bgColor: '#FAF5F0',
    textColor: '#431407',
    borderColor: '#E2C4B1',
    accentColor: '#C2410C',
    cornerEmojis: {
      topRight: '🧱',
      bottomLeft: '🏺',
      enabled: true,
    },
    orientation: 'vertical',
    shotCount: 3,
    frameShape: 'rounded',
    badgeText: 'TERRACOTTA WARMTH',
    isCustom: false,
  },
];

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  cafeSlug: 'espresso-lab',
  cafeName: 'Memories • إكسبرسو لاب',
  branding: {
    name: 'Memories Studio',
    logoUrl: '',
    tagline: 'لحظات لا تُنسى في كل زيارة',
  },
  defaultShotCount: 3,
  defaultOrientation: 'vertical',
  defaultFrameShape: 'rounded',
  defaultCardMode: 'korean_noir',
  freeGiftOffer: {
    title: 'مشروب مجاني أو هدية فورية',
    subtitle: 'أظهر هذا الشريط للباريستا لاستلام هديتك مع الصورة المطبوعة',
    icon: '🎁',
  },
  activeFrameId: 'classic-latte',
  activeColorPaletteId: 'classic-latte',
  allowCustomerColorChoice: true,
  allowedColorIds: ['classic-latte', 'noir-korean', 'warm-amber', 'ivory-cream', 'terracotta-clay'],
  allowCustomerStickers: true,
  allowCustomerModeChoice: true,
  allowedModes: ['korean_noir', 'cafe_latte', 'retro_film', 'sakura_y2k', 'polaroid_classic'],
  frames: DEFAULT_PHOTOBOOTH_FRAMES,
};

export const PRESET_EMOJI_PAIRS = [
  { label: 'نجوم ولقطات', topRight: '✨', bottomLeft: '🎞️' },
  { label: 'ساكورا وقلب', topRight: '🌸', bottomLeft: '💖' },
  { label: 'قهوة وكرواسون', topRight: '☕', bottomLeft: '🥐' },
  { label: 'طاقة ونوار', topRight: '⚡', bottomLeft: '🖤' },
  { label: 'شريطة وكاميرا', topRight: '🎀', bottomLeft: '📸' },
  { label: 'كرز وفراشة', topRight: '🍒', bottomLeft: '🦋' },
  { label: 'دبدوب وعسل', topRight: '🧸', bottomLeft: '🍯' },
  { label: 'كأس وتاج', topRight: '👑', bottomLeft: '🥂' },
];

export interface PhotoboothModeInfo {
  id: 'korean_noir' | 'cafe_latte' | 'retro_film' | 'sakura_y2k' | 'polaroid_classic';
  nameAr: string;
  nameEn: string;
  icon: string;
  description: string;
  defaultBg: string;
  defaultBorder: string;
  defaultText: string;
  defaultAccent: string;
  filmBadge: string;
}

export const PHOTOBOOTH_CARD_MODES: PhotoboothModeInfo[] = [
  {
    id: 'korean_noir',
    nameAr: '🖤 كوريان 4-كتس (Seoul Studio)',
    nameEn: 'Korean 4-Cuts',
    icon: '⚡',
    description: 'أسود نوار فخم، خطوط استوديو سيول المودرن مع باركود وأرقام كلاسيكية',
    defaultBg: '#18181B',
    defaultBorder: '#27272A',
    defaultText: '#FAFAFA',
    defaultAccent: '#A1A1AA',
    filmBadge: 'SEOUL 4-CUTS • PHOTO STUDIO',
  },
  {
    id: 'cafe_latte',
    nameAr: '☕ كافيه لاتيه سبيشالتي',
    nameEn: 'Cafe Specialty',
    icon: '☕',
    description: 'ورق كريمي دافئ ملمسي، ترويسة روستري الحرفية، ونصوص اسبريسو',
    defaultBg: '#F5F0EB',
    defaultBorder: '#E6DCCF',
    defaultText: '#2A1810',
    defaultAccent: '#C67D34',
    filmBadge: 'SPECIALTY ROASTERS • MEMORIES',
  },
  {
    id: 'retro_film',
    nameAr: '🎞️ فيلم 35mm ريترو سينمائي',
    nameEn: 'Retro 35mm Film',
    icon: '🎞️',
    description: 'طابع شرائط الأفلام التناظرية مع ثقوب وعلامات الكوداك والـ 35 مم',
    defaultBg: '#231F20',
    defaultBorder: '#3F3B3C',
    defaultText: '#F7F4EB',
    defaultAccent: '#EA580C',
    filmBadge: 'SAFETY FILM • 35MM ISO 400',
  },
  {
    id: 'sakura_y2k',
    nameAr: '🌸 ساكورا بوب وكيوت',
    nameEn: 'Sakura & Y2K Pop',
    icon: '🎀',
    description: 'درجات الوردي الباستيل والقلوب والفيونكات وطابع طوكيو ستيكرز',
    defaultBg: '#FFF0F3',
    defaultBorder: '#FFCCD5',
    defaultText: '#591C2B',
    defaultAccent: '#E11D48',
    filmBadge: 'TOKYO PHOTOBOOTH • KAWAII',
  },
  {
    id: 'polaroid_classic',
    nameAr: '📸 بولارويد كلاسيك فوري',
    nameEn: 'Minimal Polaroid',
    icon: '📸',
    description: 'إطار الكاميرا الفورية الأبيض النقي مع حافة سفلية عريضة للملاحظات',
    defaultBg: '#FFFFFF',
    defaultBorder: '#E2DDD5',
    defaultText: '#1C1917',
    defaultAccent: '#0284C7',
    filmBadge: 'INSTANT FILM • MEMORIES',
  },
];

export const CURATED_STICKER_SET = [
  '✨', '💖', '☕', '🌸', '📸', '🎀', '⚡', '🖤',
  '🥐', '🍒', '🧸', '👑', '🥂', '🍵', '🌿', '💫',
  '💌', '🐾', '🎞️', '🌻', '🍓', '🫧', '🌙', '🪐',
];
