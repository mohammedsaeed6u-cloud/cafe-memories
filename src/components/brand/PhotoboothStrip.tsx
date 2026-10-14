import React from 'react';

export interface PhotoMemory {
  url: string;
  caption?: string;
}

export interface PhotoboothStripProps {
  venueName: string;
  date: string;
  serialNumber: string;
  photos: PhotoMemory[];
  onDownloadOrPrint?: () => void;
}

/**
 * PhotoboothStrip Component
 * Section 10.1 of STAMPY Design System Specification v1.1.0
 * The 35mm photobooth keepsake strip given to customers at the end of their experience.
 */
export const PhotoboothStrip: React.FC<PhotoboothStripProps> = ({
  venueName,
  date,
  serialNumber,
  photos,
  onDownloadOrPrint,
}) => {
  return (
    <div className="w-[300px] bg-[#FAF5EB] p-4 rounded-[6px] shadow-2xl border border-[#D5C0A8] flex flex-col items-center select-none font-sans">
      {/* Top Perforation Edge Motif */}
      <div className="w-full flex justify-between items-center pb-2 border-b border-[#3D2314]/20 mb-3">
        <span className="font-mono text-[10px] tracking-widest text-[#3D2314]/70 font-bold">
          STAMPY. MEMORY STRIP
        </span>
        <span className="font-mono text-[10px] text-[#B83A26] font-bold">
          {serialNumber}
        </span>
      </div>

      {/* 3-Frame Vertical Photos */}
      <div className="w-full flex flex-col gap-3">
        {photos.slice(0, 3).map((photo, idx) => (
          <div key={idx} className="relative aspect-[4/3] w-full bg-[#1B1B1E] overflow-hidden rounded-[2px] border border-[#3D2314]/30 shadow-inner">
            <img src={photo.url} alt={`Memory ${idx + 1}`} className="w-full h-full object-cover" />
            <div className="absolute bottom-1 right-2 font-mono text-[9px] text-[#FAF5EB]/80 bg-[#1B1B1E]/60 px-1 rounded">
              0{idx + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Keepsake Footer Stamp */}
      <div className="w-full mt-4 pt-3 border-t-2 border-dashed border-[#8C6C52]/40 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-black tracking-wider text-[#3D2314] uppercase">{venueName}</h4>
          <p className="text-[10px] font-mono text-[#6E4E38]">{date}</p>
        </div>

        {/* 6-Blade Aperture Miniature Stamp */}
        <div className="w-9 h-9 rounded-full bg-[#E5A836]/20 border border-[#B83A26] flex items-center justify-center">
          <svg className="w-5 h-5 text-[#B83A26]" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6"/>
            {/* Shutter Blade Motif */}
            <path d="M50 20 L65 50 L50 80 Z" opacity="0.8"/>
          </svg>
        </div>
      </div>

      {/* Customer Happiness Action */}
      {onDownloadOrPrint && (
        <button
          onClick={onDownloadOrPrint}
          className="mt-4 w-full py-2 bg-[#B83A26] hover:bg-[#962B1A] text-[#FAF5EB] font-bold text-xs uppercase tracking-wider rounded transition-colors cursor-pointer"
        >
          Take Your Photos Home ✨
        </button>
      )}
    </div>
  );
};
