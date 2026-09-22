'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function MarketingFaq() {
  const faqs = [
    {
      q: 'هل يحتاج العميل لتحميل أي تطبيق على هاتفه؟',
      a: 'إطلاقاً. المنظومة تعمل بالكامل عبر متصفح الجوال الافتراضي (Safari / Chrome). بمجرد مسح كود الـ QR الموجود على الطاولة تفتح واجهة الكافيه مباشرة في أقل من ثانية.',
    },
    {
      q: 'هل يحتاج مقهاي لشراء أي أجهزة أو كبائن تصوير خشبية؟',
      a: 'لا نهائياً (Zero CapEx). العميل يستخدم كاميرا هاتفه الذكي الشخصية، وأنت كصاحب مقهى تحتاج فقط إلى ستاندات الـ QR الأكريليك الأنيقة على الطاولات، وشاشة الصالة إن أردت.',
    },
    {
      q: 'كيف يختم الباريستا كارت العميل دون تعطيل طابور الطلبات؟',
      a: 'عملية الختم مصممة لتستغرق ثانيتين فقط: يمسح الباريستا كود العميل بكاميرا جهاز الكاشير أو يدخل العميل رمز الموظف السري (PIN) من 4 أرقام على هاتفه مباشرة أمام الباريستا.',
    },
    {
      q: 'هل يمكننا تخصيص مقاسات الأشرطة والألوان لتطابق هويتنا؟',
      a: 'نعم بالكامل. يمكنك تحديد عدد الصور (3 أو 4)، ومقاس الشريط (2×6 شريط طولي أو 4×6 بطاقة بريدية)، وألوان الخلفية والشعار والخطوط من لوحة تحكم التاجر بمرونة تامة.',
    },
    {
      q: 'كيف نضمن خصوصية الزوار على شاشة الصالة (TV Wall)؟',
      a: 'نحن نطبق سياسة خصوصية صارمة: لا تظهر أي صورة على شاشة الصالة إلا بعد اكتمال الكارت وموافقة العميل الصريحة بنقرة واضحة. وفي حال الرفض تظل الصور خاصة بالعميل فقط.',
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 px-6 max-w-4xl mx-auto border-t border-stone-200/80">
      <div className="text-center mb-14">
        <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
          FREQUENTLY ASKED • إجابات واضحة
        </span>
        <h2
          className="text-3xl sm:text-4xl font-black text-stone-950 mt-2 font-serif"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          كل ما تحتاج معرفته قبل الانطلاق.
        </h2>
      </div>

      <div className="space-y-3.5">
        {faqs.map((f, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={f.q}
              className="rounded-2xl border border-stone-200/90 bg-white overflow-hidden shadow-2xs transition"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full p-5 text-right flex items-center justify-between gap-4 font-bold text-sm text-stone-900 cursor-pointer"
              >
                <span>{f.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-stone-900' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
