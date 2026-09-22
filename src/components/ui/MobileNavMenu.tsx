'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Search, Camera, Tv, Sparkles } from 'lucide-react';
import { DarkModeToggle } from './DarkModeToggle';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';

export function MobileNavMenu({ onOpenSearch }: { onOpenSearch: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      {/* Hamburger Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="فتح القائمة الرئيسية"
        className="w-10 h-10 rounded-2xl border border-[#E8DCC6] dark:border-[#2A4F44] bg-white/80 dark:bg-[#142721] flex items-center justify-center text-[#1E3A32] dark:text-[#FAF6EE] shadow-2xs hover:bg-[#FAF6EE] dark:hover:bg-[#1E3A32] transition cursor-pointer"
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
            className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-[#FAF6EE] dark:bg-[#142721] border-l border-[#E8DCC6] dark:border-[#2A4F44] p-6 shadow-2xl flex flex-col justify-between font-cairo text-right animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[#E8DCC6] dark:border-[#2A4F44]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1E3A32] text-[#FAF6EE] flex items-center justify-center shadow-xs">
                    <MemoriesArchIcon size={20} color="#FAF6EE" />
                  </div>
                  <span
                    className="font-serif font-black text-lg tracking-tight text-[#1E3A32] dark:text-[#FAF6EE] lowercase"
                    style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                  >
                    memories
                  </span>
                </div>
                <button
                  onClick={closeMenu}
                  aria-label="إغلاق القائمة"
                  className="w-9 h-9 rounded-full border border-[#E8DCC6] dark:border-[#2A4F44] flex items-center justify-center text-[#3B2F2A] dark:text-[#FAF6EE] hover:bg-black/5 cursor-pointer"
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
                  className="flex-1 py-2 px-3.5 rounded-full border border-[#E8DCC6] dark:border-[#2A4F44] bg-white/70 dark:bg-[#1E3A32]/60 text-xs font-bold text-[#3B2F2A] dark:text-[#FAF6EE] flex items-center justify-between shadow-2xs cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-[#8A9A7B]" />
                    <span>بحث سريع...</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#8A9A7B]">⌘K</span>
                </button>
                <DarkModeToggle />
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1.5 pt-2 text-sm font-bold text-[#3B2F2A] dark:text-[#FAF6EE]">
                <a
                  href="#loop"
                  onClick={closeMenu}
                  className="block px-4 py-3 rounded-2xl hover:bg-[#E8DCC6]/40 dark:hover:bg-[#1E3A32] transition"
                >
                  حلقة العودة والولاء
                </a>
                <a
                  href="#wall"
                  onClick={closeMenu}
                  className="block px-4 py-3 rounded-2xl hover:bg-[#E8DCC6]/40 dark:hover:bg-[#1E3A32] transition"
                >
                  شاشات الصالة الحية
                </a>
                <a
                  href="#roi"
                  onClick={closeMenu}
                  className="block px-4 py-3 rounded-2xl hover:bg-[#E8DCC6]/40 dark:hover:bg-[#1E3A32] transition"
                >
                  حاسبة العائد المتوقع
                </a>
                <a
                  href="#pricing"
                  onClick={closeMenu}
                  className="block px-4 py-3 rounded-2xl hover:bg-[#E8DCC6]/40 dark:hover:bg-[#1E3A32] transition"
                >
                  الباقات والأسعار
                </a>
                <a
                  href="#faq"
                  onClick={closeMenu}
                  className="block px-4 py-3 rounded-2xl hover:bg-[#E8DCC6]/40 dark:hover:bg-[#1E3A32] transition"
                >
                  الأسئلة الشائعة
                </a>
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-[#E8DCC6] dark:border-[#2A4F44] space-y-3">
              <Link
                href="/c/espresso-lab"
                prefetch={false}
                onClick={closeMenu}
                className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-[#1E3A32] border border-[#E8DCC6] dark:border-[#2A4F44] text-xs font-bold text-[#1E3A32] dark:text-[#FAF6EE] flex items-center justify-between shadow-2xs hover:scale-[1.01] active:scale-[0.99] transition"
              >
                <span className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#B85C43]" />
                  <span>تجربة كارت العميل </span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180 text-[#8A9A7B]" />
              </Link>

              <Link
                href="/dashboard"
                prefetch={false}
                onClick={closeMenu}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#1E3A32] hover:bg-[#142721] text-[#FAF6EE] text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition"
              >
                <Sparkles className="w-4 h-4 text-[#B85C43]" />
                <span>دخول لوحة التاجر</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
