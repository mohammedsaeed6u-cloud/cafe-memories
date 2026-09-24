'use client';

/**
 * AppleLuxuryShowcase — 1:1 Pixel-Perfect Implementation of Apple HIG Luxury Palette
 * Featuring:
 * 1. Ambient Vision Mesh Card (Image 1):
 *    - iPhone status bar (2:08, Signal, WiFi, Battery)
 *    - Top-left crimson/red aura bloom (#DD0200 / #55100D)
 *    - Bottom-right alabaster radiant illumination (#D9D9D9)
 *    - Deep coffee bean (#1A0706) & black OLED core
 *    - Diamond star badge "✦ studio"
 *    - "Luxury Color Palettes" typography
 * 2. Apple Bento Palette Grid (Image 2):
 *    - Alabaster Grey (#D9D9D9)
 *    - Racing Red (#DD0200)
 *    - Black Cherry (#55100D)
 *    - Coffee Bean (#1A0706)
 * Built with Ark UI Tabs for silky smooth transitions.
 */

import React, { useState } from 'react';
import { Sparkles, Check, Copy, Camera, Smartphone, Layers } from 'lucide-react';
import { AppleTabs, AppleTabsList, AppleTabTrigger, AppleTabContent } from '@/components/ui/ark/AppleTabs';
import { AppleTooltip } from '@/components/ui/ark/AppleTooltip';
import { IosCellularBarsSvg, IosBatterySvg, IosWifiSvg } from '@/components/photobooth/PhotoboothViralSvgIcons';

export interface AppleLuxuryShowcaseProps {
  onSelectPalette?: (paletteId: string) => void;
  onApplyTheme?: () => void;
  activeColorHex?: string;
  className?: string;
  compact?: boolean;
}

const PALETTE_SWATCHES = [
  {
    id: 'alabaster',
    name: 'Alabaster Grey',
    hex: '#D9D9D9',
    textColor: '#1A0706',
    border: 'border-white/30',
    description: 'Soft metallic pearl illumination',
    isLarge: true,
  },
  {
    id: 'racing-red',
    name: 'Racing Red',
    hex: '#DD0200',
    textColor: '#FFFFFF',
    border: 'border-red-400/40',
    description: 'High-energy vivid crimson aura',
    isLarge: false,
  },
  {
    id: 'black-cherry',
    name: 'Black Cherry',
    hex: '#55100D',
    textColor: '#FFFFFF',
    border: 'border-rose-900/60',
    description: 'Deep royal burgundy velvet depth',
    isLarge: false,
  },
  {
    id: 'coffee-bean',
    name: 'Coffee Bean',
    hex: '#1A0706',
    textColor: '#D9D9D9',
    border: 'border-white/10',
    description: 'Rich dark espresso foundation',
    isLarge: true,
  },
];

export const AppleLuxuryShowcase: React.FC<AppleLuxuryShowcaseProps> = ({
  onSelectPalette,
  onApplyTheme,
  activeColorHex = '#DD0200',
  className = '',
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<'ambient' | 'bento'>('ambient');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = (hex: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(hex);
    }
    setCopiedHex(hex);
    onSelectPalette?.(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  return (
    <div className={`w-full max-w-[360px] mx-auto select-none apple-font ${className}`}>
      {/* Ark UI View Switcher Tabs */}
      <AppleTabs
        value={activeTab}
        onValueChange={(d) => setActiveTab(d.value as 'ambient' | 'bento')}
        className="mb-3"
      >
        <AppleTabsList className="bg-black/40 dark:bg-white/10 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
          <AppleTabTrigger
            value="ambient"
            className="text-xs font-semibold py-1.5 data-[selected]:bg-white/90 data-[selected]:text-black dark:data-[selected]:bg-[#2C2C2E] dark:data-[selected]:text-white rounded-xl transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 ml-1 inline text-amber-500" />
            البطاقة الجلاسية (Ambient)
          </AppleTabTrigger>
          <AppleTabTrigger
            value="bento"
            className="text-xs font-semibold py-1.5 data-[selected]:bg-white/90 data-[selected]:text-black dark:data-[selected]:bg-[#2C2C2E] dark:data-[selected]:text-white rounded-xl transition-all"
          >
            <Layers className="w-3.5 h-3.5 ml-1 inline text-rose-500" />
            باليت أبل بينتو (Bento Grid)
          </AppleTabTrigger>
        </AppleTabsList>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: AMBIENT VISION CARD (Matching Uploaded Image 1)         */}
        {/* ------------------------------------------------------------- */}
        <AppleTabContent value="ambient">
          {/* iPhone Device Frame Wrapper */}
          <div className="relative rounded-[36px] bg-[#000000] p-3 pb-5 border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Top iOS Status Bar (Exact 2:08, Signal, WiFi, Battery) */}
            <div className="flex items-center justify-between px-3 pt-1 pb-2 text-white/90 text-[11px] font-semibold tracking-tight">
              <span className="font-mono tracking-tighter">2:08</span>
              <div className="flex items-center gap-1.5">
                <IosCellularBarsSvg size={11} color="#FFFFFF" />
                <IosWifiSvg size={11} color="#FFFFFF" />
                <div className="flex items-center gap-1 font-mono text-[9px]">
                  <span>63%</span>
                  <IosBatterySvg size={11} color="#FFFFFF" level={0.63} />
                </div>
              </div>
            </div>

            {/* Hero Ambient Vision Mesh Card */}
            <div
              className="relative rounded-[28px] p-6 pt-5 pb-7 text-white overflow-hidden border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_12px_32px_rgba(0,0,0,0.8)]"
              style={{
                background:
                  'radial-gradient(circle at 18% 12%, rgba(221, 2, 0, 0.48) 0%, rgba(85, 16, 13, 0.28) 28%, transparent 60%), radial-gradient(circle at 85% 85%, rgba(217, 217, 217, 0.42) 0%, rgba(180, 180, 180, 0.16) 32%, transparent 65%), linear-gradient(165deg, #1A0706 0%, #0A0404 45%, #000000 100%)',
                minHeight: compact ? '260px' : '380px',
              }}
            >
              {/* Subtle Film Grain Noise */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20 z-0"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")',
                }}
              />

              {/* Top Star Badge: "✦ studio" */}
              <div className="relative z-10 flex items-center gap-1.5 text-white/90">
                <span className="text-xs font-serif text-white drop-shadow-xs">✦</span>
                <span className="text-[11px] font-mono tracking-widest text-[#D9D9D9] uppercase font-bold">
                  studio
                </span>
              </div>

              {/* Center Typography: "Luxury Color Palettes" */}
              <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center py-12">
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md">
                  Luxury Color
                </h3>
                <p className="text-xs sm:text-sm font-medium tracking-[0.2em] text-[#D9D9D9]/80 uppercase mt-1">
                  Palettes
                </p>
              </div>

              {/* Interactive Mini Swatches Pill at Bottom of Card */}
              <div className="relative z-10 mt-auto pt-4 flex items-center justify-center gap-2">
                {PALETTE_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.id}
                    onClick={() => handleCopyHex(swatch.hex)}
                    title={`${swatch.name} (${swatch.hex})`}
                    className="w-7 h-7 rounded-full border border-white/20 shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer relative"
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {copiedHex === swatch.hex && (
                      <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Action Button */}
            {onApplyTheme && (
              <button
                onClick={onApplyTheme}
                className="mt-3 w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                تطبيق الثيم على صورك فوراً
              </button>
            )}
          </div>
        </AppleTabContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: APPLE BENTO GRID (Matching Uploaded Image 2)           */}
        {/* ------------------------------------------------------------- */}
        <AppleTabContent value="bento">
          {/* iPhone Device Frame Wrapper */}
          <div className="relative rounded-[36px] bg-[#000000] p-3 pb-5 border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Top iOS Status Bar (Exact 2:08, Signal, WiFi, Battery) */}
            <div className="flex items-center justify-between px-3 pt-1 pb-3 text-white/90 text-[11px] font-semibold tracking-tight">
              <span className="font-mono tracking-tighter">2:08</span>
              <div className="flex items-center gap-1.5">
                <IosCellularBarsSvg size={11} color="#FFFFFF" />
                <IosWifiSvg size={11} color="#FFFFFF" />
                <div className="flex items-center gap-1 font-mono text-[9px]">
                  <span>63%</span>
                  <IosBatterySvg size={11} color="#FFFFFF" level={0.63} />
                </div>
              </div>
            </div>

            {/* Bento Grid Layout (Exact match to Image 2) */}
            <div className="space-y-2.5">
              {/* Card 1: Alabaster Grey (Top Large Card) */}
              <div
                onClick={() => handleCopyHex('#D9D9D9')}
                className="w-full h-32 rounded-[22px] bg-[#D9D9D9] p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-md border border-white/40 group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A0706]">Alabaster Grey</span>
                  {copiedHex === '#D9D9D9' && (
                    <span className="px-2 py-0.5 rounded-full bg-black/10 text-[9px] font-mono font-bold text-[#1A0706] flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3" /> تم النسخ
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-[#1A0706]/80">
                  <span>HEX // #D9D9D9</span>
                  <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Card 2 & 3: Middle Duo Grid (Racing Red & Black Cherry) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Middle Left: Racing Red */}
                <div
                  onClick={() => handleCopyHex('#DD0200')}
                  className="h-32 rounded-[22px] bg-[#DD0200] p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md border border-red-400/40 group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Racing Red</span>
                    {copiedHex === '#DD0200' && (
                      <Check className="w-3.5 h-3.5 text-white animate-in zoom-in" />
                    )}
                  </div>
                  <div className="text-[10px] font-mono font-semibold text-white/90">
                    HEX // #DD0200
                  </div>
                </div>

                {/* Middle Right: Black Cherry */}
                <div
                  onClick={() => handleCopyHex('#55100D')}
                  className="h-32 rounded-[22px] bg-[#55100D] p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md border border-rose-950/60 group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Black Cherry</span>
                    {copiedHex === '#55100D' && (
                      <Check className="w-3.5 h-3.5 text-white animate-in zoom-in" />
                    )}
                  </div>
                  <div className="text-[10px] font-mono font-semibold text-white/80">
                    HEX // #55100D
                  </div>
                </div>
              </div>

              {/* Card 4: Coffee Bean (Bottom Wide Card) */}
              <div
                onClick={() => handleCopyHex('#1A0706')}
                className="w-full h-28 rounded-[22px] bg-[#1A0706] p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-md border border-white/10 group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D9D9D9]">Coffee Bean</span>
                  {copiedHex === '#1A0706' && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-mono font-bold text-[#D9D9D9] flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3" /> تم النسخ
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-[#D9D9D9]/70">
                  <span>HEX // #1A0706</span>
                  <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Apply Action Button */}
            {onApplyTheme && (
              <button
                onClick={onApplyTheme}
                className="mt-3 w-full py-2.5 px-4 rounded-2xl bg-[#DD0200] hover:bg-[#B50200] active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-900/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                تطبيق هذه الباليت على كارتك الآن
              </button>
            )}
          </div>
        </AppleTabContent>
      </AppleTabs>
    </div>
  );
};

export default AppleLuxuryShowcase;
