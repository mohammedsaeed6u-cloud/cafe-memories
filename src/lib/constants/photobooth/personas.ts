import type { CustomerPersonaInfo } from '@/types/photobooth';

export const CUSTOMER_PERSONAS: CustomerPersonaInfo[] = [
  {
    key: 'loyal_customer',
    label: 'عميل وفي / زائر دائم',
    icon: 'heart',
    badgeColor: 'bg-[#55100D]/60 text-[#FBF9F5] border-[#DD0200]/40',
  },
  {
    key: 'vip_guest',
    label: 'ضيف VIP / زائر مميز',
    icon: 'crown',
    badgeColor: 'bg-[#55100D]/80 text-[#FBF9F5] border-[#DD0200]/60',
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
    badgeColor: 'bg-[#55100D]/40 text-[#FBF9F5] border-[#DD0200]/30',
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
    badgeColor: 'bg-[#1A0706] text-[#FBF9F5] border-[#DD0200]/30',
  },
  {
    key: 'other',
    label: 'تصنيف آخر',
    icon: 'general',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
  },
];
