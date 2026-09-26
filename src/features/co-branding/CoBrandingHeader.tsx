'use client';

import React from 'react';
import { BusinessBranding } from '@/types/photobooth';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';
import { Coffee } from 'lucide-react';

import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';

interface CoBrandingHeaderProps {
  branding: BusinessBranding;
  className?: string;
}

export const CoBrandingHeader: React.FC<CoBrandingHeaderProps> = ({
  branding,
  className = '',
}) => {
  return (
    <header className={`w-full max-w-xl mx-auto py-3 px-4 sm:px-6 bg-[#141212]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-[#FBF9F5] ${className}`}>
      {/* Logos side-by-side with prominent × */}
      <CoBrandingLogos
        cafeName={branding.name || 'Memories Partner'}
        cafeLogoUrl={branding.logoUrl}
        size="md"
        theme="dark"
        showTagline={true}
      />

      {/* Official Collaboration Badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#55100D]/50 border border-[#DD0200]/40 text-[10px] font-mono font-bold text-[#FBF9F5]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#DD0200] animate-pulse" />
        <span>VERIFIED PARTNER STUDIO</span>
      </div>
    </header>
  );
};