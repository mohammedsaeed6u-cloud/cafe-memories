'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

export function StampyContactSection() {
  return (
    <section className="big-cta" id="get-started">
      <div className="max-w-4xl mx-auto space-y-6">
        <span className="inline-block py-1.5 px-4 rounded-full bg-[#FAF5EB] text-[#682025] font-head text-xs font-bold uppercase tracking-wider border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E] mb-2">
          READY TO START TAPPING? • جاهز لبدء الختم؟
        </span>

        <h2 className="big-cta-h">
          YOUR CUSTOMERS ARE WAITING.<br />
          <span className="text-[#f5c842]">YOUR PASS IS READY.</span>
        </h2>

        <p className="big-cta-sub max-w-2xl mx-auto">
          انضم لعشرات المقاهي والمتاجر التي ضاعفت تكرار زيارات عملائها بكروت المحفظة الرسمية واستوديو الذكريات.
        </p>

        {/* Objection Buster Box */}
        <div className="inline-flex flex-wrap items-center justify-center gap-4 text-xs font-head uppercase font-bold text-white bg-black/25 px-6 py-3 rounded-full border-2 border-white/20 backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-[#f5c842]">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>تجربة 14 يوماً مجاناً</span>
          </span>
          <span className="text-white/30">•</span>
          <span className="flex items-center gap-1.5 text-[#f5c842]">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>بدون بطاقة ائتمانية</span>
          </span>
          <span className="text-white/30">•</span>
          <span className="flex items-center gap-1.5 text-[#f5c842]">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>تفعيل فوري سحابي في دقيقتين</span>
          </span>
        </div>

        {/* Clear CTA Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login?tab=signup"
            className="cta-btn-yel"
          >
            <span>بدء التجربة المجانية (14 يوماً)</span>
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>

          <Link
            href="/c/stampy"
            className="cta-btn-gh"
          >
            <span>جرب كارت العميل الحي</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
