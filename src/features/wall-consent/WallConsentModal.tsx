'use client';

import React from 'react';
import { Tv, Sparkles, Lock } from 'lucide-react';

interface WallConsentModalProps {
  isOpen: boolean;
  businessName?: string;
  onConsent: (allow: boolean) => void;
  onClose: () => void;
}

export const WallConsentModal: React.FC<WallConsentModalProps> = ({
  isOpen,
  businessName = 'المتجر',
  onConsent,
  onClose,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#141212] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[rgba(255,255,255,0.1)] text-[#FBF9F5] space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center border border-amber-200 mx-auto shadow-xs">
          <Tv className="w-7 h-7 text-amber-800" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
            STAMPY SCREEN DISCOVERY
          </span>
          <h3 className="text-xl font-black text-[#FBF9F5] mt-2">
            هل تحب عرض لقطاتك على شاشة {businessName}؟
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed mt-1.5 max-w-sm mx-auto">
            لقد اكتمل شريط ذكرياتك. هل تفضل مشاركته على شاشة الصالة الرقمية (TV Wall) ليراها الزوار، أم الاحتفاظ بها خاصة على هاتفك فقط؟
          </p>
        </div>
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => onConsent(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FBF9F5] hover:bg-[#382D27] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>نعم، اعرض ذكرياتي على شاشة الصالة</span>
          </button>
          <button
            type="button"
            onClick={() => onConsent(false)}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#0B0A0A] text-stone-700 border border-[rgba(255,255,255,0.1)] font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span>احتفظ بها خاصة بي فقط</span>
          </button>
        </div>
      </div>
    </div>
  );
};