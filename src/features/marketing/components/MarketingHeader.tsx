'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { StampyLogo } from '@/components/brand/StampyLogo';

interface MarketingHeaderProps {
  onOpenSearch?: () => void;
}

export function MarketingHeader({ onOpenSearch }: MarketingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="tappy-nav" aria-label="Main Navigation">
      {/* Stampy Official Brand Logo */}
      <Link aria-label="Stampy home" className="flex items-center gap-2 group transition-transform hover:-translate-y-0.5" href="/">
        <StampyLogo variant="horizontal" size="sm" showTagline={false} />
      </Link>

      {/* Nav Links */}
      <ul className="hidden md:flex nav-links">
        <li>
          <a href="#how">كيف يعمل؟</a>
        </li>
        <li>
          <a href="#rules">الأنشطة والقواعد</a>
        </li>
        <li>
          <a href="#dashboard">لوحة المنشأة</a>
        </li>
        <li>
          <a href="#services">الفوتوبوث وشاشة الصالة</a>
        </li>
        <li>
          <a href="#pricing">الأسعار</a>
        </li>
        <li>
          <a href="#faq">الأسئلة الشائعة</a>
        </li>
      </ul>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/login?tab=signin"
          className="hidden sm:inline-flex text-xs font-bold text-[#1B1B1E] hover:text-[#f0456a] px-3 py-2 transition uppercase font-head tracking-wider"
        >
          تسجيل الدخول
        </Link>

        <Link
          href="/login?tab=signup"
          className="bp-btn-access"
        >
          <span>
            <span className="hidden sm:inline">إنشاء حساب </span>مجاناً
          </span>
        </Link>

        {/* Mobile Burger */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden nav-burger"
          aria-label="Open menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden nav-drawer">
          <ul>
            <li>
              <a onClick={() => setIsMobileMenuOpen(false)} href="#how">كيف يعمل؟</a>
            </li>
            <li>
              <a onClick={() => setIsMobileMenuOpen(false)} href="#rules">الأنشطة والقواعد</a>
            </li>
            <li>
              <a onClick={() => setIsMobileMenuOpen(false)} href="#dashboard">لوحة المنشأة</a>
            </li>
            <li>
              <a onClick={() => setIsMobileMenuOpen(false)} href="#services">الفوتوبوث وشاشة الصالة</a>
            </li>
            <li>
              <a onClick={() => setIsMobileMenuOpen(false)} href="#pricing">الأسعار</a>
            </li>
            <li>
              <a onClick={() => setIsMobileMenuOpen(false)} href="#faq">الأسئلة الشائعة</a>
            </li>
          </ul>
          <div className="pt-3 border-t-2 border-[#e2dbf0] flex flex-col gap-2 mt-2">
            <Link
              href="/login?tab=signin"
              className="text-center py-2.5 rounded-lg border-2 border-[#1B1B1E] text-xs font-bold text-[#1B1B1E] font-head uppercase"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/login?tab=signup"
              className="text-center py-2.5 rounded-lg bg-[#682025] text-xs font-bold text-white font-head uppercase shadow-xs"
            >
              إنشاء حساب مجاناً (14 يوماً)
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
