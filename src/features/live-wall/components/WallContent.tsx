'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { UseLiveWallReturn } from '../types';
import { WallUnpairedView } from './WallUnpairedView';
import { WallBlackoutView } from './WallBlackoutView';
import { WallHeader } from './WallHeader';
import { WallStageView } from './WallStageView';
import { WallFooter } from './WallFooter';

interface Props {
  wall: UseLiveWallReturn;
}

export const WallContent: React.FC<Props> = ({ wall }) => {
  if (!wall.isPaired) {
    return <WallUnpairedView wall={wall} />;
  }

  if (wall.isBlackout) {
    return <WallBlackoutView wall={wall} />;
  }

  return (
    <div className="min-h-screen bg-[#100C0C] text-[#FAF5EB] flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-sans relative">
      {/* Real-time Celebration Toast Banner */}
      {wall.newMemoryToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#682025] via-[#52171B] to-[#3D2314] text-[#FAF5EB] font-bold shadow-2xl border border-[#DFAB56]/50 backdrop-blur-md">
            <Sparkles className="w-5 h-5 text-[#DFAB56] animate-spin" />
            <span className="text-sm sm:text-base tracking-wide drop-shadow-sm">{wall.newMemoryToast}</span>
          </div>
        </div>
      )}

      {/* Background Ambient Archival Glows */}
      <div className="absolute top-1/4 left-1/4 w-[650px] h-[650px] bg-[#682025]/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-[#DFAB56]/15 rounded-full blur-[150px] pointer-events-none" />

      <WallHeader wall={wall} />
      <WallStageView wall={wall} />
      <WallFooter wall={wall} />
    </div>
  );
};
