'use client';

import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

export function MarketingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'هل يحتاج عميلي لتحميل أي تطبيق على هاتفه؟',
      a: 'لا، نهائياً وبشكل قاطع. يمسح العميل رمز الـ QR بكاميرا هاتفه فيفتح الكارت مباشرة في المتصفح ويُحفظ بنقرة واحدة في محفظة Apple Wallet أو Google Wallet الرسمية المثبتة مسبقاً في جهازه.',
    },
    {
      q: 'هل أحتاج لشراء أجهزة كاشير POS جديدة أو جهاز مخصص؟',
      a: 'لا، ستامبي يعمل سحابياً بالكامل. يمكنك إدارة الكروت والختم من أي شاشة كاشير، هاتف، أو تابلت موجود في متجرك حالياً عبر المتصفح برمز PIN سريع لا يستغرق أكثر من ثانيتين.',
    },
    {
      q: 'كم يستغرق تجهيز وإطلاق كارت متجري؟',
      a: 'دقيقتان فقط. ترفع شعار علامتك، تختار ألوانك ورمز الختم والهدية، وتطبع رمز الـ QR لتبدأ فوراً مع أول زبون يدخل متجرك اليوم.',
    },
    {
      q: 'كيف تعمل تنبيهات شاشة القفل التلقائية (Geofencing)؟',
      a: 'محافظ Apple & Google تدعم تحديد الموقع الجغرافي المدمج. بمجرد اقتراب حامل الكارت من متجرك بمسافة 100 متر، يضيء هاتفه تلقائياً بإشعار ترحيبي يذكره بزيارتكم واستلام مكافأته، مجاناً بالكامل وبدون رسوم رسائل SMS.',
    },
    {
      q: 'هل يمكنني إلغاء الاشتراك في أي وقت؟',
      a: 'نعم، بكل سهولة ومن نقرة واحدة في الإعدادات. لا توجد أي عقود سنوية ملزمة ولا رسوم خفية.',
    },
  ];

  return (
    <section className="faq-section py-20 px-4 bg-[#F7F3EA] border-b-[2.5px] border-[#1B1B1E]" id="faq">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="kicker">FREQUENTLY ASKED QUESTIONS</span>
          <h2 className="h2-poster center">
            GOT QUESTIONS? <span className="purp">WE GOT TAPS.</span>
          </h2>
          <p className="sub-poster center">
            Everything you need to know about ditching paper and owning your customer relationship.
            <br className="hidden sm:inline" />
            كل ما تحتاج معرفته عن كروت الولاء الرقمية واستبدال الكروت الورقية للأبد.
          </p>
        </div>

        {/* Neo-brutalist Accordion Items */}
        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border-[2.5px] border-[#1B1B1E] shadow-[4px_4px_0_#1B1B1E] transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <span className="font-head text-lg sm:text-xl font-black text-[#1B1B1E] uppercase tracking-tight">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full border-2 border-[#1B1B1E] flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'bg-[#f0456a] text-white rotate-180' : 'bg-[#FAF5EB] text-[#682025]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 stroke-[3]" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-sm text-[#4a3a6a] leading-relaxed border-t-2 border-[#e2dbf0] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
