'use client';

import React, { useState } from 'react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ShieldCheck, X, CheckCircle2, Check } from 'lucide-react';

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
  staffLabel = 'الباريستا / الكاشير',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDirectStamp = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onStampSuccess();
      setIsSuccess(false);
      setPin('');
      setError(null);
      onClose();
    }, 600);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length >= 4) {
      handleDirectStamp();
    } else {
      setError('يرجى إدخال رمز الموظف المكون من 4 أرقام');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-stone-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center border border-stone-200">
              <ShieldCheck className="w-5 h-5 text-stone-800" />
            </div>
            <div>
              <h3 className="font-black text-base text-stone-900 leading-tight">
                ختم الموظف المباشر
              </h3>
              <p className="text-[10px] text-stone-500">{staffLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {isSuccess ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="text-base font-black text-stone-900">تم الختم بنجاح</p>
            <p className="text-xs text-stone-500">تمت إضافة لقطة جديدة لكارت العميل فوراً</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-stone-600 leading-relaxed">
              عند مسح الرمز أو تأكيد الـ PIN؛ يُمنح العميل ختماً جديداً يتيح له التصوير فوراً.
            </p>
            <button
              type="button"
              onClick={handleDirectStamp}
              className="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>ختم فوري بنقرة واحدة (Direct Stamp)</span>
            </button>
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-stone-200 w-full" />
              <span className="bg-white px-2 text-[10px] text-stone-400 font-mono uppercase">أو عبر الرمز</span>
            </div>
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  رمز الموظف السري (Staff PIN):
                </label>
                <PasswordInput
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="مثال: 1234"
                  maxLength={6}
                  className="w-full bg-stone-50 border-stone-200 text-stone-900 rounded-xl font-mono text-center tracking-widest text-base"
                />
                {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>} 
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs transition cursor-pointer"
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