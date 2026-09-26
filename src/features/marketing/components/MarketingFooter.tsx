'use client';

import React from 'react';
import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="bg-[#0E0D0D] border-t border-white/10 py-14 px-6 text-xs text-[#D9D9D9]/70 apple-font select-none relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center shadow-lg shadow-red-950/50 border border-white/20">
            <span className="text-sm font-serif">✦</span>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white block leading-tight">
              memories studio
            </span>
            <span className="text-[9px] font-mono tracking-[0.18em] text-[#A19E9B] font-semibold uppercase block leading-none">
              ATELIER NOSTALGIA EDITION • 2026
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[#D9D9D9]/80 font-medium">
          <Link href="/privacy" className="hover:text-white transition-colors">
            سياسة الخصوصية
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            الشروط والأحكام
          </Link>
          <Link href="/login" className="hover:text-white transition-colors">
            لوحة تحكم التاجر
          </Link>
        </div>

        <div className="text-[11px] font-mono text-[#D9D9D9]/50">
          All Rights Reserved © 2026 Memories Studio
        </div>
      </div>
    </footer>
  );
}
