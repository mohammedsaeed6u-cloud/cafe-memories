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
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200/80 transition-all duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand Logo & Monogram */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
            <MemoriesArchIcon size={20} color="#FFFFFF" />
          </div>
          <div>
            <span
              className="text-xl font-black tracking-tight text-stone-900 block leading-tight lowercase"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              memories
            </span>
            <span className="text-[9px] font-mono tracking-widest text-stone-500 font-bold uppercase block leading-none">
              EXPERIENCE & LOYALTY STUDIO
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-stone-700">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-amber-700 transition-colors py-1"
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
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200/90 text-stone-600 text-xs font-mono transition cursor-pointer"
              title="بحث سريع (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="text-[11px]">بحث...</span>
            </button>
          )}

          <Link
            href="/login"
            className="hidden sm:flex text-xs font-bold px-3.5 py-2 rounded-xl text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>لوحة التاجر</span>
          </Link>

          <Link
            href="/c/memories"
            className="text-xs font-bold px-3 sm:px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>تجربة الزائر</span>
            <ArrowRight className="w-3 h-3 text-white rotate-180" />
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة الرئيسية'}
            aria-expanded={isMobileMenuOpen}
            className="md:hidden p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-800 transition cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-stone-900" />
            ) : (
              <Menu className="w-5 h-5 text-stone-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Sliding Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-[72px] z-50 md:hidden bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-[#FAF9F6] border-b border-stone-200/90 p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-4 duration-250"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navigation Anchors */}
            <div className="space-y-1 pb-3 border-b border-stone-200/80">
              <span className="text-[10px] font-mono tracking-widest text-stone-400 font-bold uppercase block px-3 mb-1">
                تصفح المنصة
              </span>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-bold text-stone-800 hover:text-amber-700 hover:bg-stone-100/80 transition"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Quick Access Portals */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-mono tracking-widest text-stone-400 font-bold uppercase block px-3 mb-1">
                البوابات والمحطات
              </span>

              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full px-3.5 py-3 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs font-bold flex items-center justify-between shadow-2xs hover:bg-stone-50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold">لوحة تحكم التاجر</span>
                    <span className="text-[10px] text-stone-500 font-normal">إدارة الفرع، الإطارات والتقارير</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 rotate-180" />
              </Link>

              <Link
                href="/terminal"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full px-3.5 py-3 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs font-bold flex items-center justify-between shadow-2xs hover:bg-stone-50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold">محطة الكاونتر وطاقم الخدمة (POS)</span>
                    <span className="text-[10px] text-stone-500 font-normal">ختم الزيارات وصرف الهدايا فوراً</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 rotate-180" />
              </Link>

              <Link
                href="/wall/screen-1"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full px-3.5 py-3 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs font-bold flex items-center justify-between shadow-2xs hover:bg-stone-50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold">شاشة الصالة الحية (Live Wall)</span>
                    <span className="text-[10px] text-stone-500 font-normal">بث تفاعلي لشاشات التلفزيون الذكية</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 rotate-180" />
              </Link>
            </div>

            {/* Direct CTA */}
            <div className="pt-2">
              <Link
                href="/c/memories"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>معاينة كارت وتجربة الزائر الحية</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
