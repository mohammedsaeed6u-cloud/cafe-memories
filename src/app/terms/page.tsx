'use client';

import React from 'react';
import Link from 'next/link';
import { FileCheck, ShieldCheck, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';
import { LastUpdatedBadge } from '@/components/ui/LastUpdatedBadge';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-cairo antialiased selection:bg-amber-500/20 selection:text-amber-950">
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <span className="font-extrabold text-stone-950 text-base">Memories • شروط الخدمة</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-stone-600 hover:text-stone-950 transition flex items-center gap-1"
          >
            <span>العودة للرئيسية</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-right">
        <div className="space-y-3 border-b border-stone-200 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold border border-amber-500/20">
            <FileCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>اتفاقية الاستخدام والخدمة</span>
          </div>
          <h1 className="text-3xl font-black text-stone-950">شروط الخدمة (Terms of Service)</h1>
          <LastUpdatedBadge dateString="22 سبتمبر 2026" isoDate="2026-09-22" />
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-stone-900">1. قبول الشروط (Acceptance of Terms)</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            باستخدامك لمنصة <strong>Memories</strong> سواء كمالك كافيه أو كزائر يلتقط الصور ويستخدم كروت الولاء، فإنك تقر وتوافق على الالتزام بجميع بنود هذه الاتفاقية وسياسة الخصوصية الملحقة بها.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-stone-900">2. طبيعة الخدمة (Service Description)</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            تقدم منصة Memories منظومة رقمية لإدارة كروت الولاء عبر كود الطاولات السريع، وتوثيق ذكريات الزوار في كبائن تصوير افتراضية، وبث الذكريات المعتمدة على شاشات التلفزيون الذكية بالصالة، بالإضافة لنظام تتبع المكافآت.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-stone-900">3. مسؤوليات المستخدمين والمحتوى المقبول (Acceptable Content)</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            يلتزم الزوار وأصحاب المنشآت بعدم رفع أو بث أي صور أو نصوص مسيئة أو تنتهك الآداب العامة وحقوق الملكية الفكرية. يحتفظ فريق إدارة الكافيه وإدارة المنصة بالحق الكامل في إخفاء أو رفض أي ذكرى تخالف المعايير فوراً.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-stone-900">4. حسابات التجار والمصادقة (Merchant Accounts)</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            يتحمل التاجر مسؤولية سرية حسابه وبيانات تسجيل الدخول عبر Google OAuth أو رمز الدخول السري (Staff PIN)، وأي نشاط يصدر من خلال لوحة التحكم الخاصة بمنشأته.
          </p>
        </section>

        <section className="space-y-3 border-t border-stone-200 pt-6">
          <h2 className="text-lg font-black text-stone-900">5. التواصل القانوني (Legal Inquiries)</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            لأي استفسارات قانونية أو تنظيمية:
            <br />
            البريد الإلكتروني: <strong className="font-mono text-stone-900">legal@memories-c9w.pages.dev</strong>
            <br />
            الموقع الرسمي: <strong className="font-mono text-stone-900">https://memories-c9w.pages.dev</strong>
          </p>
        </section>
      </main>
    </div>
  );
}
