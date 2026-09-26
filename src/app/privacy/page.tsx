'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, FileText, ArrowRight } from 'lucide-react';
import { LastUpdatedBadge } from '@/components/ui/LastUpdatedBadge';

export default function PrivacyPolicyPage() {
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
            <span className="font-bold text-[#FBF9F5] text-base font-serif">Memories • سياسة الخصوصية</span>
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
            <Shield className="w-3.5 h-3.5 text-[#DD0200]" />
            <span>وثيقة حماية البيانات والخصوصية</span>
          </div>
          <h1 className="text-3xl font-bold text-[#FBF9F5] font-serif">سياسة الخصوصية (Privacy Policy)</h1>
          <LastUpdatedBadge dateString="22 سبتمبر 2026" isoDate="2026-09-22" />
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <Eye className="w-4 h-4 text-[#DD0200]" />
            <span>1. البيانات التي نجمعها (Information We Collect)</span>
          </h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            عند استخدام منصة <strong className="text-[#FBF9F5]">Memories</strong> (كتاجر أو كعميل)، نجمع فقط البيانات الأساسية والضرورية لتشغيل بطاقات الولاء وشاشات العرض التفاعلية:
          </p>
          <ul className="list-disc list-inside text-sm text-[#A19E9B] space-y-1.5 pr-2">
            <li><strong className="text-[#FBF9F5]">بيانات الحساب ومصادقة Google:</strong> الاسم، عنوان البريد الإلكتروني، ومعرف الحساب عند تسجيل الدخول كتاجر لإدارة كود الطاولات والتحليلات.</li>
            <li><strong className="text-[#FBF9F5]">بيانات بطاقة الولاء للعميل:</strong> رقم الهاتف المحمول (لتوثيق وحفظ عدد الزيارات واستحقاق المكافآت دون الحاجة لكلمة مرور).</li>
            <li><strong className="text-[#FBF9F5]">الصور والذكريات الموثقة:</strong> الصور التي يلتقطها الزائر برغبته داخل الكافيه لحفظها في كارت الولاء أو عرضها على شاشات الصالة بموافقته الصريحة.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <Lock className="w-4 h-4 text-[#DD0200]" />
            <span>2. كيف نستخدم بياناتك (How We Use Your Data)</span>
          </h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            نستخدم البيانات للأغراض التشغيلية المحددة التالية فقط:
          </p>
          <ul className="list-disc list-inside text-sm text-[#A19E9B] space-y-1.5 pr-2">
            <li>التحقق من هوية أصحاب الكافيهات والمتاجر عبر Google OAuth.</li>
            <li>احتساب عدد الزيارات وإصدار قسائم الهدايا والمكافآت التلقائية للعملاء.</li>
            <li>بث الذكريات المعتمدة فقط على شاشات التلفزيون الذكية داخل صالة الكافيه.</li>
            <li>تقديم تقارير تحليلية مجمعة لأصحاب الكافيهات حول معدل الزيارات دون بيع أي بيانات شخصية لأي طرف ثالث.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <FileText className="w-4 h-4 text-[#DD0200]" />
            <span>3. حماية البيانات ومشاركتها (Data Security & Sharing)</span>
          </h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            نحن نلتزم بحماية بياناتك بأعلى معايير الأمان:
          </p>
          <ul className="list-disc list-inside text-sm text-[#A19E9B] space-y-1.5 pr-2">
            <li>يتم تشفير جميع الاتصالات والبيانات باستخدام بروتوكول HTTPS/TLS 1.3.</li>
            <li>قواعد بيانات معزولة عبر Supabase مع تطبيق سياسات الأمان على مستوى الصفوف (Row Level Security).</li>
            <li>لا نقوم إطلاقاً ببيع أو تأجير بيانات المستخدمين أو الزوار لأي شركات إعلانية أو وسطاء بيانات.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">4. حقوق المستخدم وحذف البيانات (Your Rights & Data Deletion)</h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            يحق لأي مستخدم أو زائر طلب حذف حسابه أو صوره الموثقة في أي وقت بمراسلتنا مباشرة عبر البريد الإلكتروني الموضح أدناه، وسيتم حذف البيانات فورياً ونهائياً من خوادمنا.
          </p>
        </section>

        <section className="space-y-3 border-t border-white/10 pt-6">
          <h2 className="text-lg font-bold text-[#FBF9F5] font-serif">5. تواصل معنا (Contact Us)</h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            لأي استفسارات حول سياسة الخصوصية أو ممارسة حقوقك في البيانات:
            <br />
            البريد الإلكتروني: <strong className="font-mono text-[#FBF9F5]">privacy@memories-c9w.pages.dev</strong>
            <br />
            الموقع الإلكتروني: <strong className="font-mono text-[#FBF9F5]">https://memories-c9w.pages.dev</strong>
          </p>
        </section>
      </main>
    </div>
  );
}
