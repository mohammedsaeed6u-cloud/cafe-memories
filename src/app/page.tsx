'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Coffee,
  Tv,
  Sparkles,
  ArrowRight,
  Smartphone,
  Check,
  ChevronDown,
  Gift,
  Camera,
  Flame,
  ShieldCheck,
  Layers,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Clock,
  Sparkle,
} from 'lucide-react';
import { PHOTOBOOTH_FRAME_TEMPLATES } from '@/lib/constants/photobooth-presets';
import { PhotoboothStripCard } from '@/components/photobooth/PhotoboothStripCard';
import { PhotoboothFrame } from '@/types/photobooth';

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeDashTab, setActiveDashTab] = useState<'insights' | 'moderation'>('insights');
  const [activeTemplateId, setActiveTemplateId] = useState<string>('korean_noir_2x6');
  const [roiVisitors, setRoiVisitors] = useState<number>(150);

  const selectedTemplate =
    PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === activeTemplateId) ||
    PHOTOBOOTH_FRAME_TEMPLATES[0];

  const demoFrame: PhotoboothFrame = {
    id: selectedTemplate.id,
    name: selectedTemplate.nameEn,
    nameAr: selectedTemplate.nameAr,
    bgColor: selectedTemplate.defaultBg,
    textColor: selectedTemplate.defaultText,
    borderColor: selectedTemplate.defaultBorder,
    accentColor: selectedTemplate.defaultAccent,
    cornerEmojis: { topRight: '', bottomLeft: '', enabled: false },
    orientation: selectedTemplate.orientation,
    shotCount: selectedTemplate.shotCount,
    layoutType: selectedTemplate.layoutType,
    badgeText: selectedTemplate.badge,
    widthCm: selectedTemplate.widthCm,
    heightCm: selectedTemplate.heightCm,
  };

  const samplePhotos = [
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
  ].slice(0, selectedTemplate.shotCount);

  // ROI calculations
  const extraVisitsPerMonth = Math.round(roiVisitors * 0.22 * 4);
  const extraRevenuePerMonth = extraVisitsPerMonth * 22; // 22 SAR / EGP avg coffee ticket
  const paperCardsSaved = roiVisitors * 30;

  const faqs = [
    {
      q: 'هل يحتاج العميل لتحميل تطبيق من App Store أو Google Play؟',
      a: 'نهائياً. العميل يوجه كاميرا هاتفه العادية إلى رمز الـ QR على الطاولة أو الكاونتر. يفتح كارت الذكريات فوراً كـ Web App سريع وسلس في أقل من ثانيتين بدون أي تحميل.',
    },
    {
      q: 'كيف يتم ربط شاشة الكافيه (TV Wall) بالنظام؟',
      a: 'أي شاشة تلفزيون ذكية تحتوي على متصفح إنترنت (Samsung Tizen, LG webOS, Google TV, Apple TV أو Fire TV Stick) تفتح الرابط المخصص للشاشة (/wall/screen-id). تتحدث الشاشة بالصور المعتمدة فوراً وبدون أي أجهزة إضافية.',
    },
    {
      q: 'كيف نمنع ظهور أي صور غير لائقة على شاشة الكافيه؟',
      a: 'كل صورة يلتقطها العميل تمر فوراً على لوحة تحكم الكافيه (TV Moderation Tab) للموافقة عليها بضغطة واحدة من هاتف أو تابلت الباريستا قبل بثها على الشاشة، مع إمكانية إخفاء أي صورة في أي لحظة.',
    },
    {
      q: 'كيف يمنع النظام التلاعب وتكرار مسح الـ QR في نفس اليوم؟',
      a: 'نظام الحماية الذكي يطبق فترة تبريد (Cooldown) مدتها 24 ساعة لكل جهاز، مع بصمة جهاز مشفرة برمجياً لمنع التلاعب وضمان نزاهة برنامج الولاء.',
    },
    {
      q: 'هل يدعم النظام الكافيهات ذات الفروع المتعددة؟',
      a: 'نعم، كارت الولاء يعمل على مستوى البراند بالكامل، بحيث يجمع العميل زياراته في أي فرع، بينما يمتلك كل فرع شاشته وإحصائياته وإعداداته المستقلة.',
    },
    {
      q: 'هل أحتاج للربط مع نظام الكاشير (POS)؟',
      a: 'لا، Memories يعمل بشكل مستقل تماماً وبدون أي ربط معقد بالكاشير. جهاز الـ QR يوضع على الطاولات أو الكاونتر ويبدأ العمل فوراً.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 selection:bg-amber-500/20 selection:text-amber-950 font-cairo antialiased relative overflow-x-hidden">
      {/* Subtle Dot Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(#18181B 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-200/20 via-orange-100/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navigation Bar (Translucent Apple Glass) */}
      <nav className="sticky top-0 z-50 apple-glass px-6 py-3.5 border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-950 text-white flex items-center justify-center font-black shadow-md">
              <Coffee className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-black text-lg sm:text-xl tracking-tight text-stone-950 leading-tight">
                Memories <span className="text-amber-600 font-serif">✦</span> موميريز
              </span>
              <span className="text-[10px] text-stone-500 tracking-wider uppercase font-bold">
                Specialty Photobooth & Loyalty Layer
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-xs font-bold text-stone-600">
            <a href="#hero-stage" className="hover:text-stone-950 transition-colors">الكبينة الذكية</a>
            <a href="#bento" className="hover:text-stone-950 transition-colors">المنظومة (Bento)</a>
            <a href="#frames" className="hover:text-stone-950 transition-colors">مكتبة الفريمات الـ 10</a>
            <a href="#roi" className="hover:text-stone-950 transition-colors">حاسبة العائد</a>
            <a href="#faq" className="hover:text-stone-950 transition-colors">الأسئلة الشائعة</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/c/espresso-lab"
              className="px-4 py-2 rounded-full text-xs font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <span>تجربة العميل</span>
              <span className="text-amber-600">✦</span>
            </Link>
            <Link
              href="/dashboard"
              className="apple-btn-primary py-2 px-5 text-xs shadow-md"
            >
              <span>لوحة التاجر</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 rotate-180" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section (Apple Hero Stage with 3D Staged iPhone & Physical Korean Strip) */}
      <section className="relative px-6 pt-12 sm:pt-18 pb-20 max-w-6xl mx-auto text-center" id="hero-stage">
        {/* Kicker Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-stone-200/80 bg-white/90 text-stone-800 text-xs font-bold mb-6 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
          <span>كبينة التصوير الكورية وبطاقة الولاء لكافيهات السبيشالتي</span>
          <span className="text-amber-600 font-serif">✦</span>
        </div>

        {/* Punchy Apple Headline */}
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-stone-950 tracking-tight leading-[1.02]">
            قهوتهم اليومية.
            <br />
            <span className="bg-gradient-to-r from-stone-950 via-amber-700 to-amber-500 bg-clip-text text-transparent italic font-serif font-normal">
              ذكرياتهم الدائمة.
            </span>
          </h1>
        </div>

        {/* Confident 2-Line Sub-copy */}
        <p className="mt-6 text-base sm:text-xl text-stone-600 max-w-xl mx-auto leading-relaxed font-medium">
          كبينة تصوير في متصفح كل زائر بمسحة QR واحدة.
          <br className="hidden sm:inline" />
          شاشة حية في كافيهك، وبطاقة ولاء رقمية تضمن عودتهم كل أسبوع.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <Link
            href="/c/espresso-lab"
            className="apple-btn-primary w-full sm:w-auto text-sm py-3.5 px-8"
          >
            <span>ابدأ تجربة العميل الحية</span>
            <ArrowRight className="w-4 h-4 text-amber-400 rotate-180" />
          </Link>
          <Link
            href="/wall/screen-demo"
            className="apple-btn-secondary w-full sm:w-auto text-sm py-3.5 px-6"
          >
            <Tv className="w-4 h-4 text-stone-700" />
            <span>عرض شاشة الكافيه (TV Wall)</span>
          </Link>
        </div>

        {/* 3D Staged Hero Visual (iPhone 16 Pro + Tilted Korean Strip + Dynamic Notification Pill) */}
        <div className="mt-16 relative max-w-4xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 pt-6">
          {/* Floating Dynamic Island Notification Pill */}
          <div className="dynamic-pill absolute -top-4 sm:-top-6 z-30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>تم اعتماد الصورة وبثها على شاشة الكافيه ✦ الآن</span>
            <Tv className="w-3.5 h-3.5 text-amber-400" />
          </div>

          {/* 1. Titanium iPhone 16 Pro Chassis with Live Viewfinder */}
          <div className="phone-titanium relative z-20 flex-shrink-0">
            {/* Dynamic Island */}
            <div className="phone-dynamic-island flex items-center justify-between px-3">
              <span className="w-2 h-2 rounded-full bg-stone-900 border border-stone-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
            </div>

            {/* Screen Content */}
            <div className="w-full h-full bg-[#0C0A09] rounded-[40px] overflow-hidden flex flex-col justify-between p-4 pt-10 text-white relative">
              {/* Top Viewfinder Bar */}
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-stone-300 z-10 px-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>REC 00:03</span>
                </span>
                <span className="text-stone-400">MEMORIES ROASTERS</span>
                <span className="text-amber-400 font-serif">✦</span>
              </div>

              {/* Viewfinder Main Frame */}
              <div className="relative flex-1 my-2 rounded-2xl overflow-hidden bg-stone-900 flex items-center justify-center border border-white/10">
                {/* Simulated Live Viewfinder Photo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80"
                  alt="Live Camera Viewfinder"
                  className="absolute inset-0 w-full h-full object-cover filter contrast-105"
                />

                {/* Leica Viewfinder Brackets */}
                <div className="absolute inset-4 pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/70" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/70" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/70" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/70" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-amber-400/80 rounded-full" />
                </div>

                {/* Film Preset Tag */}
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[10px] font-mono text-amber-300 font-bold">
                  FILM: KOREAN NOIR
                </div>
              </div>

              {/* Bottom Viewfinder Controls */}
              <div className="flex items-center justify-between px-2 pt-1 z-10">
                <div className="w-9 h-9 rounded-xl bg-stone-800/80 border border-white/20 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80"
                    alt="Last Shot"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Tactile Shutter Button */}
                <div className="w-14 h-14 rounded-full border-2 border-white/80 p-1 flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition">
                  <div className="w-full h-full bg-white rounded-full active:bg-amber-400 transition" />
                </div>

                <div className="w-9 h-9 rounded-xl bg-stone-800/80 border border-white/20 flex items-center justify-center text-xs font-mono font-bold text-amber-400">
                  4/4
                </div>
              </div>
            </div>
          </div>

          {/* 2. Physical Korean Photobooth Strip Tilted on Canvas */}
          <div className="tilted-strip relative z-10 flex-shrink-0 cursor-pointer">
            <div className="bg-[#FAF8F5] p-3.5 pb-5 rounded-xl border border-stone-300 shadow-2xl text-stone-900 w-[240px] sm:w-[260px]">
              {/* Studio Header */}
              <div className="text-center pb-2.5 mb-2 border-b border-stone-200 flex items-center justify-between px-1">
                <span className="text-[9px] font-mono tracking-widest uppercase text-stone-500 font-bold">SEOUL STUDIO</span>
                <span className="text-[10px] font-black tracking-tight text-stone-950 font-serif">MEMORIES ✦</span>
                <span className="text-[9px] font-mono text-stone-500">2026.09.21</span>
              </div>

              {/* 4 Cuts */}
              <div className="space-y-2">
                {[
                  'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=80',
                ].map((src, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-sm overflow-hidden bg-stone-200 border border-stone-300/80 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Cut ${i + 1}`} className="w-full h-full object-cover filter contrast-[1.08] saturate-[0.85]" />
                    <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-white/90 bg-black/50 px-1 rounded">
                      #0{i + 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Strip Footer with Barcode */}
              <div className="mt-3 pt-2 text-center border-t border-stone-200 flex items-center justify-between px-1">
                <div className="text-right">
                  <p className="text-[9px] font-black text-stone-900 leading-tight">ذكريات كافيه سبيشالتي</p>
                  <p className="text-[8px] text-amber-700 font-mono font-bold">5×15.2 CM PRINT</p>
                </div>
                {/* Barcode graphic */}
                <div className="flex items-center gap-[1.5px] h-4">
                  {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 3, 1, 2].map((w, idx) => (
                    <div key={idx} style={{ width: `${w}px` }} className="h-full bg-stone-900" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Metrics Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-4 bg-white/70 rounded-3xl border border-stone-200/80 shadow-sm backdrop-blur-md">
          <div className="p-3 text-center">
            <span className="block text-2xl sm:text-3xl font-black text-stone-950 font-mono">+78%</span>
            <span className="text-xs text-stone-600 font-bold mt-0.5 block">معدل عودة الزوار شهرياً</span>
          </div>
          <div className="p-3 text-center border-r border-stone-200/60">
            <span className="block text-2xl sm:text-3xl font-black text-stone-950 font-mono">0 ثانية</span>
            <span className="text-xs text-stone-600 font-bold mt-0.5 block">تحميل • بدون أي تطبيق</span>
          </div>
          <div className="p-3 text-center border-r border-stone-200/60">
            <span className="block text-2xl sm:text-3xl font-black text-stone-950 font-mono">10 فريمات</span>
            <span className="text-xs text-stone-600 font-bold mt-0.5 block">مقاسات استوديو حقيقية</span>
          </div>
          <div className="p-3 text-center border-r border-stone-200/60">
            <span className="block text-2xl sm:text-3xl font-black text-stone-950 font-mono">4K 60fps</span>
            <span className="text-xs text-stone-600 font-bold mt-0.5 block">بث حي لشاشة الكافيه</span>
          </div>
        </div>
      </section>

      {/* Signature Divider */}
      <div className="flex items-center justify-center gap-3 py-6 opacity-60">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        <span className="text-amber-600 font-serif text-sm">✦</span>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
      </div>

      {/* The Apple Bento Grid Section */}
      <section className="px-6 py-16 max-w-6xl mx-auto" id="bento">
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
            THE PLATFORM ✦ المنظومة المتكاملة
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-stone-950 mt-2">
            كل ما يحتاجه كافيهك.{' '}
            <span className="text-amber-600 font-serif italic font-normal">
              في تجربة واحدة متكاملة.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-stone-600 mt-2.5 max-w-xl mx-auto">
            ارتقِ بتجربة عميلك من مجرد فنجان قهوة إلى طقس يومي وذكرى ملموسة.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Bento 1: The Live 4K TV Wall (Wide Dark Card, 7 cols) */}
          <div className="bento-card-dark md:col-span-7 p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
                  LIVE 4K ✦ DIGITAL SIGNAGE
                </span>
                <span className="text-stone-400 text-xs font-mono">TV WALL</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                شاشة الكافيه الحية. معرض ذكريات دائم.
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-md">
                حوّل شاشة التلفزيون في كافيهك إلى لوحة حية تعرض لحظات الزوار فور التقاطها. تمنح المكان روحاً تفاعلية دافئة دون أي أجهزة إضافية.
              </p>
            </div>

            {/* TV Mockup Frame */}
            <div className="mt-8 rounded-2xl bg-stone-950 p-4 border border-stone-800 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-[11px] font-mono text-stone-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ONLINE • 14 MEMORIES DISPLAYED</span>
                </span>
                <span className="text-stone-500">SAMSUNG THE FRAME 4K</span>
              </div>

              {/* Photos on Wall Preview */}
              <div className="grid grid-cols-3 gap-3 pt-3">
                {[
                  'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80',
                ].map((src, i) => (
                  <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-stone-700 bg-stone-900 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="TV Strip" className="w-full h-full object-cover filter contrast-105" />
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-xs" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bento 2: Tactile 10-Stamp Pass (Tall White Card, 5 cols) */}
          <div className="bento-card md:col-span-5 p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold font-mono">
                  SMART LOYALTY ✦ بدون ورق ضائع
                </span>
                <span className="text-stone-400 text-xs font-mono">10 STAMPS</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-950 mb-2">
                كارت الـ 10 أختام. المكافأة مضمونة.
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                كل زيارة تضيف ختماً تلقائياً في كارت العميل. عند الزيارة العاشرة، تفتح الهدية المباشرة مع سلسلة زيارات تحفز العودة.
              </p>
            </div>

            {/* Tactile Stamp Pass Mockup */}
            <div className="mt-8 p-5 bg-[#FAF8F5] rounded-2xl border border-stone-300/80 shadow-md">
              <div className="flex items-center justify-between text-xs font-black text-stone-950 mb-3 font-mono">
                <span>MEMORIES PASS</span>
                <span className="text-amber-800">7/10 أختام ✦</span>
              </div>

              {/* Stamps Grid */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <div
                    key={num}
                    className={`aspect-square rounded-full border-2 flex items-center justify-center font-black text-xs transition ${
                      num <= 7
                        ? 'border-amber-600 bg-amber-100 text-amber-900 shadow-xs'
                        : 'border-dashed border-stone-300 bg-white text-stone-400'
                    }`}
                  >
                    {num <= 7 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : num}
                  </div>
                ))}
                {/* 10th Unlocked Reward Stamp */}
                <div className="aspect-square rounded-full border-2 border-amber-600 bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md animate-pulse">
                  <Gift className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-[11px] font-bold text-stone-700">
                <span className="flex items-center gap-1 text-orange-700">
                  <Flame className="w-3.5 h-3.5" />
                  <span>سلسلة زيارات: 4 أسابيع</span>
                </span>
                <span className="text-amber-800">كورتادو مجاني 🎁</span>
              </div>
            </div>
          </div>

          {/* Bento 3: Leica In-Browser Photobooth Studio (White Card, 5 cols) */}
          <div className="bento-card md:col-span-5 p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-800 border border-stone-200 text-xs font-bold font-mono">
                  ZERO APP INSTALL ✦ في المتصفح
                </span>
                <span className="text-stone-400 text-xs font-mono">LEICA LENS</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-950 mb-2">
                كاميرا وفلاتر أفلام حقيقية.
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                معايرة سينمائية مستوحاة من استوديوهات سيول وطوكيو مع صوت الغالق التناظري وفلاش الزينون.
              </p>
            </div>

            {/* Film Filter Selector Mockup */}
            <div className="mt-8 p-4 bg-stone-950 rounded-2xl border border-stone-800 text-white">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-3">
                <span>FILM EMULATIONS</span>
                <span className="text-amber-400">4 PRESETS</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold font-mono">
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-500/40 text-amber-300 flex items-center justify-between">
                  <span>KOREAN NOIR</span>
                  <span className="text-xs">✦</span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 text-stone-400 flex items-center justify-between">
                  <span>WARM LATTE</span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 text-stone-400 flex items-center justify-between">
                  <span>RETRO 35MM</span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 text-stone-400 flex items-center justify-between">
                  <span>TOKYO POP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento 4: Barista 1-Tap Control & CRM (Wide Dark Card, 7 cols) */}
          <div className="bento-card-dark md:col-span-7 p-7 sm:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
                  BARISTA MODERATION ✦ أمان كامل
                </span>
                <span className="text-stone-400 text-xs font-mono">IPAD CRM</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                اعتماد بلمسة واحدة. وبيانات ولاء دقيقة.
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-md">
                الباريستا يوافق على الصور بضغطة زر قبل ظهورها على الشاشة. تعرف على عملائك الدائمين فور وصولهم مع حماية كاملة للمكان.
              </p>
            </div>

            {/* Barista Moderation Queue Mockup */}
            <div className="mt-8 p-4 bg-stone-900/90 rounded-2xl border border-stone-800 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-xs">
                <span className="font-bold text-stone-300">طابور الاعتماد المباشر (1 في الانتظار)</span>
                <span className="text-amber-400 font-mono text-[11px]">طاولة 04 • منذ دقيقة</span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-stone-800 overflow-hidden border border-stone-700 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=200&auto=format&fit=crop&q=80"
                      alt="Pending Moderation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">جلسة أصدقاء ✦ كورتادو</p>
                    <p className="text-[11px] text-stone-400">العميل أحمد • الزيارة رقم 8</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition">
                    قبول للشاشة ✓
                  </button>
                  <button className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 font-bold text-xs transition">
                    تخطي
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Divider */}
      <div className="flex items-center justify-center gap-3 py-6 opacity-60">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        <span className="text-amber-600 font-serif text-sm">✦</span>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
      </div>

      {/* Interactive Frame Darkroom Studio Sandbox */}
      <section className="px-6 py-16 max-w-6xl mx-auto" id="frames">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
            CURATED STUDIO FRAMES ✦ استوديو الفريمات العشرة
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-stone-950 mt-2">
            جرّب كروت الاستوديو بنفسك{' '}
            <span className="text-amber-600 font-serif italic font-normal">
              قبل الاشتراك.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-stone-600 mt-2.5 max-w-xl mx-auto">
            10 مقاسات وأشكال مستوحاة من استوديوهات سيول وطوكيو، بمقاسات طباعة حقيقية بالمليمتر.
          </p>
        </div>

        {/* 10 Frame Selector Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-4xl mx-auto">
          {PHOTOBOOTH_FRAME_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setActiveTemplateId(tmpl.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTemplateId === tmpl.id
                  ? 'bg-stone-950 text-white shadow-md scale-[1.03]'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/80 hover:border-stone-300'
              }`}
            >
              <span className="text-amber-500 font-serif">✦</span>
              <span>{tmpl.nameAr.split('(')[0].trim()}</span>
              <span className="text-[10px] font-mono opacity-60">({tmpl.dimensionsCm})</span>
            </button>
          ))}
        </div>

        {/* Darkroom Studio Display Card */}
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-stone-950 rounded-3xl border border-stone-800 shadow-2xl text-white max-w-3xl mx-auto relative overflow-hidden">
          {/* Subtle Ambient Backlight Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <PhotoboothStripCard
              photos={samplePhotos}
              frame={demoFrame}
              branding={{ name: 'Memories Specialty Roasters' }}
              freeGiftOffer={{
                title: 'كورتادو مجاني عند اكتمال الكارت',
                subtitle: 'أظهر الكارت للباريستا',
                icon: '🎁',
              }}
            />

            <div className="mt-8 text-center max-w-md">
              <p className="text-sm font-bold text-stone-200 mb-1">
                {selectedTemplate.description}
              </p>
              <span className="text-xs font-mono text-amber-400 font-bold block mb-4">
                المقاس الحقيقي: {selectedTemplate.dimensionsCm} ({selectedTemplate.dimensions}) ✦ جاهز للطباعة
              </span>

              <Link
                href={`/c/espresso-lab?template=${selectedTemplate.id}`}
                className="apple-btn-primary py-2.5 px-6 text-xs shadow-md bg-white text-stone-950 hover:bg-stone-100"
              >
                <span>جرّب هذا الفريم بالكاميرا الآن</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-600 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator (Apple Trade-In Style) */}
      <section className="px-6 py-16 max-w-4xl mx-auto" id="roi">
        <div className="apple-glass rounded-3xl p-8 sm:p-12 border border-stone-300/80 shadow-xl text-center">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
            ROI CALCULATOR ✦ حاسبة العائد لكافيهك
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-950 mt-2">
            كم ستحقق شهرياً من تحويل الزوار لعملاء دائمين؟
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-lg mx-auto">
            دراسة ميدانية على كافيهات السبيشالتي أثبتت زيادة 22% في معدل الزيارات المتكررة شهرياً.
          </p>

          {/* Slider */}
          <div className="mt-8 max-w-lg mx-auto">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800 mb-2">
              <span>عدد زوار الكافيه يومياً:</span>
              <span className="text-lg font-black font-mono text-amber-800">{roiVisitors} زائر/يوم</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={roiVisitors}
              onChange={(e) => setRoiVisitors(Number(e.target.value))}
              className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
              <span>50 زائر</span>
              <span>250 زائر</span>
              <span>500 زائر</span>
            </div>
          </div>

          {/* Output Cards */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs text-center">
              <span className="text-xs font-bold text-stone-500">زيارات إضافية شهرياً</span>
              <p className="text-3xl font-black text-stone-950 font-mono mt-1">+{extraVisitsPerMonth}</p>
              <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">زيارة من عملاء مخلصين</span>
            </div>

            <div className="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/30 shadow-xs text-center">
              <span className="text-xs font-bold text-amber-900">عائد إضافي متوقع شهرياً</span>
              <p className="text-3xl font-black text-amber-950 font-mono mt-1">
                +{extraRevenuePerMonth.toLocaleString()} ر.س
              </p>
              <span className="text-[11px] text-amber-800 font-bold mt-1 inline-block">بمتوسط فاتورة 22 ر.س</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs text-center">
              <span className="text-xs font-bold text-stone-500">كروت ورقية تم توفيرها</span>
              <p className="text-3xl font-black text-stone-950 font-mono mt-1">{paperCardsSaved}</p>
              <span className="text-[11px] text-stone-500 font-bold mt-1 inline-block">توفير 100% لتكاليف الطباعة</span>
            </div>
          </div>
        </div>
      </section>

      {/* Glass FAQ Section */}
      <section className="px-6 py-16 max-w-4xl mx-auto" id="faq">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
            FAQ ✦ الأسئلة الشائعة
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-950 mt-2">
            كل ما يدور ببال أصحاب الكافيهات.
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="apple-card overflow-hidden border border-stone-200/80 transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full p-5 text-right flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-stone-900 hover:text-stone-950"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-500 transition-transform duration-300 flex-shrink-0 ${
                    activeFaq === i ? 'rotate-180 text-amber-600' : ''
                  }`}
                />
              </button>
              {activeFaq === i && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Apple CTA */}
      <section className="px-6 py-16 max-w-5xl mx-auto text-center">
        <div className="bento-card-dark p-10 sm:p-16 rounded-[2.5rem] relative overflow-hidden">
          {/* Subtle Ambient Radial */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none" />

          <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
            GET STARTED ✦ جاهز لتحويل كافيهك؟
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-3">
            ابدأ تجربة عميلك الأولى اليوم.{' '}
            <span className="text-amber-400 font-serif italic font-normal">
              بدون أي تعقيد.
            </span>
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-3 max-w-md mx-auto leading-relaxed">
            انضم إلى كافيهات السبيشالتي التي تبني مجتمعاً حقيقياً من العملاء الأوفياء.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              href="/c/espresso-lab"
              className="apple-btn-primary w-full sm:w-auto text-sm py-3.5 px-8 bg-white text-stone-950 hover:bg-stone-100"
            >
              <span>جرّب كارت العميل مباشرة</span>
              <ArrowRight className="w-4 h-4 text-amber-600 rotate-180" />
            </Link>
            <Link
              href="/dashboard"
              className="apple-btn-secondary w-full sm:w-auto text-sm py-3.5 px-6 border-white/20 text-white bg-white/10 hover:bg-white/20"
            >
              <span>فتح لوحة تحكم الكافيه</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Apple-Style Minimal Footer */}
      <footer className="border-t border-stone-200/80 py-10 px-6 text-center text-xs text-stone-500 font-medium">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-stone-900">Memories</span>
            <span>✦</span>
            <span>Specialty Photobooth & Loyalty System</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <a href="#hero-stage" className="hover:text-stone-900 transition">الكبينة</a>
            <a href="#bento" className="hover:text-stone-900 transition">المنظومة</a>
            <a href="#frames" className="hover:text-stone-900 transition">الفريمات</a>
            <a href="#faq" className="hover:text-stone-900 transition">الأسئلة</a>
            <Link href="/wall/screen-demo" className="hover:text-stone-900 transition">TV Wall</Link>
            <Link href="/dashboard" className="hover:text-stone-900 transition">لوحة التاجر</Link>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>All systems operational ✦ 99.99%</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
