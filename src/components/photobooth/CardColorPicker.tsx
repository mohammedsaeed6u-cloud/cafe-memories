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
    <div className={`w-full bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-stone-200/90 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
          <Palette className="w-3.5 h-3.5 text-amber-600" />
          <span>اختر لون الكارت المفضّل:</span>
        </div>
        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
          ألوان معتمدة ☕
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
              className={`p-2 rounded-xl border-2 text-right transition-all duration-150 flex items-center justify-between gap-2 ${
                isSelected
                  ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                  : 'border-stone-200 hover:border-stone-300 bg-stone-50/70 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Visual Color Preview Dot */}
                <div
                  style={{
                    backgroundColor: palette.bgColor,
                    borderColor: palette.borderColor,
                  }}
                  className="w-5 h-5 rounded-full border-2 shadow-xs shrink-0"
                />
                <span className="text-xs font-bold text-stone-800 truncate">
                  {palette.nameAr}
                </span>
              </div>

              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
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
