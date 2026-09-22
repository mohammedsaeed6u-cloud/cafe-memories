'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export function MarketingPricing() {
  const tiers = [
    {
      name: 'البوتيك المستقل (Single Location)',
      tagline: 'للمقاهي المختصة والمحامص الفردية',
      price: '490',
      period: 'ريال / شهرياً',
      isPopular: false,
      features: [
        'فرع واحد وكود QR موحد لكافة الطاولات',
        'أشرطة 2×6 بوصة وبطاقات 4×6 بوصة بهوية المقهى',
        'كارت أختام رقمي مع ختم الباريستا السريع',
        'شاشة صالة تفاعلية واحدة (TV Live Wall)',
        'لوحة تحكم كاملة للتاجر والـ CRM',
        'دعم تقني وتحديثات مستمرة',
      ],
      ctaText: 'ابدأ شراكة مقهاك',
      ctaHref: '/login',
    },
    {
      name: 'المقاهي المتعددة (Flagship & Chains)',
      tagline: 'للسلاسل المتنامية والمواقع الحيوية',
      price: '990',
      period: 'ريال / شهرياً',
      isPopular: true,
      features: [
        'حتى 5 فروع مع لوحة إدارة موحدة',
        'فريمات وألوان غير محدودة وتخصيص كامل للهوية',
        'محطة طباعة لاسلكية فورية (300 DPI)',
        'شاشات صالة متعددة لكل فرع على حدة',
        'تصدير بيانات العملاء والـ CRM المتقدم',
        'دعم مخصص وأولوية على مدار الساعة',
      ],
      ctaText: 'اختيار الأكثر طلباً',
      ctaHref: '/login',
    },
    {
      name: 'الشركات والفرانشايز (Enterprise White-Label)',
      tagline: 'للعلامات الكبرى والشبكات الواسعة',
      price: 'مخصص',
      period: 'حسب عدد الفروع والعتاد',
      isPopular: false,
      features: [
        'فروع غير محدودة وشبكة فرانشايز كاملة',
        'نطاق مخصص خاص بك (Custom Domain)',
        'تكامل كامل مع أنظمة نقاط البيع POS',
        'طابعات DNP حرارية مجهزة ومضبوطة',
        'مدير حساب خاص وتدريب ميداني للموظفين',
        'اتفاقية مستوى الخدمة SLA بنسبة 99.9%',
      ],
      ctaText: 'تواصل مع فريق المبيعات',
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
          className="text-3xl sm:text-5xl font-black text-stone-950 mt-2 font-serif"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          استثمار يغطي تكلفته من أول أسبوع.
        </h2>
        <p className="text-sm sm:text-base text-stone-600 mt-3.5">
          بدون عقود احتكارية معقدة، وبدون أي تكلفة لشراء أجهزة أو معدات خشبية باهظة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`p-8 rounded-3xl flex flex-col justify-between transition-all duration-200 ${
              tier.isPopular
                ? 'bg-stone-950 text-white shadow-xl ring-2 ring-amber-500 scale-[1.02]'
                : 'bg-white text-stone-900 border border-stone-200/90 shadow-xs hover:shadow-md'
            }`}
          >
            <div>
              {tier.isPopular && (
                <div className="inline-block text-[10px] font-mono uppercase tracking-widest bg-amber-500 text-stone-950 px-3 py-0.5 rounded-full font-black mb-4">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-lg font-black font-serif leading-tight">
                {tier.name}
              </h3>
              <p className={`text-xs mt-1 ${tier.isPopular ? 'text-stone-400' : 'text-stone-500'}`}>
                {tier.tagline}
              </p>

              <div className="my-6">
                <span className="text-4xl font-black font-mono">
                  {tier.price}
                </span>
                <span className={`text-xs mr-2 font-bold ${tier.isPopular ? 'text-stone-400' : 'text-stone-500'}`}>
                  {tier.period}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs">
                    <Check className={`w-4 h-4 shrink-0 ${tier.isPopular ? 'text-amber-400' : 'text-emerald-600'}`} />
                    <span className={tier.isPopular ? 'text-stone-200' : 'text-stone-700'}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <Link
                href={tier.ctaHref}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  tier.isPopular
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md font-black'
                    : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
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
