'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSub = localStorage.getItem('stampy_newsletter_subscribed');
      if (isSub) setSubscribed(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('يرجى إدخال عنوان بريد إلكتروني صحيح');
      return;
    }

    setLoading(true);
    // Simulate API registration
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('stampy_newsletter_subscribed', 'true');
      }
    }, 600);
  };

  if (subscribed) {
    return (
      <div className="p-6 rounded-3xl bg-[#3D2314] text-[#FAF5EB] border border-[#3D2314]/30] shadow-lg flex items-center justify-between gap-4 font-cairo text-right animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#B83A26] text-white flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#FAF5EB]">شكراً لانضمامك إلى مجتمع stampy.! </h4>
            <p className="text-xs text-[#EADDC4]/80 mt-0.5">
              ستصلك أحدث دراسات عودة الزوار وأفكار المقاهي المختصة شهرياً.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSubscribed(false);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('stampy_newsletter_subscribed');
            }
          }}
          className="text-[10px] text-[#EADDC4]/60 hover:text-white underline cursor-pointer"
        >
          تغيير البريد
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#20304E] border border-[#EADDC4] dark:border-[#3D2314]/30] shadow-md font-cairo text-right">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#B83A26] font-bold">
          <Sparkles className="w-4 h-4" />
          <span>نشرة رواد الأعمال وصناع تجارب الزوار</span>
        </div>
        <h3
          className="text-xl sm:text-2xl font-black text-[#3D2314] dark:text-[#FAF5EB] font-sans"
          
        >
          اشترك ليصلك جديد تحليلات وتجارب ولاء الزوار
        </h3>
        <p className="text-xs text-[#3D2314]/75 dark:text-[#FAF5EB]/75 leading-relaxed">
          نشاركك نصائح عملية لرفع معدل عودة رواد نشاطك التجاري، تحسين تجربة الزوار، وبناء مجتمع وفي لعلامتك. بدون رسائل إعلانية مزعجة.
        </p>

        <form onSubmit={handleSubmit} className="space-y-2 pt-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-[#527E78] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="أدخل بريدك الإلكتروني (e.g. barista@cafe.com)"
                className="w-full py-3.5 pr-11 pl-4 rounded-2xl bg-[#FAF5EB] dark:bg-[#3D2314] border border-[#EADDC4] dark:border-[#3D2314]/30] text-xs text-[#3D2314] dark:text-[#FAF5EB] placeholder-[#3D2314]/40 dark:placeholder-[#FAF5EB]/40 focus:outline-none focus:ring-2 focus:ring-[#B83A26]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3.5 px-6 rounded-2xl bg-[#3D2314] hover:bg-[#20304E] text-[#FAF5EB] text-xs font-bold shadow-md transition flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#B83A26]" />
                  <span>جارِ التسجيل...</span>
                </>
              ) : (
                <>
                  <span>انضمام للنشرة</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#B83A26] rotate-180" />
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="text-[11px] text-rose-500 font-bold pr-1">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
