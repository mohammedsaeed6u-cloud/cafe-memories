'use client';

import React from 'react';
import Link from 'next/link';
import { FileCheck, ArrowRight } from 'lucide-react';
import { LastUpdatedBadge } from '@/components/ui/LastUpdatedBadge';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FAF5EB] text-[#3D2314] selection:bg-[#DFAB56] selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Ambient warm glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#DFAB56]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[450px] h-[450px] bg-[#3D2314]/5 rounded-full blur-[140px] pointer-events-none" />

      <header className="bg-[#FAF5EB]/95 backdrop-blur-xl border-b border-[#EADDC4] sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DFAB56] to-[#3D2314] text-white flex items-center justify-center shadow-xs border border-[#EADDC4] shrink-0">
              <MemoriesArchIcon size={18} color="#FAF5EB" />
            </div>
            <span className="font-bold text-[#3D2314] text-base font-serif">Stampy • شروط الخدمة</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-[#63574D] hover:text-[#3D2314] transition flex items-center gap-1"
          >
            <span>العودة للرئيسية</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-right relative z-10 bg-white/70 backdrop-blur-md rounded-2xl border border-[#EADDC4] p-8 shadow-xs my-8">
        <div className="space-y-3 border-b border-[#EADDC4] pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EB] text-[#3D2314] text-xs font-bold border border-[#DFAB56]/40">
            <FileCheck className="w-3.5 h-3.5 text-[#DFAB56]" />
            <span>اتفاقية الاستخدام والخدمة</span>
          </div>
          <h1 className="text-3xl font-bold text-[#3D2314] font-serif">شروط الخدمة (Terms of Service)</h1>
          <LastUpdatedBadge dateString="22 سبتمبر 2026" isoDate="2026-09-22" />
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#3D2314] font-serif">1. قبول الشروط (Acceptance of Terms)</h2>
          <p className="text-sm text-[#63574D] leading-relaxed">
            باستخدامك لمنصة <strong className="text-[#3D2314]">Stampy</strong> سواء كمالك منشأة أو كزائر يلتقط الصور ويستخدم كروت الولاء، فإنك تقر وتوافق على الالتزام بجميع بنود هذه الاتفاقية وسياسة الخصوصية الملحقة بها.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#3D2314] font-serif">2. طبيعة الخدمة (Service Description)</h2>
          <p className="text-sm text-[#63574D] leading-relaxed">
            تقدم منصة Stampy منظومة رقمية لإدارة كروت الولاء عبر كود الطاولات السريع، وتوثيق ذكريات الزوار في كبائن تصوير افتراضية، وبث الذكريات المعتمدة على شاشات العرض الذكية بالصالة، بالإضافة لنظام تتبع المكافآت.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#3D2314] font-serif">3. مسؤوليات المستخدمين والمحتوى المقبول (Acceptable Content)</h2>
          <p className="text-sm text-[#63574D] leading-relaxed">
            يلتزم الزوار وأصحاب المنشآت بعدم رفع أو بث أي صور أو نصوص مسيئة أو تنتهك الآداب العامة وحقوق الملكية الفكرية. يحتفظ فريق إدارة المنشأة وإدارة المنصة بالحق الكامل في إخفاء أو رفض أي ذكرى تخالف المعايير فوراً.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#3D2314] font-serif">4. حسابات التجار والمصادقة (Merchant Accounts)</h2>
          <p className="text-sm text-[#63574D] leading-relaxed">
            يتحمل التاجر مسؤولية سرية حسابه وبيانات تسجيل الدخول عبر Google OAuth أو رمز الدخول السري (Staff PIN)، وأي نشاط يصدر من خلال لوحة التحكم الخاصة بمنشأته.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#EADDC4] pt-6">
          <h2 className="text-lg font-bold text-[#3D2314] font-serif">5. التواصل القانوني (Legal Inquiries)</h2>
          <p className="text-sm text-[#63574D] leading-relaxed">
            لأي استفسارات قانونية أو تنظيمية:
            <br />
            البريد الإلكتروني: <strong className="font-mono text-[#3D2314]">legal@memories-c9w.pages.dev</strong>
            <br />
            الموقع الرسمي: <strong className="font-mono text-[#3D2314]">https://memories-c9w.pages.dev</strong>
          </p>
        </section>
      </main>
    </div>
  );
}
