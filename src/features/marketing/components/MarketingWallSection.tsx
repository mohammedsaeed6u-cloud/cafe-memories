'use client';

import React from 'react';
import Link from 'next/link';
import { Tv, Shield, Wifi, ExternalLink } from 'lucide-react';

export function MarketingWallSection() {
  return (
    <section id="live-wall" className="py-20 px-6 max-w-6xl mx-auto border-t border-stone-200/80">
      <div className="p-8 sm:p-12 rounded-3xl bg-stone-950 text-white shadow-xl relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono text-amber-400 font-bold">
              <Tv className="w-3.5 h-3.5" />
              <span>DIGITAL SIGNAGE & LIVE WALL</span>
            </div>

            <h2
              className="text-3xl sm:text-4xl font-black text-white font-serif leading-tight"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              شاشة الصالة الحية: نبض المكان وتفاعل مجتمع المقهى.
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              حوّل أي شاشة تلفزيون عادية داخل الصالة إلى بورد ذكريات رقمي بدقة 4K. بمجرد أن يكمل العميل شريطه ويمنح موافقته الصريحة، تظهر لقطته بأناقة فائقة على الشاشة مع تنبيه صوتي راقٍ واحتفال بصري محبب.
            </p>

            <div className="space-y-2.5 pt-2 text-xs text-stone-300 font-medium">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>خصوصية تامة: لا تعرض أي صورة إلا بموافقة العميل الصريحة.</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-amber-400 shrink-0" />
                <span>تعمل بسلاسة حتى لو انقطع اتصال الإنترنت بفضل الـ Offline Cache.</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/wall/screen-1"
                className="w-full sm:w-auto text-xs font-bold py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>فتح شاشة الصالة التجريبية</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Wall Mockup Visual */}
          <div className="p-4 sm:p-6 bg-stone-900 rounded-2xl border border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-[10px] font-mono text-stone-400">
              <span className="text-amber-400 font-bold">LIVE 4K STREAM</span>
              <span>ESPRESSO LAB SPECIALTY BAR</span>
            </div>

            <div className="aspect-video bg-stone-950 rounded-xl border border-stone-800 overflow-hidden relative flex items-center justify-center p-4">
              <div className="text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center mx-auto">
                  <Tv className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Community Live Board</h4>
                <p className="text-[10px] text-stone-400 max-w-xs mx-auto">
                  تحديث تلقائي كل 20 ثانية لعرض أحدث اللقطات المعتمدة وباركود الطاولات.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 pt-1">
              <span>Auto Sync • 20s Interval</span>
              <span>100% Consent Controlled</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
