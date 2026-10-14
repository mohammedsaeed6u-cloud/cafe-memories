'use client';

import React from 'react';
import { KeyRound, Shield } from 'lucide-react';
import { STAFF_ROSTER } from '@/types/staff';

interface StaffPinLoginFormProps {
  pin: string;
  setPin: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function StaffPinLoginForm({
  pin,
  setPin,
  loading,
  onSubmit,
}: StaffPinLoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="p-4 rounded-xl bg-[#451215]/30 border border-[#DFAB56]/40 text-[#FBF9F5] text-xs space-y-1">
        <p className="font-bold flex items-center gap-1.5 text-[#FBF9F5]">
          <Shield className="w-4 h-4 text-[#DFAB56]" />
          <span>كاونتر الكاشير وطاقم العمل (Staff Quick PIN):</span>
        </p>
        <p className="text-[#A19E9B] leading-relaxed text-[11px]">
          هذا المسار مخصص لطاقم العمل في الفرع لفتح شاشة الكاونتر وتمرير الأختام وصرف الهدايا بسرعة دون الحاجة لكلمة مرور التاجر.
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#e6e1e1] mb-1.5 text-center">
          أدخل رمز الـ PIN المكون من 4 أرقام:
        </label>
        <input
          type="password"
          maxLength={4}
          dir="ltr"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="••••"
          className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 px-4 rounded-xl bg-[#0B0A0A] border border-white/10 focus:border-[#DFAB56] focus:ring-1 focus:ring-[#DFAB56]/30 focus:outline-none transition text-[#FBF9F5] shadow-inner"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => {
              if (val === 'C') setPin('');
              else if (val === '⌫') setPin(pin.slice(0, -1));
              else if (pin.length < 4) setPin(pin + val);
            }}
            className="py-3 rounded-xl bg-[#1C1B1B] hover:bg-[#211F1F] active:scale-95 text-[#FBF9F5] font-mono font-bold text-sm border border-white/10 transition cursor-pointer"
          >
            {val}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading || pin.length < 4}
        className="w-full mt-2 py-3 px-4 rounded-lg bg-[#DFAB56] hover:bg-[#E8BF70] text-[#1B1B1E] disabled:opacity-50 text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-5px_rgba(201,42,84,0.4)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 hover:scale-[1.01]"
      >
        <KeyRound className="w-4 h-4" />
        <span>{loading ? 'جاري التحقق...' : 'فتح شاشة الكاونتر (POS)'}</span>
      </button>
    </form>
  );
}
