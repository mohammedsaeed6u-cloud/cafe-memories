'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function DarkModeToggle({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('stampy_theme') || localStorage.getItem('memories_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved ? saved === 'dark' : prefersDark;
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stampy_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stampy_theme', 'light');
    }
  };

  if (!mounted) {
    return (
      <button
        aria-label="تبديل الوضع الداكن"
        className={`w-9 h-9 rounded-full border border-[#EADDC4] dark:border-[#3D2314]/30] bg-white/80 dark:bg-[#20304E] flex items-center justify-center text-[#3D2314] dark:text-[#FAF5EB] opacity-70 ${className}`}
      >
        <span className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'التحويل إلى الوضع الفاتح' : 'التحويل إلى الوضع الداكن'}
      title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      className={`relative w-9 h-9 rounded-full border border-[#EADDC4] dark:border-[#3D2314]/30] bg-white/90 dark:bg-[#20304E] hover:bg-[#FAF5EB] dark:hover:bg-[#3D2314] flex items-center justify-center text-[#3D2314] dark:text-[#EADDC4] shadow-2xs hover:shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#DFAB56] transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-[#3D2314] transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
