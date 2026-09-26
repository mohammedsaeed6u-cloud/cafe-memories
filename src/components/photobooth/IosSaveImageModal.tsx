'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Download,
  Sparkles,
} from 'lucide-react';
import { ImageSaveService } from '@/lib/services/image-save.service';

interface IosSaveImageModalProps {
  open?: boolean;
  isOpen?: boolean;
  imageUrl: string | null;
  filename?: string;
  title?: string;
  onClose: () => void;
}

export function IosSaveImageModal({
  open,
  isOpen,
  imageUrl,
  filename = 'memories-strip.png',
  title = 'حفظ في ألبوم الصور',
  onClose,
}: IosSaveImageModalProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const isModalOpen = open ?? isOpen ?? false;
  if (!isModalOpen || !imageUrl) return null;

  const handleCopy = async () => {
    const success = await ImageSaveService.copyImageToClipboard(imageUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await ImageSaveService.saveImage({
        dataUrl: imageUrl,
        filename,
        title: 'شريط الصور التذكاري',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleOpenNewTab = () => {
    const blob = ImageSaveService.dataUrlToBlob(imageUrl);
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-sm max-h-[92vh] bg-[#141212] text-[#FBF9F5] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#141212] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#55100D]/60 text-[#DD0200] border border-[#DD0200]/30 flex items-center justify-center shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3
                style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                className="text-sm font-bold text-[#FBF9F5]"
              >
                {title}
              </h3>
              <p className="text-[10px] text-[#A19E9B]">خاص بأجهزة iPhone ومتصفح Safari</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#A19E9B] hover:text-[#FBF9F5] flex items-center justify-center transition cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instruction Banner */}
        <div className="p-3 bg-[#55100D]/40 border-b border-[#DD0200]/30 text-[#FBF9F5] text-xs font-bold leading-relaxed text-center shrink-0">
          👆 اضغط مطولاً على الصورة أدناه ثم اختر <span className="underline decoration-[#DD0200] font-black">«حفظ في الصور» (Save Image)</span>
        </div>

        {/* Image Preview Container (with touch-callout enabled) */}
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-[#0B0A0A] min-h-0">
          <div className="relative max-h-[55vh] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Strip Preview"
              style={{
                WebkitTouchCallout: 'default',
                userSelect: 'auto',
                touchAction: 'auto',
              }}
              className="max-h-[52vh] w-auto rounded-xl shadow-2xl border border-white/15 cursor-pointer object-contain"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#141212] space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="py-2.5 px-3 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs flex items-center justify-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة / حفظ</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/10"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الصورة'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenNewTab}
            className="w-full py-2 text-[#A19E9B] hover:text-[#FBF9F5] text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
          >
            <ExternalLink className="w-3 h-3 text-[#DD0200]" />
            <span>فتح الصورة بجودة كاملة في تبويب جديد</span>
          </button>
        </div>
      </div>
    </div>
  );
}
