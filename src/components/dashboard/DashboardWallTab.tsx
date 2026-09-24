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
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold animate-in fade-in flex items-center gap-2 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{tvSyncNotice}</span>
        </div>
      )}

      {pairScreenSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold animate-in fade-in flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pairScreenSuccess}</span>
        </div>
      )}

      {pairScreenError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold animate-in fade-in flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{pairScreenError}</span>
        </div>
      )}

      {/* Main Grid: Screen Pairing + Remote Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Smart TV Pairing Card */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-black text-sm text-stone-950 flex items-center gap-2">
                <Tv className="w-4 h-4 text-amber-600" />
                <span>ربط واقتران شاشة ذكية (Smart TV Pairing)</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                افتح الرابط على تلفزيون الصالة وأدخل كود الـ 6 أرقام الظاهر على الشاشة.
              </p>
            </div>

            <a
              href={`/wall/screen-1?cafe=${cafeSlug}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition flex items-center gap-1.5"
              title="فتح الشاشة في نافذة جديدة"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                رمز الاقتران الظاهر على شاشة التلفزيون (6 أرقام):
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={screenCode}
                onChange={(e) => setScreenCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center text-2xl font-mono font-black py-2.5 px-4 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none tracking-[0.3em] text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                تسمية موقع الشاشة بالكافيه:
              </label>
              <input
                type="text"
                required
                placeholder="شاشة الصالة الرئيسية، شاشة الطابق الثاني..."
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs text-stone-900 font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={isPairingScreen || screenCode.length !== 6}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Radio className="w-4 h-4" />
              <span>{isPairingScreen ? 'جاري الربط...' : 'إتمام ربط الشاشة وبدء البث'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT: Remote Controls Console */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
          <div className="pb-3 border-b border-stone-100">
            <h3 className="font-black text-sm text-stone-950 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <span>لوحة التحكم عن بعد بشاشات الصالة (TV Remote)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              أوامر فورية متزامنة تصل لكافة شاشات التلفزيون المتصلة بدون إعادة تحميل الصفحة.
            </p>
          </div>

          <div className="space-y-3">
            {/* Blackout Toggle */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-stone-900 block">وضع التعتيم (شاشة التوقف):</span>
                <span className="text-[11px] text-stone-500">
                  {isTvBlackout ? 'الشاشات معتمة حالياً (شاشة سوداء هادئة)' : 'البث المباشر للصور نشط حالياً'}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleBlackout}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isTvBlackout
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-300'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{isTvBlackout ? 'استئناف البث' : 'تعتيم الشاشات'}</span>
              </button>
            </div>

            {/* Slide Duration Selector */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>سرعة تقليب الصور على الشاشة:</span>
                </span>
                <span className="text-[10px] font-mono text-stone-500 font-bold">
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
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      tvSlideDuration === speed.ms
                        ? 'bg-amber-600 text-white shadow-xs font-black'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
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
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                <span>إرسال أمر تحديث فوري لكافة الشاشات (Force Sync)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Screens Table */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 space-y-4">
        <h4 className="font-black text-sm text-stone-950 flex items-center gap-2">
          <Tv className="w-4 h-4 text-emerald-600" />
          <span>الشاشات المقترنة والنشطة حالياً ({screens.length})</span>
        </h4>

        {screens.length === 0 ? (
          <div className="py-8 text-center text-stone-400 text-xs">
            لا توجد شاشات مقترنة حالياً. استخدم نموذج الاقتران أعلاه لربط أول شاشة.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
            {screens.map((screen) => (
              <div
                key={screen.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/50 transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-950 block">{screen.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono block">
                      ID: {screen.id} • {screen.orientation === 'landscape' ? 'عرضي 16:9' : 'طولي 9:16'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>متصلة وتبث الآن</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onUnpairScreen(screen.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition cursor-pointer"
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
