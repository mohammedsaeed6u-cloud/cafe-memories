'use client';

import React from 'react';
import { Camera, ExternalLink } from 'lucide-react';

interface InstagramMentionPromptProps {
  instagramHandle?: string;
  businessName?: string;
  className?: string;
}

export const InstagramMentionPrompt: React.FC<InstagramMentionPromptProps> = ({
  instagramHandle,
  businessName = 'المتجر',
  className = '',
}) => {
  const cleanHandle = (instagramHandle || '').replace('@', '').trim();
  if (!cleanHandle) return null;
  return (
    <div className={`w-full max-w-xl mx-auto p-4 bg-[#141212] border border-white/10 rounded-2xl shadow-2xl text-[#e6e1e1] transition-all ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#55100D] border border-[#DD0200]/40 text-[#DD0200] flex items-center justify-center shadow-xs shrink-0">
            <Camera className="w-4 h-4 text-[#FBF9F5]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#FBF9F5] leading-tight">
              شارك ستوري واعمل منشن لـ @{cleanHandle}
            </h4>
            <p className="text-[10px] text-[#A19E9B] mt-0.5">
              انشر لقطات ذكرياتك اليوم في {businessName} للحصول على إعادة نشر ومفاجآت خاصة
            </p>
          </div>
        </div>
        <a
          href={`https://instagram.com/${cleanHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition shrink-0 active:scale-95"
        >
          <span>منشن @{cleanHandle}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};