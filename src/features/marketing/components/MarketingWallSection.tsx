'use client';

import React from 'react';
import Link from 'next/link';
import { Tv, Sparkles, ShieldCheck, ExternalLink } from 'lucide-react';

export function MarketingWallSection() {
  return (
    <section className="py-20 md:py-28 px-4 bg-stone-900 text-white relative overflow-hidden" data-purpose="live-wall-showcase" id="salon-wall">
      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 bg-amber-950/80 text-amber-400 border border-amber-800/80 font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider mb-4 shadow-sm">
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>SMART SCREEN • LIVE WALL 4K</span>
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-stone-100 tracking-tight leading-tight">
            نشاطك التجاري يحصل على جدار ذكريات حي خاص به
          </h2>
          <p className="text-stone-400 text-sm md:text-base mt-4 leading-relaxed font-normal">
            حوّل أي شاشة تلفزيون ذكية داخل الصالة إلى بورد ذكريات تفاعلي يعرض لحظات رواد المكان المعتمدة بدقة 4K دون الكشف عن أي بيانات شخصية، لتحفيز باقي الطاولات على التفاعل وتكرار الزيارة.
          </p>
        </div>

        {/* TV OLED Showcase Mockup */}
        <div className="rounded-3xl bg-[#141210] p-4 sm:p-7 border border-stone-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative">
          {/* TV Top Bar */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-5 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-stone-200 tracking-wider">بث مباشر للذكريات في الصالة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-950 text-amber-400 border border-amber-800/70 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md">
                4K UHD STREAM
              </span>
              <Link
                href="/wall/screen-1"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-white transition"
              >
                <span>معاينة الشاشة</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Screen Content Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1c1917] rounded-2xl p-4 border border-stone-800/90 text-center hover:border-amber-500/40 transition">
              <div className="h-32 bg-stone-900 rounded-xl flex items-center justify-center text-4xl mb-3 border border-stone-800 shadow-inner">
                📸
              </div>
              <span className="text-xs font-bold text-stone-200 block mb-0.5">طاولة 02 • عائلة خالد</span>
              <span className="text-[10px] font-mono text-stone-500">منذ 3 دقائق • معتمدة</span>
            </div>

            <div className="bg-[#1c1917] rounded-2xl p-4 border border-stone-800/90 text-center hover:border-amber-500/40 transition">
              <div className="h-32 bg-stone-900 rounded-xl flex items-center justify-center text-4xl mb-3 border border-stone-800 shadow-inner">
                🎉
              </div>
              <span className="text-xs font-bold text-stone-200 block mb-0.5">طاولة 06 • احتفال تخرج</span>
              <span className="text-[10px] font-mono text-stone-500">منذ 9 دقائق • معتمدة</span>
            </div>

            <div className="bg-[#1c1917] rounded-2xl p-4 border border-stone-800/90 text-center hover:border-amber-500/40 transition">
              <div className="h-32 bg-stone-900 rounded-xl flex items-center justify-center text-4xl mb-3 border border-stone-800 shadow-inner">
                ☕
              </div>
              <span className="text-xs font-bold text-stone-200 block mb-0.5">كاونتر القهوة • كوب V60</span>
              <span className="text-[10px] font-mono text-stone-500">منذ 16 دقيقة • معتمدة</span>
            </div>
          </div>

          {/* TV Bottom Footer */}
          <div className="mt-5 pt-4 border-t border-stone-800 flex flex-wrap items-center justify-between text-xs text-stone-400 gap-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>تعمل على أي شاشة تلفزيون ذكية عبر المتصفح بدون أي أجهزة إضافية</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>موافقة مسبقة من الزائر واعتماد إداري برمز PIN</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
