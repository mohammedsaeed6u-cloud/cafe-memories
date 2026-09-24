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
    <header className={`w-full max-w-xl mx-auto py-3 px-4 sm:px-6 bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-xl transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-white ${className}`}>
      {/* Logos side-by-side with prominent × */}
      <CoBrandingLogos
        cafeName={branding.name || 'Memories Partner'}
        cafeLogoUrl={branding.logoUrl}
        size="md"
        theme="dark"
        showTagline={true}
      />

      {/* Official Collaboration Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-[#D9D9D9]">
        <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
        <span>توثيق الذكريات والولاء المعتمد</span>
      </div>
    </header>
  );
};