'use client';

import React, { useState } from 'react';
import { Calculator, TrendingUp, Users, DollarSign, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function StampyRoiCalculator() {
  const [dailyGuests, setDailyGuests] = useState<number>(120);
  const [averageCheck, setAverageCheck] = useState<number>(38);

  // Business formula metrics based on hospitality loyalty benchmarks
  // 38% of guests save digital loyalty card
  const monthlyParticipants = Math.round(dailyGuests * 30 * 0.38);

  // 65% of participants save pass to Apple / Google Wallet
  const monthlyNewPasses = Math.round(monthlyParticipants * 0.65);

  // Active wallet passes generate on average 0.85 incremental repeat visits per month
  const additionalMonthlyVisits = Math.round(monthlyNewPasses * 0.85);

  // Incremental monthly revenue generated from retained repeat customers
  const monthlyIncrementalRevenue = additionalMonthlyVisits * averageCheck;

  // Annualized return
  const annualIncrementalRevenue = monthlyIncrementalRevenue * 12;

  // Growth plan is 390 SAR/mo
  const roiMultiplier = Math.round((monthlyIncrementalRevenue / 390) * 10) / 10;

  return (
    <section id="roi" className="py-20 md:py-28 px-4 bg-[#F7F3EA] border-b-[2.5px] border-[#1B1B1E] select-none">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="kicker">ROI & RETENTION CALCULATOR • حاسبة العائد التقديرية</span>
          <h2 className="h2-poster center">
            CALCULATE YOUR <span className="purp">PROFIT BOOST.</span>
          </h2>
          <p className="sub-poster center">
            شاهد كيف تتحول كروت محفظة Apple & Google وإشعارات القفل الذكية إلى زيارات متكررة وأرباح إضافية مباشرة لمقهاك أو متجرك.
          </p>
        </div>

        <div className="rounded-3xl bg-white border-[2.5px] border-[#1B1B1E] shadow-[8px_8px_0_#682025] p-6 sm:p-10 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Interactive Sliders (6 cols) */}
            <div className="lg:col-span-6 space-y-8 text-right">
              {/* Slider 1: Daily Guests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#1B1B1E] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#682025]" />
                    <span>متوسط عدد زوار الصالة يومياً:</span>
                  </span>
                  <span className="text-sm font-mono font-black text-[#682025] bg-[#FAF5EB] border border-[#EADDC4] px-3 py-1 rounded-lg">
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
                  className="w-full h-2.5 bg-[#FAF5EB] rounded-lg appearance-none cursor-pointer accent-[#682025]"
                  aria-label="متوسط عدد زوار الصالة يومياً"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#8b7aaa]">
                  <span>30 زائر (مقهى هادئ)</span>
                  <span>250 زائر (متوسط)</span>
                  <span>600 زائر (فرع مزدحم)</span>
                </div>
              </div>

              {/* Slider 2: Average Check Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#1B1B1E] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#682025]" />
                    <span>متوسط الفاتورة للشخص الواحد:</span>
                  </span>
                  <span className="text-sm font-mono font-black text-[#682025] bg-[#FAF5EB] border border-[#EADDC4] px-3 py-1 rounded-lg">
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
                  className="w-full h-2.5 bg-[#FAF5EB] rounded-lg appearance-none cursor-pointer accent-[#682025]"
                  aria-label="متوسط الفاتورة للشخص الواحد"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#8b7aaa]">
                  <span>15 ريال (مشروب واحد)</span>
                  <span>45 ريال (مشروب وحلا)</span>
                  <span>120 ريال (وجبة كاملة)</span>
                </div>
              </div>

              {/* Quick Math Assumptions Callout */}
              <div className="p-4 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] space-y-2 text-xs">
                <div className="font-head uppercase font-bold text-[#1B1B1E] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#682025]" />
                  <span>معايير الاحتساب الواقعية:</span>
                </div>
                <ul className="text-[#4a3a6a] space-y-1 leading-relaxed">
                  <li>• نسبة تفعيل كارت المحفظة: 38% من زوار الصالة.</li>
                  <li>• معدل الزيارات الإضافية الناتجة عن إشعارات القفل: 0.85 زيارة/شهر لكل عميل.</li>
                </ul>
              </div>
            </div>

            {/* Right Column: Calculated ROI Results (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Highlight Hero Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF5EB] border-[2.5px] border-[#1B1B1E] shadow-[5px_5px_0_#1B1B1E] text-right space-y-3 relative overflow-hidden">
                <span className="text-xs font-head uppercase font-bold text-[#682025] tracking-wider block">
                  ESTIMATED MONTHLY GAIN • الدخل الإضافي الشهري
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-head font-black text-[#1B1B1E]">
                    +{monthlyIncrementalRevenue.toLocaleString()}
                  </span>
                  <span className="text-base font-bold text-[#682025]">ريال / شهرياً</span>
                </div>
                <p className="text-xs text-[#4a3a6a] leading-relaxed">
                  أرباح صافية إضافية ناتجة فقط عن إعادة الزبائن عبر تنبيهات شاشة القفل التلقائية.
                </p>

                <div className="pt-3 border-t-2 border-[#EADDC4] flex items-center justify-between text-xs font-bold">
                  <span className="text-[#1B1B1E]">العائد السنوي المتوقع:</span>
                  <span className="font-mono text-emerald-700 text-sm font-black">
                    +{annualIncrementalRevenue.toLocaleString()} ريال / سنة
                  </span>
                </div>
              </div>

              {/* 2 Sub-metrics */}
              <div className="grid grid-cols-2 gap-4 text-right">
                <div className="p-4 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E]">
                  <span className="text-[11px] font-head uppercase font-bold text-[#8b7aaa] block">
                    زيارات إضافية شهرياً
                  </span>
                  <span className="text-2xl font-head font-extrabold text-[#1B1B1E] mt-1 block">
                    +{additionalMonthlyVisits} زيارة
                  </span>
                  <span className="text-[10px] text-[#4a3a6a] block">من حاملي كروت Apple & Google</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E]">
                  <span className="text-[11px] font-head uppercase font-bold text-[#8b7aaa] block">
                    مضاعف العائد على الاشتراك
                  </span>
                  <span className="text-2xl font-head font-extrabold text-[#682025] mt-1 block">
                    {roiMultiplier}x أضعاف
                  </span>
                  <span className="text-[10px] text-[#4a3a6a] block">مقارنة بتكلفة باقة النمو (390 ر.س)</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  href="/login?tab=signup"
                  className="w-full py-4 px-6 rounded-full bg-[#682025] text-white font-head font-black text-sm uppercase tracking-wider border-2 border-[#1B1B1E] shadow-[4px_4px_0_#1B1B1E] hover:shadow-[6px_6px_0_#1B1B1E] hover:bg-[#451215] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>ابدأ مضاعفة مبيعات متجرك مجاناً</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
