'use client';

import React from 'react';
import {
  Tv,
  Power,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Clock,
  Sparkles,
  AlertCircle,
  Trash2,
  KeyRound,
  Loader2,
} from 'lucide-react';

export interface ScreenRecord {
  id: string;
  name: string;
  status: string;
  orientation: string;
  lastHeartbeatAt?: string | null;
  online?: boolean;
}

interface DashboardWallTabProps {
  screens: ScreenRecord[];
  isLoadingScreens: boolean;
  pairingCode: string | null;
  pairingExpiresAt: string | null;
  isGeneratingCode: boolean;
  onGenerateCode: () => void;
  isTvBlackout: boolean;
  tvSlideDuration: number;
  onToggleBlackout: () => void;
  onChangeSlideDuration: (durationMs: number) => void;
  onUnpairScreen: (screenId: string) => void;
  onRefreshScreens: () => void;
  wallUrl: string;
  notice: string | null;
  error: string | null;
  isSavingWall: boolean;
}

export const DashboardWallTab: React.FC<DashboardWallTabProps> = ({
  screens,
  isLoadingScreens,
  pairingCode,
  pairingExpiresAt,
  isGeneratingCode,
  onGenerateCode,
  isTvBlackout,
  tvSlideDuration,
  onToggleBlackout,
  onChangeSlideDuration,
  onUnpairScreen,
  onRefreshScreens,
  wallUrl,
  notice,
  error,
  isSavingWall,
}) => {
  const onlineCount = screens.filter((screen) => screen.online).length;

  return (
    <div className="space-y-6">
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs font-bold text-emerald-200">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-bold text-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-5 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl lg:col-span-7">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#FAF5EB]">
              <KeyRound className="w-5 h-5 text-[#DFAB56]" />
              <span>اقتران شاشة جديدة</span>
            </h3>
            <span className="rounded-md border border-[#DFAB56]/40 bg-[#3D2314]/70 px-2 py-0.5 font-mono text-[10px] font-bold text-[#FAF5EB]">
              CODE PAIRING
            </span>
          </div>

          <ol className="space-y-2 text-xs leading-relaxed text-[#A19E9B]">
            <li>1. افتح رابط شاشة الصالة على جهاز التلفزيون.</li>
            <li>2. اضغط «توليد رمز» هنا واكتب الرمز على الشاشة خلال 10 دقائق.</li>
            <li>3. بعد الاقتران ستظهر الشاشة هنا وتبدأ باستقبال الذكريات.</li>
          </ol>

          {pairingCode ? (
            <div className="space-y-2 text-center">
              <div className="text-[11px] font-bold text-[#A19E9B]">الرمز الحالي</div>
              <div className="font-mono text-4xl font-black tracking-[0.35em] text-[#FAF5EB]" dir="ltr">
                {pairingCode}
              </div>
              {pairingExpiresAt && (
                <div className="flex items-center justify-center gap-1.5 font-mono text-[10px] text-[#A19E9B]">
                  <Clock className="w-3 h-3" />
                  صالح حتى {new Date(pairingExpiresAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/15 bg-[#1C1B1B] p-4 text-center text-xs text-[#A19E9B]">
              لا يوجد رمز نشط. ولّد رمزًا جديدًا ثم أدخله على شاشة التلفزيون.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGenerateCode}
              disabled={isGeneratingCode}
              className="inline-flex items-center gap-2 rounded-lg bg-[#DFAB56] px-4 py-2 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
            >
              {isGeneratingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {pairingCode ? 'توليد رمز بديل' : 'توليد رمز الاقتران'}
            </button>
            <a
              href={wallUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#1C1B1B] px-4 py-2 text-xs font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
            >
              <ExternalLink className="w-4 h-4" />
              فتح شاشة الصالة
            </a>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl lg:col-span-5">
          <h3 className="flex items-center gap-2 border-b border-white/10 pb-3 font-serif text-base font-bold text-[#FAF5EB]">
            <Tv className="w-5 h-5 text-[#DFAB56]" />
            <span>التحكم بالبث</span>
          </h3>

          <button
            type="button"
            onClick={onToggleBlackout}
            disabled={isSavingWall}
            className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-xs font-bold transition disabled:opacity-50 ${
              isTvBlackout
                ? 'border-[#DFAB56]/40 bg-[#3D2314]/60 text-[#FAF5EB]'
                : 'border-white/10 bg-[#1C1B1B] text-[#A19E9B]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Power className="w-4 h-4" />
              وضع الاستراحة (Blackout)
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] ${
                isTvBlackout ? 'bg-[#DFAB56] text-[#12100E]' : 'bg-white/10 text-[#A19E9B]'
              }`}
            >
              {isTvBlackout ? 'مفعّل' : 'متوقف'}
            </span>
          </button>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#A19E9B]">
              مدة عرض كل ذكرى: {(tvSlideDuration / 1000).toFixed(0)} ثانية
            </label>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={Math.round(tvSlideDuration / 1000)}
              onChange={(event) => onChangeSlideDuration(Number(event.target.value) * 1000)}
              disabled={isSavingWall}
              className="w-full accent-[#DFAB56]"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1C1B1B] p-3 text-xs">
            <span className="text-[#A19E9B]">الشاشات المتصلة</span>
            <span className="font-mono font-bold text-[#FAF5EB]">
              {onlineCount} / {screens.length}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#FAF5EB]">
            <Sparkles className="w-5 h-5 text-[#DFAB56]" />
            <span>الشاشات المقترنة</span>
          </h3>
          <button
            type="button"
            onClick={onRefreshScreens}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-3 py-1.5 text-[11px] font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingScreens ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>

        {screens.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-[#1C1B1B] p-6 text-center text-xs text-[#A19E9B]">
            لا توجد شاشات مقترنة بعد. استخدم رمز الاقتران أعلاه لربط أول شاشة.
          </p>
        ) : (
          <ul className="space-y-2">
            {screens.map((screen) => (
              <li
                key={screen.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1C1B1B] p-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      screen.online ? 'bg-emerald-400' : 'bg-stone-500'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-[#FAF5EB]">{screen.name}</div>
                    <div className="font-mono text-[10px] text-[#A19E9B]">
                      {screen.orientation} •{' '}
                      {screen.lastHeartbeatAt
                        ? new Date(screen.lastHeartbeatAt).toLocaleString('ar-SA')
                        : 'لم تتصل بعد'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUnpairScreen(screen.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-950/60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  إلغاء الاقتران
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
