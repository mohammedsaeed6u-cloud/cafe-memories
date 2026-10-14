'use client';

import React from 'react';
import { Coffee, Scissors, Pill, Car, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export function MarketingIndustryRules() {
  const marqueeItems = [
    'Coffee Shops',
    'Barbershops',
    'Bakeries',
    'Nail Salons',
    'Car Washes',
    'Pharmacies',
    'Restaurants',
    'Boutiques',
    'Gyms & Studios',
    'Juice Bars',
    'Bookstores',
    'Pet Grooming',
  ];

  const rules = [
    {
      num: 'a',
      type: 'مقهى مختص',
      action: 'اشترِ 9 أكواب قهوة مختصة',
      reward: 'الكوب العاشر مجاناً بالكامل',
      icon: Coffee,
      color: '#f0456a',
    },
    {
      num: 'b',
      type: 'صالون حلاقة وعناية',
      action: '5 جلسات حلاقة وتصفيف',
      reward: 'جلسة تنظيف بشرة VIP مجانية',
      icon: Scissors,
      color: '#682025',
    },
    {
      num: 'c',
      type: 'صيدلية أو متجر تجميل',
      action: 'أنفق 200 ريال / جنيه',
      reward: 'خصم فوري 20% على الفاتورة',
      icon: Pill,
      color: '#f0863a',
    },
    {
      num: 'd',
      type: 'مغسلة وتلميع سيارات',
      action: '4 غسيل شامل بلس',
      reward: 'تلميع شمعي وحماية إطارات مجاناً',
      icon: Car,
      color: '#22c55e',
    },
  ];

  return (
    <section className="perfect-section" id="rules">
      {/* Kicker & Heading */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="kicker">PERFECT FOR THE PLACES PEOPLE LOVE</span>
        <h2 className="h2-poster center">
          YOUR SHOP. <span className="purp">YOUR RULES.</span>
        </h2>
        <p className="sub-poster center">
          Coffee, hair, bread, nails, wash, ink. Whatever brings people through your door.
          <br className="hidden sm:inline" />
          متجرك، أسلوبك، وقواعد المكافآت التي تناسب هامش ربحك بدون أي تعقيد.
        </p>
      </div>

      {/* Infinite Marquee Ribbon */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, idx) => (
            <span key={idx} className="marquee-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Rules List + Rotated iPhone Mockup */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="perfect-bottom">
          {/* Left Column: Rules */}
          <div className="space-y-6">
            <div className="space-y-2 text-right">
              <span className="text-xs font-mono font-bold text-[#682025] uppercase tracking-wider block">
                FLEXIBLE REWARD ENGINE
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#1B1B1E] font-head uppercase tracking-tight">
                اختر عدد الأختام وطريقة الاحتساب بنقرة واحدة
              </h3>
              <p className="text-sm text-[#4a3a6a] leading-relaxed">
                لكل نشاط طبيعته الخاصة — لذلك تمنحك Stampy حرية تحديد شروط منح الأختام سواء كانت لكل منتج، لكل زيارة، أو لكل مبلغ مدفوع.
              </p>
            </div>

            <div className="pf-rules-list">
              {rules.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.num} className="pf-rule-row">
                    <div className="pf-rule-num">{r.num}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className="w-4 h-4 text-[#682025]" />
                        <span className="text-xs font-bold text-[#8b7aaa]">{r.type}</span>
                      </div>
                      <div className="pf-rule-text">{r.action}</div>
                    </div>
                    <div className="pf-rule-arrow">→</div>
                    <div className="pf-rule-value text-right">{r.reward}</div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF5EB] border-2 border-[#1B1B1E] flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#682025] shrink-0" />
              <p className="text-xs font-bold text-[#1B1B1E]">
                هل تريد نظام نقاط، كوبونات وقتية، أو أختام متعددة المستويات؟ محركنا يدعم كل ذلك بسلاسة.
              </p>
            </div>
          </div>

          {/* Right Column: Rotated iPhone Mockup with Apple Wallet Pass */}
          <div className="flex justify-center items-center py-6">
            <div className="relative group">
              {/* Decorative Glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#682025]/20 via-[#f0456a]/20 to-[#f5c842]/20 rounded-[50px] blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />

              {/* iPhone Frame */}
              <div className="relative w-[300px] sm:w-[330px] rounded-[48px] p-3.5 bg-[#1B1B1E] border-[3px] solid border-[#1B1B1E] shadow-[10px_10px_0_#682025,0_20px_40px_rgba(26,10,51,0.25)] transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                {/* Dynamic Island */}
                <div className="w-24 h-5 bg-black rounded-full mx-auto mb-3 flex items-center justify-between px-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-mono text-white/60">9:41</span>
                  <div className="w-2 h-1 border border-white/60 rounded-xs" />
                </div>

                {/* Apple Wallet Pass Container */}
                <div className="rounded-[30px] overflow-hidden bg-gradient-to-b from-[#451215] to-[#251047] text-white p-5 space-y-4 border border-white/10 shadow-inner">
                  {/* Pass Header */}
                  <div className="flex items-center justify-between border-b border-white/15 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#f0456a] flex items-center justify-center font-black text-xs text-white">
                        S
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/70 block">
                          APPLE WALLET PASS
                        </span>
                        <h4 className="text-sm font-black tracking-tight">Stampy • ROASTERS</h4>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#f5c842]">TIER 1</span>
                  </div>

                  {/* Stamp Progress Matrix */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-2.5 font-bold">
                      <span className="text-white/80">رصيد الأختام</span>
                      <span className="text-[#f5c842] font-mono">7 من 10 أختام</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 bg-black/25 p-3 rounded-2xl border border-white/10">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isFilled = num <= 7;
                        const isReward = num === 10;
                        return (
                          <div
                            key={num}
                            className={`aspect-square rounded-full flex items-center justify-center border-2 transition-all ${
                              isReward
                                ? 'border-dashed border-[#f5c842] bg-[#f5c842]/20 text-[#f5c842]'
                                : isFilled
                                ? 'border-white bg-[#f0456a] text-white shadow-md'
                                : 'border-white/20 bg-white/5 text-white/30'
                            }`}
                          >
                            {isReward ? (
                              <span className="text-sm">🎁</span>
                            ) : isFilled ? (
                              <span className="text-xs font-bold">✦</span>
                            ) : (
                              <span className="text-[10px] font-mono">{num}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pass Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/10">
                    <div>
                      <span className="text-[9px] text-white/60 block">اسم العميل</span>
                      <strong className="text-[11px] text-white">سارة المهيدب</strong>
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-white/60 block">المكافأة القادمة</span>
                      <strong className="text-[11px] text-[#f5c842]">Flat White مجاني</strong>
                    </div>
                  </div>

                  {/* Barcode & NFC Notice */}
                  <div className="bg-white rounded-xl p-3 text-center space-y-1.5 shadow-sm">
                    {/* Simulated PDF417 / Aztec Barcode */}
                    <div className="h-9 w-full bg-[repeating-linear-gradient(90deg,#1B1B1E_0,#1B1B1E_3px,#ffffff_3px,#ffffff_6px,#1B1B1E_6px,#1B1B1E_10px)] rounded" />
                    <span className="text-[9px] font-mono text-[#1B1B1E] font-bold block">
                      STAMPY-7739-WALLET-SECURE
                    </span>
                    <div className="text-[9px] text-[#4a3a6a] font-semibold flex items-center justify-center gap-1">
                      <span>⚡</span> قرب الهاتف من قارئ الكاونتر أو امسح الباركود
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-[10px] font-head tracking-wider uppercase text-white/80 font-bold">
                    TAP ON COUNTER • INSTANT NFC
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
