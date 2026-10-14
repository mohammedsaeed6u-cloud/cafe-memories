/**
 * Business industry options and industry profile lookup.
 * Split out of photobooth-presets.ts; the barrel file re-exports everything.
 */
export const BUSINESS_INDUSTRY_OPTIONS = [
  {
    id: 'cafe',
    nameAr: 'كافيه ومحمصة مختصة',
    nameEn: 'Cafe & Specialty Roastery',
    icon: 'coffee',
    defaultGiftTitle: 'مشروب سبيشالتي مجاني',
    defaultGiftSubtitle: 'أظهر الكارت لموظف الكاونتر لاستلام مشروبك المجاني',
    staffLabel: 'موظف الكاونتر',
  },
  {
    id: 'restaurant',
    nameAr: 'مطعم ومفهوم طعام',
    nameEn: 'Restaurant & Dining',
    icon: 'dining',
    defaultGiftTitle: 'طبق حلى أو مقبلات مجانية',
    defaultGiftSubtitle: 'أظهر الكارت لموظف الخدمة لاستلام طبقك المجاني',
    staffLabel: 'مقدم الخدمة',
  },
  {
    id: 'retail',
    nameAr: 'متجر ملابس وبوتيك أزياء',
    nameEn: 'Fashion Boutique & Retail',
    icon: 'retail',
    defaultGiftTitle: 'خصم 20% أو قسيمة شراء',
    defaultGiftSubtitle: 'أظهر الكارت للكاشير لتطبيق الخصم فوراً',
    staffLabel: 'الكاشير',
  },
  {
    id: 'salon',
    nameAr: 'صالون تجميل وعناية وسبا',
    nameEn: 'Beauty Salon, Barber & Spa',
    icon: 'salon',
    defaultGiftTitle: 'جلسة عناية أو استشوار مجاني',
    defaultGiftSubtitle: 'أظهر الكارت للاستقبال لتفعيل الجلسة المجانية',
    staffLabel: 'الاستقبال',
  },
  {
    id: 'entertainment',
    nameAr: 'ترفيه، بولينج وملاهي',
    nameEn: 'Entertainment & Gaming',
    icon: 'gaming',
    defaultGiftTitle: 'جولة لعب إضافية مجاناً',
    defaultGiftSubtitle: 'أظهر الكارت لمسؤول الألعاب لبدء جولتك المجانية',
    staffLabel: 'مشرف الألعاب',
  },
  {
    id: 'events',
    nameAr: 'معارض وفعاليات ومؤتمرات',
    nameEn: 'Events & Popups',
    icon: 'events',
    defaultGiftTitle: 'هدية تذكارية خاصة بالفعالية',
    defaultGiftSubtitle: 'أظهر الكارت لمنظمي الفعالية لاستلام هديتك',
    staffLabel: 'منظم الفعالية',
  },
  {
    id: 'general',
    nameAr: 'مساحات وتجارب أخرى',
    nameEn: 'General Business & Spaces',
    icon: 'general',
    defaultGiftTitle: 'هدية أو مكافأة خاصة بالعملاء الأوفياء',
    defaultGiftSubtitle: 'أظهر الكارت لفريق المكان لاستلام مكافأتك',
    staffLabel: 'فريق المكان',
  },
] as const;

export function getIndustryProfile(businessType?: string) {
  const found = BUSINESS_INDUSTRY_OPTIONS.find((opt) => opt.id === businessType);
  return found || BUSINESS_INDUSTRY_OPTIONS[6]; // defaults to 'general'
}

