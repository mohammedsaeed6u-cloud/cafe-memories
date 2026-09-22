'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Tv, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';

export function MarketingHero() {
  return (
    <section className="relative px-6 pt-12 sm:pt-20 pb-20 max-w-6xl mx-auto text-center">
      {/* Editorial Category Pill */}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-stone-300/80 bg-white text-stone-800 text-xs font-mono font-bold mb-8 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
        <span className="tracking-widest uppercase text-stone-500">
          MEMORIES HOSPITALITY ARCHITECTURE
        </span>
        <span className="text-stone-300">•</span>
        <span className="text-stone-900 font-bold">إصدار المقاهي المختصة 2026</span>
      </div>

      {/* Hero Headline */}
      <div className="max-w-4xl mx-auto space-y-5">
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-black text-stone-950 tracking-tight leading-[1.12]"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          تحويل لحظات القهوة العابرة.<br />
          <span className="italic font-normal text-amber-700">
            إلى ذكريات ملموسة وولاء يدوم.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium">
          منظومة فوتوبوث وولاء ذكية صُممت خصيصاً لأصحاب الكافيهات الراقية — تمنح روادك كروت تصوير وبطاقات بريدية فاخرة عبر هواتفهم بدون تكلفة أجهزة، مع ربط فوري بشاشات الصالة ومحطات الطباعة اللاسلكية.
        </p>
      </div>

      {/* Real Co-Branding Showcase Pill */}
      <div className="mt-8 flex items-center justify-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-stone-200/90 shadow-2xs text-xs font-bold text-stone-700">
          <div className="flex items-center gap-1.5 text-stone-950 font-black">
            <div className="w-5 h-5 rounded-md bg-stone-900 text-amber-400 flex items-center justify-center">
              <MemoriesArchIcon size={12} color="#FBBF24" />
            </div>
            <span>memories</span>
          </div>
          <span className="text-stone-300 font-black">×</span>
          <span className="text-stone-900 font-bold">Espresso Lab Specialty Bar</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-bold">
            CO-BRANDED EXPERIENCE
          </span>
        </div>
      </div>

      {/* Action CTAs */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
        <Link
          href="/c/espresso-lab"
          className="w-full sm:w-auto text-sm py-4 px-8 rounded-2xl bg-stone-950 hover:bg-stone-800 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>ابدأ تجربة الزائر الحية</span>
          <ArrowRight className="w-4 h-4 text-amber-400 rotate-180" />
        </Link>

        <Link
          href="/wall/screen-1"
          className="w-full sm:w-auto text-sm py-4 px-7 rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Tv className="w-4 h-4 text-stone-700" />
          <span>عرض شاشة الصالة (Live Wall)</span>
        </Link>
      </div>

      {/* Operational Highlights */}
      <div className="mt-14 pt-8 border-t border-stone-200/80 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <span className="text-xl font-black text-stone-950 block font-mono">ZERO</span>
          <span className="text-[11px] text-stone-500 font-bold">تكلفة عتاد أو أجهزة</span>
        </div>
        <div>
          <span className="text-xl font-black text-stone-950 block font-mono">2×6 & 4×6</span>
          <span className="text-[11px] text-stone-500 font-bold">أشرطة وبطاقات بريدية</span>
        </div>
        <div>
          <span className="text-xl font-black text-stone-950 block font-mono">2 SEC</span>
          <span className="text-[11px] text-stone-500 font-bold">ختم فوري للباريستا</span>
        </div>
        <div>
          <span className="text-xl font-black text-stone-950 block font-mono">300 DPI</span>
          <span className="text-[11px] text-stone-500 font-bold">طباعة فوتوغرافية معتمدة</span>
        </div>
      </div>
    </section>
  );
}
