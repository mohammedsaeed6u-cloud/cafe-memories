'use client';

import React, { useState } from 'react';
import { Gift, Check, Copy, Printer, X } from 'lucide-react';

interface CompletionGiftRewardModalProps {
  isOpen: boolean;
  giftTitle?: string;
  giftSubtitle?: string;
  giftCode?: string;
  onClose: () => void;
  onPrintStrip?: () => void;
}

export const CompletionGiftRewardModal: React.FC<CompletionGiftRewardModalProps> = ({
  isOpen,
  giftTitle = 'هدية ترحيبية مميزة',
  giftSubtitle = 'أظهر هذا الكود لموظف الكاونتر أو الكاشير لاستلام هديتك مع الصورة المطبوعة',
  giftCode = 'GIFT-2026',
  onClose,
  onPrintStrip,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(giftCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#141212] rounded-2xl p-6 sm:p-7 shadow-[0_0_50px_-10px_rgba(221,2,0,0.25)] border border-white/10 text-[#e6e1e1] space-y-4 text-center relative overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-[#1C1B1B] hover:bg-[#DD0200] flex items-center justify-center text-[#A19E9B] hover:text-white transition cursor-pointer border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-16 h-16 rounded-xl bg-[#55100D] text-[#DD0200] flex items-center justify-center border border-[#DD0200]/40 mx-auto shadow-lg">
          <Gift className="w-8 h-8 text-[#FBF9F5]" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold text-[#FBF9F5] bg-[#55100D]/60 px-2.5 py-0.5 rounded-md border border-[#DD0200]/40 uppercase tracking-wider">
            ATELIER REWARD UNLOCKED
          </span>
          <h3 className="text-xl font-bold text-[#FBF9F5] mt-2" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>{giftTitle}</h3>
          <p className="text-xs text-[#A19E9B] mt-1 max-w-xs mx-auto">{giftSubtitle}</p>
        </div>
        <div className="p-4 bg-[#0B0A0A] rounded-xl border border-white/10 space-y-2">
          <span className="text-[10px] font-mono text-[#A19E9B] uppercase font-bold block">
            كود استلام الهدية المعتمد:
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-[#DD0200]">
              {giftCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-[#1C1B1B] border border-white/10 hover:bg-[#211F1F] text-[#FBF9F5] transition cursor-pointer"
              title="نسخ الكود"
            >
              {copied ? <Check className="w-4 h-4 text-[#34C759]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2 pt-1">
          {onPrintStrip && (
            <button
              type="button"
              onClick={() => {
                onPrintStrip();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-5px_rgba(221,2,0,0.4)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 text-[#FBF9F5]" />
              <span>طباعة وتحميل الكارت فوراً (300 DPI)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs text-[#A19E9B] hover:text-[#FBF9F5] font-medium transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};