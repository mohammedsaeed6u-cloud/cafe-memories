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
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 print:hidden font-cairo text-right animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-5 rounded-3xl bg-white dark:bg-[#142721] border border-[#E8DCC6] dark:border-[#2A4F44] shadow-2xl space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E8DCC6] dark:bg-[#1E3A32] text-[#B85C43] flex items-center justify-center shrink-0">
            <Cookie className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#1E3A32] dark:text-[#FAF6EE]">
              خصوصيتك واحترام تجربتك أولويتنا •
            </h4>
            <span className="text-[10px] text-[#8A9A7B] font-mono">GDPR & Privacy Compliant</span>
          </div>
        </div>

        <p className="text-[11px] text-[#3B2F2A]/80 dark:text-[#FAF6EE]/80 leading-relaxed">
          نستخدم ملفات تعريف الارتباط الضرورية لتشغيل جلسات المنشآت والمتاجر، حفظ تفضيلات المظهر، وتأمين التحقق السحابي بدون تتبع إعلاني خارجي.{' '}
          <Link
            href="/privacy"
            className="text-[#B85C43] underline hover:text-[#9B4A33] font-bold"
          >
            سياسة الخصوصية
          </Link>
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleAccept('all')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#1E3A32] hover:bg-[#142721] text-[#FAF6EE] text-xs font-bold shadow-xs transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            موافق على الكل
          </button>
          <button
            onClick={() => handleAccept('essential')}
            className="py-2.5 px-4 rounded-xl bg-[#FAF6EE] dark:bg-[#1E3A32] border border-[#E8DCC6] dark:border-[#2A4F44] text-[#3B2F2A] dark:text-[#FAF6EE] text-xs font-bold hover:bg-[#E8DCC6]/40 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            الضرورية فقط
          </button>
        </div>
      </div>
    </div>
  );
}
