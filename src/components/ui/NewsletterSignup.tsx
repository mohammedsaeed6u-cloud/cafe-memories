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
      const isSub = localStorage.getItem('memories_newsletter_subscribed');
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
        localStorage.setItem('memories_newsletter_subscribed', 'true');
      }
    }, 600);
  };

  if (subscribed) {
    return (
      <div className="p-6 rounded-3xl bg-[#1E3A32] text-[#FAF6EE] border border-[#2A4F44] shadow-lg flex items-center justify-between gap-4 font-cairo text-right animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#B85C43] text-white flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#FAF6EE]">شكراً لانضمامك إلى مجتمع memories! </h4>
            <p className="text-xs text-[#E8DCC6]/80 mt-0.5">
              ستصلك أحدث دراسات عودة الزوار وأفكار المقاهي المختصة شهرياً.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSubscribed(false);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('memories_newsletter_subscribed');
            }
          }}
          className="text-[10px] text-[#E8DCC6]/60 hover:text-white underline cursor-pointer"
        >
          تغيير البريد
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#142721] border border-[#E8DCC6] dark:border-[#2A4F44] shadow-md font-cairo text-right">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#B85C43] font-bold">
          <Sparkles className="w-4 h-4" />
          <span>نشرة رواد الأعمال وصناع تجارب الزوار</span>
        </div>
        <h3
          className="text-xl sm:text-2xl font-black text-[#1E3A32] dark:text-[#FAF6EE] font-serif"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          اشترك ليصلك جديد تحليلات وتجارب ولاء الزوار
        </h3>
        <p className="text-xs text-[#3B2F2A]/75 dark:text-[#FAF6EE]/75 leading-relaxed">
          نشاركك نصائح عملية لرفع معدل عودة رواد نشاطك التجاري، تحسين تجربة الزوار، وبناء مجتمع وفي لعلامتك. بدون رسائل إعلانية مزعجة.
        </p>

        <form onSubmit={handleSubmit} className="space-y-2 pt-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-[#8A9A7B] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="أدخل بريدك الإلكتروني (e.g. barista@cafe.com)"
                className="w-full py-3.5 pr-11 pl-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1E3A32] border border-[#E8DCC6] dark:border-[#2A4F44] text-xs text-[#3B2F2A] dark:text-[#FAF6EE] placeholder-[#3B2F2A]/40 dark:placeholder-[#FAF6EE]/40 focus:outline-none focus:ring-2 focus:ring-[#B85C43]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3.5 px-6 rounded-2xl bg-[#1E3A32] hover:bg-[#142721] text-[#FAF6EE] text-xs font-bold shadow-md transition flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#B85C43]" />
                  <span>جارِ التسجيل...</span>
                </>
              ) : (
                <>
                  <span>انضمام للنشرة</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#B85C43] rotate-180" />
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
