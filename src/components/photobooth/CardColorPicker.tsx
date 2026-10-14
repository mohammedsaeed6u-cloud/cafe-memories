'use client';

import React from 'react';
import { CardColorPalette } from '@/types/photobooth';
import { Palette, Check } from 'lucide-react';

interface CardColorPickerProps {
  palettes: CardColorPalette[];
  selectedPaletteId: string;
  onSelectPalette: (palette: CardColorPalette) => void;
  className?: string;
}

export const CardColorPicker: React.FC<CardColorPickerProps> = ({
  palettes,
  selectedPaletteId,
  onSelectPalette,
  className = '',
}) => {
  if (!palettes || palettes.length <= 1) {
    return null; // No need to display a picker if merchant locked it or only 1 color is allowed
  }

  return (
    <div className={`w-full bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#FBF9F5]">
          <Palette className="w-3.5 h-3.5 text-[#c92a54]" />
          <span>اختر لون الكارت المفضل:</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#FBF9F5] bg-[#98183c]/60 px-2 py-0.5 rounded-md border border-[#c92a54]/40 uppercase tracking-wider">
          STAMPY PALETTES
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {palettes.map((palette) => {
          const isSelected = palette.id === selectedPaletteId;
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => onSelectPalette(palette)}
              className={`p-2.5 rounded-lg border text-right transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500/40'
                  : 'border-[rgba(255,255,255,0.1)] hover:border-stone-300 bg-white hover:bg-[#0B0A0A]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Visual Color Preview Dot */}
                <div
                  style={{
                    backgroundColor: palette.bgColor,
                    borderColor: palette.borderColor,
                  }}
                  className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0"
                />
                <span className="text-xs font-medium text-[#FBF9F5] truncate">
                  {palette.nameAr}
                </span>
              </div>

              {isSelected && (
                <div className="w-4 h-4 rounded-md bg-[#c92a54] text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
