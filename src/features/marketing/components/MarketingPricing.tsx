'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export function MarketingPricing() {
  const tiers = [
    {
      name: 'الرقمية (DIGITAL)',
      tagline: 'تجربة زائر وشاشة صالة وولاء رقمي كامل',
      price: '390',
      period: 'ريال / شهرياً',
      isPopular: false,
      features: [
        'فوتوبوث الهاتف المباشر عبر رمز QR الطاولة',
        'شاشة الصالة الحية (TV Live Wall) للشاشات الذكية',
        'كروت ولاء رقمية في محفظة Apple و Google Wallet',
        'اعتماد ذكريات الصالة السريع للموظفين',
        'لوحة تحكم وتحليلات الزيارات والولاء',
        'تخصيص كامل للهوية والألوان وحساب إنستغرام',
      ],
      ctaText: 'بدء باقة DIGITAL',
      ctaHref: '/login',
    },
    {
      name: 'الطباعة (PRINT)',
      tagline: 'التجربة الرقمية + تذكار مطبوع ملموس',
      price: '690',
      period: 'ريال / شهرياً',
      isPopular: true,
      features: [
        'كافة مميزات باقة DIGITAL الرقمية بالكامل',
        'محطة طباعة لاسلكية فورية (300 DPI عالية الدقة)',
        'استوديو فريمات متقدم بمقاسات 2×6 شريط و 4×6 كارت',
        'إدارة طابور الطباعة الحي المباشر للباريستا',
        'دعم الطابعات اللاسلكية والحرارية القياسية',
        'أولوية الدعم الفني وتحديثات مستمرة',
      ],
      ctaText: 'الأكثر اختياراً للمقاهي',
      ctaHref: '/login',
    },
    {
      name: 'متعدد الفروع (MULTI-LOCATION)',
      tagline: 'للسلاسل المتنامية وإدارة الفروع المركزية',
      price: '1,190',
      period: 'ريال / شهرياً (حتى 3 فروع)',
      isPopular: false,
      features: [
        'كافة مميزات باقتي DIGITAL و PRINT لكل الفروع',
        'لوحة إدارة موحدة للتحكم بكافة الفروع من مكان واحد',
        'شاشات صالة متعددة ومستقلة لكل فرع على حدة',
        'تحليلات مقارنة لأداء الفروع والعملاء العائدين',
        'صلاحيات وصول متعددة للمدراء والباريستا',
        'تصدير بيانات وتقارير CRM مركزية',
      ],
      ctaText: 'إدارة الفروع المتعددة',
      ctaHref: '/login',
    },
    {
      name: 'المؤسسات (ENTERPRISE)',
      tagline: 'للعلامات الكبرى والشبكات الواسعة',
      price: 'مخصص',
      period: 'حسب حجم الفروع والمتطلبات',
      isPopular: false,
      features: [
        'فروع وشاشات غير محدودة للشبكة بالكامل',
        'تخصيص كامل للنطاق وهوية المنصة (White-Label)',
        'تكامل مخصص مع أنظمة نقاط البيع POS',
        'مدير حساب تنفيذي مخصص وتدريب ميداني',
        'اتفاقية مستوى خدمة وتشغيل SLA بنسبة 99.9%',
      ],
      ctaText: 'تواصل مع فريق الحلول',
      ctaHref: '/login',
    },
  ];

  return (
    <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto border-t border-stone-200/80">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
          TRANSPARENT PRICING • باقات الشراكة
        </span>
        <h2
          className="text-3xl sm:text-5xl font-black text-stone-900 mt-2 font-serif"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          خطط اشتراك واضحة مبنية على القيمة.
        </h2>
        <p className="text-sm sm:text-base text-stone-600 mt-3.5">
          اختر المستوى المناسب لمقهاك — من التجربة الرقمية الكاملة وحتى محطات الطباعة الفورية والفروع المتعددة، بدون عقود احتكارية أو كبائن تصوير خشبية باهظة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`p-6 sm:p-7 rounded-3xl flex flex-col justify-between transition-all duration-200 ${
              tier.isPopular
                ? 'bg-[#241E1C] text-white shadow-xl ring-2 ring-amber-500 scale-[1.02]'
                : 'bg-white text-stone-900 border border-stone-200/90 shadow-xs hover:shadow-md'
            }`}
          >
            <div>
              {tier.isPopular && (
                <div className="inline-block text-[10px] font-mono uppercase tracking-widest bg-amber-500 text-stone-950 px-3 py-0.5 rounded-full font-black mb-3">
                  الأكثر طلباً
                </div>
              )}

              <h3 className="text-base font-black font-serif leading-tight">
                {tier.name}
              </h3>
              <p className={`text-xs mt-1 leading-relaxed ${tier.isPopular ? 'text-stone-300' : 'text-stone-500'}`}>
                {tier.tagline}
              </p>

              <div className="mt-5 pb-5 border-b border-stone-200/60 flex items-baseline gap-1">
                <span className="text-3xl font-black font-mono">{tier.price}</span>
                <span className={`text-[11px] font-medium mr-1 ${tier.isPopular ? 'text-stone-400' : 'text-stone-500'}`}>
                  {tier.period}
                </span>
              </div>

              <ul className="mt-5 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs leading-relaxed">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${tier.isPopular ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span className={tier.isPopular ? 'text-stone-200' : 'text-stone-700'}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 pt-4">
              <Link
                href={tier.ctaHref}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                  tier.isPopular
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-black'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300'
                }`}
              >
                <span>{tier.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
