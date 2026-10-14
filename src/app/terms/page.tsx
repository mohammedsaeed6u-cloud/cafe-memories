'use client';

import React from 'react';
import Link from 'next/link';
import { FileCheck, ArrowRight } from 'lucide-react';
import { LastUpdatedBadge } from '@/components/ui/LastUpdatedBadge';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#141313] text-[#FBF9F5] selection:bg-[#c92a54] selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Decorative Washi Tape at Top */}
      
      

      <header className="bg-white/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.1)] sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FBF9F5] text-white flex items-center justify-center font-serif text-sm shadow-sm border border-white/20">
              ✦
            </div>
            <span className="font-bold text-[#FBF9F5] text-base font-serif">Stampy SaaS • شروط الخدمة</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-stone-600 hover:text-[#c92a54] transition flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-[rgba(255,255,255,0.1)] shadow-xs"
          >
            <span>العودة للرئيسية</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-right relative z-10">
        <div className="space-y-4 border-b border-[rgba(255,255,255,0.1)] pb-6 bg-white p-6 sm:p-8 rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-sm relative">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <FileCheck className="w-3.5 h-3.5 text-[#c92a54]" />
            <span>اتفاقية الاستخدام والخدمة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#FBF9F5] font-serif">شروط الخدمة (Terms of Service)</h1>
          <LastUpdatedBadge dateString="22 سبتمبر 2026" isoDate="2026-09-22" />
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-sm space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">1. قبول الشروط (Acceptance of Terms)</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              باستخدامك لمنصة <strong className="text-[#FBF9F5]">Stampy</strong> سواء كمالك كافيه أو كزائر يلتقط الصور ويستخدم كروت الولاء، فإنك تقر وتوافق على الالتزام بجميع بنود هذه الاتفاقية وسياسة الخصوصية الملحقة بها.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">2. طبيعة الخدمة (Service Description)</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              تقدم منصة Stampy منظومة رقمية لإدارة كروت الولاء عبر كود الطاولات السريع، وتوثيق ذكريات الزوار في كبائن تصوير افتراضية، وبث الذكريات المعتمدة على شاشات التلفزيون الذكية بالصالة، بالإضافة لنظام تتبع المكافآت.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">3. مسؤوليات المستخدمين والمحتوى المقبول (Acceptable Content)</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              يلتزم الزوار وأصحاب المنشآت بعدم رفع أو بث أي صور أو نصوص مسيئة أو تنتهك الآداب العامة وحقوق الملكية الفكرية. يحتفظ فريق إدارة الكافيه وإدارة المنصة بالحق الكامل في إخفاء أو رفض أي ذكرى تخالف المعايير فوراً.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">4. حسابات التجار والمصادقة (Merchant Accounts)</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              يتحمل التاجر مسؤولية سرية حسابه وبيانات تسجيل الدخول عبر Google OAuth أو رمز الدخول السري (Staff PIN)، وأي نشاط يصدر من خلال لوحة التحكم الخاصة بمنشأته.
            </p>
          </section>

          <section className="space-y-3 border-t border-[rgba(255,255,255,0.1)] pt-6">
            <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">5. التواصل القانوني (Legal Inquiries)</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              لأي استفسارات قانونية أو تنظيمية:
              <br />
              البريد الإلكتروني: <strong className="font-mono text-[#c92a54]">legal@memories-c9w.pages.dev</strong>
              <br />
              الموقع الرسمي: <strong className="font-mono text-[#c92a54]">https://memories-c9w.pages.dev</strong>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
