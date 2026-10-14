/**
 * Customer personas and preset color palettes.
 * Split out of photobooth-presets.ts; the barrel file re-exports everything.
 */

import { CustomerPersonaInfo } from '@/types/photobooth';

export const CUSTOMER_PERSONAS: CustomerPersonaInfo[] = [
  {
    key: 'loyal_customer',
    label: 'عميل وفي / زائر دائم',
    icon: 'heart',
    badgeColor: 'bg-[#98183c]/60 text-[#FBF9F5] border-[#c92a54]/40',
  },
  {
    key: 'vip_guest',
    label: 'ضيف VIP / زائر مميز',
    icon: 'crown',
    badgeColor: 'bg-[#98183c]/80 text-[#FBF9F5] border-[#c92a54]/60',
  },
  {
    key: 'tech_freelancer',
    label: 'تقني / فريلانسر',
    icon: 'tech',
    badgeColor: 'bg-[#1C1B1B] text-[#D9D9D9] border-white/10',
  },
  {
    key: 'creator_creative',
    label: 'صانع محتوى / مبدع',
    icon: 'creative',
    badgeColor: 'bg-[#98183c]/40 text-[#FBF9F5] border-[#c92a54]/30',
  },
  {
    key: 'student_researcher',
    label: 'طالب / باحث',
    icon: 'student',
    badgeColor: 'bg-[#1C1B1B] text-[#D9D9D9] border-white/10',
  },
  {
    key: 'business_founder',
    label: 'أعمال / ريادة',
    icon: 'business',
    badgeColor: 'bg-[#1F1D1D] text-[#FBF9F5] border-white/15',
  },
  {
    key: 'coffee_lover',
    label: 'متذوق القهوة والضيافة',
    icon: 'coffee',
    badgeColor: 'bg-[#1A0706] text-[#FBF9F5] border-[#c92a54]/30',
  },
  {
    key: 'other',
    label: 'تصنيف آخر',
    icon: 'general',
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
    id: 'luxury-glass-cherry',
    nameAr: 'ألاباستر فاخر (Alabaster & Racing Red)',
    bgColor: '#D9D9D9',
    borderColor: '#98183c',
    textColor: '#1A0706',
    accentColor: '#c92a54',
  },
  {
    id: 'ticket-express-cream',
    nameAr: 'كريمي إيديتوريال فاخر (Editorial Cream)',
    bgColor: '#FAF5EC',
    borderColor: '#4A121A',
    textColor: '#3D1016',
    accentColor: '#8B2635',
  },
  {
    id: 'spotify-slate-blue',
    nameAr: 'سبوتيفاي أزرق حجري (Slate Blue)',
    bgColor: '#384C5A',
    borderColor: '#26343E',
    textColor: '#FFFFFF',
    accentColor: '#1DB954',
  },
  {
    id: 'spotify-warm-taupe',
    nameAr: 'سبوتيفاي زيتي كافيه (Warm Taupe)',
    bgColor: '#4E483E',
    borderColor: '#37322B',
    textColor: '#FFFFFF',
    accentColor: '#1DB954',
  },
  {
    id: 'spotify-charcoal-oled',
    nameAr: 'سبوتيفاي أسود داكن (Charcoal Dark)',
    bgColor: '#161618',
    borderColor: '#28282B',
    textColor: '#FFFFFF',
    accentColor: '#1DB954',
  },
  {
    id: 'spotify-burnt-terracotta',
    nameAr: 'سبوتيفاي تيراكوتا (Burnt Terracotta)',
    bgColor: '#8B3A2B',
    borderColor: '#67281D',
    textColor: '#FFFFFF',
    accentColor: '#1DB954',
  },
  {
    id: 'ios-clean-white',
    nameAr: 'آبل صور نهاري (iOS Light)',
    bgColor: '#F2F2F7',
    borderColor: '#D1D1D6',
    textColor: '#000000',
    accentColor: '#007AFF',
  },
  {
    id: 'ios-oled-black',
    nameAr: 'آبل شاشات سوداء (iOS OLED Dark)',
    bgColor: '#000000',
    borderColor: '#1C1C1E',
    textColor: '#FFFFFF',
    accentColor: '#0A84FF',
  },
  {
    id: 'memories-signature',
    nameAr: 'هوية ميموريز الرسمية (Artisanal Coffee)',
    bgColor: '#E8DCC6',
    borderColor: '#3B2F2A',
    textColor: '#3B2F2A',
    accentColor: '#B85C43',
  },
  {
    id: 'memories-forest',
    nameAr: 'ميموريز فورست جرين (Deep Forest)',
    bgColor: '#1E3A32',
    borderColor: '#2A4F44',
    textColor: '#FAF6EE',
    accentColor: '#B85C43',
  },
  {
    id: 'classic-latte',
    nameAr: 'كافيه لاتيه كلاسيك',
    bgColor: '#F5F0EB',
    borderColor: '#E6DCCF',
    textColor: '#2A1810',
    accentColor: '#C67D34',
  },
  {
    id: 'noir-korean',
    nameAr: 'أسود نوار فخم (Seoul)',
    bgColor: '#121214',
    borderColor: '#27272A',
    textColor: '#F4F4F5',
    accentColor: '#A1A1AA',
  },
  {
    id: 'arabica-gold',
    nameAr: 'أرابيكا ذهبي فاخر (Espresso & Gold)',
    bgColor: '#14110F',
    borderColor: '#D4AF37',
    textColor: '#F7F2E7',
    accentColor: '#C5A059',
  },
  {
    id: 'tokyo-pastel',
    nameAr: 'طوكيو ساكورا باستيل (Harajuku)',
    bgColor: '#FDF2F5',
    borderColor: '#FBCFE8',
    textColor: '#831843',
    accentColor: '#F43F5E',
  },
  {
    id: 'kinfolk-ivory',
    nameAr: 'كينفولك عاجي نقي (Editorial)',
    bgColor: '#FCFBF9',
    borderColor: '#E7E5E0',
    textColor: '#18181B',
    accentColor: '#A8A29E',
  },
  {
    id: 'analog-35mm',
    nameAr: 'فيلم 35mm كوداك ريترو',
    bgColor: '#1A1715',
    borderColor: '#2E2824',
    textColor: '#FEF08A',
    accentColor: '#F97316',
  },
  {
    id: 'polaroid-cream',
    nameAr: 'بولارويد كريمي دافئ',
    bgColor: '#F7F5EE',
    borderColor: '#E5E0D2',
    textColor: '#292524',
    accentColor: '#D97706',
  },
  {
    id: 'warm-amber',
    nameAr: 'عنبر القهوة الدافئ',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#78350F',
    accentColor: '#B45309',
  },
  {
    id: 'terracotta-clay',
    nameAr: 'طمي وتيراكوتا',
    bgColor: '#FAF5F0',
    borderColor: '#E2C4B1',
    textColor: '#431407',
    accentColor: '#C2410C',
  },
  {
    id: 'olive-garden',
    nameAr: 'زيتوني هادئ وطبيعي',
    bgColor: '#F4F6F0',
    borderColor: '#D5DDD0',
    textColor: '#1C2818',
    accentColor: '#4D7C0F',
  },
];

