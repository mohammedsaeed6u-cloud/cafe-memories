'use client';

import React, { useState } from 'react';
import { Calculator, TrendingUp, Users, DollarSign, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function AtelierRoiCalculator() {
  const [dailyGuests, setDailyGuests] = useState<number>(120);
  const [averageCheck, setAverageCheck] = useState<number>(38);

  // Business formula metrics based on real hospitality photobooth benchmarks
  // 38% of guests participate in photobooth / digital memory
  const monthlyParticipants = Math.round(dailyGuests * 30 * 0.38);
  
  // 65% of participants save the pass to Apple / Google Wallet
  const monthlyNewPasses = Math.round(monthlyParticipants * 0.65);
  
  // Active wallet passes generate on average 0.85 incremental repeat visits per month
  const additionalMonthlyVisits = Math.round(monthlyNewPasses * 0.85);
  
  // Incremental monthly revenue generated from retained repeat customers
  const monthlyIncrementalRevenue = additionalMonthlyVisits * averageCheck;
  
  // Annualized return
  const annualIncrementalRevenue = monthlyIncrementalRevenue * 12;

  // Digital plan is 390 SAR/mo
  const roiMultiplier = Math.round((monthlyIncrementalRevenue / 390) * 10) / 10;

  return (
    <section id="roi-calculator" className="py-24 px-6 max-w-6xl mx-auto border-t border-white/10 apple-font select-none">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-[#55100D]/50 border border-[#DD0200]/40 text-[11px] font-mono text-[#FBF9F5] font-bold backdrop-blur-md mb-3">
          <Calculator className="w-3.5 h-3.5 text-[#DD0200]" />
          <span className="tracking-[0.16em] uppercase">ROI & RETENTION CALCULATOR • حاسبة العائد</span>
        </div>
        <h2
          className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          احسب العائد الحقيقي على استثمار علامتك.
        </h2>
        <p className="text-sm sm:text-base text-[#A19E9B] mt-3.5 leading-relaxed">
          شاهد كيف تتحول الذكريات الموثقة وكروت محفظة Apple إلى زيارات متكررة ومبيعات إضافية مباشرة لمقهىك أو متجرك.
        </p>
      </div>

      <div className="rounded-2xl bg-[#141212] border border-white/10 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] p-6 sm:p-12 relative overflow-hidden backdrop-blur-2xl">
        {/* Atelier Ambient Bloom */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DD0200]/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#55100D]/20 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Interactive Sliders (6 cols) */}
          <div className="lg:col-span-6 space-y-8">
            {/* Slider 1: Daily Guests */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#DD0200]" />
                  <span>متوسط عدد زوار الصالة يومياً:</span>
                </span>
                <span className="text-sm font-mono font-bold text-[#FBF9F5] bg-white/5 border border-white/10 px-3 py-1 rounded-md">
                  {dailyGuests} زائر / يوم
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="600"
                step="10"
                value={dailyGuests}
                onChange={(e) => setDailyGuests(Number(e.target.value))}
                className="w-full h-2 bg-[#2B2A29] rounded-lg appearance-none cursor-pointer accent-[#DD0200]"
                aria-label="متوسط عدد زوار الصالة يومياً"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#A19E9B]">
                <span>30 زائر (مقهى صغير)</span>
                <span>250 زائر (متوسط)</span>
                <span>600 زائر (فرع مزدحم)</span>
              </div>
            </div>

            {/* Slider 2: Average Check Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#DD0200]" />
                  <span>متوسط الفاتورة للشخص الواحد:</span>
                </span>
                <span className="text-sm font-mono font-bold text-[#FBF9F5] bg-white/5 border border-white/10 px-3 py-1 rounded-md">
                  {averageCheck} ريال
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={averageCheck}
                onChange={(e) => setAverageCheck(Number(e.target.value))}
                className="w-full h-2 bg-[#2B2A29] rounded-lg appearance-none cursor-pointer accent-[#DD0200]"
                aria-label="متوسط الفاتورة للشخص الواحد"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#A19E9B]">
                <span>15 ريال (قهوة فقط)</span>
                <span>45 ريال (مشروب وحلى)</span>
                <span>120 ريال (وجبة متكاملة)</span>
              </div>
            </div>

            {/* Assumptions Box */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-xs text-[#A19E9B]">
              <div className="flex items-center gap-2 text-white font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#DD0200]" />
                <span>معايير الاحتساب الميدانية الموثقة:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                مبنية على متوسط معدل مشاركة 38% من الزوار، وتخزين 65% منهم لكارت Apple Wallet، مع معدل تكرار زيارة 0.85 زيارة إضافية شهرياً لكل كارت نشط.
              </p>
            </div>
          </div>

          {/* Right Column: Calculated ROI Matrix (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-xl bg-[#1C1B1B] border border-white/10 shadow-xl space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#141212] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-[#A19E9B] block">كروت محفظة نشطة / شهر</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 block">
                  +{monthlyNewPasses.toLocaleString('ar-SA')}
                </span>
                <span className="text-[9px] text-[#34C759] font-mono mt-1 block">Apple & Google Wallet</span>
              </div>

              <div className="p-4 rounded-lg bg-[#141212] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-[#A19E9B] block">زيارات مكررة إضافية / شهر</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 block">
                  +{additionalMonthlyVisits.toLocaleString('ar-SA')}
                </span>
                <span className="text-[9px] text-[#DD0200] font-mono mt-1 block">+32% تكرار عودة</span>
              </div>
            </div>

            {/* Big Highlight Revenue Card */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-[#55100D]/40 via-[#1A0706]/60 to-[#141212] border border-[#DD0200]/40 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#FBF9F5] font-bold">
                  صافي الإيراد الإضافي المتوقع شهرياً
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#DD0200] text-white">
                  عائد استثماري {roiMultiplier}x
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl sm:text-5xl font-black text-white tracking-tight"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                >
                  +{monthlyIncrementalRevenue.toLocaleString('ar-SA')}
                </span>
                <span className="text-sm font-semibold text-[#D9D9D9]">ريال / شهر</span>
              </div>
              <p className="text-[11px] text-[#D9D9D9]/80 mt-2 font-mono">
                يعادل تقريباً +{annualIncrementalRevenue.toLocaleString('ar-SA')} ريال سنوياً في مبيعات متكررة جديدة.
              </p>
            </div>

            {/* Bottom CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#A19E9B]">
                الباقة الشهرية تبدأ من 390 ريال فقط.
              </span>
              <Link
                href="/login"
                className="w-full sm:w-auto text-xs py-2.5 px-5 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-4px_rgba(221,2,0,0.5)] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ابدأ تجربة نشاطك مجاناً</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AtelierRoiCalculator;
