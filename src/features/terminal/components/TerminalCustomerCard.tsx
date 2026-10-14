'use client';

import React from 'react';
import { Award, Gift, Smartphone, Unlock } from 'lucide-react';
import { RegisteredCustomer } from '@/lib/services/customer-registry.service';
import { CustomerLoyaltyData } from '@/features/loyalty/loyalty-purse.service';
import { IssuedVoucher } from '@/lib/services/voucher.service';

interface TerminalCustomerCardProps {
  selectedCustomer: RegisteredCustomer;
  loyaltyData: CustomerLoyaltyData;
  activeVoucher: IssuedVoucher | null;
  requiredVisits: number;
  giftTitle: string;
  stampsToAdd: number;
  isEligibleForGift: boolean;
  onAddStamp: () => void;
  onRedeemGift: () => void;
  onRedeemVoucherDirect: (code: string) => void;
  onUnlockCooldown: () => void;
}

export function TerminalCustomerCard({
  selectedCustomer,
  loyaltyData,
  activeVoucher,
  requiredVisits,
  giftTitle,
  stampsToAdd,
  isEligibleForGift,
  onAddStamp,
  onRedeemGift,
  onRedeemVoucherDirect,
  onUnlockCooldown,
}: TerminalCustomerCardProps) {
  return (
    <div className="p-6 rounded-3xl bg-[#181212] border border-[#DFAB56]/40 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0E0A0A] text-[#DFAB56] flex items-center justify-center font-black text-xl shadow-xs border border-[#DFAB56]/40">
            {selectedCustomer.name.charAt(0) || 'ع'}
          </div>
          <div>
            <h3 className="text-base font-black text-[#FAF5EB]">{selectedCustomer.name}</h3>
            <p className="text-xs text-[#D5C0A8] font-mono" dir="ltr">{selectedCustomer.phone}</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#682025]/80 text-[#DFAB56] border border-[#DFAB56]/40">
          {loyaltyData.stampedCount} من {requiredVisits} أختام
        </span>
      </div>

      {activeVoucher && (
        <div className={`p-4 rounded-2xl border transition-all ${
          activeVoucher.status === 'ACTIVE'
            ? 'bg-emerald-950/40 border-emerald-500/40 shadow-xs'
            : 'bg-[#0E0A0A] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                activeVoucher.status === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-[#221A1A] text-[#A19E9B]'
              }`}>
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#FAF5EB] tracking-wider">
                    {activeVoucher.code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeVoucher.status === 'ACTIVE'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#221A1A] text-[#A19E9B]'
                  }`}>
                    {activeVoucher.status === 'ACTIVE' ? 'جاهز للاستبدال 🎁' : 'تم استبداله مسبقاً'}
                  </span>
                </div>
                <p className="text-xs text-stone-300 font-bold mt-0.5">{activeVoucher.giftTitle}</p>
              </div>
            </div>

            {activeVoucher.status === 'ACTIVE' && (
              <button
                type="button"
                onClick={() => onRedeemVoucherDirect(activeVoucher.code)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                صرف الهدية بالكود
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#D5C0A8]">
          <span>تقدم بطاقة الولاء الحالية</span>
          <span className="font-mono text-[#DFAB56] font-bold">{loyaltyData.stampedCount} / {requiredVisits} زيارات</span>
        </div>
        <div className="w-full bg-[#0E0A0A] h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="bg-gradient-to-r from-[#C9933B] via-[#DFAB56] to-[#E5A836] h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (loyaltyData.stampedCount / requiredVisits) * 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onAddStamp}
          className="py-3.5 px-4 rounded-2xl bg-[#682025] hover:bg-[#52171B] text-[#FAF5EB] font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-[#DFAB56]/40"
        >
          <Award className="w-5 h-5 text-[#DFAB56]" />
          <span>ختم زيارة جديدة (+{stampsToAdd})</span>
        </button>

        <button
          type="button"
          onClick={onRedeemGift}
          disabled={!isEligibleForGift}
          className={`py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
            isEligibleForGift
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-[#221A1A] text-[#A19E9B]/50 cursor-not-allowed border border-white/10'
          }`}
        >
          <Gift className="w-5 h-5" />
          <span>تسليم الهدية ({giftTitle})</span>
        </button>
      </div>

      <div className="p-3 rounded-xl bg-[#0E0A0A] border border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[11px] text-[#D5C0A8] font-medium">
          <Smartphone className="w-4 h-4 text-[#DFAB56] shrink-0" />
          <span>يتم بث التحديث وإشعار شاشة القفل فوراً بشعار متجرك لكارت محفظة العميل</span>
        </div>

        <button
          type="button"
          onClick={onUnlockCooldown}
          className="text-[#D5C0A8] hover:text-[#FAF5EB] font-bold flex items-center gap-1 transition cursor-pointer text-[11px]"
        >
          <Unlock className="w-3.5 h-3.5 text-[#DFAB56]" />
          <span>فك قفل الـ 24 ساعة</span>
        </button>
      </div>
    </div>
  );
}
