export interface CustomFrame {
  id: string;
  name: string;
  nameEn: string;
  bgColor: string;
  textColor: string;
  subTextColor: string;
  frameBg: string;
  headerText: string;
  footerText: string;
  badge: string;
}

export interface BusinessConfig {
  shotCount: 1 | 2 | 3 | 4;
  activeFrameId: string;
  frames: CustomFrame[];
  freeGift: {
    enabled: boolean;
    title: string;
    description: string;
    terms: string;
  };
}

export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  shotCount: 3,
  activeFrameId: 'ivory',
  frames: [
    {
      id: 'ivory',
      name: 'أبيض عاجي كلاسيك',
      nameEn: 'Pure Ivory',
      bgColor: '#FFFFFF',
      textColor: '#1C1917',
      subTextColor: '#78716C',
      frameBg: '#F5F5F4',
      headerText: 'MEMORIES • موميريز',
      footerText: 'PHOTO STRIP • SPECIAL EDITION',
      badge: 'CLASSIC',
    },
    {
      id: 'latte',
      name: 'لاتيه كريمي دافئ',
      nameEn: 'Warm Latte',
      bgColor: '#FDF8F2',
      textColor: '#451A03',
      subTextColor: '#92400E',
      frameBg: '#F5EBE1',
      headerText: 'MEMORIES • موميريز',
      footerText: 'COFFEE MOMENT • ROASTERY',
      badge: 'ROAST',
    },
    {
      id: 'matcha',
      name: 'ماتشا هادئ مينيمال',
      nameEn: 'Soft Matcha',
      bgColor: '#F4F7F4',
      textColor: '#064E3B',
      subTextColor: '#047857',
      frameBg: '#E7EFE6',
      headerText: 'MEMORIES • موميريز',
      footerText: 'MINIMAL BOTANICAL STRIP',
      badge: 'MINIMAL',
    },
    {
      id: 'rose',
      name: 'وردي باستيل ناعم',
      nameEn: 'Pastel Rose',
      bgColor: '#FFF5F5',
      textColor: '#881337',
      subTextColor: '#BE123C',
      frameBg: '#FCE7EA',
      headerText: 'MEMORIES • موميريز',
      footerText: 'SWEET MEMORIES • LIMITED',
      badge: 'STUDIO',
    },
  ],
  freeGift: {
    enabled: true,
    title: 'قطعة كوكيز أو حلى مجاناً مع شريط صورك 🥐🍪',
    description: 'استلم هديتك المجانية فوراً من الباريستا أو الكاونتر عند إبراز كود الهدية!',
    terms: 'صالحة للاستلام الفوري مع طباعة شريط الصور',
  },
};
