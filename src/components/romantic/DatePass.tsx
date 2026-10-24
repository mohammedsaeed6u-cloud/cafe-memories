'use client';

import React from 'react';

interface DatePassProps {
  passNumber?: string;
  date?: string;
  names?: string;
  stampsCount?: number;
  totalStamps?: number;
}

export function DatePass({
  passNumber = '№ 0214',
  date = 'الليلة',
  names = 'حكايتنا',
  stampsCount = 2,
  totalStamps = 2,
}: DatePassProps) {
  return (
    <div className="relative bg-[#E5A836] border-2 border-[#3D2314] rounded-xl p-5 shadow-stamp-resting max-w-sm text-[#3D2314]">
      {/* Ticket Perforation notches */}
      <div className="flex justify-between items-center text-xs font-mono font-bold border-b border-[#3D2314]/30 pb-2">
        <span>ADMIT TWO • تذكرة موعد</span>
        <span className="text-[#B83A26] bg-[#FAF5EB] px-2 py-0.5 rounded border border-[#3D2314]/20">
          {passNumber}
        </span>
      </div>

      <div className="py-4 text-center">
        <h4 className="font-black text-xl tracking-tight">A Ticket to Our Story</h4>
        <span className="text-xs font-mono text-[#3D2314]/80 mt-1 inline-block">
          {names} • {date}
        </span>
      </div>

      {/* Dual Stamp Slots */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="h-16 bg-[#FAF5EB] rounded-lg border-2 border-dashed border-[#3D2314] flex flex-col items-center justify-center text-xs font-bold transition-transform">
          <span>ختم حكايته</span>
          <span className="text-sm text-[#3D2314]">✦</span>
        </div>
        <div className="h-16 bg-[#FAF5EB] rounded-lg border-2 border-dashed border-[#3D2314] flex flex-col items-center justify-center text-xs text-[#B83A26] font-bold transition-transform">
          <span>ختم حكايتها</span>
          <span className="text-sm">♥</span>
        </div>
      </div>

      <div className="text-[10px] text-center font-mono text-[#3D2314]/80 pt-3 border-t border-[#3D2314]/20 mt-3">
        "Every moment is a stamp in time."
      </div>
    </div>
  );
}
