/**
 * Customer card personalization constants — single source of truth for
 * customer-selectable card themes, stamp icons, badges and the customization
 * data shape. Pure data + types only (no React) so both client components and
 * services can import without pulling the component layer.
 */

export interface CustomerThemeConfig {
  id: string;
  nameAr: string;
  cardBg: string;
  borderClass: string;
  accentClass: string;
  accentBg: string;
  glowClass: string;
  walletPreset: string;
  accentHex: string;
  badgeBg: string;
  textHex: string;
}

export const CUSTOMER_THEMES: CustomerThemeConfig[] = [
  {
    id: 'royal_ivory',
    nameAr: 'عاجي ملكي بالذهب (Royal Ivory)',
    cardBg: '#FFFFFF',
    borderClass: 'border-amber-300/80 shadow-[0_8px_30px_rgba(212,175,55,0.12)]',
    accentClass: 'text-[#B8860B]',
    accentBg: 'bg-[#B8860B]',
    glowClass: 'bg-amber-200/40',
    walletPreset: 'gold',
    accentHex: '#B8860B',
    badgeBg: 'bg-amber-50 border-amber-300 text-amber-950',
    textHex: '#231C18',
  },
  {
    id: 'warm_latte',
    nameAr: 'كافيه لاتيه دافئ (Warm Latte)',
    cardBg: '#FAF6F0',
    borderClass: 'border-[#C89D7C]/60 shadow-[0_8px_30px_rgba(200,157,124,0.15)]',
    accentClass: 'text-[#9C6644]',
    accentBg: 'bg-[#9C6644]',
    glowClass: 'bg-amber-300/30',
    walletPreset: 'amber',
    accentHex: '#9C6644',
    badgeBg: 'bg-[#F2E8DC] border-[#C89D7C]/60 text-amber-950',
    textHex: '#2D221C',
  },
  {
    id: 'sakura_cream',
    nameAr: 'هارو وردي عاجي (Sakura Cream)',
    cardBg: '#FFF5F7',
    borderClass: 'border-pink-300/80 shadow-[0_8px_30px_rgba(229,138,159,0.15)]',
    accentClass: 'text-[#C94A6E]',
    accentBg: 'bg-[#C94A6E]',
    glowClass: 'bg-pink-200/40',
    walletPreset: 'red',
    accentHex: '#C94A6E',
    badgeBg: 'bg-pink-100/70 border-pink-300 text-pink-950',
    textHex: '#351821',
  },
  {
    id: 'vintage_kodak',
    nameAr: 'ورق كوداك كلاسيكي (Kodak Film)',
    cardBg: '#FFFDF5',
    borderClass: 'border-amber-400/60 shadow-[0_8px_30px_rgba(230,161,64,0.15)]',
    accentClass: 'text-[#C27803]',
    accentBg: 'bg-[#C27803]',
    glowClass: 'bg-amber-200/40',
    walletPreset: 'gold',
    accentHex: '#C27803',
    badgeBg: 'bg-amber-100/80 border-amber-300 text-amber-950',
    textHex: '#2A1F11',
  },
  {
    id: 'emerald_linen',
    nameAr: 'كتان زمردي هادئ (Emerald Linen)',
    cardBg: '#F4FAF6',
    borderClass: 'border-emerald-300/70 shadow-[0_8px_30px_rgba(78,154,120,0.15)]',
    accentClass: 'text-[#2D6A4F]',
    accentBg: 'bg-[#2D6A4F]',
    glowClass: 'bg-emerald-200/40',
    walletPreset: 'green',
    accentHex: '#2D6A4F',
    badgeBg: 'bg-emerald-100/70 border-emerald-300 text-emerald-950',
    textHex: '#1B2E24',
  },
  {
    id: 'velvet_mocha',
    nameAr: 'موكا دافئة مخملية (Velvet Mocha)',
    cardBg: '#F7EFE9',
    borderClass: 'border-[#7F5539]/40 shadow-[0_8px_30px_rgba(127,85,57,0.15)]',
    accentClass: 'text-[#7F5539]',
    accentBg: 'bg-[#7F5539]',
    glowClass: 'bg-orange-200/40',
    walletPreset: 'dark',
    accentHex: '#7F5539',
    badgeBg: 'bg-[#EDE0D4] border-[#7F5539]/40 text-stone-900',
    textHex: '#2A1E17',
  },
];

export const STAMP_ICONS = [
  { id: 'coffee', label: 'قهوة', emoji: '☕' },
  { id: 'croissant', label: 'كرواسون', emoji: '🥐' },
  { id: 'star', label: 'نجمة', emoji: '⭐' },
  { id: 'heart', label: 'قلب', emoji: '🤍' },
  { id: 'crown', label: 'تاج', emoji: '👑' },
  { id: 'camera', label: 'كاميرا', emoji: '📸' },
  { id: 'sakura', label: 'زهرة', emoji: '🌸' },
  { id: 'sparkles', label: 'بريق', emoji: '✨' },
];

export const CUSTOMER_BADGES = [
  { id: 'story_maker', title: 'صانع ذكريات', icon: '📸' },
  { id: 'coffee_lover', title: 'متذوق القهوة', icon: '☕' },
  { id: 'vip_guest', title: 'ضيف VIP مميز', icon: '👑' },
  { id: 'loyal_friend', title: 'صديق وفي', icon: '⭐' },
];

export interface CustomerCustomizationData {
  themeId: string;
  customerName: string;
  badgeTitle: string;
  stampEmoji: string;
  customBackgroundUrl?: string;
  backgroundPresetId?: string;
  overlayOpacity?: number;
}

