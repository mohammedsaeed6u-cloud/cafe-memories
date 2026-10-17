'use client';

import React from 'react';
import { Clock, Pause, Play, Sparkles } from 'lucide-react';
import { UseLiveWallReturn } from '../types';

interface Props {
  wall: UseLiveWallReturn;
}

export const WallFooter: React.FC<Props> = ({ wall }) => {
  const { lastSyncTime, isPlaying, setIsPlaying, cafeSlug } = wall;

  return (
    <footer className="relative z-20 flex flex-col sm:flex-row items-center justify-between border-t border-white/10 pt-4 text-xs text-[#A19E9B] font-mono max-w-6xl mx-auto w-full px-4 gap-2">
      {/* Real-time Community Milestones Ticker */}
      <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-amber-200 font-bold">
          ✨ 142 ختماً معتمداً اليوم في الصالة • تهانينا لسارة على إكمال كارت الولاء!
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
          <Clock className="w-3 h-3" />
          <span>تحديث: {lastSyncTime}</span>
        </div>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1C1B1B] hover:bg-[#211F1F] border border-white/10 text-[#FBF9F5] transition text-[11px] cursor-pointer font-bold shadow-xs"
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isPlaying ? 'إيقاف' : 'تشغيل'}</span>
        </button>

        <span className="hidden md:inline text-stone-500 font-mono text-[10px]">
          Stampy Signage OS • {cafeSlug}
        </span>
      </div>
    </footer>
  );
};
