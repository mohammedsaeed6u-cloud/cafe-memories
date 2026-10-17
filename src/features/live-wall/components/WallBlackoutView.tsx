'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';
import { UseLiveWallReturn } from '../types';

interface Props {
  wall: UseLiveWallReturn;
}

export const WallBlackoutView: React.FC<Props> = ({ wall }) => {
  const { brandName, brandLogoUrl, screenId } = wall;

  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col items-center justify-between p-8 select-none font-sans relative overflow-hidden">
      {/* Archival Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-700/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-5xl flex items-center justify-between z-10 border-b border-white/10 pb-5">
        <CoBrandingLogos
          cafeName={brandName}
          cafeLogoUrl={brandLogoUrl}
          size="lg"
          theme="dark"
          showTagline={true}
        />
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#231C18] border border-amber-500/40 text-amber-400 text-xs font-bold font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span className="uppercase tracking-wider">استراحة مؤقتة • STANDBY</span>
        </div>
      </div>

      <div className="text-center space-y-5 max-w-md z-10">
        <div className="w-24 h-24 rounded-2xl bg-[#141212] border border-white/10 text-amber-400 flex items-center justify-center mx-auto shadow-2xl animate-pulse">
          <Sparkles className="w-12 h-12 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h2
            style={{ fontFamily: 'var(--font-jakarta), var(--font-cairo), sans-serif' }}
            className="text-3xl font-bold text-[#FBF9F5] tracking-tight"
          >
            {brandName}
          </h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            شاشة العرض في وضع الاستراحة المؤقتة.
            <br />
            التقط لقطتك اليوم واطبع شريط ذكرياتك عبر مسح كود الطاولة بالهاتف!
          </p>
        </div>
      </div>

      <div className="text-center text-xs text-[#A19E9B]/60 font-mono z-10">
        Screen ID: {screenId} • Standby Mode
      </div>
    </div>
  );
};
