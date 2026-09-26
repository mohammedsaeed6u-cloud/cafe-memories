'use client';

import React from 'react';
import { Layers, Repeat, Zap, Tv, Printer, Award, ArrowUpRight } from 'lucide-react';

export function MarketingRetentionLoop() {
  const pillars = [
    {
      num: '01',
      title: 'هوية بصرية متكاملة بشعار علامتك التجارية',
      desc: 'تظهر هوية وشعار وألوان علامتك على كل شريط تصوير، مع استوديو مخصص يمنح كل زائر تجربة متناسقة تماماً مع طابع نشاطك دون الحاجة لشراء أو صيانة كبائن مخصصة.',
      icon: Layers,
      benefit: 'ظهور مستمر لعلامتك التجارية مع كل ذكرى موثقة',
    },
    {
      num: '02',
      title: 'ولاء تفاعلي يشجع على تكرار الزيارة',
      desc: 'برامج النقاط التقليدية الجافة يسهل نسيانها، بينما ربط الزيارة بكارت صور رقمي يحفظ ذكريات الزائر مع أصدقائه يصنع ارتباطاً عاطفياً يشجع على تكرار الزيارات بصورة ملموسة.',
      icon: Repeat,
      benefit: 'ارتباط شعوري يعزز تكرار الزيارات بصورة مستمرة',
    },
    {
      num: '03',
      title: 'سرعة تشغيل فائقة لا تعطل طابور الكاونتر',
      desc: 'صُممت واجهة الختم لتعمل في ثانيتين فقط عبر PIN الموظف أو مسح سريع دون حاجة لأجهزة POS معقدة. يظل تركيز طاقم العمل منصباً على سرعة خدمة العملاء وتقديم أفضل تجربة.',
      icon: Zap,
      benefit: 'انسيابية مطلقة في ساعات الذروة المزدحمة',
    },
    {
      num: '04',
      title: 'شاشة صالة ذكية تحرك تفاعل رواد المكان',
      desc: 'بموافقة العميل الصريحة بنقرة واحدة، تُعرض اللقطات المعتمدة على شاشات تلفزيون الصالة بجودة 4K في تدفق بصري أنيق، ما يشعل حماس باقي الطاولات لتجربة التصوير ومشاركة اللحظة.',
      icon: Tv,
      benefit: 'تفاعل جماعي حقيقي يحرك مبيعات الصالة',
    },
    {
      num: '05',
      title: 'محطة طباعة لاسلكية فورية فائقة الدقة',
      desc: 'اتصال مباشر مع طابعات الصور الفوتوغرافية والحرارية (DNP / Canon Selphy) لإنتاج شريط صور مادي فخم بدقة 300 DPI يحتفظ به العميل في محفظته أو على مكتبه تذكيراً دائماً بعلامتك التجارية.',
      icon: Printer,
      benefit: 'تسويق مادي يومي في جيب ومكتب العميل',
    },
    {
      num: '06',
      title: 'عزل تام للبيانات واستقلالية كاملة لكل فرع',
      desc: 'لكل نشاط تجاري مساره المعزول، وقائمة عملائه الحقيقيين، وضوابطه المخصصة في عدد الصور ومقاسات الأشرطة ونوع الهدايا، مع صلاحيات إدارية مستقلة ومحمية بالكامل.',
      icon: Award,
      benefit: 'حماية خصوصية مطلقة واستقلالية براند كاملة',
    },
  ];

  return (
    <section id="business-operation" className="py-24 px-6 max-w-6xl mx-auto border-t border-white/10 apple-font">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-mono tracking-widest text-[#D9D9D9] uppercase mb-3 backdrop-blur-xl">
          <span>OPERATIONAL EXCELLENCE • تشغيل واستثمار البيزنس</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
          هندسة تشغيلية تضاعف عودة الزوار.
        </h2>
        <p className="text-sm sm:text-base text-[#A19E9B] mt-3.5 leading-relaxed">
          حلول برمجية سلسة مصممة خصيصاً لتفادي تعقيدات العتاد والبرمجيات المزعجة، ولتمنح علامتك التجارية سلاحاً تسويقياً فريداً يميزك عن المنافسين.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.num}
              className="p-7 rounded-2xl bg-[#141212] hover:bg-[#1C1B1B] border border-white/10 hover:border-[#DD0200]/30 shadow-xl flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 backdrop-blur-xl group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center shadow-lg shadow-red-950/50 border border-white/20 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#A19E9B]">
                    PILLAR {p.num}
                  </span>
                </div>

                <h3 className="font-semibold text-lg text-white mb-2 leading-snug" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#A19E9B] leading-relaxed">
                  {p.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#DD0200] flex items-center gap-1">
                  <span>{p.benefit}</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#DD0200] opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
