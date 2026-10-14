'use client';

import React from 'react';
import { Award, Gift, Zap } from 'lucide-react';

interface TerminalShiftStatsProps {
  shiftStampsCount: number;
  shiftRedeemedCount: number;
  printQueueCount?: number;
}

export function TerminalShiftStats({
  shiftStampsCount,
  shiftRedeemedCount,
}: TerminalShiftStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="p-4 rounded-2xl bg-[#141212] border border-white/10 shadow-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#98183c]/40 text-[#c92a54] border border-[#c92a54]/30 flex items-center justify-center font-bold">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-[#A19E9B] font-bold block">أختام اليوم</span>
          <span className="text-xl font-black font-mono text-[#FBF9F5]">+{shiftStampsCount}</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#141212] border border-white/10 shadow-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] text-[#A19E9B] font-bold block">هدايا مستبدلة</span>
          <span className="text-xl font-black font-mono text-emerald-400">{shiftRedeemedCount}</span>
        </div>
      </div>

      <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#141212] border border-white/10 shadow-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-950/50 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
          <Zap className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <span className="text-[10px] text-[#A19E9B] font-bold block">سرعة الختم والمسح</span>
          <span className="text-xl font-black font-mono text-[#FBF9F5]">~2s <span className="text-[10px] font-normal text-emerald-400 font-sans">فوري</span></span>
        </div>
      </div>
    </div>
  );
}
