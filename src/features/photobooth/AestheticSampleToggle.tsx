'use client';

import React from 'react';
import { Sparkles, Camera } from 'lucide-react';

interface AestheticSampleToggleProps {
  isPreviewMode: boolean;
  onToggle: (mode: boolean) => void;
  className?: string;
}

export const AestheticSampleToggle: React.FC<AestheticSampleToggleProps> = ({
  isPreviewMode,
  onToggle,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center p-1 bg-stone-100/90 border border-stone-200/90 rounded-2xl shadow-2xs text-xs font-bold ${className}`}>
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
          isPreviewMode
            ? 'bg-white text-stone-900 shadow-xs font-black'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        <span>معاينة بالصور الجمالية</span>
      </button>
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
          !isPreviewMode
            ? 'bg-white text-stone-900 shadow-xs font-black'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <Camera className="w-3.5 h-3.5 text-stone-700" />
        <span>كارتي الفعلي</span>
      </button>
    </div>
  );
};