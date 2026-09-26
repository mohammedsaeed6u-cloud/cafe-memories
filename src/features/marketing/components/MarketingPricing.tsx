'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { AppleSwitch } from '@/components/ui/ark/AppleSwitch';

export function MarketingPricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  const tiers = [
    {
      id: 'digital',
      name: 'الرقمية (DIGITAL)',
      tagline: 'تجربة زائر وشاشة صالة وولاء رقمي كامل',
      monthlyPrice: '390',
      annualPrice: '312',
      period: 'ريال / شهرياً',
      isPopular: false,
      features: [
        'فوتوبوث الهاتف المباشر عبر رمز QR الطاولة',
        'شاشة الصالة الحية (TV Live Wall) للشاشات الذكية',
        'كروت ولاء رقمية في محفظة Apple و Google Wallet',
        'اعتماد ذكريات الصالة السريع للموظفين برمز PIN',
        'لوحة تحكم وتحليلات الزيارات ومعدل عودة العملاء',
        'تخصيص كامل للهوية والألوان وحساب إنستغرام',
      ],
      ctaText: 'بدء باقة DIGITAL',
      ctaHref: '/login',
    },
    {
      id: 'print',
      name: 'الطباعة (PRINT)',
      tagline: 'التجربة الرقمية + تذكار مطبوع ملموس',
      monthlyPrice: '690',
      annualPrice: '552',
      period: 'ريال / شهرياً',
      isPopular: true,
      features: [
        'كافة مميزات باقة DIGITAL الرقمية بالكامل',
        'محطة طباعة لاسلكية فورية (300 DPI عالية الدقة)',
        'استوديو فريمات متقدم بمقاسات 2×6 شريط و 4×6 كارت',
        'إدارة طابور الطباعة الحي الفوري لطاقم الكاونتر',
        'دعم الطابعات اللاسلكية والحرارية القياسية',
        'أولوية الدعم الفني وتحديثات مستمرة للمنظومة',
      ],
      ctaText: 'الباقة الأكثر طلباً للعلامات التجارية',
      ctaHref: '/login',
    },
    {
      id: 'multi',
      name: 'متعدد الفروع (MULTI)',
      tagline: 'للسلاسل المتنامية وإدارة الفروع المركزية',
      monthlyPrice: '1,190',
      annualPrice: '952',
      period: 'ريال / شهرياً (حتى 3 فروع)',
      isPopular: false,
      features: [
        'كافة مميزات باقتي DIGITAL و PRINT لكل الفروع',
        'لوحة إدارة موحدة للتحكم بكافة الفروع من مكان واحد',
        'شاشات صالة متعددة ومستقلة لكل فرع على حدة',
        'تحليلات مقارنة لأداء الفروع والعملاء العائدين',
        'صلاحيات وصول متعددة للمدراء وطواقم العمل',
        'تصدير بيانات وتقارير CRM مركزية',
      ],
      ctaText: 'إدارة الفروع المتعددة',
      ctaHref: '/login',
    },
    {
      id: 'enterprise',
      name: 'المؤسسات (ENTERPRISE)',
      tagline: 'للعلامات الكبرى والشبكات الواسعة',
      monthlyPrice: 'مخصص',
      annualPrice: 'مخصص',
      period: 'حسب حجم الفروع والمتطلبات',
      isPopular: false,
      features: [
        'فروع وشاشات غير محدودة للشبكة بالكامل',
        'تخصيص كامل للنطاق وهوية المنصة (White-Label)',
        'تكامل مخصص مع أنظمة نقاط البيع POS و ERP',
        'مدير حساب تنفيذي مخصص وتدريب ميداني للطاقم',
        'اتفاقية مستوى خدمة وتشغيل SLA بنسبة 99.9%',
      ],
      ctaText: 'تواصل مع فريق الحلول',
      ctaHref: '/login',
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 max-w-6xl mx-auto border-t border-white/10 apple-font">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-mono tracking-widest text-[#D9D9D9] uppercase mb-3 backdrop-blur-xl">
          <Layers className="w-3.5 h-3.5 text-[#DD0200]" />
          <span>TRANSPARENT PRICING • باقات الشراكة</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
          خطط اشتراك واضحة مبنية على القيمة.
        </h2>
        <p className="text-sm sm:text-base text-[#D9D9D9]/80 mt-3.5 leading-relaxed">
          اختر المستوى المناسب لعلامتك التجارية — من التجربة الرقمية الكاملة وحتى محطات الطباعة الفورية وإدارة الفروع المتعددة، بدون أي تكاليف خفية.
        </p>

        {/* Apple HIG Billing Switch with 20% discount */}
        <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl">
          <span className="text-xs font-semibold text-white">
            فاتورة شهرية
          </span>
          <AppleSwitch
            checked={isAnnual}
            onCheckedChange={(details) => setIsAnnual(details.checked)}
          />
          <span className="text-xs font-semibold flex items-center gap-1.5 text-white">
            <span>فاتورة سنوية</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DD0200] text-white font-bold">
              خصم 20%
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {tiers.map((tier) => {
          const displayPrice = isAnnual ? tier.annualPrice : tier.monthlyPrice;
          return (
            <div
              key={tier.id}
              className={
                'p-6 sm:p-7 rounded-2xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden backdrop-blur-xl ' +
                (tier.isPopular
                  ? 'bg-gradient-to-b from-[#240807] via-[#141212] to-[#0E0D0D] border border-[#DD0200]/40 shadow-[0_0_50px_-10px_rgba(221,2,0,0.3)] scale-[1.01]'
                  : 'bg-[#141212] hover:bg-[#1C1B1B] border border-white/10 shadow-lg')
              }
            >
              {/* Featured Aura Glow for Popular Card */}
              {tier.isPopular && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#DD0200]/15 rounded-full blur-2xl pointer-events-none" />
              )}

              <div>
                {tier.isPopular && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.15em] bg-[#55100D] border border-[#DD0200]/40 text-[#FBF9F5] px-2.5 py-1 rounded-md font-bold mb-4 shadow-sm">
                    <Sparkles className="w-3 h-3 text-[#DD0200]" />
                    <span>الأكثر طلباً للعلامات</span>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-white tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                  {tier.name}
                </h3>
                <p className="text-xs text-[#A19E9B] mt-1 leading-relaxed">
                  {tier.tagline}
                </p>

                <div className="mt-5 pb-5 border-b border-white/10 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-bold font-mono text-white">
                    {displayPrice}
                  </span>
                  <span className="text-[11px] font-medium text-[#A19E9B]">
                    {tier.period}
                  </span>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs leading-relaxed text-[#e6e1e1]">
                      <Check className={'w-4 h-4 shrink-0 mt-0.5 ' + (tier.isPopular ? 'text-[#DD0200]' : 'text-emerald-400')} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href={tier.ctaHref}
                  className={
                    'w-full py-3 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ' +
                    (tier.isPopular
                      ? 'bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-5px_rgba(221,2,0,0.4)] hover:scale-[1.01] active:scale-[0.98]'
                      : 'bg-white/10 hover:bg-white/15 text-[#FBF9F5] border border-white/10 hover:border-[#DD0200]/30 backdrop-blur-md hover:scale-[1.01] active:scale-[0.98]')
                  }
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
