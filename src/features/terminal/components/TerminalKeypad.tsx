'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface TerminalKeypadProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onLookup: (val: string) => void;
  onKeyPress: (key: string) => void;
  onClear: () => void;
}

export function TerminalKeypad({
  searchQuery,
  onSearchChange,
  onLookup,
  onKeyPress,
  onClear,
}: TerminalKeypadProps) {
  return (
    <div className="p-6 rounded-3xl bg-[#181212] border border-[#DFAB56]/30 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#FAF5EB] flex items-center gap-1.5">
          <Search className="w-4 h-4 text-[#DFAB56]" />
          <span>بحث برقم الجوال أو رمز الهدية (GIFT-XXXX):</span>
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#DFAB56] bg-[#682025]/80 px-2.5 py-0.5 rounded-full border border-[#DFAB56]/40 font-bold">
          POS LOOKUP
        </span>
      </div>

      <div className="relative">
        <input
          type="tel"
          dir="ltr"
          placeholder="رقم الهاتف أو كود الهدية GIFT-XXXX"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            if (e.target.value.length >= 8) {
              onLookup(e.target.value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim().length >= 4) {
              e.preventDefault();
              onLookup(searchQuery.trim());
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onClear();
            }
          }}
          className="w-full text-center text-xl sm:text-2xl font-mono font-black py-3.5 px-4 rounded-2xl bg-[#0E0A0A] border border-[#DFAB56]/30 focus:bg-[#150F0F] focus:border-[#DFAB56] focus:outline-none tracking-widest text-[#FAF5EB] placeholder:text-[#A19E9B]/40 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClear}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#2A2020] hover:bg-[#382C2C] text-[#A19E9B] hover:text-[#FAF5EB] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div dir="ltr" className="grid grid-cols-3 gap-2.5 pt-1">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '010', '0', '011'].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => onKeyPress(val)}
            className="py-3.5 rounded-2xl bg-[#221A1A] hover:bg-[#2C2222] active:scale-95 text-[#FAF5EB] font-mono font-bold text-base border border-white/10 shadow-xs transition cursor-pointer hover:border-[#DFAB56]/40"
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
}
