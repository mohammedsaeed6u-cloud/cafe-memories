'use client';

/**
 * AppleLuxuryShowcase — Atelier Nostalgia Masterpiece Exhibition Vitrine
 * 
 * Replaces fake phone mockups and swatch pickers with authentic, world-class previews
 * of the core platform products:
 * 1. Atelier Photobooth Strip (Physical tactile film card)
 * 2. Digital Loyalty Pass (Apple Wallet NFC smart pass with Tier Horizon Bar)
 * 3. Live TV Wall Display (Digital signage hospitality experience)
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Award,
  Tv,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AppleTabs, AppleTabsList, AppleTabTrigger, AppleTabContent } from '@/components/ui/ark/AppleTabs';
import { PhotoboothStripCard } from '@/components/photobooth/PhotoboothStripCard';
import { CustomerLoyaltyCard } from '@/features/loyalty/CustomerLoyaltyCard';

const SHOWCASE_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
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
  const [activeTab, setActiveTab] = useState<'strip' | 'loyalty' | 'wall'>('strip');

  return (
    <div className={`w-full max-w-3xl mx-auto select-none ${className}`}>
      {/* Restrained Architectural Segmented Control */}
      <div className="flex justify-center mb-8">
        <AppleTabs
          value={activeTab}
          onValueChange={(d) => setActiveTab(d.value as any)}
          className="w-auto"
        >
          <AppleTabsList className="bg-[#141212] border border-white/10 backdrop-blur-xl p-1.5 rounded-xl shadow-2xl flex items-center gap-1">
            <AppleTabTrigger
              value="strip"
              className="text-xs font-semibold py-2 px-4 sm:px-6 rounded-lg transition-all data-[selected]:bg-[#DD0200] data-[selected]:text-[#FBF9F5] data-[selected]:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-4px_rgba(221,2,0,0.5)] text-[#A19E9B] hover:text-[#FBF9F5] cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 ml-1.5 inline text-[#FBF9F5]" />
              شريط الذكريات المطبوع
            </AppleTabTrigger>

            <AppleTabTrigger
              value="loyalty"
              className="text-xs font-semibold py-2 px-4 sm:px-6 rounded-lg transition-all data-[selected]:bg-[#DD0200] data-[selected]:text-[#FBF9F5] data-[selected]:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-4px_rgba(221,2,0,0.5)] text-[#A19E9B] hover:text-[#FBF9F5] cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 ml-1.5 inline text-[#FBF9F5]" />
              كارت الولاء الرقمي
            </AppleTabTrigger>

            <AppleTabTrigger
              value="wall"
              className="text-xs font-semibold py-2 px-4 sm:px-6 rounded-lg transition-all data-[selected]:bg-[#DD0200] data-[selected]:text-[#FBF9F5] data-[selected]:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-4px_rgba(221,2,0,0.5)] text-[#A19E9B] hover:text-[#FBF9F5] cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 ml-1.5 inline text-[#FBF9F5]" />
              شاشة الصالة الحية
            </AppleTabTrigger>
          </AppleTabsList>

          {/* ============================================================= */}
          {/* TAB 1: AUTHENTIC PHOTOBOOTH STRIP                            */}
          {/* ============================================================= */}
          <AppleTabContent value="strip" className="mt-2">
            <div className="relative rounded-2xl bg-[#141212] p-6 sm:p-10 border border-white/10 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col items-center">
              {/* Luxury Ambient Bloom */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#DD0200]/15 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#55100D]/20 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                {/* Photobooth Strip Component */}
                <div className="transform transition-transform duration-300 hover:scale-[1.01] shadow-2xl">
                  <PhotoboothStripCard
                    photos={SHOWCASE_PHOTOS}
                    frame={{
                      id: 'atelier_signature',
                      name: 'Atelier Signature',
                      nameAr: 'استوديو نوار الفاخر',
                      shotCount: 3,
                      widthCm: 5,
                      heightCm: 15.2,
                      orientation: 'vertical',
                      bgColor: '#141313',
                      textColor: '#FBF9F5',
                      borderColor: 'rgba(255,255,255,0.1)',
                      accentColor: '#DD0200',
                      cornerEmojis: {
                        topRight: '',
                        bottomLeft: '',
                        enabled: false,
                      },
                    }}
                    branding={{
                      name: 'Memories Studio',
                      tagline: 'CAFÉ MOMENTS. LASTING LOYALTY.',
                      instagramHandle: '@memories_studio',
                    }}
                    freeGiftOffer={{
                      title: 'قهوة اليوم مجاناً',
                      subtitle: 'عند استكمال شريط الذكريات',
                      icon: '☕',
                    }}
                    cardMode="korean_noir"
                  />
                </div>

                <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-[#A19E9B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DD0200] animate-pulse" />
                  <span>PREMIUM 300 DPI THERMAL & DIGITAL PRINT ARCHIVE</span>
                </div>
              </div>
            </div>
          </AppleTabContent>

          {/* ============================================================= */}
          {/* TAB 2: DIGITAL LOYALTY CARD                                  */}
          {/* ============================================================= */}
          <AppleTabContent value="loyalty" className="mt-2">
            <div className="relative rounded-2xl bg-[#141212] p-6 sm:p-10 border border-white/10 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col items-center">
              {/* Luxury Ambient Bloom */}
              <div className="absolute top-0 left-0 w-72 h-72 bg-[#55100D]/25 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#DD0200]/12 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative z-10 w-full max-w-md">
                <CustomerLoyaltyCard
                  loyaltyData={{
                    stampedCount: 3,
                    maxSlots: 4,
                    completedCardsCount: 1,
                    customerPhone: '01001234567',
                    cafeSlug: 'memories',
                  }}
                  giftTitle="مشروب ترحيبي فاخر عند اكتمال الختم الرابع"
                  brandName="Memories Studio"
                  customerName="سارة أحمد"
                  instagramHandle="@memories_studio"
                  onOpenStaffStamp={() => {}}
                />

                <div className="mt-6 text-center">
                  <span className="inline-flex items-center gap-2 text-[11px] font-mono text-[#A19E9B]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                    <span>NFC SMART PASS & APPLE WALLET INTEGRATION</span>
                  </span>
                </div>
              </div>
            </div>
          </AppleTabContent>

          {/* ============================================================= */}
          {/* TAB 3: LIVE TV WALL DISPLAY                                  */}
          {/* ============================================================= */}
          <AppleTabContent value="wall" className="mt-2">
            <div className="relative rounded-2xl bg-[#141212] p-6 sm:p-10 border border-white/10 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] overflow-hidden">
              {/* Screen Shell */}
              <div className="relative rounded-xl bg-[#0B0A0A] border border-white/15 p-4 sm:p-6 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DD0200] animate-ping" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#FBF9F5]" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                        شاشة الصالة المباشرة • Memories Wall
                      </h4>
                      <p className="text-[10px] text-[#A19E9B] font-mono">LIVE GUEST MEMORIES IN SALON</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#FBF9F5] bg-[#55100D]/60 border border-[#DD0200]/40 px-2.5 py-0.5 rounded-md">
                    24 LIVE MEMORIES
                  </span>
                </div>

                {/* Grid of sample guest memories */}
                <div className="grid grid-cols-3 gap-3 my-4">
                  {SHOWCASE_PHOTOS.map((src, i) => (
                    <div
                      key={i}
                      className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10 bg-[#141313] shadow-md"
                    >
                      <img
                        src={src}
                        alt="Guest Memory"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 right-2 text-right">
                        <span className="text-[10px] font-bold text-white block">طاولة 0{i + 2}</span>
                        <span className="text-[8px] font-mono text-[#D9D9D9]">منذ {i * 7 + 3} دقيقة</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A19E9B]">
                  <span>تعمل على أي شاشة تلفزيون ذكية عبر المتصفح</span>
                  <Link
                    href="/wall/screen-1"
                    className="inline-flex items-center gap-1 text-[#DD0200] hover:text-[#FF5E5B] font-semibold transition"
                  >
                    <span>معاينة الشاشة بكامل العرض</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
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
