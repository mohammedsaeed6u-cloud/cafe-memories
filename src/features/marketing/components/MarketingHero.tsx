'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Camera } from 'lucide-react';
import { AppleLuxuryShowcase } from '@/components/photobooth/AppleLuxuryShowcase';

export function MarketingHero() {
  return (
    <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-20 max-w-5xl mx-auto text-center apple-font">
      {/* Category Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md border border-white/10 bg-white/[0.03] text-stone-300 text-[11px] font-mono font-bold mb-8 backdrop-blur-xl shadow-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-[#DD0200] animate-pulse" />
        <span className="tracking-[0.18em] uppercase text-[#D9D9D9]">
          ATELIER NOSTALGIA • MEMORIES STUDIO
        </span>
      </div>

      {/* Hero Headline */}
      <div className="max-w-3xl mx-auto space-y-5">
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-semibold text-white tracking-tight leading-[1.12]"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          استوديو الذكريات والولاء الفاخر.<br />
          <span className="bg-gradient-to-r from-[#DD0200] via-[#FF5E5B] to-[#D9D9D9] bg-clip-text text-transparent font-normal italic">
            كل زيارة تصنع أثراً يدوم.
          </span>
        </h1>

        <p className="mt-3 text-sm sm:text-base md:text-lg text-[#A19E9B] max-w-xl mx-auto leading-relaxed font-normal">
          كروت تصوير زجاجية تفاعلية، بطاقات ولاء رقمية في Apple Wallet، وشاشات صالة حية تعيد الزوار لمكانك بدون تطبيقات أو تعقيد.
        </p>
      </div>

      {/* Two Restrained Atelier Nostalgia CTAs */}
      <div className="mt-8 mb-12 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
        <Link
          href="/c/memories"
          className="w-full sm:w-auto text-xs py-3 px-6 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_30px_-8px_rgba(221,2,0,0.4)] transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-[#FBF9F5]" />
          <span>فتح استوديو التصوير المباشر</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </Link>

        <Link
          href="/login"
          className="w-full sm:w-auto text-xs py-3 px-6 rounded-lg bg-transparent hover:bg-white/[0.04] border border-white/10 hover:border-[#DD0200]/40 text-[#FBF9F5] font-semibold backdrop-blur-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
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
