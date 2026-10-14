'use client';

import React from 'react';
import { ShieldCheck, Lock, Trash2, Eye, Server, RefreshCw } from 'lucide-react';

export function MarketingTrustSection() {
  const trusts = [
    {
      title: 'موافقة الزائر المسبقة (Customer Consent)',
      desc: 'لا تُعرض أي صورة على شاشة الصالة دون موافقة صريحة بنقرة واضحة من الزائر.',
      icon: Eye,
    },
    {
      title: 'عزل تام لبيانات كل متجر (Tenant Isolation)',
      desc: 'بيانات نشاطك وسجلات زوارك معزولة بالكامل في مسار سحابي مستقل ومحمي.',
      icon: Server,
    },
    {
      title: 'صلاحيات وصول محمية (PIN Security)',
      desc: 'فصل تام بين صلاحيات الكاشير (برمز PIN السريع) وصلاحيات الإدارة والمالك.',
      icon: Lock,
    },
    {
      title: 'حق الحذف الفوري (Data Privacy)',
      desc: 'يحق لأي زائر طلب حذف صوره وسجلاته في أي لحظة بضغطة زر واحدة.',
      icon: Trash2,
    },
    {
      title: 'تشفير كامل عبر بروتوكول HTTPS & PKPass',
      desc: 'كافة عمليات المسح ونقل البيانات وتسجيل الأختام تتم عبر قنوات اتصال مشفرة بأمان.',
      icon: ShieldCheck,
    },
    {
      title: 'أداء فائق وسرعة استجابة سحابية',
      desc: 'معالجة صور فورية وضغط ذكي يضمن فتح الكارت في أجزاء من الثانية.',
      icon: RefreshCw,
    },
  ];

  return (
    <section className="py-20 px-4 bg-[#F7F3EA] border-b-[2.5px] border-[#1B1B1E]" data-purpose="security-privacy">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="kicker">SECURITY & COMPLIANCE</span>
          <h2 className="h2-poster center">
            BUILT FOR TRUST. <span className="purp">SCALED FOR ENTERPRISE.</span>
          </h2>
          <p className="sub-poster center">
            أمان وموثوقية مبنية على أعلى معايير السحاب العالمية ومعايير الخصوصية الصارمة.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-right">
          {trusts.map((t, idx) => {
            const Icon = t.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border-[2.5px] border-[#1B1B1E] shadow-[4px_4px_0_#1B1B1E] flex flex-col justify-between hover:shadow-[6px_6px_0_#682025] transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-[#FAF5EB] text-[#682025] font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#EADDC4]">
                      #0{idx + 1}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#FAF5EB] border border-[#EADDC4] flex items-center justify-center text-[#682025]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-head text-lg font-black text-[#1B1B1E] uppercase mb-2 leading-snug">
                    {t.title}
                  </h3>
                  <p className="text-xs text-[#4a3a6a] leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
