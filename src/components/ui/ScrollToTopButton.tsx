'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="العودة لأعلى الصفحة"
      title="العودة لأعلى الصفحة"
      className="fixed bottom-6 left-6 z-40 w-11 h-11 rounded-full bg-[#3D2314] hover:bg-[#20304E] text-[#FAF5EB] border border-[#DFAB56/40] shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group print:hidden"
    >
      <ArrowUp className="w-5 h-5 text-[#FAF5EB] group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
}
