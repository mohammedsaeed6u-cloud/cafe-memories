'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  X,
  FlipHorizontal,
  Zap,
  ZapOff,
  AlertCircle,
  ScanLine,
  Keyboard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { reportIgnoredError } from '@/lib/services/diagnostics';

interface TerminalBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedQuery: string) => void;
  autoStampEnabled?: boolean;
}

/**
 * Extracts phone or voucher code from scanned QR/barcode string or URL.
 */
export function extractCustomerIdentifierFromScan(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  // 1. Direct Voucher Code pattern (e.g. GIFT-1234 or VOUCHER-...)
  if (/^GIFT-[A-Z0-9]+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // 2. URL parsing (e.g. https://.../customer?cafe=memories&customer=01012345678)
  try {
    if (trimmed.includes('://') || trimmed.startsWith('/')) {
      const url = new URL(trimmed, 'https://stampy.app');
      const paramCustomer = url.searchParams.get('customer') || url.searchParams.get('phone') || url.searchParams.get('voucher');
      if (paramCustomer) {
        return paramCustomer.trim();
      }
      // Check pathname segments
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      if (last && /^01[0-9]{9}$/.test(last.replace(/[^0-9]/g, ''))) {
        return last.replace(/[^0-9]/g, '');
      }
    }
  } catch (e) {
    reportIgnoredError('scanner/url_parse', e);
  }

  // 3. Digits extraction (e.g. phone number like 01012345678 or +201012345678)
  const cleanDigits = trimmed.replace(/[^0-9]/g, '');
  if (cleanDigits.length >= 8) {
    return cleanDigits;
  }

  // 4. Return raw trimmed query as fallback
  return trimmed;
}

export function TerminalBarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  autoStampEnabled = false,
}: TerminalBarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          reportIgnoredError('terminal/scanner#track_stop', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setIsScanning(false);
  }, []);

  // Handle successful scan
  const handleDecoded = useCallback((rawValue: string) => {
    const extracted = extractCustomerIdentifierFromScan(rawValue);
    if (!extracted) return;

    SoundEffectsService.playScanBeep();
    stopCamera();
    onScan(extracted);
  }, [onScan, stopCamera]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('المتصفح أو الجهاز لا يدعم الوصول المباشر لكاميرا الويب.');
      return;
    }

    try {
      // Check available devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch (e) {
        reportIgnoredError('terminal/scanner#devices', e);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((err) => {
          reportIgnoredError('terminal/scanner#video_play', err);
        });
      }

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities?.() as any) || {};
        setHasTorch(Boolean(capabilities.torch));
      }

      setIsScanning(true);

      // Setup BarcodeDetector if available
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      if (BarcodeDetectorClass) {
        try {
          const detector = new BarcodeDetectorClass({
            formats: ['qr_code', 'code_128', 'pdf417', 'aztec', 'data_matrix', 'ean_13', 'upc_a'],
          });

          scanIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                handleDecoded(barcodes[0].rawValue);
              }
            } catch (err) {
              reportIgnoredError('terminal/scanner#detect', err);
            }
          }, 120);
        } catch (e) {
          reportIgnoredError('terminal/scanner#initDetector', e);
        }
      }
    } catch (err: any) {
      console.warn('Failed to access camera for scanner:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('تم رفض إذن الكاميرا. يرجى السماح بالوصول للكاميرا أو إدخال الكود يدويًا.');
      } else {
        setCameraError('تعذر فتح الكاميرا. يمكنك استخدام الإدخال اليدوي أو مسدس الباركود.');
      }
    }
  }, [facingMode, handleDecoded, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Toggle torch / flash
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (err) {
        console.warn('Failed to toggle torch', err);
      }
    }
  };

  // Flip camera between front and back
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Manual submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecoded(manualInput);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#231C18] border border-amber-600/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between gap-3 bg-[#1C1613]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  مسح كارت المحفظة (Apple & Google)
                </h3>
                {autoStampEnabled && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider animate-bounce">
                    ختم فوري ⚡
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                وجّه الكاميرا نحو باركود شاشة هاتف العميل لمسحه فوراً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center space-y-3 max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-stone-300 leading-relaxed font-bold">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl border-2 border-amber-400/80 shadow-[0_0_20px_rgba(217,119,6,0.35)] overflow-hidden flex items-center justify-center">
                  {/* Corner accents */}
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-2xl" />
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-2xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-2xl" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-2xl" />

                  {/* Laser Scan line animation */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b] animate-[bounce_2s_infinite]" />
                </div>
              </div>

              {/* Viewfinder Controls (Torch, Flip) */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                      torchOn ? 'bg-amber-500 text-black' : 'bg-black/60 text-white hover:bg-black/80'
                    }`}
                  >
                    {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                    <span>{torchOn ? 'إطفاء الفلاش' : 'تشغيل الفلاش'}</span>
                  </button>
                )}

                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer mr-auto"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    <span>تبديل الكاميرا</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom Fallback Manual Entry & Guidance */}
        <div className="p-4 sm:p-5 bg-[#1C1613] border-t border-stone-800 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                dir="ltr"
                placeholder="أو أدخل رقم الجوال / كود الهدية يدويًا"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full py-2.5 px-3.5 pr-9 rounded-xl bg-stone-900 border border-stone-700 focus:border-amber-500 focus:outline-none text-white text-xs sm:text-sm font-mono tracking-wider placeholder:text-stone-500"
              />
              <Keyboard className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={!manualInput.trim()}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
                manualInput.trim()
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              <span>اعتماد</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>يدعم مسح كروت المحفظة وبطاقات الـ QR والباركود العادي</span>
            </span>
            <span className="font-mono text-stone-500">POS QUICK SCAN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
