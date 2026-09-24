'use client';

import React from 'react';
import Link from 'next/link';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';

export function MarketingFooter() {
  return (
    <footer className="bg-white border-t border-white/10/80 py-12 px-6 text-stone-400 text-xs">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-xs">
            <MemoriesArchIcon size={18} color="#FFFFFF" />
          </div>
          <div>
            <span
              className="text-base font-black tracking-tight text-white block leading-tight lowercase"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              memories
            </span>
            <span className="text-[9px] font-mono tracking-widest text-stone-400 font-bold uppercase block leading-none">
              HOSPITALITY ARCHITECTURE • 2026
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-stone-400 font-medium">
          <Link href="/privacy" className="hover:text-white transition">
            سياسة الخصوصية
          </Link>
          <Link href="/terms" className="hover:text-white transition">
            الشروط والأحكام
          </Link>
          <Link href="/login" className="hover:text-white transition">
            دخول الموظفين والشركاء
          </Link>
        </div>

        <div className="text-[11px] font-mono text-stone-400">
          All Rights Reserved © 2026 Memories Studio
        </div>
      </div>
    </footer>
  );
}
