'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StampyLogo } from '@/components/brand/StampyLogo';
import { Search, ArrowRight, UserCheck, Menu, X, Tv, ShieldCheck, Sparkles, Store } from 'lucide-react';

interface MarketingHeaderProps {
  onOpenSearch?: () => void;
}

export function MarketingHeader({ onOpenSearch }: MarketingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { href: '#business-operation', label: 'تشغيل المنشأة' },
    { href: '#live-wall', label: 'شاشة الصالة' },
    { href: '#pricing', label: 'باقات الشراكة' },
    { href: '#trust', label: 'المعمارية والأمان' },
    { href: '#faq', label: 'الأسئلة الشائعة' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF5EB]/95 backdrop-blur-2xl border-b border-[#EADDC4] transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Official Stampy Brand Logo */}
        <Link href="/" className="flex items-center group">
          <StampyLogo size="md" showTagline={true} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#63574D]">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-[#3D2314] transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#EADDC4] bg-white text-[#63574D] hover:text-white hover:border-[#DFAB56]/30 text-xs transition-colors"
              title="بحث في المنظومة (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#DFAB56]" />
              <span className="text-[11px] font-mono text-[#7D6E63]">⌘K</span>
            </button>
          )}

          <Link
            href="/c/stampy"
            className="hidden sm:inline-flex items-center gap-2 text-xs py-2 px-3.5 rounded-lg bg-white hover:bg-[#FAF5EB] text-[#3D2314] border border-[#EADDC4] font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#DFAB56]" />
            <span>تجربة الاستوديو</span>
          </Link>

          <Link
            href="/login"
            className="text-xs py-2 px-4 rounded-lg bg-[#DFAB56] hover:bg-[#C99645] text-[#3D2314] font-bold shadow-md shadow-amber-950/20 transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>لوحة التحكم</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#7D6E63] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="القائمة"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-[#DFAB56]/20 bg-[#FAF5EB]/98 backdrop-blur-2xl px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[#63574D] hover:text-[#3D2314] py-1 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-[#EADDC4] flex flex-col gap-2.5">
            <Link
              href="/c/stampy"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-[#3D2314] text-[#DFAB56] text-xs font-semibold border border-[#DFAB56]/30"
            >
              فتح استوديو الزائر
            </Link>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-[#DFAB56] text-[#12100E] text-xs font-bold"
            >
              دخول لوحة تحكم المنشأة
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
