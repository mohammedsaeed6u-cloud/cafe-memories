'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';

const THEME_STORAGE_KEY = 'memories_theme';

const noopSubscribe = () => () => {};

function readInitialTheme(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) return saved === 'dark';
  } catch {
    /* storage may be unavailable (private mode) */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function DarkModeToggle({ className = '' }: { className?: string }) {
  // Hydration-safe "is the client mounted" flag without a setState-in-effect.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [isDark, setIsDark] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextDark ? 'dark' : 'light');
    } catch {
      /* storage may be unavailable (private mode) */
    }
  };

  if (!isClient) {
    return (
      <button
        aria-label="تبديل الوضع الداكن"
        className={`w-9 h-9 rounded-full border border-[#E8DCC6] dark:border-[#2A4F44] bg-white/80 dark:bg-[#142721] flex items-center justify-center text-[#3B2F2A] dark:text-[#FAF6EE] opacity-70 ${className}`}
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
      className={`relative w-9 h-9 rounded-full border border-[#E8DCC6] dark:border-[#2A4F44] bg-white/90 dark:bg-[#142721] hover:bg-[#FAF6EE] dark:hover:bg-[#1E3A32] flex items-center justify-center text-[#1E3A32] dark:text-[#E8DCC6] shadow-2xs hover:shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#CF735A] transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-[#1E3A32] transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
