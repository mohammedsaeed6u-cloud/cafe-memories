'use client';

import React from 'react';
import { Camera, CreditCard, Sparkles } from 'lucide-react';

interface CustomerTopNavProps {
  activeTab: 'studio' | 'loyalty';
  onTabChange: (tab: 'studio' | 'loyalty') => void;
  totalCardSlots: number;
  stampedCount: number;
  loyaltyMaxVisits: number;
}

/** Segmented top navigation for the customer surface (studio ↔ loyalty). */
export const CustomerTopNav: React.FC<CustomerTopNavProps> = ({
  activeTab,
  onTabChange,
  totalCardSlots,
  stampedCount,
  loyaltyMaxVisits,
}) => (
  <div className="w-full max-w-xl mx-auto p-1.5 bg-[#FAF5EB] rounded-2xl border border-[#DFAB56]/40 shadow-[0_4px_16px_rgba(61,35,20,0.04)] grid grid-cols-2 gap-1.5">
    <button
      type="button"
      onClick={() => onTabChange('loyalty')}
      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
        activeTab === 'loyalty'
          ? 'bg-[#682025] text-[#FAF5EB] shadow-sm'
          : 'text-[#3D2314] hover:bg-white/60'
      }`}
    >
      <CreditCard className={`w-4 h-4 ${activeTab === 'loyalty' ? 'text-[#DFAB56]' : 'text-[#682025]'}`} />
      <span className="truncate">كارت الولاء ({stampedCount}/{loyaltyMaxVisits})</span>
      {stampedCount > 0 && (
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
          activeTab === 'loyalty' ? 'bg-[#DFAB56] text-stone-900' : 'bg-[#EFE2CC] text-[#682025]'
        }`}>
          ✨
        </span>
      )}
    </button>

    <button
      type="button"
      onClick={() => onTabChange('studio')}
      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
        activeTab === 'studio'
          ? 'bg-[#682025] text-[#FAF5EB] shadow-sm'
          : 'text-[#3D2314] hover:bg-white/60'
      }`}
    >
      <Camera className={`w-4 h-4 ${activeTab === 'studio' ? 'text-[#DFAB56]' : 'text-[#682025]'}`} />
      <span className="truncate">استوديو الصور ({totalCardSlots} لقطات)</span>
      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
        activeTab === 'studio' ? 'bg-[#DFAB56] text-stone-900' : 'bg-[#EFE2CC] text-[#682025]'
      }`}>
        4-CUT
      </span>
    </button>
  </div>
);

