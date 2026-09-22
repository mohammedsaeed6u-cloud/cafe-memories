'use client';

import React from 'react';
import { QrCode, ShieldCheck, Camera, Share2, Printer, Check, Gift } from 'lucide-react';

export function MarketingVisualSteps() {
  const steps = [
    {
      step: '01',
      title: 'مسح باركود الطاولة (Table QR Scan)',
      badge: 'بدون أي تطبيق',
      desc: 'يجلس العميل على طاولته، وبمجرد فتح كاميرا هاتفه ومسح كود الـ QR الأنيق؛ يفتح استوديو التصوير المخصص باسم وهوية الكافيه دون تحميل أي تطبيق أو انتظار تسجيل معقد.',
      icon: QrCode,
      tag: 'Zero-App Friction',
    },
    {
      step: '02',
      title: 'ختم فوري من الباريستا (Instant Staff Stamp)',
      badge: 'ثانيتان فقط',
      desc: 'عند استلام طلبه؛ يختم الباريستا كارت العميل بلمسة سريعة أو عبر رمز الموظف السري (PIN)، فيُمنح العميل ختماً رقمياً ورصيد لقطة حية فورية تضاف لكارته.',
      icon: ShieldCheck,
      tag: 'Staff PIN / Direct Stamp',
    },
    {
      step: '03',
      title: 'التقاط وتنسيق اللقطات (Capture & Curate)',
      badge: '2×6 & 4×6',
      desc: 'يوثق العميل لحظته عبر كاميرا هاتفه أو يختار من استوديو الصور، مع حرية التبديل بين شريط الفوتوبوث الكوري 2×6 سم أو كارت البوستكارد 4×6 سم مع فلاتر نوار وكافيه الحصرية.',
      icon: Camera,
      tag: 'Viral Frame Studio',
    },
    {
      step: '04',
      title: 'منشن انستجرام ومضاعفة الوصول (Instagram Story)',
      badge: 'تسويق عضوي فاخر',
      desc: 'بنقرة واحدة، يشارك العميل شريط ذكرياته الأنيق على ستوري انستجرام مع منشن تلقائي لحساب الكافيه، ليتحول كل زائر إلى سفير حقيقي ينقل أجواء المكان لأصدقائه.',
      icon: Share2,
      tag: 'Viral Story Loop',
    },
    {
      step: '05',
      title: 'طباعة فورية وهدية الإكمال (Print & Milestone Gift)',
      badge: '300 DPI دقة حقيقية',
      desc: 'تُطبع الصورة فورياً عبر محطة الطباعة اللاسلكية لاستلامها كتذكار ملموس، وبمجرد اكتمال خانات الكارت يظهر كود استلام مشروب أو هدية حصرية تقديراً لوفائه.',
      icon: Gift,
      tag: 'Tangible Loyalty Reward',
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
