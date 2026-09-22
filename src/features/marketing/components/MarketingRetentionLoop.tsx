'use client';

import React from 'react';
import { Layers, Repeat, Zap, Tv, Printer, Award } from 'lucide-react';

export function MarketingRetentionLoop() {
  const pillars = [
    {
      num: '01',
      title: 'شراكة Co-Branding بدون تكلفة عتاد (Zero Hardware CapEx)',
      desc: 'لا حاجة لإنفاق 3,000 إلى 7,000 دولار على كبائن خشبية ضخمة تلتهم مساحة الصالة وتحتاج صيانة دورية. هواتف الزوار هي الكابينة الذكية، وشريط التصوير يبرز شعار وهوية مقهاك في كل لقطة.',
      icon: Layers,
      benefit: 'صفر استثمار عتادي، وتغطية 100% لكافة الطاولات',
    },
    {
      num: '02',
      title: 'حلقة ولاء عاطفي ترفع تكرار الزيارة بنسبة 300%',
      desc: 'برامج الخصومات التقليدية والنقاط الجافة تُنسى سريعاً. أما حين يربط العميل قهوة الصباح بلقطات تجمع أصدقائه في كارت ذكريات ملموس، يصبح العودة لإكمال الكارت عادة طبيعية.',
      icon: Repeat,
      benefit: 'ارتباط شعوري عميق يضمن ولاء طويل الأمد',
    },
    {
      num: '03',
      title: 'سرعة قصوى دون تعطيل طابور الكاونتر (Zero Friction)',
      desc: 'صُممت واجهة الختم لتعمل في ثانيتين فقط عبر PIN الموظف أو مسح سريع دون حاجة لأجهزة POS معقدة. يظل تركيز الباريستا منصباً على سرعة الإعداد وجودة فنجان القهوة.',
      icon: Zap,
      benefit: 'انسيابية مطلقة في ساعات الذروة (Peak Hours)',
    },
    {
      num: '04',
      title: 'شاشة الصالة الرقمية التفاعلية (In-Store TV Wall)',
      desc: 'بموافقة العميل الصريحة بنقرة واحدة، تُعرض اللقطات المعتمدة على شاشات تلفزيون الصالة بجودة 4K في تدفق بصري أنيق، ما يشعل حماس باقي الطاولات لتجربة التصوير ومشاركة اللحظة.',
      icon: Tv,
      benefit: 'تفاعل جماعي حقيقي يحرك مبيعات الصالة',
    },
    {
      num: '05',
      title: 'محطة الطباعة الذاتية اللاسلكية (Wireless Print Station)',
      desc: 'اتصال مباشر مع طابعات الصور الفوتوغرافية والحرارية (DNP / Canon Selphy) لإنتاج شريط صور مادي فخم بدقة 300 DPI يحتفظ به العميل في محفظته أو على مكتبه تذكيراً دائماً بكافيهك.',
      icon: Printer,
      benefit: 'تسويق مادي يومي في جيب ومكتب العميل',
    },
    {
      num: '06',
      title: 'عزل تام للبيانات وتحكم فوري (True Multi-Tenant)',
      desc: 'لكل كافيه مساره المعزول، وقائمة عملائه الحقيقيين، وضوابطه المخصصة في عدد الصور ومقاسات الأشرطة ونوع الهدايا، مع صلاحيات إدارية مستقلة ومحمية بالكامل.',
      icon: Award,
      benefit: 'حماية خصوصية مطلقة واستقلالية براند كاملة',
    },
  ];

  return (
    <section id="business-operation" className="py-20 px-6 max-w-6xl mx-auto border-t border-stone-200/80">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
          OPERATIONAL EXCELLENCE • تشغيل واستثمار البيزنس
        </span>
        <h2
          className="text-3xl sm:text-5xl font-black text-stone-950 mt-2.5 font-serif"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          كيف يعمل النظام في مقهاك لتحقيق أعلى عائد؟
        </h2>
        <p className="text-sm sm:text-base text-stone-600 mt-3.5 leading-relaxed">
          هندسة تشغيلية مصممة خصيصاً لتفادي تعقيدات العتاد والبرمجيات المزعجة، ولتمنح علامتك التجارية سلاحاً تسويقياً فريداً يميزك عن المنافسين.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.num}
              className="p-7 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-stone-950 text-white flex items-center justify-center shadow-xs">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-xs font-mono font-bold text-stone-400">
                    PILLAR {p.num}
                  </span>
                </div>

                <h3
                  className="font-black text-base text-stone-950 mb-2.5 font-serif leading-snug"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                >
                  {p.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {p.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100">
                <span className="text-[11px] font-bold text-amber-800 block">
                  {p.benefit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
