'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Tv, ShieldCheck, Sparkles, Check, Heart, Coffee, Smartphone, Printer, QrCode } from 'lucide-react';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';

type HeroTheme = 'korean_noir' | 'polaroid_vintage' | 'cafe_latte' | 'film_35mm' | 'ticket_express';

const HERO_THEMES: { id: HeroTheme; label: string; icon: string; bg: string; border: string; text: string; accent: string }[] = [
  { id: 'korean_noir', label: 'نوار كوري عاجي', icon: '📸', bg: '#FBF9F5', border: '#D6D3CD', text: '#1C1917', accent: '#3B2F2A' },
  { id: 'polaroid_vintage', label: 'بولارويد كلاسيك', icon: '🎞️', bg: '#FFFFFC', border: '#E7E5E4', text: '#292524', accent: '#D97706' },
  { id: 'cafe_latte', label: 'لاتيه كافيه دافئ', icon: '☕', bg: '#F7F2EB', border: '#E2D7C7', text: '#3E2F28', accent: '#B85C43' },
  { id: 'film_35mm', label: 'فيلم 35 ملم', icon: '📽️', bg: '#1C1917', border: '#44403C', text: '#FAFAF9', accent: '#F59E0B' },
  { id: 'ticket_express', label: 'تذكرة الكافيه', icon: '🎟️', bg: '#FAF5EC', border: '#8B2635', text: '#4A121A', accent: '#8B2635' },
];

const HERO_PORTRAITS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
];

export function MarketingHero() {
  const [activeThemeId, setActiveThemeId] = useState<HeroTheme>('korean_noir');
  const activeTheme = HERO_THEMES.find((t) => t.id === activeThemeId) || HERO_THEMES[0];

  return (
    <section className="relative px-4 sm:px-6 pt-10 sm:pt-16 pb-20 max-w-6xl mx-auto text-center">
      {/* Ambient Warm Atmosphere Glow */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Editorial Category Pill */}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-stone-300/80 bg-white text-stone-800 text-xs font-mono font-bold mb-6 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
        <span className="tracking-widest uppercase text-stone-500">
          MEMORIES HOSPITALITY ARCHITECTURE
        </span>
        <span className="text-stone-300">•</span>
        <span className="text-stone-900 font-bold">منظومة تجربة زوار المقاهي المختصة 2026</span>
      </div>

      {/* Hero Headline */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-black text-stone-950 tracking-tight leading-[1.14]"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          تحويل كل زيارة في مقهاك إلى ذكرى تدوم.<br />
          <span className="italic font-normal text-amber-700">
            وكل ذكرى إلى دافع حقيقي للعودة.
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium">
          منصة متكاملة لتجربة زوار المقاهي المختصة والولاء التفاعلي: يوثق العميل لحظته بهاتفه مباشرة بدون أي تطبيق، شاشة الصالة الحية تصنع تفاعلاً مجتمعياً دافئاً، وكارت الولاء الرقمي في محفظة Apple و Google Wallet يمنحه سبباً دائماً لاختيار مقهاك وتكرار زياراته.
        </p>
      </div>

      {/* Platform Real Independence Badge */}
      <div className="mt-6 flex items-center justify-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-stone-200/90 shadow-2xs text-xs font-bold text-stone-700">
          <div className="flex items-center gap-1.5 text-stone-900 font-black">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center">
              <MemoriesArchIcon size={12} color="#FFFFFF" />
            </div>
            <span>memories</span>
          </div>
          <span className="text-amber-500 font-black">•</span>
          <span className="text-stone-800 font-bold">منظومة مخصصة لهوية وعلامة مقهاك المستقلة</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            White-Label Ready
          </span>
        </div>
      </div>

      {/* Primary Action CTAs */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
        <Link
          href="/login"
          className="w-full sm:w-auto text-sm py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-black shadow-lg shadow-amber-900/15 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>ابدأ تجربة مقهاك مجاناً</span>
          <ArrowRight className="w-4 h-4 text-white rotate-180" />
        </Link>

        <Link
          href="/c/memories"
          className="w-full sm:w-auto text-sm py-4 px-7 rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-700" />
          <span>معاينة كارت الزائر الحي</span>
        </Link>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE HERO PRODUCT SHOWCASE: STRIP + WALLET PASS + WALL */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="mt-14 max-w-4xl mx-auto">
        {/* Interactive Theme Switcher Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-3 scrollbar-none">
          <span className="text-xs font-bold text-stone-500 ml-1 shrink-0">جرب أنماط الكروت:</span>
          {HERO_THEMES.map((theme) => {
            const isActive = activeThemeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setActiveThemeId(theme.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm scale-105'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <span>{theme.icon}</span>
                <span>{theme.label}</span>
              </button>
            );
          })}
        </div>

        {/* Hero Visual Stage */}
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-stone-100/80 to-stone-50/40 border border-stone-200/90 shadow-xl flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden">
          {/* 1. Real Korean-Standard Photobooth Strip Card */}
          <div className="relative group shrink-0">
            <div
              style={{
                backgroundColor: activeTheme.bg,
                borderColor: activeTheme.border,
                color: activeTheme.text,
              }}
              className="w-[240px] sm:w-[260px] p-3.5 pt-4 pb-5 rounded-2xl shadow-2xl border transition-all duration-300 relative select-none flex flex-col items-center"
            >
              {/* Paper Texture Overlay */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-15 rounded-2xl"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")',
                }}
              />

              {/* Strip Header */}
              <div className="w-full flex items-center justify-between px-1 mb-2.5 text-[9px] font-mono font-bold opacity-80">
                <span className="tracking-wider uppercase">MEMORIES • 3-CUT</span>
                <span>2026.09.23</span>
              </div>

              {/* 3 Authentic Photo Slots */}
              <div className="w-full space-y-2">
                {HERO_PORTRAITS.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-white shadow-2xs border-[3px] border-white ring-1 ring-stone-200/60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Patron Shot ${idx + 1}`}
                      className="w-full h-full object-cover filter contrast-[1.03] saturate-[0.98]"
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[7px] font-mono font-bold rounded-xs flex items-center gap-0.5 select-none">
                      <Check className="w-2 h-2 text-emerald-300 stroke-[3]" />
                      <span>#0{idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Strip Footer */}
              <div className="w-full mt-3 pt-2 border-t border-current/15 flex items-center justify-between text-[9px] font-mono font-black">
                <div className="flex items-center gap-1">
                  <Coffee className="w-3 h-3 text-amber-600" />
                  <span>MEMORIES STUDIO</span>
                </div>
                <span className="text-[8px] opacity-70">SEOUL × CAIRO</span>
              </div>
            </div>
          </div>

          {/* 2. Side Floating Showcase Elements: Wallet Pass & TV Live Wall Badge */}
          <div className="flex flex-col items-center md:items-start text-right space-y-4 max-w-sm">
            {/* Apple & Google Wallet Loyalty Pass Preview */}
            <div className="w-full p-4 rounded-2xl bg-white border border-stone-200 shadow-md text-stone-900 space-y-2.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-stone-950">كارت ولاء محفظة الهاتف</h4>
                    <span className="text-[10px] text-stone-500 font-mono">Apple & Google Wallet</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  ٤ من ٥ أختام
                </span>
              </div>

              {/* 5 Stamp Circles Progress */}
              <div className="flex items-center justify-between px-1 py-1" dir="ltr">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center text-xs font-black shadow-2xs">
                    <Check className="w-4 h-4 text-amber-800 stroke-[3]" />
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-xs font-black animate-pulse shadow-xs border border-amber-600">
                  🎁
                </div>
              </div>

              <p className="text-[11px] text-stone-600 font-medium leading-tight">
                الزيارة القادمة تفتح <strong>مشروب مجاني مميز + طباعة الكارت</strong> فوراً.
              </p>
            </div>

            {/* In-Store 4K Live Wall Notification Card */}
            <div className="w-full p-3.5 rounded-2xl bg-[#1E1917] text-white border border-stone-800 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-amber-400 font-bold">شاشة الصالة الحية 4K</span>
                </div>
                <span className="text-[9px] font-mono text-stone-400">TV DISPLAY</span>
              </div>
              <p className="text-xs font-bold text-stone-100 leading-snug">
                "تم بث لقطة سارة للتو على شاشة الصالة الرئيسية بموافقتها الصريحة"
              </p>
              <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800">
                <span>تفاعل فوري في الصالة</span>
                <span className="text-emerald-400 font-bold">معتمد 100%</span>
              </div>
            </div>

            {/* Direct Interaction Hint */}
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>جرب النقر على أنماط الكروت بالأعلى لمشاهدة التغير الفوري!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Honest Operational Reality Highlights */}
      <div className="mt-14 pt-8 border-t border-stone-200/80 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <span className="text-base font-black text-stone-900 block font-mono">بدون كابينة</span>
          <span className="text-[11px] text-stone-500 font-medium">يعمل بهواتف زوارك الحالية</span>
        </div>
        <div>
          <span className="text-base font-black text-stone-900 block font-mono">LIVE WALL</span>
          <span className="text-[11px] text-stone-500 font-medium">شاشة صالة تفاعلية للشاشات الذكية</span>
        </div>
        <div>
          <span className="text-base font-black text-stone-900 block font-mono">APPLE & GOOGLE</span>
          <span className="text-[11px] text-stone-500 font-medium">كروت ولاء رقمية بالمحفظة</span>
        </div>
        <div>
          <span className="text-base font-black text-stone-900 block font-mono">طباعة اختيارية</span>
          <span className="text-[11px] text-stone-500 font-medium">متوافق مع أي طابعة صور لاسلكية</span>
        </div>
      </div>
    </section>
  );
}

