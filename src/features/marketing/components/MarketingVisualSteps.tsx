'use client';

import React from 'react';
import { Camera, Share2, Gift, ShieldCheck, QrCode } from 'lucide-react';

export function MarketingVisualSteps() {
  const steps = [
    {
      step: '01',
      title: 'التقاط اللحظة بالهاتف',
      badge: 'بدون أي تطبيق',
      desc: 'يمسح الزائر رمز QR الطاولة بكاميرا هاتفه فيفتح استوديو التصوير المخصص بهوية علامتك التجارية فوراً، ليلتقط صوراً مميزة بألوان ونمط متجرك وبدون أي تسجيل معقد.',
      icon: Camera,
      tag: 'تجربة فورية بلمسة واحدة',
      accent: 'border-[#DD0200]/30',
    },
    {
      step: '02',
      title: 'تفاعل الصالة الحي',
      badge: 'شاشة الصالة 4K',
      desc: 'بموافقة الزائر واعتماد الموظف، تنضم الصورة إلى شاشة الصالة الحية (Live Wall) لتخلق أجواءً حية وتفاعلاً مجتمعياً أنيقاً يراه جميع رواد المكان.',
      icon: Share2,
      tag: 'أجواء تفاعلية دافئة',
      accent: 'border-white/15',
    },
    {
      step: '03',
      title: 'مكافأة الولاء التقديرية',
      badge: 'Apple & Google Wallet',
      desc: 'يجمع الزائر أختاماً رقمية مع كل زيارة تُحفظ في كارت المحفظة بهاتفه، وعند اكتمال الخانات تُفتح له مكافأة أو هدية تقديرية من نشاطك التجاري.',
      icon: Gift,
      tag: 'كارت في محفظة الهاتف',
      accent: 'border-white/15',
    },
    {
      step: '04',
      title: 'تكرار زيارة الزبائن',
      badge: 'ارتباط عاطفي مستمر',
      desc: 'الكارت المحفوظ بهاتفه مع الذكرى المطبوعة أو الرقمية يمنحان الزائر سبباً دائماً لاختيار علامتك التجارية وتكرار زياراته بصحبة أصدقائه.',
      icon: ShieldCheck,
      tag: 'ولاء حقيقي وملموس',
      accent: 'border-white/15',
    },
    {
      step: '05',
      title: 'قياس الأثر ونمو المبيعات',
      badge: 'لوحة تحكم وتحليلات',
      desc: 'يرى صاحب النشاط التجاري بوضوح: أعداد الزيارات، تفاعل الزوار، نسبة العملاء العائدين، والمكافآت المستردة لاتخاذ قرارات بيع وتشغيل دقيقة.',
      icon: QrCode,
      tag: 'قرارات مبنية على الأرقام',
      accent: 'border-[#DD0200]/30',
    },
  ];

  return (
    <section id="customer-journey" className="px-6 py-24 max-w-6xl mx-auto border-t border-white/10 apple-font">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-mono tracking-widest text-[#D9D9D9] uppercase mb-3 backdrop-blur-xl">
          <span>THE GUEST EXPERIENCE • رحلة العميل</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
          خمس خطوات مدروسة من الطاولة إلى التذكار الدائم.
        </h2>
        <p className="text-sm sm:text-base text-[#D9D9D9]/80 mt-3.5 leading-relaxed">
          تجربة مصممة بعناية فائقة لتكون خالية من التعقيد، تمنح رواد متجرك وصالتك بهجة التوثيق الفوري وتضمن عودتهم مرات متتالية.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className={
                'p-7 rounded-[30px] bg-white/[0.03] hover:bg-white/[0.06] border ' +
                s.accent +
                ' shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all duration-300 backdrop-blur-xl group relative overflow-hidden ' +
                (idx === 2 ? 'md:col-span-2 lg:col-span-1' : '')
              }
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#DD0200] px-2.5 py-1 rounded-full bg-[#DD0200]/10 border border-[#DD0200]/20">
                    STEP {s.step}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#D9D9D9]/70">
                    {s.badge}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1 leading-snug">
                    {s.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-[#D9D9D9]/80 leading-relaxed mt-2.5">
                  {s.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#D9D9D9]/70">
                  {s.tag}
                </span>
                <span className="text-xs text-[#DD0200] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  ✦
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
