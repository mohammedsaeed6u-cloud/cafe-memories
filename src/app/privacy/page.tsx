'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, FileText, ArrowRight } from 'lucide-react';
import { LastUpdatedBadge } from '@/components/ui/LastUpdatedBadge';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';

export default function PrivacyPolicyPage() {
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
            <span className="font-bold text-[#3D2314] text-base font-serif">Stampy • سياسة الخصوصية</span>
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
            <Shield className="w-3.5 h-3.5 text-[#DFAB56]" />
            <span>وثيقة حماية البيانات والخصوصية</span>
          </div>
          <h1 className="text-3xl font-bold text-[#3D2314] font-serif">سياسة الخصوصية (Privacy Policy)</h1>
          <LastUpdatedBadge dateString="22 سبتمبر 2026" isoDate="2026-09-22" />
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#3D2314] flex items-center gap-2 font-serif">
            <Eye className="w-4 h-4 text-[#DFAB56]" />
            <span>1. البيانات التي نجمعها (Information We Collect)</span>
          </h2>
          <p className="text-sm text-[#63574D] leading-relaxed">
            عند استخدام منصة <strong className="text-[#3D2314]">Stampy</strong> (كتاجر أو كعميل)، نجمع فقط البيانات الأساسية والضرورية لتشغيل بطاقات الولاء وشاشات العرض التفاعلية:
          </p>
          <ul className="list-disc list-inside text-sm text-[#63574D] space-y-1.5 pr-2">
            <li><strong className="text-[#3D2314]">بيانات الحساب ومصادقة Google:</strong> الاسم، عنوان البريد الإلكتروني، ومعرف الحساب عند تسجيل الدخول كتاجر لإدارة كود الطاولات والتحليلات.</li>
            <li><strong className="text-[#3D2314]">بيانات بطاقة الولاء للعميل:</strong> رقم الهاتف المحمول (لتوثيق وحفظ عدد الزيارات واستحقاق المكافآت دون الحاجة لكلمة مرور).</li>
            <li><strong className="text-[#3D2314]">الصور والذكريات الموثقة:</strong> الصور التي يلتقطها الزائر برغبته داخل المنشأة لحفظها في كارت الولاء أو عرضها على شاشات الصالة بموافقته الصريحة.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#3D2314] flex items-center gap-2 font-serif">
            <Lock className="w-4 h-4 text-[#DFAB56]" />
            <span>2. كيف نستخدم بياناتك (How We Use Your Data)</span>
          </h2>
          <p className="text-sm text-[#63574D] leading-relaxed">
            نستخدم البيانات للأغراض التشغيلية المحددة التالية فقط:
          </p>
          <ul className="list-disc list-inside text-sm text-[#63574D] space-y-1.5 pr-2">
            <li>التحقق من هوية أصحاب المنشآت والمتاجر عبر Google OAuth.</li>
            <li>احتساب عدد الزيارات وإصدار قسائم الهدايا والمكافآت التلقائية للعملاء.</li>
            <li>بث الذكريات المعتمدة فقط على شاشات العرض الذكية داخل صالة المنشأة.</li>
            <li>تقديم تقارير تحليلية مجمعة لأصحاب المنشآت حول معدل الزيارات دون بيع أي بيانات شخصية لأي طرف ثالث.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#3D2314] flex items-center gap-2 font-serif">
            <FileText className="w-4 h-4 text-[#DFAB56]" />
            <span>3. حماية البيانات ومشاركتها (Data Security & Sharing)</span>
          </h2>
          <p className="text-sm text-[#63574D] leading-relaxed">
            نحن نلتزم بحماية بياناتك بأعلى معايير الأمان:
          </p>
          <ul className="list-disc list-inside text-sm text-[#63574D] space-y-1.5 pr-2">
            <li>يتم تشفير جميع الاتصالات والبيانات باستخدام بروتوكول HTTPS/TLS 1.3.</li>
            <li>قواعد بيانات معزولة عبر Supabase مع تطبيق سياسات الأمان على مستوى الصفوف (Row Level Security).</li>
            <li>لا نقوم إطلاقاً ببيع أو تأجير بيانات المستخدمين أو الزوار لأي شركات إعلانية أو وسطاء بيانات.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#3D2314] font-serif">4. حقوق المستخدم وحذف البيانات (Your Rights & Data Deletion)</h2>
          <p className="text-sm text-[#63574D] leading-relaxed">
            يحق لأي مستخدم أو زائر طلب حذف حسابه أو صوره الموثقة في أي وقت بمراسلتنا مباشرة عبر البريد الإلكتروني الموضح أدناه، وسيتم حذف البيانات فورياً ونهائياً من خوادمنا.
          </p>
        </section>

        <section className="space-y-3 border-t border-[#EADDC4] pt-6">
          <h2 className="text-lg font-bold text-[#3D2314] font-serif">5. تواصل معنا (Contact Us)</h2>
          <p className="text-sm text-[#63574D] leading-relaxed">
            لأي استفسارات حول سياسة الخصوصية أو ممارسة حقوقك في البيانات:
            <br />
            البريد الإلكتروني: <strong className="font-mono text-[#3D2314]">privacy@memories-d9l.pages.dev</strong>
            <br />
            الموقع الإلكتروني: <strong className="font-mono text-[#3D2314]">https://memories-d9l.pages.dev</strong>
          </p>
        </section>
      </main>
    </div>
  );
}
