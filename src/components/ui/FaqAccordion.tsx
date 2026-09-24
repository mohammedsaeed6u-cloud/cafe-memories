'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { AppleAccordion, AppleAccordionItem } from '@/components/ui/ark/AppleAccordion';

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
  return (
    <div className="max-w-3xl mx-auto font-cairo text-right">
      <AppleAccordion defaultValue={['faq-0']} collapsible multiple>
        {FAQ_DATA.map((item, idx) => (
          <AppleAccordionItem
            key={idx}
            value={`faq-${idx}`}
            title={item.question}
            icon={<HelpCircle className="w-4 h-4 text-[#0071E3]" />}
          >
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {item.answer}
            </p>
          </AppleAccordionItem>
        ))}
      </AppleAccordion>
    </div>
  );
}
