'use client';

import React from 'react';
import { Wifi, WifiOff, Maximize2, Zap, Sparkles } from 'lucide-react';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';
import { UseLiveWallReturn } from '../types';

interface Props {
  wall: UseLiveWallReturn;
}

export const WallHeader: React.FC<Props> = ({ wall }) => {
  const { brandName, brandLogoUrl, isOnline, setIsPaired, toggleFullscreen } = wall;

  return (
    <header className="relative z-20 flex items-center justify-between border-b border-white/10 pb-4 max-w-6xl mx-auto w-full px-4">
      <div className="flex items-center gap-4">
        <CoBrandingLogos
          cafeName={brandName}
          cafeLogoUrl={brandLogoUrl}
          size="lg"
          theme="dark"
          showTagline={true}
        />

        {/* Live Happy Hour Multiplier Ribbon */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold font-mono">
          <Zap className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          <span>ساعة السعادة: الأختام مضاعفة 2x الآن!</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Live 4K Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141212] border border-white/10 text-xs font-mono shadow-xs">
          {isOnline ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="text-[#FBF9F5] font-bold font-mono">
            {isOnline ? '4K LIVE SIGNAGE' : 'OFFLINE CACHE'}
          </span>
        </div>

        {/* Screen Pairing Code */}
        <button
          onClick={() => setIsPaired(false)}
          className="px-3 py-1.5 rounded-xl bg-[#1C1B1B] hover:bg-[#211F1F] border border-white/10 text-[#FBF9F5] text-xs transition cursor-pointer font-bold shadow-xs"
          title="إعادة اقتران الشاشة"
        >
          كود الشاشة
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-[#1C1B1B] hover:bg-[#211F1F] border border-white/10 text-[#FBF9F5] transition cursor-pointer shadow-xs"
          title="ملء الشاشة"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
