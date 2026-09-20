'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Sparkles, CheckCircle2, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface CameraViewfinderProps {
  targetShotCount: number;
  onCaptureComplete: (photos: string[]) => void;
  brandName?: string;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  targetShotCount,
  onCaptureComplete,
  brandName = 'Memories',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [isShootingSequence, setIsShootingSequence] = useState(false);
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play audio beep via Web Audio API
  const playBeep = useCallback(
    (freq = 800, duration = 0.1) => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // audio context blocked or not supported
      }
    },
    [soundEnabled]
  );

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setIsCameraReady(false);
    setCameraError(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
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
      setCameraError('يرجى السماح بالوصول إلى الكاميرا لالتقاط لحظاتك الحية.');
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

  // Capture single frame from video element
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const size = Math.min(video.videoWidth || 720, video.videoHeight || 720);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    // Flip horizontally if front camera for natural mirror feel
    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    return canvas.toDataURL('image/jpeg', 0.92);
  }, [facingMode]);

  // Execute burst sequence
  const startSequence = async () => {
    if (!isCameraReady || isShootingSequence) return;

    setCapturedPhotos([]);
    setIsShootingSequence(true);
    const photos: string[] = [];

    for (let shot = 0; shot < targetShotCount; shot++) {
      setCurrentShotIndex(shot + 1);

      // 3-second countdown
      for (let c = 3; c > 0; c--) {
        setCountdown(c);
        playBeep(650, 0.08);
        await new Promise((r) => setTimeout(r, 900));
      }

      // Flash & Snap!
      setCountdown(null);
      setIsFlashing(true);
      playBeep(1200, 0.2);

      const photo = captureFrame();
      if (photo) {
        photos.push(photo);
        setCapturedPhotos([...photos]);
      }

      await new Promise((r) => setTimeout(r, 250));
      setIsFlashing(false);

      // Short breathing pause between shots if more shots remain
      if (shot < targetShotCount - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setIsShootingSequence(false);
  };

  const handleRetake = () => {
    setCapturedPhotos([]);
    setCurrentShotIndex(0);
    setCountdown(null);
  };

  const handleConfirm = () => {
    if (capturedPhotos.length > 0) {
      onCaptureComplete(capturedPhotos);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none">
      {/* Viewfinder Frame Container */}
      <div className="relative w-full aspect-square bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-stone-100 ring-1 ring-stone-200">
        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live WebRTC Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
        />

        {/* Shutter White Flash Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-300 pointer-events-none" />
        )}

        {/* Camera Loading or Error State */}
        {!isCameraReady && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 backdrop-blur-sm text-white p-6 text-center">
            <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mb-3" />
            <p className="font-semibold text-lg">جاري تشغيل كاميرا الاستوديو...</p>
            <p className="text-stone-400 text-xs mt-1">تأكد من إعطاء إذن الكاميرا</p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 text-white p-6 text-center">
            <Camera className="w-12 h-12 text-rose-500 mb-3" />
            <p className="font-bold text-rose-400 text-sm leading-relaxed">{cameraError}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-full text-xs font-bold transition flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> إعادة المحاولة
            </button>
          </div>
        )}

        {/* Studio Viewfinder Guides */}
        {isCameraReady && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Viewfinder crosshairs / corner brackets */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br" />

            {/* Live Indicator */}
            <div className="absolute top-4 inset-x-0 flex justify-center">
              <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full flex items-center gap-2 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[11px] font-bold text-white tracking-wide uppercase">
                  LIVE PHOTOBOOTH
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Animated Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-40">
            <span className="text-8xl font-black text-amber-400 drop-shadow-[0_4px_24px_rgba(245,158,11,0.8)] animate-ping">
              {countdown}
            </span>
            <div className="mt-4 px-4 py-1.5 bg-black/70 rounded-full text-white text-xs font-bold border border-white/20">
              اللقطة {currentShotIndex} من {targetShotCount}
            </div>
          </div>
        )}

        {/* Floating Controls (Camera Flip & Sound) */}
        {isCameraReady && !isShootingSequence && capturedPhotos.length === 0 && (
          <div className="absolute bottom-4 inset-x-4 flex justify-between items-center z-30 pointer-events-auto">
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:text-white flex items-center justify-center border border-white/20 hover:scale-105 transition"
              title="كتم / تفعيل الصوت"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleCamera}
              className="px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:text-white flex items-center gap-1.5 text-xs font-medium border border-white/20 hover:scale-105 transition"
              title="تبديل الكاميرا الأمامية/الخلفية"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>قلب الكاميرا</span>
            </button>
          </div>
        )}
      </div>

      {/* Captured Thumbnails Bar */}
      {capturedPhotos.length > 0 && (
        <div className="w-full mt-4 flex items-center justify-center gap-2 p-2 bg-stone-100 rounded-2xl border border-stone-200">
          {Array.from({ length: targetShotCount }).map((_, idx) => {
            const photo = capturedPhotos[idx];
            return (
              <div
                key={idx}
                className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-stone-300 bg-stone-200 flex items-center justify-center shadow-sm"
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt={`Shot ${idx + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-stone-400">{idx + 1}</span>
                )}
                {photo && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Trigger Buttons */}
      <div className="w-full mt-5">
        {capturedPhotos.length === 0 ? (
          <button
            onClick={startSequence}
            disabled={!isCameraReady || isShootingSequence}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 hover:from-black hover:to-stone-900 text-white font-bold text-base shadow-xl hover:shadow-2xl active:scale-[0.98] transition flex items-center justify-center gap-3 border border-stone-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Camera className="w-5 h-5 text-amber-400" />
            <span>
              {isShootingSequence
                ? `جاري التقاط اللقطة ${currentShotIndex} من ${targetShotCount}...`
                : `ابدأ التصوير (${targetShotCount} لقطات متتالية)`}
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm border border-stone-300 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة التصوير</span>
            </button>
            <button
              onClick={handleConfirm}
              className="flex-[2] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>اعتماد الصور واختيار الإطار</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-stone-500 mt-3 font-medium text-center">
        🔒 تجربة فوتوبوث حية 100% داخل المكان • {brandName}
      </p>
    </div>
  );
};
