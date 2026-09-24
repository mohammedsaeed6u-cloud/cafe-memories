'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    question: 'هل يحتاج الزائر لتحميل تطبيق على هاتفه لتوثيق الصور وكروت الولاء؟',
    answer: 'إطلاقاً! منظومة memories مصممة بمبدأ Zero-App Friction. يمسح العميل كود الـ QR الموجود على طاولة الكافيه أو الكوستر بكاميرا هاتفه العادية، فيفتح له كارت التصوير الرقمي فوراً في متصفح Safari أو Chrome مع حفظ تلقائي لهويته وزياراته.',
  },
  {
    question: 'ما هي الأجهزة أو الشاشات المطلوبة لتشغيل شاشة الصالة الحية (Live Wall)؟',
    answer: 'تعمل المنظومة على أي شاشة تلفزيون ذكية (Smart TV) تحتوي على متصفح ويب، أو عبر أي جهاز رخيص مثل Chromecast أو Fire TV Stick أو Apple TV أو ميني PC. الاقتران يتم خلال ثوانٍ عبر كود PIN مؤقت وسري من لوحة تحكم التاجر دون كتابة كلمات سر.',
  },
  {
    question: 'ماذا يحدث إذا انقطع الإنترنت في الكافيه؟ هل تتوقف الشاشة الحية؟',
    answer: 'لا تتوقف أبداً! شاشة الصالة مزودة بنظام التخزين المؤقت المحلي (Offline Cache). عند انقطاع الإنترنت تستمر الشاشة في عرض آخر اللحظات والصور المخزنة محلياً بسلاسة تامة حتى عودة الاتصال ومزامنة الصور الجديدة تلقائياً.',
  },
  {
    question: 'كيف تتم حماية المتجر من التلاعب أو صرف الهدايا والأختام الوهمية؟',
    answer: 'التحقق من صحة الزيارات واستحقاق المكافآت يتم برمجياً على الخادم (Server-Side Verification) مع نظام منع التكرار خلال 24 ساعة (Cooldown Engine)، ولا يتم صرف الهدية للعميل إلا بإدخال رمز الـ Staff PIN السري المعتمد لطاقم العمل.',
  },
  {
    question: 'هل تدعم المنظومة طباعة كروت الصور على الطابعات الحرارية أو طابعات الصور؟',
    answer: 'نعم، المنظومة مزودة بنمط طباعة مخصص (@media print) متوافق مع ورق البولارويد وطابعات الصور مقاس 4×6 وطابعات الإيصالات الحرارية (80mm) لتقديم كارت صور ملموس للعميل كهدية تذكارية.',
  },
  {
    question: 'هل يمكن تخصيص ألوان وشعار نشاطك التجاري بالكامل على الكروت وشاشات الصالة؟',
    answer: 'نعم بكل تأكيد، من خلال لوحة التاجر يمكنك رفع شعار علامتك التجارية، وتحديد اسم الفرع، واختيار ألوان كارت البولارويد وقواعد مكافآت الولاء المناسبة لهوية نشاطك التجاري.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto font-cairo text-right">
      {FAQ_DATA.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="rounded-3xl border border-[#E8DCC6] dark:border-[#2A4F44] bg-white dark:bg-[#142721] overflow-hidden transition-all duration-200 shadow-2xs hover:shadow-xs"
          >
            <button
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-right cursor-pointer group"
            >
              <span className="font-bold text-sm sm:text-base text-[#1E3A32] dark:text-[#FAF6EE] group-hover:text-[#B85C43] transition-colors">
                {item.question}
              </span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 ${
                  isOpen
                    ? 'bg-[#1E3A32] text-[#FAF6EE] border-[#1E3A32] rotate-180'
                    : 'bg-[#FAF6EE] dark:bg-[#1E3A32] text-[#3B2F2A] dark:text-[#FAF6EE] border-[#E8DCC6] dark:border-[#2A4F44]'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isOpen && (
              <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#3B2F2A]/80 dark:text-[#FAF6EE]/80 leading-relaxed border-t border-[#E8DCC6]/60 dark:border-[#2A4F44]/60 animate-in fade-in duration-200">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
