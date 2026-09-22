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
    <header className={`w-full max-w-xl mx-auto py-3 px-4 sm:px-6 bg-white border border-stone-200/90 rounded-2xl shadow-xs transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
      {/* Logos side-by-side with prominent × */}
      <CoBrandingLogos
        cafeName={branding.name || 'Café Partner'}
        cafeLogoUrl={branding.logoUrl}
        size="md"
        showTagline={true}
      />

      {/* Official Collaboration Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/90 border border-stone-200/80 text-[10px] font-bold text-stone-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>توثيق الذكريات والولاء المعتمد</span>
      </div>
    </header>
  );
};