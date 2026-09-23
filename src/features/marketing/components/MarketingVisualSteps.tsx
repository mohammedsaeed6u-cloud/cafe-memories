'use client';

import React from 'react';
import { QrCode, ShieldCheck, Camera, Share2, Printer, Check, Gift } from 'lucide-react';

export function MarketingVisualSteps() {
  const steps = [
    {
      step: '01',
      title: 'التقاط اللحظة بالهاتف',
      badge: 'بدون أي تطبيق',
      desc: 'يمسح الزائر رمز الطاولة بكاميرا هاتفه فيفتح استوديو التصوير المخصص بهوية مقهاك فوراً، ليلتقط صوراً مميزة بألوان ونمط الكافيه وبدون أي تسجيل معقد.',
      icon: Camera,
      tag: 'تجربة فورية بلمسة واحدة',
    },
    {
      step: '02',
      title: 'تفاعل الصالة الحي',
      badge: 'شاشة الصالة الحية',
      desc: 'بموافقة الزائر واعتماد الموظف، تنضم الصورة إلى شاشة الصالة الحية (Live Wall) لتخلق أجواءً حية وتفاعلاً مجتمعياً أنيقاً يراه جميع رواد المقهى.',
      icon: Share2,
      tag: 'أجواء تفاعلية دافئة',
    },
    {
      step: '03',
      title: 'مكافأة الولاء التقديرية',
      badge: 'Apple & Google Wallet',
      desc: 'يجمع الزائر أختاماً رقمية مع كل زيارة تُحفظ في كارت المحفظة بهاتفه، وعند اكتمال الخانات تُفتح له مكافأة أو هدية تقديرية من المقهى.',
      icon: Gift,
      tag: 'كارت في محفظة الهاتف',
    },
    {
      step: '04',
      title: 'تكرار زيارة الزبائن',
      badge: 'ارتباط عاطفي مستمر',
      desc: 'الكارت المحفوظ بهاتفه مع الذكرى المطبوعة أو الرقمية يمنحان الزائر سبباً دائماً لاختيار مقهاك وتكرار زياراته بصحبة أصدقائه.',
      icon: ShieldCheck,
      tag: 'ولاء حقيقي وملموس',
    },
    {
      step: '05',
      title: 'قياس الأثر ونمو المبيعات',
      badge: 'لوحة تحكم وتحليلات',
      desc: 'يرى صاحب الكافيه بوضوح: أعداد الزيارات، تفاعل الزوار، نسبة العملاء العائدين، والمكافآت المستردة لاتخاذ قرارات بيع وتشغيل دقيقة.',
      icon: QrCode,
      tag: 'قرارات مبنية على الأرقام',
    },
  ];

  return (
    <section id="customer-journey" className="px-6 py-20 max-w-6xl mx-auto border-t border-stone-200/80">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
          THE GUEST EXPERIENCE • رحلة العميل
        </span>
        <h2
          className="text-3xl sm:text-5xl font-black text-stone-950 mt-2.5 font-serif"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          خمس خطوات مدروسة من الطاولة إلى التذكار الدائم.
        </h2>
        <p className="text-sm sm:text-base text-stone-600 mt-3.5 leading-relaxed">
          تجربة مصممة بعناية فائقة لتكون خالية من التعقيد، تمنح رواد مقهاك بهجة التوثيق الفوري وتضمن عودتهم مرات متتالية.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className={`p-7 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200 ${
                idx === 2 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 text-stone-900 flex items-center justify-center shadow-2xs">
                    <Icon className="w-5 h-5 text-stone-800" />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    STEP {s.step}
                  </span>
                </div>

                <div className="inline-block text-[10px] font-bold text-stone-500 mb-1">
                  {s.badge}
                </div>
                <h3
                  className="font-black text-lg text-stone-950 mb-2.5 font-serif leading-snug"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                >
                  {s.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono font-bold text-stone-500">
                <span>{s.tag}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
