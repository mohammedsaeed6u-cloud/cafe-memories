'use client';

import React from 'react';
import { X } from 'lucide-react';
import { UseSubscriptionBillingReturn } from '../types';

interface Props {
  vm: UseSubscriptionBillingReturn;
}

export const BillingCardUpdateModal: React.FC<Props> = ({ vm }) => {
  const {
    isChangingCard,
    setIsChangingCard,
    handleSaveCard,
    cardBrand,
    setCardBrand,
    cardHolder,
    setCardHolder,
    cardNumber,
    setCardNumber,
    expiry,
    setExpiry,
  } = vm;

  if (!isChangingCard) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#141212] rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/10 space-y-5 text-[#e6e1e1]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#FBF9F5] font-serif">تحديث بطاقة الدفع المعتمدة</h3>
            <p className="text-xs text-[#A19E9B] mt-0.5">ربط آمن عبر بوابة الدفع المعتمدة</p>
          </div>
          <button
            onClick={() => setIsChangingCard(false)}
            className="p-1.5 rounded-lg text-[#A19E9B] hover:text-[#FBF9F5] hover:bg-[#1C1B1B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveCard} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">نوع البطاقة</label>
            <div className="grid grid-cols-3 gap-2">
              {(['mada', 'visa', 'mastercard'] as const).map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setCardBrand(b)}
                  className={`py-2 rounded-lg text-xs font-bold uppercase border transition cursor-pointer ${
                    cardBrand === b
                      ? 'border-[#d97706] bg-[#b45309]/50 text-[#FBF9F5] shadow-xs'
                      : 'border-white/10 text-[#A19E9B] bg-[#1C1B1B] hover:bg-[#211F1F]'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">الاسم على البطاقة</label>
            <input
              type="text"
              required
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs font-medium focus:border-[#d97706] outline-none text-[#FBF9F5] placeholder:text-[#A19E9B]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">رقم البطاقة</label>
            <input
              type="text"
              required
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs font-mono font-medium focus:border-[#d97706] outline-none text-[#FBF9F5] placeholder:text-[#A19E9B]/40"
              placeholder="0000 0000 0000 0000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
                تاريخ الانتهاء
              </label>
              <input
                type="text"
                required
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs font-mono text-center focus:border-[#d97706] outline-none text-[#FBF9F5] placeholder:text-[#A19E9B]/40"
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">رمز CVC</label>
              <input
                type="password"
                maxLength={4}
                defaultValue="***"
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs font-mono text-center focus:border-[#d97706] outline-none text-[#FBF9F5] placeholder:text-[#A19E9B]/40"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsChangingCard(false)}
              className="px-4 py-2 rounded-lg text-[#A19E9B] hover:bg-[#1C1B1B] text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-[#FBF9F5] text-xs font-bold transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
            >
              حفظ وتأكيد البطاقة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
