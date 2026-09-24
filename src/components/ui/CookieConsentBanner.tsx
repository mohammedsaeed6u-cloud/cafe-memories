'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck } from 'lucide-react';

export function CookieConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('memories_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = (type: 'all' | 'essential') => {
    localStorage.setItem('memories_cookie_consent', type);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="إشعار ملفات تعريف الارتباط والخصوصية"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 print:hidden apple-font text-right animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-5 rounded-[26px] bg-[#1C1C1E]/90 border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#DD0200]/20 border border-[#DD0200]/40 text-[#DD0200] flex items-center justify-center shrink-0">
            <Cookie className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              خصوصيتك واحترام تجربتك أولويتنا •
            </h4>
            <span className="text-[10px] text-[#D9D9D9]/70 font-mono">GDPR & Privacy Compliant</span>
          </div>
        </div>

        <p className="text-[11px] text-[#D9D9D9]/80 leading-relaxed">
          نستخدم ملفات تعريف الارتباط الضرورية لتشغيل جلسات المنشآت والمتاجر، حفظ تفضيلات المظهر، وتأمين التحقق السحابي بدون تتبع إعلاني خارجي.{' '}
          <Link
            href="/privacy"
            className="text-[#DD0200] underline hover:text-red-400 font-bold"
          >
            سياسة الخصوصية
          </Link>
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleAccept('all')}
            className="flex-1 py-2.5 px-4 rounded-full bg-[#DD0200] hover:bg-[#B50200] text-white text-xs font-semibold shadow-md transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            موافق على الكل
          </button>
          <button
            onClick={() => handleAccept('essential')}
            className="py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-[#D9D9D9] text-xs font-medium transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            الضرورية فقط
          </button>
        </div>
      </div>
    </div>
  );
}
