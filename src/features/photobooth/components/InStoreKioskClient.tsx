'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Sparkles,
  RefreshCw,
  Tv,
  CheckCircle2,
  Gift,
  ArrowRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { EventOrchestratorService } from '@/lib/services/event-orchestrator.service';
import { WallFeedService } from '@/lib/services/wall-feed.service';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { PhotoboothResponsiveCard } from '@/features/photobooth/PhotoboothResponsiveCard';
import { CUSTOMER_STUDIO_THEME_PILLS } from '@/features/photobooth/customer-studio-presets';
import { PhotoboothCardMode } from '@/types/photobooth';
import { DEFAULT_PHOTOBOOTH_FRAMES } from '@/lib/constants/photobooth-frames';

interface InStoreKioskClientProps {
  cafeSlug: string;
}

type KioskStep = 'attract' | 'shooting' | 'styling' | 'completed';

// High-resolution sample poses for Korean 4-Cuts kiosk simulation
const SAMPLE_POSES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
];

export function InStoreKioskClient({ cafeSlug }: InStoreKioskClientProps) {
  const [step, setStep] = useState<KioskStep>('attract');
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [cardMode, setCardMode] = useState<PhotoboothCardMode>('korean_noir');
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [guestName, setGuestName] = useState('أصدقاء المكان');
  const [resetTimer, setResetTimer] = useState<number>(45);

  const settings = BusinessSettingsService.getSettings(cafeSlug);
  const brandName = settings?.branding?.name || 'Memories Studio';
  const brandColor = settings?.walletPassConfig?.colorHex || '#DFAB56';

  // Toggle Kiosk Fullscreen Mode for iPad / Tablet Stand
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Start shooting sequence
  const handleStartSession = () => {
    setCapturedPhotos([]);
    setCurrentSlotIndex(0);
    setStep('shooting');
    if (!isSoundMuted) SoundEffectsService.playStampChime();
    startCountdownForSlot(0);
  };

  // Countdown timer for individual shots
  const startCountdownForSlot = (slotIdx: number) => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          triggerShotCapture(slotIdx);
          return null;
        }
        if (!isSoundMuted) SoundEffectsService.playStampChime();
        return prev - 1;
      });
    }, 1000);
  };

  // Capture single shot with camera flash
  const triggerShotCapture = (slotIdx: number) => {
    setIsShutterFlashing(true);
    if (!isSoundMuted) SoundEffectsService.playRewardCelebration();

    setTimeout(() => {
      setIsShutterFlashing(false);
      const newPhoto = SAMPLE_POSES[slotIdx % SAMPLE_POSES.length];
      setCapturedPhotos((prev) => {
        const next = [...prev, newPhoto];
        if (next.length < 4) {
          setCurrentSlotIndex(next.length);
          setTimeout(() => startCountdownForSlot(next.length), 1200);
        } else {
          // Finished all 4 shots -> go to styling
          setTimeout(() => setStep('styling'), 800);
        }
        return next;
      });
    }, 350);
  };

  // Publish to 4K Live Wall & show completion QR
  const handleCastAndFinish = () => {
    const primaryPhoto = capturedPhotos[0] || SAMPLE_POSES[0];
    const timestamp = new Date().toISOString();

    // 1. Broadcast to Live Wall Feed
    WallFeedService.publishWallItem(cafeSlug, {
      customerName: guestName,
      photoUrl: primaryPhoto,
      caption: `التقطت للتو في كشك ${brandName} 📸✨`,
      timeFormatted: 'الآن',
      visitNumber: 1,
      createdAt: timestamp,
      visibility: 'live_wall',
      status: 'approved',
    });

    // 2. Authoritative Event Orchestrator
    EventOrchestratorService.dispatch(
      'PHOTO_CASTED',
      {
        memoryId: 'kiosk_' + Date.now(),
        customerName: guestName,
        photoUrl: primaryPhoto,
        caption: `التقطت للتو في كشك ${brandName} 📸✨`,
        visitNumber: 1,
        cafeSlug,
        timestamp,
        source: 'kiosk_ipad',
      },
      cafeSlug
    );

    if (!isSoundMuted) SoundEffectsService.playRewardCelebration();
    setStep('completed');
    setResetTimer(45);
  };

  // Countdown timer on completed screen before returning to attract mode
  useEffect(() => {
    if (step !== 'completed') return;
    const timer = setInterval(() => {
      setResetTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStep('attract');
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  return (
    <div className="min-h-screen w-full bg-[#0F0E0E] text-[#FBF9F5] flex flex-col justify-between select-none relative overflow-hidden font-sans">
      {/* Shutter Camera Flash Overlay */}
      {isShutterFlashing && (
        <div className="fixed inset-0 z-50 bg-white animate-[fadeOut_0.35s_ease-out] pointer-events-none" />
      )}

      {/* Top Kiosk Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between z-20 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: brandColor }}
            className="w-10 h-10 rounded-2xl border-2 border-white/20 flex items-center justify-center font-black text-lg text-white shadow-lg"
          >
            {brandName.charAt(0)}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wide uppercase font-['Plus_Jakarta_Sans',sans-serif]">
              {brandName}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#DFAB56] font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>KOREAN 4-CUTS KIOSK • كشك الصالة</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const next = !isSoundMuted;
              setIsSoundMuted(next);
              SoundEffectsService.setMuted(next);
            }}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition active:scale-95"
            title={isSoundMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isSoundMuted ? <VolumeX className="w-5 h-5 text-stone-400" /> : <Volume2 className="w-5 h-5 text-[#DFAB56]" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition active:scale-95"
            title="ملء الشاشة"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Kiosk Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 z-10 w-full max-w-5xl mx-auto">
        {/* 1. ATTRACT SCREEN (Touch to Start) */}
        {step === 'attract' && (
          <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative inline-block">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#DFAB56] via-[#682025] to-[#DFAB56] p-1 animate-pulse shadow-[0_0_50px_rgba(223,171,86,0.4)]">
                <div className="w-full h-full rounded-full bg-[#1A1818] flex items-center justify-center text-white">
                  <Camera className="w-14 h-14 sm:w-18 sm:h-18 text-[#DFAB56] animate-bounce" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs sm:text-sm font-mono tracking-widest text-[#DFAB56] uppercase px-4 py-1.5 rounded-full bg-[#682025]/80 border border-[#DFAB56]/40">
                LIFE FOUR CUTS • كشك التصوير الكوري
              </span>
              <h2
                style={{ fontFamily: 'var(--font-head), Plus Jakarta Sans, sans-serif' }}
                className="text-3xl sm:text-5xl font-black text-[#FAF5EB] leading-tight"
              >
                التقط شريط ذكرياتك 4-Cuts
              </h2>
              <p className="text-sm sm:text-base text-stone-400 max-w-md mx-auto">
                4 وضعيات مع أصدقائك، ثيمات سينمائية، بث فوري على شاشة الصالة، وختم مجاني في Apple Wallet!
              </p>
            </div>

            {/* Tap to Start Action Button */}
            <button
              onClick={handleStartSession}
              className="py-5 px-10 rounded-3xl bg-[#682025] hover:bg-[#52171B] text-[#FAF5EB] text-xl sm:text-2xl font-black tracking-wide shadow-[0_20px_40px_rgba(104,32,37,0.5)] border-2 border-[#DFAB56]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3 mx-auto"
            >
              <Sparkles className="w-6 h-6 text-[#DFAB56] animate-spin" />
              <span>المس الشاشة للبدء • TAP TO START</span>
            </button>
          </div>
        )}

        {/* 2. SHOOTING COUNTDOWN & CAPTURE */}
        {step === 'shooting' && (
          <div className="w-full max-w-2xl text-center space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-4">
              <span className="text-sm font-mono font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/40">
                اللقطة {currentSlotIndex + 1} من 4
              </span>
              <span className="text-xs font-mono text-stone-400">
                استعد وابتسم للكاميرا! 📸
              </span>
            </div>

            {/* Viewfinder Window */}
            <div className="relative aspect-[3/4] max-h-[55vh] mx-auto rounded-3xl overflow-hidden border-4 border-white/20 bg-stone-900 shadow-2xl flex items-center justify-center">
              {/* Photo preview or simulated live camera stream */}
              <img
                src={SAMPLE_POSES[currentSlotIndex % SAMPLE_POSES.length]}
                alt="Camera Stream"
                className="w-full h-full object-cover"
              />

              {/* Big Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                  <span className="text-8xl sm:text-9xl font-black text-amber-300 animate-ping font-mono drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                    {countdown}
                  </span>
                </div>
              )}
            </div>

            {/* Small Thumbnails of Taken Shots */}
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {[0, 1, 2, 3].map((idx) => {
                const photo = capturedPhotos[idx];
                return (
                  <div
                    key={idx}
                    className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                      photo
                        ? 'border-emerald-400 shadow-md'
                        : idx === currentSlotIndex
                        ? 'border-amber-400 animate-pulse bg-white/5'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {photo ? (
                      <img src={photo} alt={`Shot ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-mono text-stone-500">
                        #{idx + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. STYLING & THEME SELECTION */}
        {step === 'styling' && (
          <div className="w-full max-w-3xl flex flex-col md:flex-row items-center justify-center gap-8 animate-in fade-in duration-300">
            {/* Strip Preview Card */}
            <div className="shrink-0 scale-90 sm:scale-100 origin-center">
              <PhotoboothResponsiveCard
                photos={capturedPhotos}
                frame={{
                  ...DEFAULT_PHOTOBOOTH_FRAMES[0],
                  id: 'kiosk-strip',
                  name: 'Kiosk 4-Cuts',
                  dimensionsPreset: 'strip_2x6',
                  widthCm: 5,
                  heightCm: 15,
                  shotCount: 4,
                  cardMode,
                  bgColor: '#FFFFFF',
                }}
                cardMode={cardMode}
                branding={settings.branding}
                freeGiftOffer={settings.freeGiftOffer}
                stickers={[]}
                dimensionPreset="strip_2x6"
              />
            </div>

            {/* Controls Side */}
            <div className="space-y-6 text-right w-full max-w-md">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-[#FBF9F5]">
                  اختر طابع شريط الذكريات
                </h3>
                <p className="text-xs text-stone-400">
                  حدد مظهر الكارت الذي سيبث على شاشة الصالة الآن
                </p>
              </div>

              {/* Theme Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {CUSTOMER_STUDIO_THEME_PILLS.map((mode) => {
                  const isActive = cardMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setCardMode(mode.id as PhotoboothCardMode)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-[#F0456A] text-white border-white/40 shadow-lg scale-102'
                          : 'bg-white/5 hover:bg-white/10 text-stone-300 border-white/10'
                      }`}
                    >
                      <span className="text-lg">{mode.icon}</span>
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Guest Name input */}
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">
                  اسمك أو اسم مجموعتك للشاشة:
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm focus:border-amber-400 focus:outline-none"
                  placeholder="مثال: سارة ونورة"
                />
              </div>

              {/* Action Button: Broadcast to Wall */}
              <button
                onClick={handleCastAndFinish}
                className="w-full py-4 px-6 rounded-2xl bg-[#10B981] hover:bg-[#059669] active:scale-[0.98] text-white font-black text-lg shadow-[0_10px_30px_rgba(16,185,129,0.4)] border border-white/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Tv className="w-5 h-5 text-white" />
                <span>بث على شاشة الصالة والحفظ ✨</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. COMPLETED & QR GRAB SCREEN */}
        {step === 'completed' && (
          <div className="text-center space-y-6 max-w-lg p-8 rounded-3xl bg-[#141212] border-2 border-emerald-500/50 shadow-2xl animate-in zoom-in-95 duration-400">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                تم بث صورتك على الشاشة الكبيرة! 📺✨
              </h2>
              <p className="text-xs sm:text-sm text-stone-300">
                انظر إلى شاشة الصالة الآن! ولحفظ شريطك في هاتفك واكتساب ختمك المجاني في Apple Wallet:
              </p>
            </div>

            {/* QR Code Standee */}
            <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex flex-col items-center justify-center shadow-xl border-4 border-amber-400">
              <RealOutsourcedQr
                value={`https://memories-c9w.pages.dev/c/${cafeSlug}?source=kiosk_completed`}
                size={160}
                alt="Claim Kiosk Strip & Pass"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-black text-amber-400 tracking-wider uppercase block">
                SCAN WITH PHONE CAMERA • امسح بكاميرا هاتفك
              </span>
              <span className="text-[11px] text-stone-400 block">
                تحميل شريط 300 DPI + كارت Apple & Google Wallet + 1 ختم مجاني 🎁
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-stone-500 font-mono border-t border-white/10">
              <span>ستتم إعادة الضبط تلقائياً خلال {resetTimer}ث</span>
              <button
                onClick={() => setStep('attract')}
                className="text-amber-400 hover:underline font-bold"
              >
                جلسة جديدة الآن
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Kiosk Footer */}
      <footer className="p-4 text-center text-xs text-stone-500 font-mono border-t border-white/10 bg-black/40">
        <span>Stampy In-Store OS • Kiosk Node Active</span>
      </footer>
    </div>
  );
}
