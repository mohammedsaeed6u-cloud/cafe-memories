'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Gift,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  ChevronRight,
  Volume2,
  VolumeX,
  Camera,
  RefreshCw,
  Award,
} from 'lucide-react';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { BusinessSettings } from '@/types/photobooth';

export interface TappyCustomerWebCardProps {
  cafeSlug: string;
  settings: BusinessSettings;
  stampedCount: number;
  maxSlots: number;
  customerName?: string;
  customerPhone?: string;
  showSimulator?: boolean;
  onAddStamp?: () => void;
  onResetStamps?: () => void;
  onOpenPhotoboothStudio?: () => void;
  onRegisterCustomerPhone?: (phone: string, name: string) => void;
}

export function TappyCustomerWebCard({
  cafeSlug,
  settings,
  stampedCount: initialStampedCount,
  maxSlots = 8,
  customerName = 'ضيف مميز',
  customerPhone = '',
  showSimulator,
  onAddStamp,
  onResetStamps,
  onOpenPhotoboothStudio,
}: TappyCustomerWebCardProps) {
  // Local state for interactive test simulation and live updates
  const [stamps, setStamps] = useState<number>(initialStampedCount !== undefined ? initialStampedCount : 0);
  const [lastStampedIndex, setLastStampedIndex] = useState<number | null>(null);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [liveReceiptTime, setLiveReceiptTime] = useState<string>('');
  const [redeemNonce, setRedeemNonce] = useState<string>('STP-8492');
  const [hasRedeemed, setHasRedeemed] = useState(false);

  const brandName = settings?.branding?.name || 'ستامبي';
  const brandColor = settings?.walletPassConfig?.colorHex || '#DFAB56';
  const stampIcon = settings?.stampConfig?.customEmoji || '✨';
  const rewardTitle = settings?.freeGiftOffer?.title || 'مكافأة مميزة مجانية ✨';
  const activeBranch = settings?.locationConfig?.relevantText || 'الفرع الرئيسي - الرياض';

  const isCompleted = stamps >= maxSlots;
  const stampsRemaining = Math.max(0, maxSlots - stamps);

  // Sync external stamps prop
  useEffect(() => {
    if (initialStampedCount !== undefined) {
      setStamps(initialStampedCount);
    }
  }, [initialStampedCount]);

  // Real-time ticking clock for anti-counterfeit live receipt
  useEffect(() => {
    if (!isRedeemModalOpen) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
      setLiveReceiptTime(`${timeStr}.${ms}`);
    }, 45);

    return () => clearInterval(interval);
  }, [isRedeemModalOpen]);

  // Handle Interactive Tap Simulator (+1 Stamp)
  const handleSimulateTap = () => {
    if (stamps >= maxSlots) {
      setIsRedeemModalOpen(true);
      return;
    }
    const nextStamps = stamps + 1;
    setStamps(nextStamps);
    setLastStampedIndex(nextStamps - 1);

    // Audio Chime Feedback
    if (!isSoundMuted) {
      if (nextStamps >= maxSlots) {
        SoundEffectsService.playRewardCelebration();
      } else {
        SoundEffectsService.playStampChime();
      }
    }

    if (onAddStamp) {
      onAddStamp();
    }
  };

  // Open Redemption Screen with security nonce
  const handleOpenRedeem = () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    setRedeemNonce(`STP-${randomCode}`);
    setHasRedeemed(false);
    setIsRedeemModalOpen(true);
  };

  // Barista Confirmation
  const handleConfirmRedemption = () => {
    setHasRedeemed(true);
    if (!isSoundMuted) {
      SoundEffectsService.playRewardCelebration();
    }
    setTimeout(() => {
      setStamps(0);
      setIsRedeemModalOpen(false);
      setHasRedeemed(false);
      if (onResetStamps) onResetStamps();
    }, 1800);
  };

  // Apple & Google Wallet Deep Links
  const appleWalletUrl = `/api/v1/apple-pass-service/pass/${cafeSlug || 'stampy'}`;
  const googleWalletUrl = `/api/v1/tappy/pass?format=google&cafeSlug=${cafeSlug || 'stampy'}`;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center px-3 py-4 selection:bg-[#DFAB56] selection:text-white">
      {/* 1. BRAND HEADER & STATUS BAR - Luxury Stationery Cardstock */}
      <div className="w-full flex items-center justify-between p-3.5 mb-3 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-2xl shadow-[0_4px_16px_rgba(61,35,20,0.05)]">
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: brandColor }}
            className="w-11 h-11 rounded-xl border border-[#DFAB56]/50 flex items-center justify-center text-white text-lg font-black shadow-sm overflow-hidden bg-white/90"
          >
            {settings?.branding?.logoUrl ? (
              <img
                src={settings.branding.logoUrl}
                alt={brandName}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="font-serif text-[#682025]">{brandName.charAt(0)}</span>
            )}
          </div>
          <div>
            <h1 className="text-base font-black text-[#3D2314] font-['Plus_Jakarta_Sans',sans-serif] uppercase leading-tight tracking-tight">
              {brandName}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6E4E38]">
              <MapPin className="w-3 h-3 text-[#DFAB56]" />
              <span className="truncate max-w-[190px]">{activeBranch}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const next = !isSoundMuted;
            setIsSoundMuted(next);
            SoundEffectsService.setMuted(next);
          }}
          className="p-2.5 rounded-xl bg-white/80 border border-[#DFAB56]/30 text-[#3D2314] hover:bg-white shadow-xs transition-transform active:scale-95"
          title={isSoundMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isSoundMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-[#682025]" />}
        </button>
      </div>

      {/* 2. THE AUTHENTIC STAMPY DIGITAL KEEPSAKE PASS */}
      <div className="w-full relative bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-3xl p-6 shadow-[0_12px_36px_-6px_rgba(61,35,20,0.08),0_2px_8px_-1px_rgba(61,35,20,0.04)] overflow-hidden transition-all duration-300 stampy-ticket-card">
        {/* Subtle Archival Paper Texture Gradient */}
        <div className="absolute inset-0 bg-radial from-white/40 via-transparent to-[#DFAB56]/5 pointer-events-none" />

        {/* Card Header Top Row */}
        <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-[#DFAB56]/30">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-[#8C6C52]">
              بطاقة ولاء وذكريات رقمية
              <span className="sr-only">Verified Digital Card</span>
            </div>
            <div className="text-xs font-black text-[#3D2314] font-['Plus_Jakarta_Sans',sans-serif]">
              {customerName || 'عضو مميز'}
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/90 border border-[#DFAB56]/40 rounded-full shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#DFAB56]" />
            <span className="text-xs font-black font-mono text-[#3D2314]">
              {stamps} / {maxSlots}
            </span>
          </div>
        </div>

        {/* Motivational Banner */}
        <div className="relative z-10 my-4 text-center">
          {isCompleted ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold animate-pulse shadow-xs">
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>اكتملت البطاقة! اضغط بالأسفل للاستلام 🎁</span>
              <span className="sr-only">Card Completed! Tap Below to Redeem</span>
            </div>
          ) : (
            <div className="text-xs font-medium text-[#3D2314]">
              اجمع <span className="font-extrabold text-[#682025] font-mono text-sm">{stampsRemaining}</span> {stampsRemaining === 1 ? 'ختم إضافي' : 'أختام إضافية'} للحصول على{' '}
              <span className="font-bold text-[#682025] underline decoration-[#DFAB56] decoration-2 underline-offset-2">{rewardTitle}</span>
              <span className="sr-only">Collect {stampsRemaining} more stamps</span>
            </div>
          )}
        </div>

        {/* 3. TACTILE STAMP GRID - Luxury Embossed Stamp Seals */}
        <div
          dir="ltr"
          className={`relative z-10 grid gap-3 py-3 ${
            maxSlots <= 6 ? 'grid-cols-3' : maxSlots <= 8 ? 'grid-cols-4' : 'grid-cols-5'
          }`}
        >
          {Array.from({ length: maxSlots }).map((_, idx) => {
            const isStamped = idx < stamps;
            const isJustStamped = idx === lastStampedIndex;
            const isFinalSlot = idx === maxSlots - 1;

            return (
              <div
                key={idx}
                className="aspect-square relative flex items-center justify-center rounded-2xl select-none"
              >
                {isStamped ? (
                  // Stamped Slot with Realistic Physical Shutter Stamp Slam
                  <div
                    style={{
                      transform: `rotate(${((idx * 5) % 10) - 5}deg)`,
                    }}
                    className={`w-full h-full rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#F5ECDC] border-2 border-[#DFAB56] shadow-[0_4px_12px_rgba(61,35,20,0.12)] flex flex-col items-center justify-center transition-all ${
                      isJustStamped ? 'animate-[bounce_0.4s_ease-out] ring-2 ring-[#DFAB56]' : ''
                    } stampy-stamp`}
                  >
                    <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(61,35,20,0.2)]">
                      {isFinalSlot ? '🎁' : stampIcon}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#682025] mt-0.5">
                      #{idx + 1}
                    </span>
                  </div>
                ) : (
                  // Empty Stamp Slot with Delicate Archival Dotted Gold Ring
                  <div className="w-full h-full rounded-2xl border-2 border-dashed border-[#DFAB56]/40 bg-white/50 shadow-inner flex flex-col items-center justify-center transition-all hover:border-[#DFAB56]/80 hover:bg-white/80">
                    <span className="text-xs font-mono font-bold text-[#DFAB56]/70">
                      {isFinalSlot ? '🎁' : idx + 1}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Segmented Gold Foil Progress Bar */}
        <div className="relative z-10 mt-4 pt-3.5 border-t border-[#DFAB56]/30">
          <div className="w-full h-2.5 bg-[#EFE2CC] rounded-full p-0.5 overflow-hidden shadow-inner">
            <div
              style={{
                width: `${Math.min(100, (stamps / maxSlots) * 100)}%`,
                backgroundColor: '#DFAB56',
              }}
              className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-[#C9933B] via-[#DFAB56] to-[#E5A836]"
            />
          </div>
        </div>

        {/* Milestone Reward Footer */}
        <div className="relative z-10 mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#3D2314] font-medium">
            <Gift className="w-4 h-4 text-[#682025]" />
            <span className="truncate max-w-[220px] font-bold">{rewardTitle}</span>
          </div>

          {isCompleted ? (
            <button
              onClick={handleOpenRedeem}
              className="px-4 py-2 bg-[#682025] hover:bg-[#52171B] active:scale-95 text-[#FAF5EB] font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <span>استلام المكافأة الآن</span>
              <span className="sr-only">Redeem Now</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[11px] font-mono text-[#8C6C52] font-semibold">
              {stampsRemaining} زيارات متبقية
            </span>
          )}
        </div>
      </div>

      {/* 4. 1-TAP SAVE TO APPLE & GOOGLE WALLET BUTTONS */}
      <div className="w-full mt-4 space-y-2.5">
        <div className="text-center text-[11px] font-medium text-[#6E4E38]">
          احفظ البطاقة في محفظة هاتفك للختم السريع وتنبيهات القرب:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Official Add to Apple Wallet Button */}
          <a
            href={appleWalletUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-[#1B1B1E] hover:bg-black active:scale-[0.98] text-[#FAF5EB] rounded-2xl shadow-sm hover:shadow-md flex items-center justify-center gap-2.5 transition-all text-xs font-bold border border-black/20"
          >
            {/* Apple Logo SVG */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.77-7.94-12.22-14.59-6.42-9.68-11.45-20.73-15.09-33.15-3.63-12.43-5.46-24.36-5.46-35.8 0-14.81 3.7-27.18 11.09-37.11 7.39-9.92 16.92-14.99 28.58-15.22 5.08 0 10.45 1.34 16.11 4.02 5.66 2.68 9.53 4.08 11.62 4.2 1.89-.22 5.73-1.63 11.5-4.22 5.78-2.6 11.05-3.86 15.82-3.8 11.22.45 20.47 4.7 27.73 12.76-9.82 5.92-14.62 14.21-14.4 24.87.22 8.27 3.38 15.22 9.48 20.85 6.1 5.64 13.32 8.87 21.66 9.71-2.12 6.53-4.8 13.06-8.04 19.59zM119.22 31.85c0-7.39 2.67-14.35 8.01-20.89 5.34-6.53 11.95-10.47 19.82-11.83.67 4.02.67 8.04 0 12.06-1.56 7.6-5.13 14.52-10.71 20.75-5.58 6.24-12.39 10.15-20.43 11.75-.45-3.92-.67-7.84-.69-11.84z" />
            </svg>
            <span>إضافة إلى Apple Wallet</span>
            <span className="sr-only">Add to Apple Wallet</span>
          </a>

          {/* Official Save to Google Wallet Button */}
          <a
            href={googleWalletUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-white hover:bg-stone-50 active:scale-[0.98] text-[#3D2314] rounded-2xl border border-stone-200 shadow-xs hover:shadow-sm flex items-center justify-center gap-2.5 transition-all text-xs font-bold"
          >
            {/* Google Multi-Color G Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>حفظ في Google Wallet</span>
            <span className="sr-only">Save to Google Wallet</span>
          </a>
        </div>
      </div>

      {/* 5. PHOTOBOOTH STRIP MEMORY STUDIO LINK & TV WALL BRIDGE */}
      {onOpenPhotoboothStudio && (
        <div className="w-full mt-3">
          <button
            onClick={onOpenPhotoboothStudio}
            className="w-full p-4 bg-[#FAF5EB] hover:bg-[#F5ECDC] border border-[#DFAB56]/40 rounded-2xl shadow-xs hover:shadow-md flex items-center justify-between text-xs font-bold text-[#3D2314] transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-[#682025] text-[#FAF5EB] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5 text-[#DFAB56]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-[#3D2314]">استوديو الصور الكورية (4-Cuts)</span>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#DFAB56]/20 text-[#682025] border border-[#DFAB56]/40">
                    +1 ختم مجاني
                  </span>
                </div>
                <div className="text-[11px] text-[#6E4E38]">
                  التقط شريط ذكرياتك وبثه على شاشة الصالة الآن 📺
                </div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#682025] font-bold bg-white px-3 py-1.5 rounded-xl border border-[#DFAB56]/40 shrink-0 shadow-2xs">
              فتح الاستوديو ←
            </span>
          </button>
        </div>
      )}

      {/* 5.1 KEEPSAKES ARCHIVE DIRECT LINK */}
      <div className="w-full mt-2.5">
        <Link
          href={`/c/${cafeSlug || 'stampy'}/keepsakes`}
          className="w-full p-3.5 bg-white/80 hover:bg-white border border-[#DFAB56]/40 rounded-2xl shadow-xs hover:shadow-sm flex items-center justify-between text-xs font-bold text-[#3D2314] transition-all group active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DFAB56]/20 text-[#682025] flex items-center justify-center">
              <Award className="w-4 h-4 text-[#682025]" />
            </div>
            <div className="text-right">
              <span className="font-bold text-xs text-[#3D2314] block">ألبوم الذكريات والأختام السابقة</span>
              <span className="text-[10px] text-[#6E4E38]">تصفح شرائط الصور المحفوظة والجوائز المستلمة</span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#682025] group-hover:translate-x-[-2px] transition-transform">
            عرض الألبوم ←
          </span>
        </Link>
      </div>

      {/* 6. INTERACTIVE TAP SIMULATOR (TESTER TOOLBAR) */}
      {(showSimulator ?? (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test')) && (
        <div className="w-full mt-4 p-3 bg-white/80 border border-dashed border-[#DFAB56]/60 rounded-2xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#3D2314]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#DFAB56] animate-ping" />
            <span>محاكي الختم التفاعلي (NFC):</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateTap}
              className="px-3.5 py-1.5 bg-[#682025] hover:bg-[#52171B] active:scale-95 text-[#FAF5EB] font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <span>+1 ختم تجريبي</span>
              <span className="sr-only">+1 Stamp Tap</span>
            </button>
            <button
              onClick={() => {
                setStamps(0);
                if (onResetStamps) onResetStamps();
              }}
              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-[#3D2314] rounded-xl border border-stone-200 transition-all cursor-pointer"
              title="إعادة ضبط الكارت"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 7. COUNTERFEIT-PROOF LIVE ANIMATED RECEIPT MODAL - Luxury Archival Certificate */}
      {isRedeemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#FAF5EB] border border-[#DFAB56]/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            {/* Gold Leaf Top Bar */}
            <div className="w-full -mt-6 -mx-6 mb-4 h-2 bg-gradient-to-r from-[#DFAB56] via-[#E5A836] to-[#682025]" />

            {/* Shield & Live Status */}
            <div className="w-12 h-12 rounded-2xl bg-[#DFAB56]/20 border border-[#DFAB56]/60 flex items-center justify-center text-[#682025] mb-2 shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#DFAB56]/15 text-[#682025] border border-[#DFAB56]/40 mb-2">
              إيصال استلام رسمي موثق
              <span className="sr-only">Verified Counterfeit-Proof Receipt</span>
            </span>

            <h3 className="text-xl font-black text-[#3D2314] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
              {brandName}
            </h3>
            <p className="text-xs text-[#6E4E38] mb-3">{activeBranch}</p>

            {/* LIVE SECOND TICKING CLOCK */}
            <div className="w-full p-4 bg-white/90 border border-[#DFAB56]/40 rounded-2xl shadow-xs my-2">
              <div className="text-[10px] uppercase font-bold text-[#8C6C52] flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-[#682025]" />
                <span>ساعة التحقق الحية</span>
                <span className="sr-only">Live Verification Clock</span>
              </div>
              <div className="text-2xl font-black font-mono text-[#682025] tracking-wider mt-0.5">
                {liveReceiptTime || '14:28:09.12'}
              </div>
              <div className="text-[9px] font-mono text-stone-500 mt-1">
                رمز الحماية ضد لقطات الشاشة: <strong className="text-[#3D2314]">{redeemNonce}</strong>
                <span className="sr-only">Anti-screenshot security token: {redeemNonce}</span>
              </div>
            </div>

            {/* Reward Summary */}
            <div className="w-full my-3 p-3.5 bg-white/60 border border-[#DFAB56]/30 rounded-2xl text-right">
              <div className="text-[10px] uppercase font-bold text-[#682025]">المكافأة المستحقة:</div>
              <div className="text-sm font-black text-[#3D2314]">{rewardTitle}</div>
              <div className="text-[10px] text-[#6E4E38]">أظهر هذه الشاشة للكاشير أو الباريستا عند الاستلام</div>
            </div>

            {/* Barista Confirmation Button */}
            {hasRedeemed ? (
              <div className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم تأكيد الاستلام بنجاح! جاري تجديد الكارت...</span>
              </div>
            ) : (
              <div className="w-full space-y-2">
                <button
                  onClick={handleConfirmRedemption}
                  className="w-full py-3.5 bg-[#682025] hover:bg-[#52171B] active:scale-95 text-[#FAF5EB] font-bold rounded-2xl shadow-md text-xs cursor-pointer transition-all"
                >
                  <span>تأكيد الاستلام بواسطة الكاشير / الباريستا</span>
                  <span className="sr-only">Barista Tap: Confirm Redemption</span>
                </button>
                <button
                  onClick={() => setIsRedeemModalOpen(false)}
                  className="w-full py-2 bg-transparent text-stone-500 hover:text-[#3D2314] font-medium text-xs cursor-pointer"
                >
                  إغلاق الإيصال
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
