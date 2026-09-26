'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';
import { Search, ArrowRight, UserCheck, Menu, X, Tv, ShieldCheck, Sparkles, Store } from 'lucide-react';

interface MarketingHeaderProps {
  onOpenSearch?: () => void;
}

export function MarketingHeader({ onOpenSearch }: MarketingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '#customer-journey', label: 'رحلة العميل' },
    { href: '#business-operation', label: 'تشغيل البيزنس' },
    { href: '#live-wall', label: 'شاشة الصالة' },
    { href: '#pricing', label: 'باقات الشراكة' },
    { href: '#faq', label: 'الأسئلة الشائعة' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-black/65 backdrop-blur-2xl border-b border-white/10 transition-all duration-200 apple-font">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand Logo & Monogram */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center shadow-lg shadow-red-950/50 group-hover:scale-105 transition-transform duration-200 border border-white/20">
            <span className="text-sm font-serif">✦</span>
          </div>
          <div>
            <span
              className="text-xl font-black tracking-tight text-white block leading-tight lowercase"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              memories
            </span>
            <span className="text-[8.5px] font-mono tracking-widest text-[#D9D9D9]/70 font-bold uppercase block leading-none">
              EXPERIENCE & LOYALTY STUDIO
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-stone-300">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons (Desktop & Tablet) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 text-xs font-mono transition cursor-pointer backdrop-blur-md"
              aria-label="البحث السريع في الموقع (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <span>بحث...</span>
              <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-sm border border-white/10 text-stone-400">⌘K</kbd>
            </button>
          )}

          <Link
            href="/login"
            className="hidden sm:inline-flex text-xs py-2 px-4 rounded-lg bg-transparent hover:bg-white/5 border border-white/10 text-[#FBF9F5] font-semibold transition active:scale-95 cursor-pointer backdrop-blur-md"
          >
            لوحة التاجر
          </Link>

          <Link
            href="/c/memories"
            className="text-xs py-2 px-4 sm:px-5 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-6px_rgba(221,2,0,0.4)] transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>تجربة الزائر</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="فتح القائمة الرئيسية"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-stone-200 hover:bg-white/10"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-bold"
            >
              تسجيل دخول التاجر
            </Link>
            <Link
              href="/c/memories"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full bg-[#DD0200] text-white text-xs font-bold shadow-md"
            >
              فتح كارت التصوير الرقمي
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
