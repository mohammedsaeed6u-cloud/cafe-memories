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
    <div className={`w-full max-w-xl mx-auto p-4 bg-white border border-stone-200/90 rounded-2xl shadow-xs text-stone-900 transition-all ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs shrink-0">
            <Camera className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
              شارك ستوري واعمل منشن لـ @{cleanHandle}
            </h4>
            <p className="text-[10px] text-stone-500 mt-0.5">
              انشر لقطات ذكرياتك اليوم في {businessName} للحصول على إعادة نشر ومفاجآت خاصة
            </p>
          </div>
        </div>
        <a
          href={`https://instagram.com/${cleanHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition shrink-0 active:scale-95"
        >
          <span>منشن @{cleanHandle}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};