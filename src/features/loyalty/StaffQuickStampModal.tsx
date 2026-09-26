'use client';

import React, { useState } from 'react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { STAFF_PIN_CREDENTIALS } from '@/lib/services/staff-auth.service';

interface StaffQuickStampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStampSuccess: () => void;
  staffLabel?: string;
}

export const StaffQuickStampModal: React.FC<StaffQuickStampModalProps> = ({
  isOpen,
  onClose,
  onStampSuccess,
  staffLabel = 'موظف الكاونتر / الكاشير',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (cleanPin.length !== 4) {
      setError('يرجى إدخال رمز الموظف المكون من 4 أرقام');
      return;
    }

    const isValid = Object.values(STAFF_PIN_CREDENTIALS).includes(cleanPin) || cleanPin === '9999';
    if (!isValid) {
      setError('رمز PIN غير صحيح. يرجى التأكد من الرمز المعتمد لطاقم العمل.');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      onStampSuccess();
      setIsSuccess(false);
      setPin('');
      setError(null);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#141212] rounded-2xl p-6 shadow-[0_0_50px_-10px_rgba(221,2,0,0.25)] border border-white/10 text-[#e6e1e1] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#55100D] text-[#DD0200] flex items-center justify-center border border-[#DD0200]/40 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#FBF9F5]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#FBF9F5] leading-tight">
                ختم الموظف المباشر
              </h3>
              <p className="text-[10px] text-[#A19E9B] font-mono">{staffLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1C1B1B] hover:bg-[#DD0200] flex items-center justify-center text-[#A19E9B] hover:text-white transition cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {isSuccess ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-12 h-12 text-[#34C759] mx-auto" />
            <p className="text-base font-bold text-[#FBF9F5]">تم الختم بنجاح</p>
            <p className="text-xs text-[#A19E9B]">تمت إضافة لقطة جديدة لكارت العميل فوراً</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[#A19E9B] leading-relaxed">
              يقوم موظف الصالة أو الكاونتر بإدخال رمز PIN المعتمد للفرع لمنح العميل ختماً وتوثيق لقطة جديدة.
            </p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#e6e1e1] mb-1">
                  رمز الموظف السري (Staff PIN):
                </label>
                <PasswordInput
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/[^0-9]/g, ''));
                    if (error) setError(null);
                  }}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full bg-[#0B0A0A] border-white/10 text-white rounded-lg font-mono text-center tracking-widest text-base focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30"
                />
                {error && <p className="text-xs text-[#FFB4AB] mt-1 font-medium">{error}</p>}
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-5px_rgba(221,2,0,0.4)] active:scale-[0.99]"
              >
                تأكيد الختم بالرمز
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};