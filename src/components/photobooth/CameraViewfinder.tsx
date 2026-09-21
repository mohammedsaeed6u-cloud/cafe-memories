'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, RotateCcw, Volume2, VolumeX } from 'lucide-react';

export type CameraFilterMode = 'natural' | 'espresso' | 'noir' | 'fade';

interface CameraViewfinderProps {
  onCaptureComplete: (photo: string) => void;
  brandName?: string;
  visitNumber?: number;
  aspectRatioGuide?: '3:4' | '4:3' | '1:1' | '16:9';
}

const FILTER_PRESETS: {
  id: CameraFilterMode;
  nameAr: string;
  nameEn: string;
  cssFilter: string;
  canvasFilter: string;
}[] = [
  {
    id: 'natural',
    nameAr: 'طبيعي',
    nameEn: 'Natural',
    cssFilter: 'contrast(1.02) saturate(1.0)',
    canvasFilter: 'contrast(102%) saturate(100%)',
  },
  {
    id: 'espresso',
    nameAr: 'إسبريسو دافئ',
    nameEn: 'Warm Espresso',
    cssFilter: 'sepia(0.22) saturate(1.18) contrast(1.05)',
    canvasFilter: 'sepia(22%) saturate(118%) contrast(105%)',
  },
  {
    id: 'noir',
    nameAr: 'نوار كوري',
    nameEn: 'Seoul Noir',
    cssFilter: 'grayscale(1) contrast(1.22)',
    canvasFilter: 'grayscale(100%) contrast(122%)',
  },
  {
    id: 'fade',
    nameAr: 'فيلم باهت',
    nameEn: 'Film Fade',
    cssFilter: 'contrast(0.96) brightness(1.06) saturate(0.85) sepia(0.12)',
    canvasFilter: 'contrast(96%) brightness(106%) saturate(85%) sepia(12%)',
  },
];

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onCaptureComplete,
  brandName = 'Memories',
  visitNumber = 1,
  aspectRatioGuide = '3:4',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<CameraFilterMode>('espresso');
  const [isShooting, setIsShooting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Synthesized mechanical shutter sound via Web Audio API
  const playShutterSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1400, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.05);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(600, ctx.currentTime + 0.07);
      osc2.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.14);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.07);
      osc2.stop(ctx.currentTime + 0.14);
    } catch {
      // Audio context blocked
    }
  }, [soundEnabled]);

  // Countdown beep
  const playCountdownBeep = useCallback((freq = 880) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context blocked
    }
  }, [soundEnabled]);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setIsCameraReady(false);
    setCameraError(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1440 },
          height: { ideal: 1440 },
          aspectRatio: { ideal: 1 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('يرجى السماح بالوصول إلى الكاميرا لالتقاط صورة زيارتك.');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  // Capture single frame with active filter applied
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const size = Math.min(video.videoWidth || 1080, video.videoHeight || 1080);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const currentFilter = FILTER_PRESETS.find((f) => f.id === activeFilter) || FILTER_PRESETS[0];

    try {
      ctx.filter = currentFilter.canvasFilter;
    } catch {
      // Browser does not support ctx.filter
    }

    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    return canvas.toDataURL('image/jpeg', 0.94);
  }, [facingMode, activeFilter]);

  // Take the single photo of this visit
  const handleSnap = async () => {
    if (!isCameraReady || isShooting) return;

    setIsShooting(true);

    // 3-second countdown
    for (let c = 3; c > 0; c--) {
      setCountdown(c);
      playCountdownBeep(c === 1 ? 980 : 780);
      await new Promise((r) => setTimeout(r, 900));
    }

    // Flash & Shutter
    setCountdown(null);
    setIsFlashing(true);
    playShutterSound();

    const photo = captureFrame();
    if (photo) {
      setCapturedPhoto(photo);
    }

    await new Promise((r) => setTimeout(r, 220));
    setIsFlashing(false);
    setIsShooting(false);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCountdown(null);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCaptureComplete(capturedPhoto);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const currentFilterObj = FILTER_PRESETS.find((f) => f.id === activeFilter) || FILTER_PRESETS[0];

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none font-sans">
      {/* Viewfinder Frame Container */}
      <div className="relative w-full aspect-square bg-stone-950 rounded-2xl overflow-hidden shadow-2xl border border-stone-800">
        <canvas ref={canvasRef} className="hidden" />

        {/* Video feed or captured photo preview */}
        {capturedPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedPhoto}
            alt="Captured Visit"
            className="w-full h-full object-cover animate-in fade-in duration-200"
          />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{ filter: currentFilterObj.cssFilter }}
            className={`w-full h-full object-cover transition-all duration-300 ${
              facingMode === 'user' ? '-scale-x-100' : ''
            }`}
          />
        )}

        {/* White Xenon Studio Flash Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200 opacity-100" />
        )}

        {/* Loading / Error */}
        {!isCameraReady && !cameraError && !capturedPhoto && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 text-white p-6 text-center">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <p className="font-semibold text-base">جاري تشغيل كاميرا الاستوديو...</p>
            <p className="text-stone-400 text-xs mt-1">تأكد من إعطاء إذن الكاميرا</p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 text-white p-6 text-center">
            <Camera className="w-10 h-10 text-rose-500 mb-3" />
            <p className="font-bold text-rose-400 text-sm leading-relaxed">{cameraError}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-full text-xs font-bold transition flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> إعادة المحاولة
            </button>
          </div>
        )}

        {/* Leica M Viewfinder Brackets & Framing Guide */}
        {isCameraReady && !capturedPhoto && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {/* 4 Corner Frameline Brackets */}
            <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-xs" />
            <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-xs" />
            <div className="absolute bottom-16 left-5 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-xs" />
            <div className="absolute bottom-16 right-5 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-xs" />

            {/* Subtle Center Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-4 h-[1px] bg-white" />
              <div className="h-4 w-[1px] bg-white absolute" />
            </div>

            {/* Top Status Pill */}
            <div className="absolute top-4 inset-x-0 flex justify-center">
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full flex items-center gap-2 border border-white/15">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-white tracking-widest uppercase">
                  SHOT #{String(visitNumber).padStart(2, '0')} ✦ LEICA FRAME
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-40">
            <span
              key={countdown}
              className="text-8xl font-black text-amber-400 drop-shadow-[0_4px_24px_rgba(245,158,11,0.8)] scale-100 animate-in zoom-in-50 duration-200"
            >
              {countdown}
            </span>
            <div className="mt-4 px-4 py-1.5 bg-black/80 rounded-full text-white text-xs font-bold border border-white/20">
              ✦ استعد للقطة
            </div>
          </div>
        )}

        {/* Filter Selection Bar & Utility Controls */}
        {isCameraReady && !isShooting && !capturedPhoto && (
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-30 pointer-events-auto">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/15">
              {FILTER_PRESETS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    activeFilter === filter.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {filter.nameAr}
                </button>
              ))}
            </div>

            {/* Camera Switch & Mute */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled((v) => !v)}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white/90 hover:text-white flex items-center justify-center border border-white/15 hover:scale-105 transition"
                title="كتم / تفعيل الصوت"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={toggleCamera}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white/90 hover:text-white flex items-center justify-center border border-white/15 hover:scale-105 transition"
                title="تبديل الكاميرا"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full mt-4">
        {!capturedPhoto ? (
          <div className="flex flex-col items-center">
            <button
              onClick={handleSnap}
              disabled={!isCameraReady || isShooting}
              className="group relative w-18 h-18 rounded-full bg-stone-100 hover:bg-white flex items-center justify-center shadow-xl active:scale-95 transition-all border-[5px] border-stone-300 disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-b from-stone-900 to-stone-800 flex items-center justify-center shadow-inner group-hover:from-black group-hover:to-stone-900 transition-colors">
                <Camera className="w-5 h-5 text-amber-400" />
              </div>
            </button>
            <span className="text-[11px] font-bold text-stone-500 mt-2">
              {isShooting ? 'جاري التقاط اللقطة...' : 'اضغط لالتقاط اللقطة الحية'}
            </span>
          </div>
        ) : (
          <div className="flex gap-2.5">
            <button
              onClick={handleRetake}
              className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs border border-stone-300 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة اللقطة</span>
            </button>
            <button
              onClick={handleConfirm}
              className="flex-[2] py-3 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>اعتماد اللقطة وإضافتها للكارت</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-[10px] text-stone-400 mt-3 font-mono text-center">
        ✦ لقطة حية موثقة لكل زيارة لاكتمال كارت ذكرياتك • {brandName}
      </p>
    </div>
  );
};
