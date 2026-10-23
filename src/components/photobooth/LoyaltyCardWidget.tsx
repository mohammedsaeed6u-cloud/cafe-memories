'use client';

import React from 'react';
import { Sparkles, Gift, Check, Award } from 'lucide-react';

interface LoyaltyCardWidgetProps {
  currentVisitCount: number;
  totalStamps?: number;
  brandName?: string;
  nextRewardTitle?: string;
}

export const LoyaltyCardWidget: React.FC<LoyaltyCardWidgetProps> = ({
  currentVisitCount,
  totalStamps = 5,
  brandName = 'Memories',
  nextRewardTitle = 'هدية خاصة وترحيبية مميزة عند اكتمال البطاقة',
}) => {
  const activeStamps = Math.min(currentVisitCount, totalStamps);
  const remaining = totalStamps - activeStamps;

  return (
    <div className="w-full bg-[#181212] text-white rounded-3xl p-5 shadow-xl border border-white/10 relative overflow-hidden select-none">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-[#DD0200]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#55100D] text-[#DD0200] flex items-center justify-center border border-[#DD0200]/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">
              بطاقة ولاء ذكريات • {brandName}
            </h4>
            <p className="text-[10px] text-[#A19E9B] font-medium">
              الزيارة {currentVisitCount} من {totalStamps}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30">
          LOYALTY CARD
        </span>
      </div>

      {/* Stamps Grid */}
      <div className="grid grid-cols-5 gap-2.5 my-3">
        {Array.from({ length: totalStamps }).map((_, idx) => {
          const stampNumber = idx + 1;
          const isStamped = stampNumber <= activeStamps;
          const isFinal = stampNumber === totalStamps;

          return (
            <div
              key={idx}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-1 border-2 transition-all relative ${
                isStamped
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-white/5 border-white/15 text-white/40'
              }`}
            >
              {isStamped ? (
                <Check className="w-5 h-5 stroke-[3]" />
              ) : isFinal ? (
                <Gift className="w-5 h-5 text-[#DD0200] animate-pulse" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#A19E9B]/50" />
              )}
              <span className="text-[9px] font-bold mt-0.5">
                {isFinal ? 'الهدية' : `#${stampNumber}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Milestone Footer */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-stone-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-[11px]">
            {remaining > 0
              ? `متبقي ${remaining} ${remaining === 1 ? 'زيارة' : 'زيارات'} للحصول على ${nextRewardTitle}`
              : 'اكتملت بطاقتك وأصبحت هديتك جاهزة للاستلام'}
          </span>
        </div>
      </div>
    </div>
  );
};
