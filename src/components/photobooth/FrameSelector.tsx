'use client';

import React from 'react';
import { PhotoboothFrame } from '@/types/photobooth';
import { Sparkles, Check } from 'lucide-react';

interface FrameSelectorProps {
  frames: PhotoboothFrame[];
  selectedFrameId: string;
  onSelectFrame: (frame: PhotoboothFrame) => void;
}

export const FrameSelector: React.FC<FrameSelectorProps> = ({
  frames,
  selectedFrameId,
  onSelectFrame,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#DD0200]" />
        <h4
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          className="text-xs font-bold text-[#FBF9F5] tracking-wide"
        >
          اختر إطار الفوتوبوث الخاص بك:
        </h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {frames.map((frame) => {
          const isSelected = frame.id === selectedFrameId;
          return (
            <button
              key={frame.id}
              onClick={() => onSelectFrame(frame)}
              style={{
                backgroundColor: frame.bgColor,
                borderColor: isSelected ? frame.accentColor || '#DD0200' : frame.borderColor,
                color: frame.textColor,
              }}
              className={`relative p-3 rounded-2xl border-2 text-right transition-all duration-200 hover:scale-[1.02] shadow-sm flex flex-col justify-between h-24 ${
                isSelected
                  ? 'ring-2 ring-[#DD0200]/40 shadow-md font-bold'
                  : 'hover:border-white/20 opacity-90'
              }`}
            >
              {/* Corner emojis preview */}
              {frame.cornerEmojis && frame.cornerEmojis.enabled && (
                <div className="flex justify-between items-start w-full text-sm">
                  <span>{frame.cornerEmojis.bottomLeft}</span>
                  <span>{frame.cornerEmojis.topRight}</span>
                </div>
              )}

              <div className="flex items-end justify-between w-full mt-auto">
                <div>
                  <p className="text-xs font-bold leading-tight">{frame.nameAr}</p>
                  <p className="text-[10px] opacity-70 font-mono">
                    {frame.orientation === 'horizontal' ? 'أفقي' : 'رأسي'} • {frame.shotCount} صور
                  </p>
                </div>

                {isSelected && (
                  <div
                    style={{ backgroundColor: frame.accentColor || '#D97706' }}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
