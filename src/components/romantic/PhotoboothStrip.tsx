'use client';

import React from 'react';

interface PhotoboothStripProps {
  photos: string[];
  date?: string;
  names?: string;
  storyNote?: string;
  className?: string;
}

export function PhotoboothStrip({
  photos = [],
  date = '2026.10.24',
  names = 'Us',
  storyNote = 'كل لحظة هي طابع وختمة في سجل الزمن.',
  className = '',
}: PhotoboothStripProps) {
  const displayPhotos = photos.length > 0 ? photos.slice(0, 3) : [
    '/sample-moment-1.jpg',
    '/sample-moment-2.jpg',
    '/sample-moment-3.jpg'
  ];

  return (
    <div className={`w-64 bg-[#FAF5EB] border-2 border-[#3D2314] p-3 rounded-2xl shadow-stamp-resting flex flex-col gap-3 font-sans ${className}`}>
      {/* 3 Photo Slots */}
      <div className="space-y-2.5">
        {displayPhotos.map((url, i) => (
          <div
            key={i}
            className="aspect-[4/3] bg-[#EADDC4] rounded-lg border border-[#3D2314]/30 overflow-hidden relative flex items-center justify-center text-xs text-[#3D2314]/50 font-mono"
          >
            {url.startsWith('http') || url.startsWith('data:') ? (
              <img
                src={url}
                alt={`Moment ${i + 1}`}
                className="w-full h-full object-cover filter contrast-[1.05] sepia-[0.1]"
              />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl">📸</span>
                <span>لحظة ${i + 1}</span>
              </div>
            )}
            <span className="absolute bottom-1 right-1.5 text-[9px] font-mono font-bold bg-[#3D2314]/70 text-[#FAF5EB] px-1 py-0.5 rounded">
              #0${i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Date & Branding Footer */}
      <div className="pt-2 border-t border-[#3D2314]/20 flex flex-col items-center text-center">
        <span className="font-sans font-black text-lg text-[#3D2314] tracking-tight">stampy.</span>
        <span className="font-mono text-[9px] font-bold text-[#B83A26] uppercase tracking-widest mt-0.5">
          {date} • {names}
        </span>
        {storyNote && (
          <p className="text-[11px] text-[#3D2314]/80 italic mt-1 font-serif">
            «{storyNote}»
          </p>
        )}
      </div>
    </div>
  );
}
