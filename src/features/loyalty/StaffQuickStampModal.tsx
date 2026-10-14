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

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (cleanPin.length !== 4) {
      setError('يرجى إدخال رمز الموظف المكون من 4 أرقام');
      return;
    }

    // Server-authoritative check via the signed staff-session endpoint;
    // the legacy client-side '9999' bypass was removed (CWE-798).
    // The route itself rate-limits and verifies against the live roster.
    let isValid = false;
    try {
      const res = await fetch('/api/v1/staff-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
      });
      isValid = res.ok;
    } catch {
      isValid = false;
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#141212] rounded-3xl p-6 shadow-[0_20px_60px_-15px_rgba(40,30,20,0.15)] border border-[rgba(255,255,255,0.1)] text-[#FBF9F5] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#c92a54]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#FBF9F5] leading-tight">
                ختم الموظف المباشر
              </h3>
              <p className="text-[10px] text-stone-500 font-mono">{staffLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition cursor-pointer border border-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {isSuccess ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="text-base font-bold text-[#FBF9F5]">تم الختم بنجاح 🎉</p>
            <p className="text-xs text-stone-500">تمت إضافة ختم جديد لكارت العميل فوراً</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-stone-600 leading-relaxed">
              يقوم موظف الصالة أو الكاونتر بإدخال رمز PIN المعتمد للفرع لمنح العميل ختماً وتوثيق لقطة جديدة.
            </p>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
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
                  className="w-full bg-[#141212] border-[rgba(255,255,255,0.1)] text-[#FBF9F5] rounded-xl font-mono text-center tracking-widest text-base focus:border-[#c92a54] focus:ring-1 focus:ring-amber-200"
                />
                {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FBF9F5] hover:bg-[#382D27] text-white font-bold text-xs transition-all cursor-pointer shadow-md active:scale-[0.99]"
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