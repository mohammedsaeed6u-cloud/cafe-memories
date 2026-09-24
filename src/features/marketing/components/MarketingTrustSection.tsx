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
    <section id="trust" className="py-24 px-6 max-w-6xl mx-auto border-t border-white/10 apple-font">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-mono tracking-widest text-[#D9D9D9] uppercase mb-3 backdrop-blur-xl">
          <Lock className="w-3.5 h-3.5 text-[#DD0200]" />
          <span>SECURITY & PRIVACY • الأمان والخصوصية</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
          أمان وخصوصية مبنية على ثقة روادك.
        </h2>
        <p className="text-sm sm:text-base text-[#D9D9D9]/80 mt-3.5 leading-relaxed">
          صُممت المنظومة لتكون منصة ضيافة محترمة ترعى خصوصية العميل ولا تكشف بياناته الشخصية، مع التزام تام بالمعايير التشغيلية المعتمدة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trustPoints.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-7 rounded-[30px] bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 shadow-lg flex flex-col justify-between hover:border-white/20 transition-all duration-300 backdrop-blur-xl group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#D9D9D9]/80 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <span className="text-[10px] font-mono text-[#DD0200] font-bold">
                  VERIFIED PROTOCOL
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
