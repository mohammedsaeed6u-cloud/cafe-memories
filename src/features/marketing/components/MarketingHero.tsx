'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function MarketingHero() {
  const [stamps, setStamps] = useState<number>(7);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  const handleTap = (index: number) => {
    const next = index + 1;
    setStamps(next);
    if (next >= 10) {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
  };

  return (
    <section className="tappy-hero" aria-label="Hero">
      {/* Grid Pattern Background */}
      <div className="hero-grid-bg" />

      {/* Floating Sparks */}
      <div className="hero-sparks" aria-hidden="true">
        <span className="hero-spark hs-1">✦</span>
        <span className="hero-spark hs-2">✦</span>
        <span className="hero-spark hs-3">✦</span>
        <span className="hero-spark hs-4">✦</span>
        <span className="hero-spark hs-5">✦</span>
        <span className="hero-spark hs-6">✦</span>
      </div>

      <div className="hero-inner">
        {/* Kicker Pill Tag */}
        <div className="hero-tag">
          <span className="hero-tag-dot" />
          <span>STAMPY • WALLET & LOYALTY SAAS</span>
        </div>

        {/* Big Poster Typography: Every Moment is a Stamp in Time */}
        <h1 className="poster" dir="ltr">
          <span className="line-1">EVERY MOMENT IS A</span>
          <span className="line-2">STAMP IN TIME.</span>
          <span className="tapping-word">stampy.</span>
        </h1>

        {/* Emotional Resonance Sub-line */}
        <p className="poster-sub-line">
          <span className="psl-part">الارتباط العاطفي هو المحرك الأقوى لولاء العملاء.</span>
          <span className="star" aria-hidden="true">✦</span>
          <span className="psl-part">محفظة Apple Wallet وتذكار مادي فاخر.</span>
          <span className="star" aria-hidden="true">✦</span>
          <span className="psl-part">كل ختم يروي قصة.</span>
        </p>

        <p className="text-xs sm:text-sm font-semibold text-[#682025]/90 max-w-xl mx-auto -mt-4 mb-8 leading-relaxed">
          مثل شوبيفاي لمحافظ Apple & Google — تفعيل فوري سحابي في دقيقتين وبدون أي تطبيقات.
        </p>

        {/* Hero CTA Actions */}
        <div className="hero-actions">
          <Link href="/login?tab=signup" className="btn-fat">
            <span>ابدأ تجربة مجانية</span>
            <span style={{ fontSize: '18px' }}>→</span>
          </Link>

          <a href="#how" className="btn-fat-ghost">
            شاهد كيف يعمل
          </a>

          <Link href="/c/stampy" className="btn-fat-ghost text-xs">
            📱 جرّب كارت العميل
          </Link>
        </div>

        <div className="text-center mb-6">
          <Link href="/login?tab=signin" className="text-xs font-bold text-[#4a3a6a] hover:text-[#682025] transition underline decoration-[#682025]/40 font-head uppercase tracking-wider">
            لديك حساب بالفعل؟ تسجيل الدخول
          </Link>
        </div>

        {/* ==================== 10-STAMP PROGRESS ROW (TAPPY MILLIMETER) ==================== */}
        <div className="hero-card-row" aria-label="شريط الأختام">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
            const num = idx + 1;
            const filled = num <= stamps;
            return (
              <button
                type="button"
                key={idx}
                onClick={() => handleTap(idx)}
                className={`stamp-big ${filled ? 'is-filled' : ''} ${num === stamps ? 'is-latest' : ''}`}
                title={`الختم ${num} (اضغط للتجربة)`}
              />
            );
          })}

          {/* 10th Slot: Reward Slot */}
          <button
            type="button"
            onClick={() => handleTap(9)}
            className={`stamp-big reward ${stamps >= 10 ? 'is-unlocked' : ''}`}
            title="المكافأة المجانية (اضغط لفتح المكافأة)"
          />
        </div>

        <div className="hero-card-label">
          ختم بعد ختم <span className="arrow">→</span> {stamps >= 10 ? '🎉 المكافأة فُتحت بنجاح!' : 'المكافأة جاهزة (Tap by tap → Reward unlocked)'}
        </div>
      </div>
    </section>
  );
}
