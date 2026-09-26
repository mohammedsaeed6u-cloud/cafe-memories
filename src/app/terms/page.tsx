'use client';

import React from 'react';
import Link from 'next/link';
import { FileCheck, ArrowRight } from 'lucide-react';
import { LastUpdatedBadge } from '@/components/ui/LastUpdatedBadge';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] selection:bg-[#DD0200] selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#55100D]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[450px] h-[450px] bg-[#DD0200]/10 rounded-full blur-[140px] pointer-events-none" />

      <header className="bg-[#141212]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center font-serif text-sm shadow-md border border-white/10">
              ✦
            </div>
            <span className="font-bold text-[#FBF9F5] text-base font-serif">Memories • شروط الخدمة</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-[#A19E9B] hover:text-[#FBF9F5] transition flex items-center gap-1"
          >
            <span>العودة للرئيسية</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-right relative z-10">
        <div className="space-y-3 border-b border-white/10 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#55100D]/50 text-[#FBF9F5] text-xs font-bold border border-[#DD0200]/40">
            <FileCheck className="w-3.5 h-3.5 text-[#DD0200]" />
            <span>اتفاقية الاستخدام والخدمة</span>
          </div>
          <h1 className="text-3xl font-bold text-[#FBF9F5] font-serif">شروط الخدمة (Terms of Service)</h1>
          <LastUpdatedBadge dateString="22 سبتمبر 2026" isoDate="2026-09-22" />
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">1. قبول الشروط (Acceptance of Terms)</h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            باستخدامك لمنصة <strong className="text-[#FBF9F5]">Memories</strong> سواء كمالك كافيه أو كزائر يلتقط الصور ويستخدم كروت الولاء، فإنك تقر وتوافق على الالتزام بجميع بنود هذه الاتفاقية وسياسة الخصوصية الملحقة بها.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">2. طبيعة الخدمة (Service Description)</h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            تقدم منصة Memories منظومة رقمية لإدارة كروت الولاء عبر كود الطاولات السريع، وتوثيق ذكريات الزوار في كبائن تصوير افتراضية، وبث الذكريات المعتمدة على شاشات التلفزيون الذكية بالصالة، بالإضافة لنظام تتبع المكافآت.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">3. مسؤوليات المستخدمين والمحتوى المقبول (Acceptable Content)</h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            يلتزم الزوار وأصحاب المنشآت بعدم رفع أو بث أي صور أو نصوص مسيئة أو تنتهك الآداب العامة وحقوق الملكية الفكرية. يحتفظ فريق إدارة الكافيه وإدارة المنصة بالحق الكامل في إخفاء أو رفض أي ذكرى تخالف المعايير فوراً.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">4. حسابات التجار والمصادقة (Merchant Accounts)</h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            يتحمل التاجر مسؤولية سرية حسابه وبيانات تسجيل الدخول عبر Google OAuth أو رمز الدخول السري (Staff PIN)، وأي نشاط يصدر من خلال لوحة التحكم الخاصة بمنشأته.
          </p>
        </section>

        <section className="space-y-3 border-t border-white/10 pt-6">
          <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">5. التواصل القانوني (Legal Inquiries)</h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            لأي استفسارات قانونية أو تنظيمية:
            <br />
            البريد الإلكتروني: <strong className="font-mono text-[#FBF9F5]">legal@memories-c9w.pages.dev</strong>
            <br />
            الموقع الرسمي: <strong className="font-mono text-[#FBF9F5]">https://memories-c9w.pages.dev</strong>
          </p>
        </section>
      </main>
    </div>
  );
}
