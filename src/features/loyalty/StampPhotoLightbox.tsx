'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Upload, Camera, Sparkles, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { CardImageService } from '@/lib/services/card-image.service';

function isHttpOrDataUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.startsWith('data:image/')) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

interface StampPhotoLightboxProps {
  imageUrl: string | null;
  stampNumber: number | null;
  onClose: () => void;
  brandName: string;
  onManualSubmit: (url: string) => void;
}

/**
 * World-class photo lightbox for loyalty card stamps.
 * Allows viewing the photo in high resolution, or capturing/uploading
 * a memory directly for that stamp slot with instant client-side compression.
 */
export const StampPhotoLightbox: React.FC<StampPhotoLightboxProps> = ({
  imageUrl,
  stampNumber,
  onClose,
  brandName,
  onManualSubmit,
}) => {
  const [manualUrl, setManualUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (imageUrl) {
      setManualUrl('');
      setShowUrlFallback(false);
    }
  }, [imageUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const compressed = await CardImageService.compressAndCropImage(file, {
        maxWidth: 1080,
        maxHeight: 1440,
        quality: 0.85,
        format: 'image/jpeg',
      });
      onManualSubmit(compressed.dataUrl);
    } catch (err) {
      console.warn('Failed to compress stamp photo:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!imageUrl && !stampNumber) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={imageUrl ? `صورة الختم ${stampNumber}` : 'إضافة صورة للختم'}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 animate-in fade-in"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="إغلاق الصورة"
        className="absolute top-5 left-5 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-stone-800 flex items-center justify-center transition cursor-pointer border border-[rgba(255,255,255,0.1)] shadow-lg active:scale-95"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {imageUrl ? (
          <div className="space-y-4 animate-in zoom-in-95">
            <div className="relative rounded-3xl overflow-hidden border-2 border-amber-300/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] bg-stone-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`صورة الختم ${stampNumber} في ${brandName}`}
                className="w-full max-h-[75vh] object-contain rounded-3xl"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent p-4 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-bold font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>الختم {stampNumber} • {brandName}</span>
                </span>
              </div>
            </div>
            <p className="text-center text-stone-300 text-xs font-medium">
              ذكرى موثقة في بطاقة ولائك ☕✨
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-7 bg-[#141212] border border-[rgba(255,255,255,0.1)] rounded-3xl space-y-4 shadow-2xl text-[#FBF9F5] animate-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
                <Camera className="w-6 h-6 text-amber-800" />
              </div>
              <h3 className="text-base font-bold text-[#FBF9F5]">
                توثيق صورة للختم رقم {stampNumber}
              </h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                كل ختم في كارتك يرتبط بلحظة حقيقية من زيارتك لـ {brandName}
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FBF9F5] hover:bg-[#382D27] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-98"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>جاري معالجة الصورة...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-amber-300" />
                    <span>رفع صورة أو التقاط سيلفي الآن</span>
                  </>
                )}
              </button>

              {!showUrlFallback ? (
                <button
                  type="button"
                  onClick={() => setShowUrlFallback(true)}
                  className="w-full py-2 text-stone-500 hover:text-stone-800 text-[11px] font-bold text-center transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>أو إدخال رابط صورة مباشرة</span>
                </button>
              ) : (
                <div className="space-y-2 pt-2 animate-in fade-in">
                  <input
                    type="url"
                    dir="ltr"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[rgba(255,255,255,0.1)] bg-white text-[#FBF9F5] focus:border-[#c92a54] focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    disabled={!isHttpOrDataUrl(manualUrl)}
                    onClick={() => {
                      if (isHttpOrDataUrl(manualUrl)) onManualSubmit(manualUrl.trim());
                    }}
                    className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-[rgba(255,255,255,0.1)] disabled:opacity-40 text-stone-800 text-xs font-bold transition cursor-pointer"
                  >
                    حفظ الرابط في الختم
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
