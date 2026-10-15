'use client';

import React from 'react';
import Link from 'next/link';
import { FileCheck, ArrowRight } from 'lucide-react';
import { LastUpdatedBadge } from '@/components/ui/LastUpdatedBadge';

export default function TermsOfServicePage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#FAF5EB] text-[#2D1F17] selection:bg-[#DFAB56] selection:text-[#1E3D30] font-sans antialiased relative">
      {/* Header */}
      <header className="bg-[#FAF5EB]/90 backdrop-blur-md border-b border-[#DFAB56]/30 sticky top-0 z-30 shadow-[0_2px_8px_rgba(61,35,20,0.04)]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1E3D30] text-[#FAF5EB] flex items-center justify-center font-serif text-base shadow-sm border border-[#DFAB56]/40">
              ✦
            </div>
            <div>
              <span className="font-bold text-[#1E3D30] text-base font-serif block leading-none">ستامبي · Stampy</span>
              <span className="text-[10px] text-[#8B3A2B] font-bold">شروط الخدمة والاتفاقية</span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-[#1E3D30] hover:text-[#8B3A2B] transition flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#DFAB56]/40 shadow-xs"
          >
            <span>العودة للرئيسية</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180 text-[#8B3A2B]" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-right relative z-10">
        <div className="space-y-4 border border-[#DFAB56]/40 bg-white p-6 sm:p-8 rounded-2xl shadow-[0_4px_20px_rgba(61,35,20,0.05)] relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3D30]/10 text-[#1E3D30] text-xs font-bold border border-[#1E3D30]/20">
            <FileCheck className="w-3.5 h-3.5 text-[#8B3A2B]" />
            <span>اتفاقية الاستخدام والخدمة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3D30] font-serif">شروط الخدمة (Terms of Service)</h1>
          <LastUpdatedBadge dateString="22 سبتمبر 2026" isoDate="2026-09-22" />
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DFAB56]/40 shadow-[0_4px_20px_rgba(61,35,20,0.05)] space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E3D30] font-serif">1. قبول الشروط (Acceptance of Terms)</h2>
            <p className="text-sm text-[#2D1F17]/80 leading-relaxed">
              باستخدامك لمنصة <strong className="text-[#1E3D30]">Stampy</strong> سواء كمالك كافيه أو كزائر يلتقط الصور ويستخدم كروت الولاء، فإنك تقر وتوافق على الالتزام بجميع بنود هذه الاتفاقية وسياسة الخصوصية الملحقة بها.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E3D30] font-serif">2. طبيعة الخدمة (Service Description)</h2>
            <p className="text-sm text-[#2D1F17]/80 leading-relaxed">
              تقدم منصة Stampy منظومة رقمية لإدارة كروت الولاء عبر كود الطاولات السريع، وتوثيق ذكريات الزوار في كبائن تصوير افتراضية، وبث الذكريات المعتمدة على شاشات التلفزيون الذكية بالصالة، بالإضافة لنظام تتبع المكافآت.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E3D30] font-serif">3. مسؤوليات المستخدمين والمحتوى المقبول (Acceptable Content)</h2>
            <p className="text-sm text-[#2D1F17]/80 leading-relaxed">
              يلتزم الزوار وأصحاب المنشآت بعدم رفع أو بث أي صور أو نصوص مسيئة أو تنتهك الآداب العامة وحقوق الملكية الفكرية. يحتفظ فريق إدارة الكافيه وإدارة المنصة بالحق الكامل في إخفاء أو رفض أي ذكرى تخالف المعايير فوراً.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E3D30] font-serif">4. حسابات التجار والمصادقة (Merchant Accounts)</h2>
            <p className="text-sm text-[#2D1F17]/80 leading-relaxed">
              يتحمل التاجر مسؤولية سرية حسابه وبيانات تسجيل الدخول عبر Google OAuth أو رمز الدخول السري (Staff PIN)، وأي نشاط يصدر من خلال لوحة التحكم الخاصة بمنشأته.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#DFAB56]/30 pt-6">
            <h2 className="text-lg font-bold text-[#1E3D30] font-serif">5. التواصل القانوني (Legal Inquiries)</h2>
            <p className="text-sm text-[#2D1F17]/80 leading-relaxed">
              لأي استفسارات قانونية أو تنظيمية:
              <br />
              البريد الإلكتروني: <strong className="font-mono text-[#8B3A2B]">legal@stampy.sa</strong>
              <br />
              الموقع الرسمي: <strong className="font-mono text-[#8B3A2B]">https://stampy.sa</strong>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
