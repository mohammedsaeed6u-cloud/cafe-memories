'use client';

import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface TwoFactorVerifyFormProps {
  twoFactorCode: string;
  setTwoFactorCode: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function TwoFactorVerifyForm({
  twoFactorCode,
  setTwoFactorCode,
  loading,
  onSubmit,
  onBack,
}: TwoFactorVerifyFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-[#e6e1e1] mb-1.5 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#DFAB56]" />
          <span>رمز التحقق بخطوتين (2FA)</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          dir="ltr"
          required
          autoFocus
          value={twoFactorCode}
          onChange={(e) => setTwoFactorCode(e.target.value)}
          placeholder="123456"
          className="w-full px-4 py-3 rounded-xl bg-[#0B0A0A] border border-white/10 text-center tracking-widest font-mono text-lg font-black text-[#FBF9F5] focus:border-[#DFAB56] focus:ring-1 focus:ring-[#DFAB56]/30 focus:outline-none transition shadow-inner placeholder:text-[#A19E9B]/30"
        />
        <p className="mt-1.5 text-[11px] text-[#A19E9B] text-center">
          أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة الخاص بك
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3 px-4 rounded-lg bg-[#DFAB56] hover:bg-[#E8BF70] text-[#1B1B1E] disabled:opacity-50 text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-5px_rgba(201,42,84,0.4)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 hover:scale-[1.01]"
      >
        <ShieldCheck className="w-4 h-4" />
        <span>{loading ? 'جاري التحقق...' : 'تأكيد الدخول'}</span>
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-lg border border-transparent hover:border-white/10 text-xs font-bold text-[#A19E9B] hover:text-[#FBF9F5] transition flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <ArrowRight className="w-3.5 h-3.5" />
        <span>العودة لخيارات الدخول</span>
      </button>
    </form>
  );
}
