'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Search, Camera, Tv, Sparkles } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';
import { StampyLogo } from '@/components/brand/StampyLogo';

export function MobileNavMenu({ onOpenSearch }: { onOpenSearch: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      {/* Hamburger Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="فتح القائمة الرئيسية"
        className="w-10 h-10 rounded-2xl border border-[#EADDC4] dark:border-[#3D2314]/30] bg-white/80 dark:bg-[#20304E] flex items-center justify-center text-[#3D2314] dark:text-[#FAF5EB] shadow-2xs hover:bg-[#FAF5EB] dark:hover:bg-[#3D2314] transition cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeMenu}
          role="dialog"
          aria-modal="true"
        >
          {/* Slide-in Sheet */}
          <div
            className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-[#FAF5EB] dark:bg-[#20304E] border-l border-[#EADDC4] dark:border-[#3D2314]/30] p-6 shadow-2xl flex flex-col justify-between font-cairo text-right animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[#EADDC4] dark:border-[#3D2314]/30]">
                <div className="flex items-center gap-2.5">
                    <StampyLogo size="sm" variant="horizontal" showTagline={false} theme="light" />
                  </div>
                <button
                  onClick={closeMenu}
                  aria-label="إغلاق القائمة"
                  className="w-9 h-9 rounded-full border border-[#EADDC4] dark:border-[#3D2314]/30] flex items-center justify-center text-[#3D2314] dark:text-[#FAF5EB] hover:bg-black/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Actions (Search & Theme) */}
              <div className="py-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenSearch();
                  }}
                  className="flex-1 py-2 px-3.5 rounded-full border border-[#EADDC4] dark:border-[#3D2314]/30] bg-white/70 dark:bg-[#3D2314]/60 text-xs font-bold text-[#3D2314] dark:text-[#FAF5EB] flex items-center justify-between shadow-2xs cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-[#527E78]" />
                    <span>بحث سريع...</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#527E78]">⌘K</span>
                </button>
                <DarkModeToggle />
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1.5 pt-2 text-sm font-bold text-[#3D2314] dark:text-[#FAF5EB]">
                <a
                  href="#loop"
                  onClick={closeMenu}
                  className="block px-4 py-3 rounded-2xl hover:bg-[#EADDC4]/40 dark:hover:bg-[#3D2314] transition"
                >
                  حلقة العودة والولاء
                </a>
                <a
                  href="#wall"
                  onClick={closeMenu}
                  className="block px-4 py-3 rounded-2xl hover:bg-[#EADDC4]/40 dark:hover:bg-[#3D2314] transition"
                >
                  شاشات الصالة الحية
                </a>
                <a
                  href="#roi"
                  onClick={closeMenu}
                  className="block px-4 py-3 rounded-2xl hover:bg-[#EADDC4]/40 dark:hover:bg-[#3D2314] transition"
                >
                  حاسبة العائد المتوقع
                </a>
                <a
                  href="#pricing"
                  onClick={closeMenu}
                  className="block px-4 py-3 rounded-2xl hover:bg-[#EADDC4]/40 dark:hover:bg-[#3D2314] transition"
                >
                  الباقات والأسعار
                </a>
                <a
                  href="#faq"
                  onClick={closeMenu}
                  className="block px-4 py-3 rounded-2xl hover:bg-[#EADDC4]/40 dark:hover:bg-[#3D2314] transition"
                >
                  الأسئلة الشائعة
                </a>
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-[#EADDC4] dark:border-[#3D2314]/30] space-y-3">
              <Link
                href="/c/stampy"
                prefetch={false}
                onClick={closeMenu}
                className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-[#3D2314] border border-[#EADDC4] dark:border-[#3D2314]/30] text-xs font-bold text-[#3D2314] dark:text-[#FAF5EB] flex items-center justify-between shadow-2xs hover:scale-[1.01] active:scale-[0.99] transition"
              >
                <span className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#B83A26]" />
                  <span>كارت وتوثيق العميل</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180 text-[#527E78]" />
              </Link>

              <Link
                href="/dashboard"
                prefetch={false}
                onClick={closeMenu}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#3D2314] hover:bg-[#20304E] text-[#FAF5EB] text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition"
              >
                <Sparkles className="w-4 h-4 text-[#B83A26]" />
                <span>دخول لوحة التاجر</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
