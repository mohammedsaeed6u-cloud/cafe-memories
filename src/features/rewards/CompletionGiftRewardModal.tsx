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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#141212] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[rgba(255,255,255,0.1)] text-[#FBF9F5] space-y-4 text-center relative overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition cursor-pointer border border-[rgba(255,255,255,0.1)]"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center border border-amber-200 mx-auto shadow-xs">
          <Gift className="w-8 h-8 text-amber-800" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
            STAMPY REWARD UNLOCKED
          </span>
          <h3 className="text-xl font-black text-[#FBF9F5] mt-2">{giftTitle}</h3>
          <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto">{giftSubtitle}</p>
        </div>
        <div className="p-4 bg-[#141212] rounded-2xl border border-[rgba(255,255,255,0.1)] space-y-2 shadow-2xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase font-bold block">
            كود استلام الهدية المعتمد:
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-amber-800">
              {giftCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-xl bg-stone-100 border border-[rgba(255,255,255,0.1)] hover:bg-stone-200 text-stone-700 transition cursor-pointer"
              title="نسخ الكود"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
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
              className="w-full py-3.5 px-4 rounded-2xl bg-[#FBF9F5] hover:bg-[#382D27] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>طباعة وتحميل الكارت فوراً (300 DPI)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs text-stone-500 hover:text-stone-800 font-bold transition cursor-pointer"
          >
            إغلاق ومتابعة الزيارة
          </button>
        </div>
      </div>
    </div>
  );
};