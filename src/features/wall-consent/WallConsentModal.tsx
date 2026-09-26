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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#141212] rounded-2xl p-6 sm:p-7 shadow-[0_0_50px_-10px_rgba(221,2,0,0.25)] border border-white/10 text-[#e6e1e1] space-y-4 text-center">
        <div className="w-14 h-14 rounded-xl bg-[#55100D] text-[#DD0200] flex items-center justify-center border border-[#DD0200]/40 mx-auto shadow-lg">
          <Tv className="w-7 h-7 text-[#FBF9F5]" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold text-[#FBF9F5] bg-[#55100D]/60 px-2.5 py-0.5 rounded-md border border-[#DD0200]/40 uppercase tracking-wider">
            ATELIER SCREEN DISCOVERY
          </span>
          <h3 className="text-xl font-bold text-[#FBF9F5] mt-2" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            هل تحب عرض لقطاتك على شاشة {businessName}؟
          </h3>
          <p className="text-xs text-[#A19E9B] leading-relaxed mt-1.5 max-w-sm mx-auto">
            لقد اكتمل شريط ذكرياتك. هل تفضل مشاركته على شاشة الصالة الرقمية (TV Wall) ليراها الزوار، أم الاحتفاظ بها خاصة على هاتفك فقط؟
          </p>
        </div>
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => onConsent(true)}
            className="w-full py-3.5 px-4 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-5px_rgba(221,2,0,0.4)] transition flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#FBF9F5]" />
            <span>نعم، اعرض ذكرياتي على شاشة الصالة</span>
          </button>
          <button
            type="button"
            onClick={() => onConsent(false)}
            className="w-full py-3 px-4 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] border border-white/10 font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#A19E9B]" />
            <span>احتفظ بها خاصة بي فقط</span>
          </button>
        </div>
      </div>
    </div>
  );
};