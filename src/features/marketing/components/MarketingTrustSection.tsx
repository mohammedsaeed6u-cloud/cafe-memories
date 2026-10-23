'use client';

import React from 'react';
import { ShieldCheck, Lock, Cpu, Database, RefreshCw, Zap, Server, Activity, AlertTriangle, Key } from 'lucide-react';

export function MarketingTrustSection() {
  const architecturalPillars = [
    {
      num: '01',
      title: 'منع تضارب الطلبات (Race Conditions Guard)',
      desc: 'قفل ذري متزامن (Mutex) مع إصدارات تدقيق متفائلة تمنع استبدال القسائم أو الأختام المزدوجة نهائياً.',
      icon: Cpu,
    },
    {
      num: '02',
      title: 'القضاء على استعلامات N+1 (Batch Data Aggregator)',
      desc: 'تجميع استعلامات CRM وسجلات العملاء والأختام بدفعة معالجة واحدة (Batch Loader) لتحقيق استجابة تحت 10ms.',
      icon: Database,
    },
    {
      num: '03',
      title: 'تتبع الأخطاء الصفرية (Zero Silent Failures)',
      desc: 'تسجيل تحليلي موحد مع معرفات ارتباط فريدة (Correlation IDs) وتتبع المسار وسياق التشغيل كاملاً.',
      icon: Activity,
    },
    {
      num: '04',
      title: 'محددات السرعة المنزلقة (Sliding-Window Rate Limits)',
      desc: 'حماية رمز PIN من التخمين (قفل فوري بعد 5 محاولات) وتقييد طلبات الأختام ورفع الصور تلقائياً.',
      icon: Lock,
    },
    {
      num: '05',
      title: 'طابور المهام غير المتزامن (Async Background Jobs)',
      desc: 'معالجة دمج الشرائط عالية الدقة 4K وطباعة الكروت في الخلفية دون تجميد مسار الـ HTTP مع طابور DLQ.',
      icon: Zap,
    },
    {
      num: '06',
      title: 'تنبيهات الحصص والاستهلاك (Spend Alerts & Quotas)',
      desc: 'مراقبة سعة التخزين والزيارات وطابور الطباعة لكل منشأة مع تنبيهات استباقية عند 80% وإغلاق وقائي.',
      icon: AlertTriangle,
    },
    {
      num: '07',
      title: 'التراجع الفوري بدون توقف (Zero-Downtime Rollback)',
      desc: 'فحص تكاملي فوري للصحة (/api/health) وتثبيت النشر السحابي مع إمكانية الرجوع الفوري لأي إصدار.',
      icon: RefreshCw,
    },
    {
      num: '08',
      title: 'صمود المزامنة دون اتصال (Offline-First Resilience)',
      desc: 'محطة الكاشير وشاشة الصالة تعملان بثبات أثناء انقطاع الإنترنت المؤقت وتتزامنان تلقائياً عند العودة.',
      icon: Server,
    },
    {
      num: '09',
      title: 'أمان الـ Webhooks ومنع التكرار (HMAC & Idempotency)',
      desc: 'تشفير الإشعارات بتوقيع HMAC-SHA256 مع سجل مفاتيح منع التكرار لضمان معالجة الحدث مرة واحدة تماماً.',
      icon: Key,
    },
    {
      num: '10',
      title: 'النسخ الاحتياطي والتعافي التلقائي (Disaster Recovery)',
      desc: 'تصدير لقطة بيانات شاملة مشفرة لكل منشأة مع رمز تحقق للسلامة (SHA Checksum) لاختبار الاستعادة.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="trust" className="py-24 px-6 max-w-6xl mx-auto border-t border-[#EADDC4]">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#DFAB56]/30 bg-[#DFAB56]/10 text-[11px] font-mono tracking-widest text-[#DFAB56] uppercase mb-3 backdrop-blur-xl">
          <ShieldCheck className="w-4 h-4 text-[#DFAB56]" />
          <span>PRODUCTION-READY BLUEPRINT • جاهزية الـ 1,000 مستخدم والأمن السيبراني</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#3D2314] tracking-tight leading-tight">
          معمارية سحابية محصنة لتحمل أقصى درجات الضغط.
        </h2>
        <p className="text-sm sm:text-base text-[#63574D] mt-3.5 leading-relaxed">
          تم بناء استامبي (Stampy) وفق الركائز المعمارية العشر الصارمة ونموذج الأمان الصفري (Zero Trust) لمنع التحرك العرضي وتصعيد الصلاحيات وحماية بيانات علامتك التجارية.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {architecturalPillars.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-6 rounded-2xl bg-white border border-[#EADDC4] hover:border-[#DFAB56] shadow-sm transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#3D2314] text-[#DFAB56] flex items-center justify-center border border-[#DFAB56]/30 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-[#DFAB56]/80">{item.num}</span>
              </div>
              <h3 className="text-sm font-bold text-[#3D2314] mb-2 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-[#63574D] leading-relaxed font-normal">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
