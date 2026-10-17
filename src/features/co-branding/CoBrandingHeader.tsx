'use client';

import React from 'react';
import { BusinessBranding } from '@/types/photobooth';
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
    <header className={`w-full max-w-xl mx-auto py-3 px-4 sm:px-6 bg-white/95 backdrop-blur-xl border border-[#EADBCE] rounded-2xl shadow-xs transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-[#231C18] ${className}`}>
      {/* Logos side-by-side with prominent × */}
      <CoBrandingLogos
        cafeName={branding.name || 'Memories Partner'}
        cafeLogoUrl={branding.logoUrl}
        size="md"
        theme="light"
        showTagline={true}
      />

      {/* Official Collaboration Badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-mono font-bold text-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
        <span>VERIFIED PARTNER STUDIO</span>
      </div>
    </header>
  );
};