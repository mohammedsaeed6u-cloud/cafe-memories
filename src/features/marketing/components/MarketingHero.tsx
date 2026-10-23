'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Camera, ShieldCheck, Zap } from 'lucide-react';
import { AppleLuxuryShowcase } from '@/components/photobooth/AppleLuxuryShowcase';
import { StampyHeroTicket } from '@/components/brand/StampyLogo';

export function MarketingHero() {
  return (
    <section className="relative px-4 sm:px-6 pt-12 sm:pt-20 pb-20 max-w-5xl mx-auto text-center font-sans">
      {/* Category Pill with Stampy Ochre & 5 Spectral Stripes */}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#DFAB56]/40 bg-[#DFAB56]/15 text-[#3D2314] text-xs font-mono font-bold mb-8 backdrop-blur-xl shadow-lg">
        <span className="w-2 h-2 rounded-full bg-[#DFAB56] animate-pulse" />
        <span className="tracking-[0.15em] uppercase text-[#DFAB56]">
          STAMPY • استامبي • منصة كروت التصوير والولاء الذكية
        </span>
      </div>

      {/* Hero Headline */}
      <div className="max-w-3xl mx-auto space-y-5">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#3D2314] tracking-tight leading-[1.15]">
          كل زيارة تصنع أثراً يدوم.<br />
          <span className="bg-gradient-to-r from-[#DFAB56] via-[#C99645] to-[#AC3E25] bg-clip-text text-transparent">
            استوديو الذكريات والولاء الفاخر لمنشأتك.
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-[#63574D] max-w-2xl mx-auto leading-relaxed font-normal">
          كروت تصوير فوتوبوث زجاجية تفاعلية، بطاقات ولاء رقمية في Apple Wallet و Google Wallet، وشاشات صالة حية تعيد الرواد لمنشأتك دون تطبيقات أو تعقيد.
        </p>
      </div>

      {/* Hero CTAs */}
      <div className="mt-8 mb-12 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
        <Link
          href="/c/stampy"
          className="w-full sm:w-auto text-xs py-3.5 px-7 rounded-xl bg-[#DFAB56] hover:bg-[#C99645] text-[#3D2314] font-extrabold shadow-lg shadow-amber-950/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Camera className="w-4 h-4 text-[#3D2314]" />
          <span>فتح استوديو التصوير المباشر</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </Link>

        <Link
          href="/login"
          className="w-full sm:w-auto text-xs py-3.5 px-7 rounded-xl bg-white hover:bg-[#FAF5EB] border border-[#EADDC4] hover:border-[#DFAB56] text-[#3D2314] font-bold backdrop-blur-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>لوحة تحكم المنشأة</span>
        </Link>
      </div>

      {/* Centerpiece: Official Tilted Stampy Ticket (-6.42°) */}
      <div className="my-8 flex justify-center">
        <StampyHeroTicket size={340} />
      </div>

      {/* Centerpiece: Interactive Photobooth Strip Showcase */}
      <div className="mt-12">
        <AppleLuxuryShowcase />
      </div>
    </section>
  );
}
