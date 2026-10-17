'use client';

import React from 'react';
import { Sparkles, Gift, Award, Camera } from 'lucide-react';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';
import { UseLiveWallReturn } from '../types';

interface Props {
  wall: UseLiveWallReturn;
}

export const WallStageView: React.FC<Props> = ({ wall }) => {
  const { currentMemory, cafeSlug, brandName } = wall;

  return (
    <main className="relative z-10 flex-1 my-4 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 max-w-6xl mx-auto w-full px-4">
      {currentMemory ? (
        <>
          {/* 1. CINEMATIC PHOTO VITRINE (MUSEUM-GRADE 35MM ARCHIVAL PASSE-PARTOUT) */}
          <div className="relative group max-w-md w-full aspect-[3/4] max-h-[72vh] rounded-3xl overflow-hidden shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] bg-[#1A1414] border-2 border-[#DFAB56]/40 p-3 flex flex-col justify-between transition-all duration-700">
            {/* Inner Frame */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
              {/* Soft Ambient Inner Vignette */}
              <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/70 pointer-events-none z-10" />

              {/* Photo with Ken Burns Slow Motion Zoom */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentMemory.photoUrl}
                alt={currentMemory.customerName}
                className="w-full h-full object-cover transition-transform duration-[12000ms] ease-out scale-105 hover:scale-110 animate-in fade-in zoom-in-95"
              />

              {/* Top Archival Film Frame Numbering */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
                <span className="text-[10px] font-mono tracking-widest text-[#FAF5EB] bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-[#DFAB56]/40 uppercase flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DFAB56] animate-pulse" />
                  <span>✦ 4-CUTS LIVE MEMORY {currentMemory.tableNumber ? `• طاولة ${currentMemory.tableNumber}` : ''}</span>
                </span>
                <span className="text-[10px] font-mono text-[#DFAB56] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 font-bold">
                  ISO 400 • {currentMemory.timeFormatted || '2026.10.01'}
                </span>
              </div>

              {/* Bottom Memory Caption & Guest Loyalty Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-6 text-right space-y-2 z-20 bg-gradient-to-t from-black via-black/85 to-transparent text-[#FAF5EB]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#682025]/90 backdrop-blur-md border border-[#DFAB56]/40 text-[#FAF5EB] flex items-center gap-1.5 shadow-sm">
                      <Award className="w-3.5 h-3.5 text-[#DFAB56]" />
                      <span>الزيارة رقم #{currentMemory.visitNumber}</span>
                    </span>
                    {currentMemory.tableNumber && (
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#DFAB56] text-stone-950 flex items-center gap-1 shadow-md">
                        <span>📍 طاولة {currentMemory.tableNumber}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[#DFAB56]/80 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 shrink-0">
                    {currentMemory.timeFormatted}
                  </span>
                </div>

                <div className="space-y-0.5 pt-1">
                  <h3
                    style={{ fontFamily: 'var(--font-head), Plus Jakarta Sans, sans-serif' }}
                    className="text-2xl font-black text-[#FAF5EB] drop-shadow-lg tracking-wide"
                  >
                    {currentMemory.customerName}
                  </h3>
                  {currentMemory.caption && (
                    <p className="text-sm text-[#EFE2CC] drop-shadow-md font-medium leading-snug">
                      "{currentMemory.caption}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. SIDE COMMUNITY ACTION & SCANNABLE GOLDEN QR STANDEE */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-right space-y-5 max-w-sm">
            {/* Header Tag */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#682025]/60 text-[#DFAB56] font-mono text-xs font-bold border border-[#DFAB56]/40 uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[#DFAB56] animate-pulse" />
                <span>شاشة الذكريات والولاء المباشرة</span>
              </div>
              <h2
                style={{ fontFamily: 'var(--font-head), Plus Jakarta Sans, sans-serif' }}
                className="text-2xl sm:text-3xl font-black text-[#FAF5EB] leading-snug drop-shadow-sm"
              >
                شارك شريط صورك واختم كارت ولائك الآن
              </h2>
              <p className="text-xs sm:text-sm text-[#D5C0A8] leading-relaxed font-medium">
                امسح الرمز بكاميرا هاتفك بدون تحميل أي تطبيق، التقط شريط صور 4-Cuts مع أصدقائك، واكسب ختماً مجانياً في Apple Wallet!
              </p>
            </div>

            {/* Scannable Luxury QR Vitrine Standee */}
            <div className="p-5 rounded-3xl bg-gradient-to-b from-[#221A1A] to-[#151010] border-2 border-[#DFAB56]/50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center gap-3.5 relative overflow-hidden group">
              <div className="p-4 bg-white rounded-2xl shadow-inner relative border border-[#DFAB56]/30">
                <RealOutsourcedQr
                  value={`https://memories-c9w.pages.dev/c/${cafeSlug}?source=live_wall`}
                  size={152}
                  alt="Live Wall Scannable QR"
                  className="w-38 h-38 object-contain"
                />
              </div>

              <div className="text-center space-y-0.5">
                <span className="text-[11px] font-mono font-bold text-[#DFAB56] tracking-widest uppercase block">
                  SCAN WITH CAMERA • بث فوري
                </span>
                <span className="text-[10px] text-[#D5C0A8] font-sans block">
                  امسح بالكاميرا لالتقاط لقطاتك وحفظ كارتك
                </span>
              </div>
            </div>

            {/* Live Stampy Loyalty Ticker Badge */}
            <div className="w-full p-3.5 rounded-2xl bg-[#682025]/30 border border-[#DFAB56]/30 flex items-center justify-between text-xs text-[#FAF5EB] backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#DFAB56] shrink-0" />
                <span className="font-bold text-[11px]">الهدية عند 8 أختام: مشروبك المفضل مجاناً ☕</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* EMPTY STATE / AMBIENT SIGNAGE LOOP */
        <div className="text-center space-y-6 max-w-lg p-10 rounded-3xl bg-gradient-to-b from-[#221A1A] to-[#151010] border-2 border-[#DFAB56]/40 shadow-2xl animate-in fade-in duration-500">
          <div className="w-16 h-16 rounded-3xl bg-[#682025]/80 border-2 border-[#DFAB56]/50 flex items-center justify-center mx-auto text-[#DFAB56] shadow-[0_0_30px_rgba(223,171,86,0.3)]">
            <Camera className="w-8 h-8 animate-pulse text-[#DFAB56]" />
          </div>

          <div className="space-y-2">
            <h3
              style={{ fontFamily: 'var(--font-head), Plus Jakarta Sans, sans-serif' }}
              className="text-2xl font-black text-[#FAF5EB]"
            >
              كن أول من يضيء الشاشة اليوم!
            </h3>
            <p className="text-xs sm:text-sm text-[#D5C0A8] leading-relaxed max-w-sm mx-auto">
              امسح الرمز بكاميرا هاتفك عند طاولتك، التقط شريط ذكرياتك 4-Cuts مع أصدقائك، واكسب ختماً مجانياً في {brandName || 'المكان'}.
            </p>
          </div>

          {/* Golden Standee QR */}
          <div className="p-4 bg-white rounded-2xl w-44 h-44 mx-auto flex flex-col items-center justify-center shadow-xl border-2 border-[#DFAB56]">
            <RealOutsourcedQr
              value={`https://memories-c9w.pages.dev/c/${cafeSlug}?source=live_wall`}
              size={140}
              alt="Live Wall QR"
            />
          </div>

          <span className="text-[11px] font-mono font-bold text-[#DFAB56] tracking-wider uppercase block">
            SCAN TO SNAP & JOIN • التقط صورك فوراً
          </span>
        </div>
      )}
    </main>
  );
};
