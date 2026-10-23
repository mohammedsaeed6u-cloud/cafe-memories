'use client';

import React from 'react';
import Link from 'next/link';
import { StampyLogo } from '@/components/brand/StampyLogo';

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#EADDC4] bg-[#F2E8D5] py-14 px-6 text-[#63574D] text-xs font-sans">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <StampyLogo size="sm" showTagline={false} />
          <span className="text-[#7D6E63] text-[11px]">
            منصة كروت التصوير التفاعلية وبرامج الولاء الذكية للمنشآت والعلامات التجارية
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-stone-400">
          <Link href="/privacy" className="hover:text-[#3D2314] transition-colors">
            سياسة الخصوصية
          </Link>
          <Link href="/terms" className="hover:text-[#3D2314] transition-colors">
            شروط الخدمة
          </Link>
          <Link href="/login" className="hover:text-[#3D2314] transition-colors">
            دخول المنشأة
          </Link>
          <Link href="/c/stampy" className="hover:text-[#3D2314] transition-colors">
            استوديو الزائر
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#EADDC4] text-center text-[#7D6E63] text-[11px] font-mono">
        © {new Date().getFullYear()} STAMPY (استامبي). جميع الحقوق محفوظة • مبني وفق الركائز المعمارية السحابية الـ 10.
      </div>
    </footer>
  );
}
