'use client';

/**
 * AppleLuxuryShowcase — World-Class Apple HIG Luxury Studio Experience
 * 1:1 Translation of User Images with Architectural Elegance
 *
 * Tab 1: Ambient Vision Card (Image 1) — Velvet dark mesh, crimson & alabaster lighting leaks, 2:08 status bar, photo strip slots
 * Tab 2: Apple Bento Palette (Image 2) — Alabaster Grey (#D9D9D9), Racing Red (#DD0200), Black Cherry (#55100D), Coffee Bean (#1A0706)
 * Tab 3: Apple Wallet Pass — Titanium NFC smart pass with instant loyalty stamps
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Check,
  Copy,
  Camera,
  Layers,
  CreditCard,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Eye,
} from 'lucide-react';
import { AppleTabs, AppleTabsList, AppleTabTrigger, AppleTabContent } from '@/components/ui/ark/AppleTabs';
import { IosCellularBarsSvg, IosBatterySvg, IosWifiSvg } from '@/components/photobooth/PhotoboothViralSvgIcons';

const PALETTE_DATA = [
  {
    id: 'alabaster',
    name: 'Alabaster Grey',
    hex: '#D9D9D9',
    textColor: '#1A0706',
    border: 'border-white/40',
    description: 'إضاءة لؤلؤية مسنفرة ناعمة',
    tag: 'PEARL ILLUMINATION',
  },
  {
    id: 'racing-red',
    name: 'Racing Red',
    hex: '#DD0200',
    textColor: '#FFFFFF',
    border: 'border-red-400/40',
    description: 'هالة قرموية متوهجة حيوية',
    tag: 'VIVID AURA',
  },
  {
    id: 'black-cherry',
    name: 'Black Cherry',
    hex: '#55100D',
    textColor: '#FFFFFF',
    border: 'border-rose-950/60',
    description: 'عمق مخملي ملكي داكن',
    tag: 'VELVET DEPTH',
  },
  {
    id: 'coffee-bean',
    name: 'Coffee Bean',
    hex: '#1A0706',
    textColor: '#D9D9D9',
    border: 'border-white/10',
    description: 'أساس إسبريسو غني وصلب',
    tag: 'RICH FOUNDATION',
  },
];

const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
];

export interface AppleLuxuryShowcaseProps {
  className?: string;
  onSelectPalette?: (hex: string) => void;
  onApplyTheme?: () => void;
  activeColorHex?: string;
}

export function AppleLuxuryShowcase({
  className = '',
  onSelectPalette,
  onApplyTheme,
  activeColorHex = '#DD0200',
}: AppleLuxuryShowcaseProps) {
  const [activeTab, setActiveTab] = useState<'ambient' | 'bento' | 'wallet'>('ambient');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [selectedAccent, setSelectedAccent] = useState(activeColorHex);

  const handleCopyHex = (hex: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(hex);
    }
    setCopiedHex(hex);
    setSelectedAccent(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto apple-font select-none ${className}`}>
      {/* High-End Apple Segmented Tabs */}
      <div className="flex justify-center mb-6">
        <AppleTabs
          value={activeTab}
          onValueChange={(d) => setActiveTab(d.value as any)}
          className="w-auto"
        >
          <AppleTabsList className="bg-white/[0.06] border border-white/10 backdrop-blur-2xl p-1.5 rounded-full shadow-2xl">
            <AppleTabTrigger
              value="ambient"
              className="text-xs font-semibold py-2 px-4 sm:px-5 rounded-full transition-all data-[selected]:bg-white data-[selected]:text-black data-[selected]:shadow-lg text-stone-300"
            >
              <Sparkles className="w-3.5 h-3.5 ml-1.5 inline text-amber-500" />
              الكارت الزجاجي (Ambient Card)
            </AppleTabTrigger>
            <AppleTabTrigger
              value="bento"
              className="text-xs font-semibold py-2 px-4 sm:px-5 rounded-full transition-all data-[selected]:bg-white data-[selected]:text-black data-[selected]:shadow-lg text-stone-300"
            >
              <Layers className="w-3.5 h-3.5 ml-1.5 inline text-[#DD0200]" />
              لوحة البينتو (Bento Palette)
            </AppleTabTrigger>
            <AppleTabTrigger
              value="wallet"
              className="text-xs font-semibold py-2 px-4 sm:px-5 rounded-full transition-all data-[selected]:bg-white data-[selected]:text-black data-[selected]:shadow-lg text-stone-300"
            >
              <CreditCard className="w-3.5 h-3.5 ml-1.5 inline text-blue-400" />
              Apple Wallet Pass
            </AppleTabTrigger>
          </AppleTabsList>

          {/* ============================================================= */}
          {/* TAB 1: THE AMBIENT VISION CARD (Exact match to Image 1)        */}
          {/* ============================================================= */}
          <AppleTabContent value="ambient">
            <div className="relative rounded-[40px] bg-[#000000] p-4 sm:p-6 border border-white/15 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] overflow-hidden">
              {/* iPhone Status Bar (2:08, Signal, WiFi, Battery 63%) */}
              <div className="flex items-center justify-between px-3 pt-1 pb-4 text-white text-xs font-semibold tracking-tight">
                <span className="font-mono tracking-tighter">2:08</span>
                <div className="flex items-center gap-2">
                  <IosCellularBarsSvg size={12} color="#FFFFFF" />
                  <IosWifiSvg size={12} color="#FFFFFF" />
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <span>63%</span>
                    <IosBatterySvg size={12} color="#FFFFFF" level={0.63} />
                  </div>
                </div>
              </div>

              {/* The Hero Card Container with Alabaster Grey Background (اللون الفاتح للباك جراوند) */}
              <div
                className="relative rounded-[32px] p-6 sm:p-8 text-[#1A0706] overflow-hidden border border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500"
                style={{
                  background:
                    selectedAccent === '#D9D9D9' || selectedAccent === '#DD0200'
                      ? 'radial-gradient(circle at 18% 12%, rgba(221, 2, 0, 0.22) 0%, rgba(85, 16, 13, 0.10) 28%, transparent 60%), radial-gradient(circle at 85% 85%, rgba(255, 255, 255, 0.85) 0%, transparent 65%), linear-gradient(165deg, #EAEAEA 0%, #D9D9D9 45%, #C8C8C8 100%)'
                      : `radial-gradient(circle at 18% 12%, ${selectedAccent}44 0%, transparent 60%), radial-gradient(circle at 85% 85%, rgba(255, 255, 255, 0.75) 0%, transparent 65%), linear-gradient(165deg, #EAEAEA 0%, #D9D9D9 100%)`,
                }}
              >
                {/* Film Grain Texture */}
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-15 z-0"
                  style={{
                    backgroundImage:
                      'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")',
                  }}
                />

                {/* Top Badge: "✦ studio" in Coffee Bean & Racing Red */}
                <div className="relative z-10 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-[#1A0706]">
                    <span className="text-xs font-serif text-[#1A0706] drop-shadow-xs">✦</span>
                    <span className="text-xs font-mono tracking-widest text-[#1A0706] uppercase font-bold">
                      studio
                    </span>
                  </div>
                  <span className="text-[9px] font-mono tracking-[0.2em] text-white uppercase px-2 py-0.5 rounded-full bg-[#DD0200] font-bold shadow-xs">
                    ALABASTER BG
                  </span>
                </div>

                {/* Center Title: "Luxury Color Palettes" in Coffee Bean #1A0706 */}
                <div className="relative z-10 text-center py-4 sm:py-6">
                  <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#1A0706] drop-shadow-xs">
                    Luxury Color
                  </h3>
                  <p className="text-xs sm:text-sm font-bold tracking-[0.25em] text-[#55100D] uppercase mt-1">
                    Palettes
                  </p>
                </div>

                {/* 3 Authentic Photo Slots with Glassmorphism Frames */}
                <div className="relative z-10 grid grid-cols-3 gap-2.5 sm:gap-3 my-4">
                  {SAMPLE_PHOTOS.map((src, i) => (
                    <div
                      key={i}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-black/10 bg-black/10 shadow-md backdrop-blur-md transition-transform hover:scale-105"
                    >
                      <img
                        src={src}
                        alt="Photobooth memory"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                      <div className="absolute top-1.5 left-2 text-[8px] font-mono font-bold text-white drop-shadow-xs">
                        ✦ 0{i + 1}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interactive Palette Color Dots */}
                <div className="relative z-10 pt-4 border-t border-[#1A0706]/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#1A0706]/80 tracking-widest uppercase font-bold">
                    {selectedAccent === '#D9D9D9' ? 'ACTIVE // #D9D9D9 (اللون الفاتح للباك جراوند)' : `ACTIVE // ${selectedAccent}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {PALETTE_DATA.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedAccent(p.hex)}
                        title={`${p.name} (${p.hex})`}
                        className={`w-6 h-6 rounded-full border transition-all cursor-pointer relative ${
                          selectedAccent === p.hex
                            ? 'border-[#1A0706] scale-125 shadow-md ring-2 ring-[#DD0200]/40'
                            : 'border-black/20 hover:scale-110'
                        }`}
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
                <Link
                  href="/c/memories"
                  className="w-full sm:flex-1 py-3 px-5 rounded-full bg-[#DD0200] hover:bg-[#B50200] active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>فتح استوديو التصوير المباشر</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto py-3 px-5 rounded-full bg-white/10 hover:bg-white/20 active:scale-[0.98] border border-white/15 text-white text-xs font-semibold transition-all backdrop-blur-md cursor-pointer text-center"
                >
                  دخول لوحة التاجر
                </Link>
              </div>
            </div>
          </AppleTabContent>

          {/* ============================================================= */}
          {/* TAB 2: THE APPLE BENTO GRID (Exact match to Image 2)          */}
          {/* ============================================================= */}
          <AppleTabContent value="bento">
            <div className="relative rounded-[40px] bg-[#000000] p-4 sm:p-6 border border-white/15 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] overflow-hidden">
              {/* iPhone Status Bar */}
              <div className="flex items-center justify-between px-3 pt-1 pb-4 text-white text-xs font-semibold tracking-tight">
                <span className="font-mono tracking-tighter">2:08</span>
                <div className="flex items-center gap-2">
                  <IosCellularBarsSvg size={12} color="#FFFFFF" />
                  <IosWifiSvg size={12} color="#FFFFFF" />
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <span>63%</span>
                    <IosBatterySvg size={12} color="#FFFFFF" level={0.63} />
                  </div>
                </div>
              </div>

              {/* Bento Grid Layout (Exact translation of Image 2) */}
              <div className="space-y-3">
                {/* 1. Alabaster Grey (Top Large Card) - THE LIGHT BACKGROUND */}
                <div
                  onClick={() => handleCopyHex('#D9D9D9')}
                  className="w-full h-36 rounded-[26px] bg-[#D9D9D9] p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-md border border-white/60 group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#1A0706] block">Alabaster Grey</span>
                      <span className="text-[10px] text-[#1A0706]/80 font-mono font-bold">اللون الفاتح للباك جراوند • PRIMARY BACKGROUND</span>
                    </div>
                    {copiedHex === '#D9D9D9' ? (
                      <span className="px-2.5 py-1 rounded-full bg-black/10 text-[10px] font-mono font-bold text-[#1A0706] flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3.5 h-3.5" /> تم النسخ والتطبيق
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#1A0706]/60 group-hover:text-[#1A0706] transition-colors">
                        اضغط للنسخ
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#1A0706]">
                    <span>HEX // #D9D9D9</span>
                    <Copy className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* 2 & 3. Middle Duo Cards (Racing Red & Black Cherry) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Racing Red */}
                  <div
                    onClick={() => handleCopyHex('#DD0200')}
                    className="h-36 rounded-[26px] bg-[#DD0200] p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md border border-red-400/40 group relative overflow-hidden text-white"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold block">Racing Red</span>
                        <span className="text-[10px] text-white/70 font-mono">VIVID CRIMSON AURA</span>
                      </div>
                      {copiedHex === '#DD0200' ? (
                        <Check className="w-4 h-4 text-white animate-in zoom-in" />
                      ) : (
                        <span className="text-[10px] font-mono text-white/60">اضغط للنسخ</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                      <span>HEX // #DD0200</span>
                      <Copy className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Black Cherry */}
                  <div
                    onClick={() => handleCopyHex('#55100D')}
                    className="h-36 rounded-[26px] bg-[#55100D] p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md border border-rose-950/60 group relative overflow-hidden text-white"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold block">Black Cherry</span>
                        <span className="text-[10px] text-white/70 font-mono">VELVET BURGUNDY</span>
                      </div>
                      {copiedHex === '#55100D' ? (
                        <Check className="w-4 h-4 text-white animate-in zoom-in" />
                      ) : (
                        <span className="text-[10px] font-mono text-white/60">اضغط للنسخ</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                      <span>HEX // #55100D</span>
                      <Copy className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>

                {/* 4. Coffee Bean (Bottom Wide Card) */}
                <div
                  onClick={() => handleCopyHex('#1A0706')}
                  className="w-full h-32 rounded-[26px] bg-[#1A0706] p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-md border border-white/10 group relative overflow-hidden text-[#D9D9D9]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold block">Coffee Bean</span>
                      <span className="text-[10px] text-[#D9D9D9]/60 font-mono">DARK FOUNDATION</span>
                    </div>
                    {copiedHex === '#1A0706' ? (
                      <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-mono font-bold text-white flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3.5 h-3.5" /> تم النسخ والتطبيق
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-white/40">اضغط للنسخ</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#D9D9D9]">
                    <span>HEX // #1A0706</span>
                    <Copy className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
          </AppleTabContent>

          {/* ============================================================= */}
          {/* TAB 3: APPLE WALLET PASS                                      */}
          {/* ============================================================= */}
          <AppleTabContent value="wallet">
            <div className="relative rounded-[40px] bg-[#000000] p-4 sm:p-6 border border-white/15 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] overflow-hidden">
              {/* Apple Wallet Titanium Pass Card */}
              <div className="relative rounded-[32px] p-6 sm:p-7 apple-titanium text-white overflow-hidden border border-white/20 shadow-2xl">
                {/* Contactless NFC Waves Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg"></span>
                    <span className="text-xs font-bold tracking-wider">Apple Wallet Pass</span>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-[#D9D9D9]/80 uppercase px-2.5 py-1 rounded-full bg-white/10 border border-white/10">
                    NFC READY
                  </span>
                </div>

                <div className="py-6">
                  <span className="text-xs font-mono text-[#D9D9D9]/70 uppercase block mb-1">
                    GUEST LOYALTY CARD
                  </span>
                  <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Memories Studio VIP Pass
                  </h4>
                  <p className="text-xs text-stone-400 mt-1">
                    احفظ أختامك التفاعلية وزياراتك في محفظة Apple مباشرة بدون تطبيقات.
                  </p>
                </div>

                {/* 6 Interactive Stamp Circles */}
                <div className="grid grid-cols-6 gap-2 py-4">
                  {[1, 2, 3, 4, 5, 6].map((slot) => {
                    const isStamped = slot <= 4;
                    const isGift = slot === 6;
                    return (
                      <div
                        key={slot}
                        className={`aspect-square rounded-2xl flex items-center justify-center text-xs font-bold border transition-all ${
                          isStamped
                            ? 'bg-[#0071E3] border-blue-400 text-white shadow-md'
                            : isGift
                            ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                            : 'bg-white/5 border-white/15 text-stone-500'
                        }`}
                      >
                        {isStamped ? <Check className="w-4 h-4" /> : isGift ? '🎁' : slot}
                      </div>
                    );
                  })}
                </div>

                {/* Barcode Strip */}
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <div className="h-9 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden">
                    <div className="flex gap-1 h-full items-center">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-black h-full"
                          style={{ width: i % 3 === 0 ? '4px' : i % 2 === 0 ? '2px' : '1px' }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-stone-400 mt-1 block">
                    MEMORIES-APPLE-PASS-2026
                  </span>
                </div>
              </div>
            </div>
          </AppleTabContent>
        </AppleTabs>
      </div>
    </div>
  );
}

export default AppleLuxuryShowcase;
