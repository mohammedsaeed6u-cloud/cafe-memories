'use client';

import React from 'react';
import { Store, LayoutDashboard } from 'lucide-react';

interface TerminalHeaderProps {
  cafeSlug: string;
  branding: { name?: string; logoUrl?: string };
}

export function TerminalHeader({ cafeSlug, branding }: TerminalHeaderProps) {
  return (
    <header className="bg-[#141212] text-[#FBF9F5] border-b border-white/10 px-4 sm:px-6 py-3.5 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/" className="transition hover:opacity-90 flex items-center">
            <img
              src={branding?.logoUrl || '/brand/stampy-logo.svg'}
              alt={branding?.name || 'Stampy'}
              className="h-9 w-auto max-w-[130px] object-contain"
            />
          </a>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm sm:text-base tracking-wide text-[#FBF9F5]">
                {branding?.name || 'محطة الكاشير'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#682025]/80 text-[#DFAB56] text-[10px] font-mono font-bold border border-[#DFAB56]/40">
                STAFF POS TERMINAL
              </span>
            </div>
            <p className="text-[11px] text-[#D5C0A8]">
              كاونتر الختم السريع، صرف المكافآت، وطباعة أشرطة الذكريات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/dashboard?cafe=${cafeSlug}`}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[#FAF5EB] font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#DFAB56]" />
            <span className="hidden sm:inline">لوحة التحكم CRM</span>
          </a>
        </div>
      </div>
    </header>
  );
}
