'use client';

import React from 'react';
import { X } from 'lucide-react';
import { TenantSummary } from '@/types/super-admin';
import { WalletQuotaEditState } from '../types';

interface AdminWalletQuotaModalProps {
  tenant: TenantSummary | null;
  quotaEditData: WalletQuotaEditState;
  onClose: () => void;
  onResetUsage: (tenantId: string) => void;
  onSetQuotaEditData: React.Dispatch<React.SetStateAction<WalletQuotaEditState>>;
  onSave: () => void;
}

export function AdminWalletQuotaModal({
  tenant,
  quotaEditData,
  onClose,
  onResetUsage,
  onSetQuotaEditData,
  onSave,
}: AdminWalletQuotaModalProps) {
  if (!tenant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#141212] rounded-3xl border border-[rgba(255,255,255,0.1)] shadow-2xl max-w-lg w-full p-6 sm:p-8 text-right space-y-6 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
              WALLETWALLET.DEV • QUOTA & KEY CONTROL
            </span>
            <h3 className="text-lg font-black text-[#FBF9F5] mt-1">
              إدارة كوتا ومفتاح المحفظة للفرع
            </h3>
            <p className="text-xs text-stone-500 font-medium">{tenant.name} (/{tenant.slug})</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Usage Overview Box */}
        <div className="p-4 rounded-2xl bg-[#141212] border border-[rgba(255,255,255,0.1)] space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-[#FBF9F5]">
            <span>الاستهلاك الحالي لهذا الشهر:</span>
            <span className="font-mono text-sm text-amber-800 font-black">
              {tenant.walletConfig?.usedPassesThisMonth || 0} / {quotaEditData.monthlyPassQuota} كارت
            </span>
          </div>
          <button
            type="button"
            onClick={() => onResetUsage(tenant.id)}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 underline block cursor-pointer"
          >
            🔄 تصفير عداد الاستهلاك للشهر الجديد
          </button>
        </div>

        {/* Field 1: Monthly Pass Quota */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#FBF9F5] block">
            الكوتا الشهرية المسموحة لكروت Apple & Google Wallet:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 2000, 5000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onSetQuotaEditData((prev) => ({ ...prev, monthlyPassQuota: preset }))}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                  quotaEditData.monthlyPassQuota === preset
                    ? 'bg-[#FBF9F5] text-white border-[#FBF9F5]'
                    : 'bg-white text-stone-600 border-[rgba(255,255,255,0.1)] hover:bg-[#0B0A0A]'
                }`}
              >
                {preset} كارت
              </button>
            ))}
          </div>
          <input
            type="number"
            min="10"
            max="100000"
            value={quotaEditData.monthlyPassQuota}
            onChange={(e) =>
              onSetQuotaEditData((prev) => ({
                ...prev,
                monthlyPassQuota: Math.max(1, parseInt(e.target.value) || 0),
              }))
            }
            className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141212] text-xs font-bold text-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#c92a54]"
            placeholder="أو اكتب حداً مخصصاً..."
          />
        </div>

        {/* Field 2: API Key Mode (Platform vs BYOK) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-[#FBF9F5] block">
            مصدر مفتاح الربط وتوقيع البطاقات:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onSetQuotaEditData((prev) => ({ ...prev, usePlatformKey: true }))}
              className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                quotaEditData.usePlatformKey
                  ? 'bg-amber-50 border-amber-400 text-amber-950 ring-1 ring-amber-400'
                  : 'bg-[#141212] border-[rgba(255,255,255,0.1)] text-stone-600 hover:bg-[#0B0A0A]'
              }`}
            >
              <p className="text-xs font-bold">مفتاح المنصة المعتمد</p>
              <p className="text-[10px] text-stone-500 mt-0.5">يتم خصم الكروت من كوتا ساس المركزية</p>
            </button>

            <button
              type="button"
              onClick={() => onSetQuotaEditData((prev) => ({ ...prev, usePlatformKey: false }))}
              className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                !quotaEditData.usePlatformKey
                  ? 'bg-purple-50 border-purple-400 text-purple-950 ring-1 ring-purple-400'
                  : 'bg-[#141212] border-[rgba(255,255,255,0.1)] text-stone-600 hover:bg-[#0B0A0A]'
              }`}
            >
              <p className="text-xs font-bold">مفتاح العميل الخاص (BYOK)</p>
              <p className="text-[10px] text-stone-500 mt-0.5">كوتا غير محدودة على حساب العميل</p>
            </button>
          </div>

          {!quotaEditData.usePlatformKey && (
            <div className="space-y-1 animate-in fade-in">
              <label className="text-[11px] font-bold text-stone-600 block">
                أدخل مفتاح WalletWallet API الخاص بالعميل (ww_live_...):
              </label>
              <input
                type="password"
                value={quotaEditData.walletWalletApiKey}
                onChange={(e) =>
                  onSetQuotaEditData((prev) => ({ ...prev, walletWalletApiKey: e.target.value }))
                }
                placeholder="ww_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-mono font-bold text-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-purple-600 text-left"
                dir="ltr"
              />
            </div>
          )}
        </div>

        {/* Field 3: Over-Quota Policy */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0B0A0A] border border-[rgba(255,255,255,0.1)]">
          <div>
            <span className="text-xs font-bold text-[#FBF9F5] block">سياسة تجاوز الكوتا:</span>
            <span className="text-[10px] text-stone-500">
              {quotaEditData.allowOverQuota
                ? 'السماح بإصدار الكروت مع تنبيه دون تعطيل خدمة العملاء'
                : 'حظر إصدار وتحديث كروت المحفظة فور استهلاك الحد الشهري'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSetQuotaEditData((prev) => ({ ...prev, allowOverQuota: !prev.allowOverQuota }))}
            className={`w-12 h-6 rounded-full transition p-1 cursor-pointer flex items-center ${
              quotaEditData.allowOverQuota ? 'bg-[#c92a54] justify-end' : 'bg-stone-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
          </button>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.1)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-6 py-2.5 rounded-xl bg-[#FBF9F5] hover:bg-[#382D27] text-white text-xs font-bold transition shadow-md cursor-pointer"
          >
            حفظ وتطبيق الكوتا فوراً
          </button>
        </div>
      </div>
    </div>
  );
}
