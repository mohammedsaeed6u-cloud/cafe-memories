'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Zap,
  Users,
  QrCode,
  Sliders,
  ChevronDown,
  Gift,
  Award,
  KeyRound,
  Store,
  Menu,
  X,
} from 'lucide-react';
import { StampyApertureIcon } from '@/components/brand/StampyLogo';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'هل يحتاج العميل لتحميل أي تطبيق على هاتفه؟',
      a: 'إطلاقاً! العميل لا يحتاج لتنزيل أي تطبيق. يفتح رابط كرت المنشأة عبر المتصفح أو يحفظه مباشرة في تطبيق Apple Wallet (لأجهزة iPhone) أو Google Wallet (لأجهزة Android) بنقرة زر واحدة.',
    },
    {
      q: 'كيف يقوم موظف الكاونتر (الكاشير) بختم بطاقة العميل؟',
      a: 'يقوم الكاشير بفتح شاشة الكاونتر (/terminal) وإدخال رمز PIN السريع الخاص به، ثم يمسح كود الـ QR من جوال العميل أو يبحث برقم هاتفه ويضغط "ختم الكرت الآن" فتُضاف الختمة لحظياً بصوت وأنيميشن ممتع.',
    },
    {
      q: 'هل يرى العميل تحديث الختمة في محفظة جواله في نفس اللحظة؟',
      a: 'نعم! بفضل تقنية المزامنة اللحظية والـ PassKit، يتم تحديث عدد الأختام في بطاقة المحفظة بهاتف العميل في نفس الثانية دون أي تأخير.',
    },
    {
      q: 'كيف أتحكم في صلاحيات الموظفين وما يمكنهم رؤيته؟',
      a: 'من خلال لوحة تحكم المنشأة، يمكنك إضافة موظفي الكاونتر وتعيين رمز PIN مكون من 4 أرقام لكل موظف، مع تحديد صلاحيات دقيقة: مثل السماح بالختم وصرف الهدايا فقط ومنع الاطلاع على التقارير المالية أو الـ CRM.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF5EB] text-[#3D2314] font-sans selection:bg-[#E5A836] selection:text-[#3D2314] overflow-x-hidden">
      
      {/* ---------------- NAVIGATION BAR (TABBY STYLE) ---------------- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EADDC4] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#E5A836] border-2 border-[#3D2314] shadow-stamp-resting flex items-center justify-center transition-transform group-hover:scale-105">
              <StampyApertureIcon size={20} color="#3D2314" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tight text-[#3D2314] leading-none">
                stampy.
              </span>
              <span className="text-[9px] font-mono font-bold text-[#B83A26] uppercase tracking-wider mt-0.5">
                SMART LOYALTY
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[#3D2314]/70">
            <a href="#how-it-works" className="hover:text-[#3D2314] transition py-1">
              كيف يعمل
            </a>
            <a href="#features" className="hover:text-[#3D2314] transition py-1">
              المميزات
            </a>
            <a href="#pricing" className="hover:text-[#3D2314] transition py-1">
              الأسعار
            </a>
            <a href="#faq" className="hover:text-[#3D2314] transition py-1">
              الأسئلة الشائعة
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-[#3D2314] hover:text-[#B83A26] transition px-3 py-2"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold py-2.5 px-5 rounded-xl bg-[#3D2314] hover:bg-[#25150C] text-white transition shadow-sm flex items-center gap-1.5 active:scale-98"
            >
              <span>ابدأ مجاناً</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-[#EADDC4] text-[#3D2314]"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#EADDC4] px-4 py-4 space-y-3">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-[#3D2314] py-1.5"
            >
              كيف يعمل
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-[#3D2314] py-1.5"
            >
              المميزات
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-[#3D2314] py-1.5"
            >
              الأسعار
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-bold text-[#3D2314] py-1.5"
            >
              الأسئلة الشائعة
            </a>
            <div className="pt-2 border-t border-[#EADDC4] flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2 text-xs font-bold text-[#3D2314] border border-[#EADDC4] rounded-lg"
              >
                دخول المنشأة
              </Link>
              <Link
                href="/signup"
                className="w-full text-center py-2.5 text-xs font-bold bg-[#3D2314] text-white rounded-lg"
              >
                إنشاء حساب مجاناً
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ---------------- HERO SECTION (TABBY CLEAN FINTECH) ---------------- */}
      <section className="relative px-4 sm:px-6 pt-12 sm:pt-20 pb-16 max-w-5xl mx-auto text-center">
        
        {/* Crisp Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#EADDC4] bg-white text-[#3D2314] text-xs font-bold mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#B83A26]" />
          <span>بطاقات ولاء رقمية أصلية في Apple Wallet و Google Wallet</span>
        </div>

        {/* High-Impact Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#3D2314] tracking-tight leading-[1.2] max-w-4xl mx-auto">
          كل زيارة تصنع أثراً يدوم.<br />
          <span className="text-[#B83A26]">بطاقات أختام ذكية في محفظة جوال عميلك.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-base md:text-lg text-[#3D2314]/75 max-w-2xl mx-auto leading-relaxed font-medium">
          استبدل كروت الأختام الورقية ببطاقات رقمية حقيقية يحفظها العميل في هاتفه دون أي تطبيقات.
          كاشير يختم بلحظة وبصوت ممتع، ولوحة تحكم متكاملة لبيانات العملاء وفريق العمل.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto text-sm py-3.5 px-8 rounded-xl bg-[#B83A26] hover:bg-[#9E2E1D] text-white font-bold shadow-stamp-resting hover:shadow-stamp-hover transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-[#3D2314] active:translate-x-[2px] active:translate-y-[2px]"
          >
            <span>ابدأ تجربة منشأتك مجاناً</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <Link
            href="/c/stampy"
            className="w-full sm:w-auto text-sm py-3.5 px-6 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#3D2314] font-bold border-2 border-[#3D2314] shadow-stamp-resting hover:shadow-stamp-hover transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-x-[2px] active:translate-y-[2px]"
          >
            <Smartphone className="w-4 h-4 text-[#B83A26]" />
            <span>تجربة كرت العميل المباشر</span>
          </Link>
        </div>

        {/* ---------------- DUAL SHOWCASE (WALLET PASS vs CASHIER POS) ---------------- */}
        <div className="mt-14 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-right" dir="rtl">
          
          {/* Card 1: Customer Apple Wallet Pass */}
          <div className="bg-white border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-hover flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#EADDC4] pb-3 mb-4">
                <span className="text-xs font-mono font-bold text-[#B83A26]">APPLE WALLET PASS</span>
                <span className="text-[10px] font-bold bg-[#527E78]/15 text-[#527E78] px-2.5 py-0.5 rounded-full border border-[#527E78]/30">
                  مزامنة حية لحظية
                </span>
              </div>

              {/* Pass Ticket Body */}
              <div className="bg-[#E5A836] border-2 border-[#3D2314] rounded-xl p-5 shadow-stamp-resting text-[#3D2314]">
                <div className="flex items-center justify-between border-b border-[#3D2314]/30 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#3D2314] flex items-center justify-center">
                      <StampyApertureIcon size={16} color="#3D2314" />
                    </div>
                    <span className="font-black text-sm">استوديو صويل</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-[#3D2314]/30">
                    4 / 5 أختام
                  </span>
                </div>

                {/* Stamp Slots */}
                <div className="grid grid-cols-5 gap-1.5 my-3">
                  {[1, 2, 3, 4].map((num) => (
                    <div
                      key={num}
                      className="aspect-square rounded-lg bg-[#B83A26] border border-[#3D2314] text-white flex items-center justify-center text-xs font-black shadow-stamp-pressed"
                    >
                      ✦
                    </div>
                  ))}
                  <div className="aspect-square rounded-lg bg-white border border-dashed border-[#3D2314] text-[#3D2314]/40 flex items-center justify-center text-xs font-bold">
                    5
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-[#3D2314]/20 text-xs font-bold text-center mt-3">
                  🎁 الهدية: جلسة تصوير فوتوبوث مجانية عند الختم القادم
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EADDC4] flex items-center justify-between text-xs text-[#3D2314]/70 font-semibold">
              <span>يحفظه العميل بدون أي تطبيق</span>
              <span className="font-mono text-[#3D2314] font-bold">.PKPASS READY</span>
            </div>
          </div>

          {/* Card 2: Cashier Counter POS Tablet */}
          <div className="bg-white border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-hover flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#EADDC4] pb-3 mb-4">
                <span className="text-xs font-mono font-bold text-[#527E78]">COUNTER POS TERMINAL</span>
                <span className="text-[10px] font-bold bg-[#E5A836]/20 text-[#3D2314] px-2.5 py-0.5 rounded-full border border-[#3D2314]/20">
                  الكاشير: فريق الاستقبال • PIN: ••••
                </span>
              </div>

              {/* POS Terminal Screen Mock */}
              <div className="bg-[#FAF5EB] border-2 border-[#3D2314] rounded-xl p-4 shadow-stamp-resting space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#3D2314]">
                  <span>بحث سريع بالهاتف:</span>
                  <span className="font-mono text-[#B83A26]">05X XXX XXXX</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-[#EADDC4] flex items-center justify-between">
                  <div>
                    <h5 className="font-black text-xs text-[#3D2314]">عميل يزور بانتظام</h5>
                    <span className="text-[10px] text-[#3D2314]/60">4 زيارات موثّقة</span>
                  </div>
                  <span className="text-xs font-mono font-black text-[#527E78]">4 / 5</span>
                </div>

                {/* Instant Tactile Stamp Button */}
                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-[#B83A26] text-white font-black text-xs border-2 border-[#3D2314] shadow-stamp-resting hover:shadow-stamp-hover flex items-center justify-center gap-2 cursor-pointer transition active:translate-x-[2px] active:translate-y-[2px]"
                >
                  <Sparkles className="w-4 h-4 text-[#E5A836]" />
                  <span>ختم الكرت الآن (+1 ختم فوري)</span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EADDC4] flex items-center justify-between text-xs text-[#3D2314]/70 font-semibold">
              <span>الختم بصوت وأنيميشن مادي ممتع</span>
              <span className="font-mono text-[#B83A26] font-bold">INSTANT SOUND</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS (3 SIMPLE STEPS) ---------------- */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 bg-white border-y-2 border-[#3D2314]">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold text-[#B83A26] uppercase">
              SEAMLESS 3-STEP JOURNEY
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#3D2314] mt-1 tracking-tight">
              كيف تعمل المنظومة في منشأتك؟
            </h2>
            <p className="text-xs sm:text-sm text-[#3D2314]/70 mt-2 max-w-lg mx-auto">
              تجربة مستخدم بدون احتكاك، بدون تطبيقات، ومصممة لسرعة خدمة الزبائن في الكاونتر.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="bg-[#FAF5EB] border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-resting flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#E5A836] border-2 border-[#3D2314] shadow-stamp-resting flex items-center justify-center font-mono font-black text-sm text-[#3D2314] mb-4">
                  01
                </div>
                <h3 className="font-black text-base text-[#3D2314] mb-2">
                  العميل يسجل ويحفظ الكرت
                </h3>
                <p className="text-xs text-[#3D2314]/75 leading-relaxed">
                  يمسح العميل كود المنشأة بكاميرا جواله، يدخل رقمه واسمه لأول مرة فقط، ويحفظ البطاقة في Apple Wallet أو Google Wallet بثانية واحدة.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#3D2314]/20 text-[11px] font-mono font-bold text-[#B83A26]">
                NO APP DOWNLOAD
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FAF5EB] border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-resting flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#B83A26] border-2 border-[#3D2314] shadow-stamp-resting flex items-center justify-center font-mono font-black text-sm text-white mb-4">
                  02
                </div>
                <h3 className="font-black text-base text-[#3D2314] mb-2">
                  الكاشير يختم بلمسة واحدة
                </h3>
                <p className="text-xs text-[#3D2314]/75 leading-relaxed">
                  عند المحاسبة، يمسح الكاشير كود الـ QR من جوال العميل أو يبحث برقم هاتفه، ويضغط زر الختم الفوري بصوت وتفاعل حركي ممتع.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#3D2314]/20 text-[11px] font-mono font-bold text-[#527E78]">
                1-TAP TACTILE STAMP
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FAF5EB] border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-resting flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#527E78] border-2 border-[#3D2314] shadow-stamp-resting flex items-center justify-center font-mono font-black text-sm text-white mb-4">
                  03
                </div>
                <h3 className="font-black text-base text-[#3D2314] mb-2">
                  مزامنة لحظية وصرف المكافأة
                </h3>
                <p className="text-xs text-[#3D2314]/75 leading-relaxed">
                  يتحدث الكرت في محفظة العميل بنفس اللحظة، ويتلقى إشعاراً ترحيبياً، وعند اكتمال الأختام يستلم مكافأته التذكارية المعتمدة.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#3D2314]/20 text-[11px] font-mono font-bold text-[#E5A836]">
                REALTIME PUSH NOTIFY
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CORE PILLARS & FEATURES ---------------- */}
      <section id="features" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold text-[#527E78] uppercase">
            POWERFUL SAAS CAPABILITIES
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#3D2314] mt-1 tracking-tight">
            مصممة لأقوى العمليات التشغيلية
          </h2>
          <p className="text-xs sm:text-sm text-[#3D2314]/70 mt-2 max-w-lg mx-auto">
            لوحة تحكم للمالك، نقاط بيع للكاونتر، وسجل عملاء ذكي يرفع معدل تكرار الزيارات.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-resting">
            <div className="w-10 h-10 rounded-xl bg-[#E5A836] border-2 border-[#3D2314] flex items-center justify-center text-[#3D2314] mb-4 shadow-stamp-resting">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-black text-base text-[#3D2314] mb-1.5">
              قاعدة بيانات عملاء حقيقية (CRM متكامل)
            </h3>
            <p className="text-xs text-[#3D2314]/70 leading-relaxed">
              تتبع أسماء وأرقام عملائك، رصيد أختامهم، عدد مرات الزيارة، وتواريخ آخر تردد على المكان، مع إمكانية الختم المباشر بنقرة زر من داخل الـ CRM.
            </p>
          </div>

          <div className="bg-white border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-resting">
            <div className="w-10 h-10 rounded-xl bg-[#527E78] border-2 border-[#3D2314] flex items-center justify-center text-white mb-4 shadow-stamp-resting">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-black text-base text-[#3D2314] mb-1.5">
              فريق العمل وصلاحيات دقيقة (Granular RBAC)
            </h3>
            <p className="text-xs text-[#3D2314]/70 leading-relaxed">
              أنشئ حسابات الموظفين من داخل حساب المنشأة مباشرة مع رمز PIN من 4 أرقام لكل كاشير، وحدد بدقة من يختم الكروت ومن يمكنه رؤية التقارير.
            </p>
          </div>

          <div className="bg-white border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-resting">
            <div className="w-10 h-10 rounded-xl bg-[#B83A26] border-2 border-[#3D2314] flex items-center justify-center text-white mb-4 shadow-stamp-resting">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-black text-base text-[#3D2314] mb-1.5">
              ستوديو كرت الأختام والمحفظة الرقمية
            </h3>
            <p className="text-xs text-[#3D2314]/70 leading-relaxed">
              خصص عدد الأختام (5، 8، أو 10)، عنوان المكافأة، ألوان الهوية، مع معاينة حية لحظية ومزامنة رسمية لبطاقات Apple Wallet و Google Wallet.
            </p>
          </div>

          <div className="bg-white border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-resting">
            <div className="w-10 h-10 rounded-xl bg-[#3D2314] border-2 border-[#3D2314] flex items-center justify-center text-[#E5A836] mb-4 shadow-stamp-resting">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-black text-base text-[#3D2314] mb-1.5">
              توثيق الذكريات وشرائط الفوتوبوث
            </h3>
            <p className="text-xs text-[#3D2314]/70 leading-relaxed">
              اربط الختم بلحظة رومانسية أو صورة تذكارية للزيارة عبر شرائط أفلام 35mm وتذاكر المواعيد الغرامية (Date Passes) لتخليد التجربة.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- PRICING PLANS ---------------- */}
      <section id="pricing" className="py-16 px-4 sm:px-6 bg-white border-y-2 border-[#3D2314]">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-bold text-[#B83A26] uppercase">
              TRANSPARENT PRICING
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#3D2314] mt-1 tracking-tight">
              باقات اشتراك واضحة ومباشرة
            </h2>
            <p className="text-xs sm:text-sm text-[#3D2314]/70 mt-2 max-w-lg mx-auto">
              ابدأ مجاناً بدون بطاقة بنكية، واختر الخطة المناسبة لحجم منشأتك.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            
            {/* Free Starter */}
            <div className="bg-[#FAF5EB] border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-resting flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#3D2314]/60 block mb-1">الباقة التجريبية</span>
                <h3 className="text-xl font-black text-[#3D2314]">مجاناً للأبد</h3>
                <div className="my-4 text-3xl font-black text-[#3D2314]">0 <span className="text-xs font-normal">ريال</span></div>
                <ul className="space-y-2.5 text-xs text-[#3D2314]/80">
                  <li className="flex items-center gap-2">✓ حتى 100 عميل نشط</li>
                  <li className="flex items-center gap-2">✓ كرت أختام رقمي تفاعلي</li>
                  <li className="flex items-center gap-2">✓ شاشة كاونتر واحدة (PIN)</li>
                  <li className="flex items-center gap-2">✓ دعم فني عبر المنصة</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full mt-6 py-2.5 rounded-xl border-2 border-[#3D2314] bg-white font-bold text-xs text-center hover:bg-[#FAF5EB] transition block shadow-stamp-resting"
              >
                ابدأ مجاناً
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-[#E5A836] border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-hover flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#B83A26] text-white text-[10px] font-mono font-bold px-3 py-0.5 rounded-full border border-[#3D2314]">
                MOST POPULAR
              </div>
              <div>
                <span className="text-xs font-bold text-[#3D2314]/80 block mb-1">المنشآت النشطة</span>
                <h3 className="text-xl font-black text-[#3D2314]">الباقة المتقدمة</h3>
                <div className="my-4 text-3xl font-black text-[#3D2314]">199 <span className="text-xs font-normal">ريال / شهرياً</span></div>
                <ul className="space-y-2.5 text-xs text-[#3D2314] font-semibold">
                  <li className="flex items-center gap-2">✓ عملاء غير محدودين</li>
                  <li className="flex items-center gap-2">✓ مزامنة Apple & Google Wallet</li>
                  <li className="flex items-center gap-2">✓ إدارة فريق العمل (RBAC متقدم)</li>
                  <li className="flex items-center gap-2">✓ سجل CRM كامل وتصدير البيانات</li>
                  <li className="flex items-center gap-2">✓ شاشات صالة TV Wall تفاعلية</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full mt-6 py-3 rounded-xl bg-[#3D2314] text-white font-bold text-xs text-center hover:bg-[#25150C] transition block shadow-stamp-resting"
              >
                ترقية المنشأة الآن
              </Link>
            </div>

            {/* Enterprise Chains */}
            <div className="bg-[#FAF5EB] border-2 border-[#3D2314] rounded-2xl p-6 shadow-stamp-resting flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#3D2314]/60 block mb-1">سلاسل وفروع</span>
                <h3 className="text-xl font-black text-[#3D2314]">باقة الفروع المتعددة</h3>
                <div className="my-4 text-3xl font-black text-[#3D2314]">399 <span className="text-xs font-normal">ريال / شهرياً</span></div>
                <ul className="space-y-2.5 text-xs text-[#3D2314]/80">
                  <li className="flex items-center gap-2">✓ فروع متعددة ونقاط بيع غير محدودة</li>
                  <li className="flex items-center gap-2">✓ تقارير مالية وتحليلات نمو متقدمة</li>
                  <li className="flex items-center gap-2">✓ دومين مخصص للمنشأة</li>
                  <li className="flex items-center gap-2">✓ مدير حساب ودعم على مدار الساعة</li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full mt-6 py-2.5 rounded-xl border-2 border-[#3D2314] bg-white font-bold text-xs text-center hover:bg-[#FAF5EB] transition block shadow-stamp-resting"
              >
                تواصل مع المبيعات
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ SECTION ---------------- */}
      <section id="faq" className="py-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-mono font-bold text-[#B83A26] uppercase">
            COMMON QUESTIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#3D2314] mt-1 tracking-tight">
            الأسئلة الأكثر شيوعاً
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border-2 border-[#3D2314] rounded-xl shadow-stamp-resting overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full p-4 flex items-center justify-between text-right font-bold text-xs sm:text-sm text-[#3D2314] cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#B83A26] transition-transform ${
                    activeFaq === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {activeFaq === index && (
                <div className="p-4 pt-0 text-xs text-[#3D2314]/75 border-t border-[#EADDC4] bg-[#FAF5EB]/50 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- FINAL CTA BANNER ---------------- */}
      <section className="py-16 px-4 sm:px-6 bg-[#3D2314] text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="w-12 h-12 rounded-xl bg-[#E5A836] border-2 border-white flex items-center justify-center mx-auto shadow-md">
            <StampyApertureIcon size={24} color="#3D2314" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            جاهز لبدء برنامج الولاء الأكثر متعة لعملائك؟
          </h2>
          <p className="text-xs sm:text-sm text-[#FAF5EB]/80 max-w-lg mx-auto leading-relaxed">
            انضم الآن وابدأ في إعداد كرت الأختام الخاص بمتجرك خلال دقيقتين فقط بدون أي تعقيدات برمجية.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-[#E5A836] hover:bg-[#D99A27] text-[#3D2314] font-black text-sm border-2 border-white shadow-stamp-resting transition active:translate-x-[2px] active:translate-y-[2px]"
            >
              <span>إنشاء حساب منشأة جديد مجاناً</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- MINIMAL FOOTER ---------------- */}
      <footer className="py-8 px-4 sm:px-6 bg-[#FAF5EB] border-t-2 border-[#3D2314] text-xs text-[#3D2314]/70">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-base text-[#3D2314]">stampy.</span>
            <span className="text-[11px] font-mono">© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link href="/privacy" className="hover:text-[#3D2314] transition">
              سياسة الخصوصية
            </Link>
            <Link href="/terms" className="hover:text-[#3D2314] transition">
              الشروط والأحكام
            </Link>
            <Link href="/login" className="hover:text-[#3D2314] transition">
              دخول المنشأة
            </Link>
            <Link href="/terminal" className="hover:text-[#3D2314] transition">
              كاونتر الكاشير
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
