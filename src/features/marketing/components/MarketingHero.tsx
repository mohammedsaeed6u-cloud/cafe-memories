'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Camera } from 'lucide-react';
import { AppleLuxuryShowcase } from '@/components/photobooth/AppleLuxuryShowcase';

export function MarketingHero() {
  return (
    <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-20 max-w-5xl mx-auto text-center apple-font">
      {/* Category Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-stone-300 text-xs font-mono font-medium mb-6 backdrop-blur-xl shadow-lg">
        <span className="w-2 h-2 rounded-full bg-[#DD0200] animate-pulse" />
        <span className="tracking-widest uppercase text-[#D9D9D9]">
          MEMORIES STUDIO • APPLE DESIGN EDITION
        </span>
      </div>

      {/* Hero Headline */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.12]"
        >
          استوديو الذكريات والولاء الفاخر.<br />
          <span className="bg-gradient-to-r from-[#DD0200] via-[#FF4D4B] to-[#D9D9D9] bg-clip-text text-transparent font-normal italic">
            كل زيارة تصنع أثراً يدوم.
          </span>
        </h1>

        <p className="mt-3 text-sm sm:text-base md:text-lg text-[#D9D9D9]/80 max-w-xl mx-auto leading-relaxed font-normal">
          كروت تصوير زجاجية تفاعلية، بطاقات ولاء رقمية في Apple Wallet، وشاشات صالة حية تعيد الزوار لمكانك بدون تطبيقات أو تعقيد.
        </p>
      </div>

      {/* Two Restrained Apple CTAs */}
      <div className="mt-8 mb-12 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
        <Link
          href="/c/memories"
          className="w-full sm:w-auto text-xs py-3 px-6 rounded-full bg-[#DD0200] hover:bg-[#B50200] text-white font-bold shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>فتح استوديو التصوير المباشر</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </Link>

        <Link
          href="/login"
          className="w-full sm:w-auto text-xs py-3 px-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold backdrop-blur-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>لوحة تحكم التاجر</span>
        </Link>
      </div>

      {/* Centerpiece: Apple Luxury Interactive Studio */}
      <div className="mt-6">
        <AppleLuxuryShowcase />
      </div>
    </section>
  );
}
