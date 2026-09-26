'use client';

import React, { useState } from 'react';
import {
  Tv,
  Radio,
  Power,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  SlidersHorizontal,
  Clock,
  Sparkles,
  AlertCircle,
  Trash2,
} from 'lucide-react';

export interface ScreenRecord {
  id: string;
  name: string;
  status: string;
  orientation: string;
  lastHeartbeatAt?: string;
}

interface DashboardWallTabProps {
  screens: ScreenRecord[];
  isTvBlackout: boolean;
  tvSlideDuration: number;
  onToggleBlackout: () => void;
  onChangeSlideDuration: (durationMs: number) => void;
  onForceRefresh: () => void;
  onUnpairScreen: (screenId: string) => void;
  onPairScreenSubmit: (code: string, locationName: string) => Promise<void>;
  isPairingScreen: boolean;
  pairScreenSuccess: string | null;
  pairScreenError: string | null;
  tvSyncNotice: string | null;
  cafeSlug: string;
}

export const DashboardWallTab: React.FC<DashboardWallTabProps> = ({
  screens,
  isTvBlackout,
  tvSlideDuration,
  onToggleBlackout,
  onChangeSlideDuration,
  onForceRefresh,
  onUnpairScreen,
  onPairScreenSubmit,
  isPairingScreen,
  pairScreenSuccess,
  pairScreenError,
  tvSyncNotice,
  cafeSlug,
}) => {
  const [screenCode, setScreenCode] = useState('');
  const [locationName, setLocationName] = useState('شاشة الصالة الرئيسية');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onPairScreenSubmit(screenCode, locationName);
    setScreenCode('');
  };

  return (
    <div className="space-y-6">
      {/* Sync / Pairing Notices */}
      {tvSyncNotice && (
        <div className="p-4 rounded-xl bg-[#1A0706] border border-[#DD0200]/40 text-[#FBF9F5] text-xs font-bold animate-in fade-in flex items-center gap-2 shadow-lg">
          <Sparkles className="w-4 h-4 text-[#DD0200] shrink-0" />
          <span>{tvSyncNotice}</span>
        </div>
      )}

      {pairScreenSuccess && (
        <div className="p-4 rounded-xl bg-[#141212] border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in flex items-center gap-2 shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{pairScreenSuccess}</span>
        </div>
      )}

      {pairScreenError && (
        <div className="p-4 rounded-xl bg-[#1A0706] border border-rose-500/40 text-rose-300 text-xs font-bold animate-in fade-in flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{pairScreenError}</span>
        </div>
      )}

      {/* Main Grid: Screen Pairing + Remote Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Smart TV Pairing Card */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="font-bold text-sm text-[#FBF9F5] flex items-center gap-2 font-serif">
                <Tv className="w-4 h-4 text-[#DD0200]" />
                <span>ربط واقتران شاشة ذكية (Smart TV Pairing)</span>
              </h3>
              <p className="text-xs text-[#A19E9B] mt-0.5">
                افتح الرابط على تلفزيون الصالة وأدخل كود الـ 6 أرقام الظاهر على الشاشة.
              </p>
            </div>

            <a
              href={`/wall/screen-1?cafe=${cafeSlug}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] border border-white/10 text-[#FBF9F5] text-xs font-bold transition flex items-center gap-1.5"
              title="فتح الشاشة في نافذة جديدة"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#A19E9B] mb-1">
                رمز الاقتران الظاهر على شاشة التلفزيون (6 أرقام):
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={screenCode}
                onChange={(e) => setScreenCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center text-2xl font-mono font-black py-2.5 px-4 rounded-lg border border-white/10 bg-[#0B0A0A] focus:border-[#DD0200] focus:outline-none tracking-[0.3em] text-[#DD0200] placeholder:text-[#A19E9B]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A19E9B] mb-1">
                تسمية موقع شاشة العرض بالصالة:
              </label>
              <input
                type="text"
                required
                placeholder="شاشة الصالة الرئيسية، شاشة الطابق الثاني..."
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0B0A0A] focus:border-[#DD0200] focus:outline-none text-xs text-[#FBF9F5] font-bold placeholder:text-[#A19E9B]/40"
              />
            </div>

            <button
              type="submit"
              disabled={isPairingScreen || screenCode.length !== 6}
              className="w-full py-3 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Radio className="w-4 h-4" />
              <span>{isPairingScreen ? 'جاري الربط...' : 'إتمام ربط الشاشة وبدء البث'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT: Remote Controls Console */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="font-bold text-sm text-[#FBF9F5] flex items-center gap-2 font-serif">
              <SlidersHorizontal className="w-4 h-4 text-[#DD0200]" />
              <span>لوحة التحكم عن بعد بشاشات الصالة (TV Remote)</span>
            </h3>
            <p className="text-xs text-[#A19E9B] mt-0.5">
              أوامر فورية متزامنة تصل لكافة شاشات التلفزيون المتصلة بدون إعادة تحميل الصفحة.
            </p>
          </div>

          <div className="space-y-3">
            {/* Blackout Toggle */}
            <div className="p-3.5 rounded-xl bg-[#1C1B1B] border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-[#FBF9F5] block">وضع التعتيم (شاشة التوقف):</span>
                <span className="text-[11px] text-[#A19E9B]">
                  {isTvBlackout ? 'الشاشات معتمة حالياً (شاشة سوداء هادئة)' : 'البث المباشر للصور نشط حالياً'}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleBlackout}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isTvBlackout
                    ? 'bg-[#55100D] border border-[#DD0200]/50 text-[#FBF9F5] shadow-xs'
                    : 'bg-[#141212] hover:bg-[#211F1F] text-[#A19E9B] hover:text-[#FBF9F5] border border-white/10'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isTvBlackout ? 'استئناف البث' : 'تعتيم الشاشات'}</span>
              </button>
            </div>

            {/* Slide Duration Selector */}
            <div className="p-3.5 rounded-xl bg-[#1C1B1B] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#FBF9F5] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#DD0200]" />
                  <span>سرعة تقليب الصور على الشاشة:</span>
                </span>
                <span className="text-[10px] font-mono text-[#A19E9B] font-bold">
                  {tvSlideDuration / 1000} ثوانٍ
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '4 ثوانٍ', ms: 4000 },
                  { label: '8 ثوانٍ', ms: 8000 },
                  { label: '12 ثانية', ms: 12000 },
                  { label: '16 ثانية', ms: 16000 },
                ].map((speed) => (
                  <button
                    key={speed.ms}
                    type="button"
                    onClick={() => onChangeSlideDuration(speed.ms)}
                    className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      tvSlideDuration === speed.ms
                        ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] font-bold'
                        : 'bg-[#141212] text-[#A19E9B] border border-white/10 hover:bg-[#211F1F] hover:text-[#FBF9F5]'
                    }`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Force Refresh Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onForceRefresh}
                className="w-full py-2.5 px-4 rounded-lg border border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#DD0200]" />
                <span>إرسال أمر تحديث فوري لكافة الشاشات (Force Sync)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Screens Table */}
      <div className="bg-[#141212] rounded-2xl border border-white/10 shadow-xl p-6 space-y-4">
        <h4 className="font-bold text-sm text-[#FBF9F5] flex items-center gap-2 font-serif">
          <Tv className="w-4 h-4 text-emerald-400" />
          <span>الشاشات المقترنة والنشطة حالياً ({screens.length})</span>
        </h4>

        {screens.length === 0 ? (
          <div className="py-8 text-center text-[#A19E9B]/50 text-xs">
            لا توجد شاشات مقترنة حالياً. استخدم نموذج الاقتران أعلاه لربط أول شاشة.
          </div>
        ) : (
          <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
            {screens.map((screen) => (
              <div
                key={screen.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[#1C1B1B]/50 transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#55100D] border border-[#DD0200]/30 text-[#DD0200] flex items-center justify-center font-bold">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#FBF9F5] block">{screen.name}</span>
                    <span className="text-[10px] text-[#A19E9B] font-mono block">
                      ID: {screen.id} • {screen.orientation === 'landscape' ? 'عرضي 16:9' : 'طولي 9:16'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#55100D]/70 border border-[#DD0200]/40 text-[#FBF9F5] text-[10px] font-bold flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>متصلة وتبث الآن</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onUnpairScreen(screen.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-950/40 text-[#A19E9B]/60 hover:text-rose-400 transition cursor-pointer"
                    title="فصل وإلغاء اقتران الشاشة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
