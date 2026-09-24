'use client';

import React from 'react';
import { ShieldCheck, Lock, EyeOff, UserCheck, Trash2, Database } from 'lucide-react';

export function MarketingTrustSection() {
  const trustPoints = [
    {
      title: 'موافقة الزائر المسبقة (Customer Consent)',
      desc: 'لا تُعرض أي صورة على شاشة الصالة دون موافقة صريحة بنقرة واضحة من الزائر، مع إمكانية الاحتفاظ بالصورة خاصة في محفظته الشخصية فقط.',
      icon: EyeOff,
    },
    {
      title: 'عزل تام لبيانات كل مقهى (Tenant Isolation)',
      desc: 'بيانات نشاطك التجاري، سجلات عملائك، وصور روادك معزولة بالكامل في مسار سحابي مستقل مشفر، ولا يمكن لأي نشاط آخر الاطلاع عليها.',
      icon: Database,
    },
    {
      title: 'صلاحيات وصول محمية (Role-Based Access)',
      desc: 'فصل تام بين صلاحيات طاقم الخدمة والكاونتر (منح الأختام واعتماد الذكريات برمز PIN) وصلاحيات الإدارة والتحليلات والإعدادات.',
      icon: UserCheck,
    },
    {
      title: 'حق الحذف الفوري (Data Deletion)',
      desc: 'يحق لأي زائر طلب حذف صوره وسجلاته في أي وقت بضغطة زر من صفحة التجربة، كما تملك إدارة النشاط صلاحية حذف أو إخفاء أي محتوى فوراً.',
      icon: Trash2,
    },
    {
      title: 'تشفير كامل عبر بروتوكول HTTPS',
      desc: 'كافة عمليات مسح الرموز، نقل الصور، وتسجيل الأختام الرقمية تتم عبر قنوات اتصال مشفرة بأعلى معايير الأمان السحابي.',
      icon: Lock,
    },
    {
      title: 'سياسة حفظ بيانات نظيفة (Clean Retention)',
      desc: 'تطبيق أحدث معايير ضغط ومعالجة الصور السحابية (WebP) مع سياسة دورية لتنظيف الملفات المؤقتة وحماية هوية الزوار.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="trust" className="py-20 px-6 max-w-6xl mx-auto border-t border-stone-200/80">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
          SECURITY & PRIVACY • الأمان والخصوصية
        </span>
        <h2
          className="text-3xl sm:text-4xl font-black text-stone-900 mt-2 font-serif"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          أمان وخصوصية مبنية على ثقة روادك.
        </h2>
        <p className="text-sm sm:text-base text-stone-600 mt-3.5">
          صُممت Memories لتكون منصة ضيافة محترمة ترعى خصوصية العميل ولا تكشف بياناته الشخصية، مع التزام تام بالمعايير التشغيلية المعتمدة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trustPoints.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs transition"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-stone-900 mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
