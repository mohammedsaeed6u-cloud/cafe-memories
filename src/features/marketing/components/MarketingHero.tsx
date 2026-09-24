'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Tv, ShieldCheck, Sparkles, Check, Heart, Smartphone, Printer, QrCode } from 'lucide-react';
import { AppleLuxuryShowcase } from '@/components/photobooth/AppleLuxuryShowcase';

export function MarketingHero() {
  return (
    <section className="relative px-4 sm:px-6 pt-12 sm:pt-20 pb-20 max-w-6xl mx-auto text-center apple-font">
      {/* Category Pill */}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/15 bg-white/[0.05] text-stone-200 text-xs font-mono font-semibold mb-6 backdrop-blur-xl shadow-lg">
        <span className="w-2 h-2 rounded-full bg-[#DD0200] animate-pulse" />
        <span className="tracking-widest uppercase text-[#D9D9D9]">
          APPLE LUXURY HIG & AMBIENT EXPERIENCE 2026
        </span>
        <span className="text-white/30">•</span>
        <span className="text-white font-bold">منظومة تجربة العملاء والولاء الفاخرة</span>
      </div>

      {/* Hero Headline */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.14] drop-shadow-md"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          تحويل كل زيارة في نشاطك التجاري<br />
          <span className="italic font-normal bg-gradient-to-r from-[#DD0200] via-[#FF4D4B] to-[#D9D9D9] bg-clip-text text-transparent">
            إلى تجربة فاخرة لا تُنسى.
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-[#D9D9D9]/80 max-w-2xl mx-auto leading-relaxed font-medium">
          واجهة زجاجية مستوحاة من فلسفة أبل: يوثق الزائر لحظته بهاتفه مباشرة بدون تطبيقات، شاشات صالة حية تعكس بهجة المكان، وبطاقة ولاء رقمية في Apple Wallet و Google Wallet تحفظ ذكرياته وتضمن عودته.
        </p>
      </div>

      {/* Multi-Industry Badges Pill */}
      <div className="mt-6 flex items-center justify-center flex-wrap gap-2 text-[11px] font-semibold text-stone-300">
        <span className="px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">متاجر وبوتيكات أزياء</span>
        <span className="px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">صالونات تجميل وعناية</span>
        <span className="px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">مطاعم ومفاهيم طعام</span>
        <span className="px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">معارض وفعاليات ومؤتمرات</span>
        <span className="px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">مساحات ترفيه ومغامرة</span>
        <span className="px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">مقاهي ومحامص مختصة</span>
      </div>

      {/* Primary Action CTAs */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
        <Link
          href="/login"
          className="w-full sm:w-auto text-sm py-4 px-8 rounded-full bg-[#DD0200] hover:bg-[#B50200] text-white font-bold shadow-xl shadow-red-950/60 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>ابدأ تجربة نشاطك التجاري مجاناً</span>
          <ArrowRight className="w-4 h-4 text-white rotate-180" />
        </Link>

        <Link
          href="/c/memories"
          className="w-full sm:w-auto text-sm py-4 px-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold backdrop-blur-md shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>معاينة كارت الزائر الحي</span>
        </Link>
      </div>

      {/* Centerpiece: Apple Luxury Ambient & Bento Showcase Matching User Images 1 & 2 */}
      <div className="mt-14 max-w-lg mx-auto">
        <div className="text-center mb-4">
          <span className="text-[11px] font-mono tracking-widest text-[#D9D9D9]/70 uppercase font-bold">
            ✦ INTERACTIVE APPLE HIG SHOWCASE ✦
          </span>
        </div>
        <AppleLuxuryShowcase />
      </div>
    </section>
  );
}
