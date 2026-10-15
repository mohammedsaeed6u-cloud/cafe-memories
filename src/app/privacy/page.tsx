'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, FileText, ArrowRight } from 'lucide-react';
import { LastUpdatedBadge } from '@/components/ui/LastUpdatedBadge';

export default function PrivacyPolicyPage() {
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
              <span className="text-[10px] text-[#8B3A2B] font-bold">سياسة الخصوصية وحماية البيانات</span>
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
            <Shield className="w-3.5 h-3.5 text-[#8B3A2B]" />
            <span>وثيقة حماية البيانات والخصوصية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3D30] font-serif">سياسة الخصوصية (Privacy Policy)</h1>
          <LastUpdatedBadge dateString="22 سبتمبر 2026" isoDate="2026-09-22" />
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DFAB56]/40 shadow-[0_4px_20px_rgba(61,35,20,0.05)] space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E3D30] flex items-center gap-2 font-serif">
              <Eye className="w-4 h-4 text-[#8B3A2B]" />
              <span>1. البيانات التي نجمعها (Information We Collect)</span>
            </h2>
            <p className="text-sm text-[#2D1F17]/80 leading-relaxed">
              عند استخدام منصة <strong className="text-[#1E3D30]">Stampy</strong> (كتاجر أو كعميل)، نجمع فقط البيانات الأساسية والضرورية لتشغيل بطاقات الولاء وشاشات العرض التفاعلية:
            </p>
            <ul className="list-disc list-inside text-sm text-[#2D1F17]/80 space-y-2 pr-2">
              <li><strong className="text-[#1E3D30]">بيانات الحساب ومصادقة Google:</strong> الاسم، عنوان البريد الإلكتروني، ومعرف الحساب عند تسجيل الدخول كتاجر لإدارة كود الطاولات والتحليلات.</li>
              <li><strong className="text-[#1E3D30]">بيانات بطاقة الولاء للعميل:</strong> رقم الهاتف المحمول (لتوثيق وحفظ عدد الزيارات واستحقاق المكافآت دون الحاجة لكلمة مرور).</li>
              <li><strong className="text-[#1E3D30]">الصور والذكريات الموثقة:</strong> الصور التي يلتقطها الزائر برغبته داخل الكافيه لحفظها في كارت الولاء أو عرضها على شاشات الصالة بموافقته الصريحة.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E3D30] flex items-center gap-2 font-serif">
              <Lock className="w-4 h-4 text-[#8B3A2B]" />
              <span>2. كيف نستخدم بياناتك (How We Use Your Data)</span>
            </h2>
            <p className="text-sm text-[#2D1F17]/80 leading-relaxed">
              نستخدم البيانات للأغراض التشغيلية المحددة التالية فقط:
            </p>
            <ul className="list-disc list-inside text-sm text-[#2D1F17]/80 space-y-2 pr-2">
              <li>التحقق من هوية أصحاب الكافيهات والمتاجر عبر Google OAuth.</li>
              <li>احتساب عدد الزيارات وإصدار قسائم الهدايا والمكافآت التلقائية للعملاء.</li>
              <li>بث الذكريات المعتمدة فقط على شاشات التلفزيون الذكية داخل صالة الكافيه.</li>
              <li>تقديم تقارير تحليلية مجمعة لأصحاب الكافيهات حول معدل الزيارات دون بيع أي بيانات شخصية لأي طرف ثالث.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E3D30] flex items-center gap-2 font-serif">
              <FileText className="w-4 h-4 text-[#8B3A2B]" />
              <span>3. حماية البيانات ومشاركتها (Data Security & Sharing)</span>
            </h2>
            <p className="text-sm text-[#2D1F17]/80 leading-relaxed">
              نحن نلتزم بحماية بياناتك بأعلى معايير الأمان:
            </p>
            <ul className="list-disc list-inside text-sm text-[#2D1F17]/80 space-y-2 pr-2">
              <li>يتم تشفير جميع الاتصالات والبيانات باستخدام بروتوكول HTTPS/TLS 1.3.</li>
              <li>قواعد بيانات معزولة مع تطبيق سياسات الأمان على مستوى الصفوف (Row Level Security).</li>
              <li>لا نقوم إطلاقاً ببيع أو تأجير بيانات المستخدمين أو الزوار لأي شركات إعلانية أو وسطاء بيانات.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1E3D30] font-serif">4. حقوق المستخدم وحذف البيانات (Your Rights & Data Deletion)</h2>
            <p className="text-sm text-[#2D1F17]/80 leading-relaxed">
              يحق لأي مستخدم أو زائر طلب حذف حسابه أو صوره الموثقة في أي وقت بمراسلتنا مباشرة عبر البريد الإلكتروني الموضح أدناه، وسيتم حذف البيانات فورياً ونهائياً من خوادمنا.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#DFAB56]/30 pt-6">
            <h2 className="text-lg font-bold text-[#1E3D30] font-serif">5. تواصل معنا (Contact Us)</h2>
            <p className="text-sm text-[#2D1F17]/80 leading-relaxed">
              لأي استفسارات حول سياسة الخصوصية أو ممارسة حقوقك في البيانات:
              <br />
              البريد الإلكتروني: <strong className="font-mono text-[#8B3A2B]">privacy@stampy.sa</strong>
              <br />
              الموقع الإلكتروني: <strong className="font-mono text-[#8B3A2B]">https://stampy.sa</strong>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
