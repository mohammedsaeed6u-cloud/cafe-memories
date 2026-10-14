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

  const handleDownload = () => {
    try {
      const blob = ImageSaveService.dataUrlToBlob(imageUrl);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-sm max-h-[92vh] bg-[#141313] text-[#FBF9F5] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[rgba(255,255,255,0.1)] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#c92a54] border border-amber-200 flex items-center justify-center shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3
                style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                className="text-sm font-bold text-[#FBF9F5]"
              >
                {title}
              </h3>
              <p className="text-[10px] text-stone-500">خاص بأجهزة iPhone ومتصفح Safari</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instruction Banner */}
        <div className="p-3 bg-amber-50/80 border-b border-amber-200/80 text-amber-900 text-xs font-bold leading-relaxed text-center shrink-0">
          👆 اضغط مطولاً على الصورة أدناه ثم اختر <span className="underline decoration-amber-600 font-black">«حفظ في الصور» (Save Image)</span>
        </div>

        {/* Image Preview Container (with touch-callout enabled) */}
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-[#141212] min-h-0">
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
        <div className="p-4 border-t border-[rgba(255,255,255,0.1)] bg-white space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="py-2.5 px-3 rounded-lg bg-[#c92a54] hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95 rounded-xl"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة / حفظ</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="py-2.5 px-3 rounded-lg bg-[#FBF9F5] hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 rounded-xl"
            >
              <Download className="w-3.5 h-3.5 text-[#c92a54]" />
              <span>تنزيل الملف</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2 px-2.5 rounded-lg bg-white hover:bg-[#0B0A0A] text-stone-600 font-medium text-[11px] flex items-center justify-center gap-1 transition cursor-pointer border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xs"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الصورة'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="py-2 px-2.5 rounded-lg bg-white hover:bg-[#0B0A0A] text-stone-600 font-medium text-[11px] flex items-center justify-center gap-1 transition cursor-pointer border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xs"
            >
              <ExternalLink className="w-3 h-3 text-[#c92a54]" />
              <span>فتح بجودة كاملة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
