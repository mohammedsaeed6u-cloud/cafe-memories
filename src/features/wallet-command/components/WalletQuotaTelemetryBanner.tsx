'use client';

import React from 'react';
import { Zap, RefreshCw } from 'lucide-react';

interface WalletQuotaTelemetryBannerProps {
  tenantQuota: {
    used: number;
    quota: number;
    remaining: number;
    isByok: boolean;
    resetDate?: string;
  };
  usage: {
    count: number;
    limit: number;
    remaining: number;
    resetDate: string;
    plan: string;
    isByok?: boolean;
  } | null;
  isLoadingUsage: boolean;
  onRefreshUsage: () => void;
}

export function WalletQuotaTelemetryBanner({
  tenantQuota,
  usage,
  isLoadingUsage,
  onRefreshUsage,
}: WalletQuotaTelemetryBannerProps) {
  return (
    <div className="space-y-4">
      {/* SaaS Wallet Quota Telemetry Banner */}
      <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            tenantQuota.isByok ? 'bg-purple-950/60 border-purple-500/40 text-purple-300' : 'bg-[#98183c]/50 border-[#c92a54]/40 text-[#c92a54]'
          }`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#FBF9F5]">كوتة كروت المحفظة الشهرية (Wallet Passes Quota)</h3>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border font-mono ${
                tenantQuota.isByok ? 'bg-purple-950/60 text-purple-200 border-purple-500/40' : 'bg-[#98183c]/60 text-[#FBF9F5] border-[#c92a54]/40'
              }`}>
                {tenantQuota.isByok ? 'مفتاح خاص (BYOK) • غير محدود' : 'مستهلك من باقة ستامبي'}
              </span>
            </div>
            <p className="text-xs text-[#A19E9B] mt-0.5">
              {tenantQuota.isByok
                ? 'يتم إصدار كروت Apple و Google Wallet مباشرة عبر حساب التاجر الخاص دون احتساب كوتة شهرية.'
                : `تم استهلاك ${tenantQuota.used} من إجمالي ${tenantQuota.quota} كارت هذا الشهر. المتبقي: ${tenantQuota.remaining} كارت.`}
            </p>
          </div>
        </div>

        {!tenantQuota.isByok && (
          <div className="w-full sm:w-52 shrink-0">
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-[#FBF9F5]">{tenantQuota.used} / {tenantQuota.quota} كارت</span>
              <span className={tenantQuota.used >= tenantQuota.quota ? 'text-rose-400' : 'text-emerald-400'}>
                {Math.round((tenantQuota.used / Math.max(1, tenantQuota.quota)) * 100)}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#1C1B1B] overflow-hidden border border-white/10 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  tenantQuota.used >= tenantQuota.quota ? 'bg-rose-500' : 'bg-gradient-to-r from-[#c92a54] to-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.round((tenantQuota.used / Math.max(1, tenantQuota.quota)) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4 Usage & Quota Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
          <span className="text-[10px] text-[#A19E9B] font-bold block mb-1">الخطة ونوع المفتاح</span>
          <div className="flex items-center gap-1.5 font-bold text-sm text-[#FBF9F5]">
            <Zap className="w-4 h-4 text-[#c92a54]" />
            <span className="truncate">{usage?.isByok ? 'BYOK خاص' : usage?.plan?.toUpperCase() || 'PRO / ENTERPRISE'}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
          <span className="text-[10px] text-[#A19E9B] font-bold block mb-1">الكروت المُصدرة</span>
          <div className="font-mono font-bold text-sm text-[#FBF9F5]">
            {isLoadingUsage ? '...' : usage?.isByok ? `${usage?.count || 0} كارت (مفتوح)` : `${usage?.count || 0} / ${usage?.limit || 1000}`}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
          <span className="text-[10px] text-[#A19E9B] font-bold block mb-1">الرصيد المتبقي</span>
          <div className="font-mono font-bold text-sm text-emerald-400">
            {isLoadingUsage ? '...' : usage?.isByok ? 'غير محدود ♾️' : `${usage?.remaining || 1000} كارت`}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141212] border border-white/10 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#A19E9B] font-bold block mb-1">تجديد الكوتة</span>
            <span className="text-xs font-bold text-[#FBF9F5]">
              {usage?.resetDate || 'أول كل شهر'}
            </span>
          </div>
          <button
            type="button"
            onClick={onRefreshUsage}
            title="تحديث البيانات"
            className="p-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] border border-white/10 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsage ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
