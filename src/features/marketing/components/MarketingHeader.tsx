'use client';

import React from 'react';
import Link from 'next/link';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';
import { Search, ArrowRight, UserCheck } from 'lucide-react';

interface MarketingHeaderProps {
  onOpenSearch?: () => void;
}

export function MarketingHeader({ onOpenSearch }: MarketingHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-stone-200/80 transition-all duration-200">
      <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
        {/* Brand Logo & Monogram */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
            <MemoriesArchIcon size={20} color="#FBBF24" />
          </div>
          <div>
            <span
              className="text-xl font-black tracking-tight text-stone-900 block leading-tight lowercase"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              memories
            </span>
            <span className="text-[9px] font-mono tracking-widest text-stone-500 font-bold uppercase block leading-none">
              HOSPITALITY STUDIO
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-stone-700">
          <a href="#customer-journey" className="hover:text-stone-950 transition-colors">
            رحلة العميل
          </a>
          <a href="#business-operation" className="hover:text-stone-950 transition-colors">
            تشغيل البيزنس
          </a>
          <a href="#live-wall" className="hover:text-stone-950 transition-colors">
            شاشة الصالة
          </a>
          <a href="#pricing" className="hover:text-stone-950 transition-colors">
            باقات الشراكة
          </a>
          <a href="#faq" className="hover:text-stone-950 transition-colors">
            الأسئلة الشائعة
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200/90 text-stone-600 text-xs font-mono transition cursor-pointer"
              title="بحث في المنظومة"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-[11px]">بحث...</span>
            </button>
          )}

          <Link
            href="/login"
            className="text-xs font-bold px-3.5 py-2 rounded-xl text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>لوحة التاجر</span>
          </Link>

          <Link
            href="/c/espresso-lab"
            className="text-xs font-bold px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>تجربة الزائر الحية</span>
            <ArrowRight className="w-3 h-3 text-amber-400 rotate-180" />
          </Link>
        </div>
      </div>
    </header>
  );
}
