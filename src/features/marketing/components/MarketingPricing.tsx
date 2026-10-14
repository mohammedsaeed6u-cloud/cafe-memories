'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

export function MarketingPricing() {
  const plans = [
    {
      id: 'starter',
      tier: 'Cloud Starter',
      name: 'Cloud Starter',
      price: '199',
      period: 'ريال / شهرياً',
      subtitle: 'للمقاهي والمتاجر المستقلة للتخلص الفوري من تكلفة الكروت الورقية',
      popular: false,
      features: [
        'كروت ولاء رقمية غير محدودة في Apple & Google Wallet',
        'رمز QR ذكي لطاولات الفرع والكاونتر بدون تطبيق',
        'محطة كاشير برمز PIN سريع لموظفي الفرع',
        'تنبيهات شاشة القفل عند كل ختم جديد',
        'لوحة تحكم مباشرة لقياس عدد الأختام اليومية',
      ],
      ctaText: 'ابدأ تجربة Cloud Starter مجاناً',
      ctaHref: '/login?tab=signup',
    },
    {
      id: 'growth',
      tier: 'Growth & Loyalty',
      name: 'Growth & Loyalty',
      price: '390',
      period: 'ريال / شهرياً',
      subtitle: 'الباقة الأكثر طلباً لمضاعفة تكرار زيارات العملاء وتشغيل شاشة الصالة',
      popular: true,
      features: [
        'كافة مميزات باقة Cloud Starter بدون أي حدود',
        'شاشة الصالة التفاعلية 4K Live Wall للعرض المباشر',
        'تنبيهات جغرافية تلقائية (Geofencing) عند الاقتراب 100م',
        'بث رسائل وعروض ترويجية لجميع حاملي الكارت',
        'لوحة تحليلات متقدمة وخريطة أوقات الذروة Heatmap',
        'دعم فني مخصص وأولوية على مدار الساعة',
      ],
      ctaText: 'ابدأ تجربة Growth & Loyalty مجاناً',
      ctaHref: '/login?tab=signup',
    },
    {
      id: 'enterprise',
      tier: 'Enterprise Chains',
      name: 'Enterprise Chains',
      price: 'مخصص',
      period: 'سلاسل الفروع الكبرى',
      subtitle: 'للعلامات التجارية الكبرى والسلاسل التي تتطلب إدارة موحدة لعشرات الفروع',
      popular: false,
      features: [
        'إدارة مركزية متعددة الفروع والفريق بصلاحيات مخصصة',
        'ربط برمجي مخصص API & Webhooks مع أنظمة POS السحابية',
        'مدير حساب تنفيذي وتدريب ميداني لطواقم العمل',
        'اتفاقية مستوى الخدمة SLA بنسبة جاهزية 99.99%',
        'شهادات أمان مخصصة وعزل كامل لقواعد البيانات',
      ],
      ctaText: 'تحدث مع فريق Enterprise Chains',
      ctaHref: '#contact',
    },
  ];

  const chips = [
    'Apple & Google Wallet passes',
    'Unlimited customer stamps',
    'Real-time APNs push',
    'Geofence proximity 100m',
    'Peak hours heatmap matrix',
    'Counter terminal & staff PIN',
    'Interactive 4K Live Wall',
    'Zero hardware required',
    'Cancel anytime',
  ];

  return (
    <section className="price-section" id="pricing">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="kicker">TWO PLANS. ONE TAP. • خطتان فقط. بساطة مطلقة.</span>
          <h2 className="h2-poster center">
            SIMPLE PRICING. <span className="purp">SERIOUS RETURNS.</span>
          </h2>
          <p className="sub-poster center">
            No hidden fees. No transaction cuts. Just happy regulars who keep coming back.
            <br className="hidden sm:inline" />
            استثمار بسيط يُغطي تكلفته في أسبوع واحد من زيادة تكرار زيارات عملائك.
          </p>
        </div>

        {/* Plan Grid */}
        <div className="plan-grid">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`plan-card ${p.popular ? 'feat' : ''}`}
            >
              {p.popular && (
                <div className="plan-badge">
                  ★ الأكثر اختياراً • MOST POPULAR
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-head text-2xl font-black text-[#1B1B1E] uppercase">
                    {p.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-[#682025] bg-[#FAF5EB] px-2 py-0.5 rounded-full uppercase">
                    {p.tier}
                  </span>
                </div>

                <p className="text-xs text-[#4a3a6a] leading-relaxed min-h-[36px]">
                  {p.subtitle}
                </p>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-white border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E] flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-head font-extrabold text-[#1B1B1E]">
                      {p.price}
                    </span>
                    <span className="text-xs font-bold text-[#8b7aaa]">
                      {p.price !== 'مخصص' ? 'ر.س' : ''}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#682025]">
                    {p.period}
                  </span>
                </div>

                {/* Features List */}
                <ul className="text-xs text-[#4a3a6a] space-y-2.5 pt-2">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#FAF5EB] text-[#682025] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        ✓
                      </div>
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t-2 border-[#e2dbf0]">
                <Link
                  href={p.ctaHref}
                  className={`w-full py-3.5 px-6 rounded-full font-head font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 border-2 border-[#1B1B1E] transition duration-150 cursor-pointer ${
                    p.popular
                      ? 'bg-[#682025] text-white shadow-[4px_4px_0_#1B1B1E] hover:shadow-[6px_6px_0_#1B1B1E] hover:bg-[#451215]'
                      : 'bg-white text-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E] hover:shadow-[5px_5px_0_#1B1B1E] hover:bg-[#F7F3EA]'
                  }`}
                >
                  <span>{p.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* All Inclusive Chips */}
        <div className="text-center pt-2">
          <span className="text-xs font-head font-bold uppercase text-[#8b7aaa] tracking-wider block mb-3">
            ALL PLANS INCLUDE • متضمن في جميع الباقات بدون استثناء
          </span>
          <div className="all-incl">
            {chips.map((chip, i) => (
              <span key={i} className="incl-chip">
                <span className="incl-chip-ck" />
                <span>{chip}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
