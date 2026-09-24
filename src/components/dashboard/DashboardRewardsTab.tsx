'use client';

import React, { useState } from 'react';
import {
  Gift,
  Coffee,
  CheckCircle,
  Save,
  Sparkles,
  Award,
} from 'lucide-react';
import { BusinessSettings } from '@/types/photobooth';

interface DashboardRewardsTabProps {
  settings: BusinessSettings;
  onSaveRewards: (visits: number, title: string, subtitle: string) => void;
  isSavingRewards: boolean;
  saveRewardsSuccess: boolean;
}

export const DashboardRewardsTab: React.FC<DashboardRewardsTabProps> = ({
  settings,
  onSaveRewards,
  isSavingRewards,
  saveRewardsSuccess,
}) => {
  const [rewardVisits, setRewardVisits] = useState<number>(
    () => settings.defaultShotCount || 5
  );
  const [rewardGiftTitle, setRewardGiftTitle] = useState<string>(
    () => settings.freeGiftOffer?.title || 'كوب سبيشالتي مجاني من اختيارك'
  );
  const [rewardGiftSubtitle, setRewardGiftSubtitle] = useState<string>(
    () => settings.freeGiftOffer?.subtitle || 'مكافأة الزائر الوفي'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRewards(Number(rewardVisits), rewardGiftTitle, rewardGiftSubtitle);
  };

  return (
    <div className="space-y-6">
      {saveRewardsSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold animate-in fade-in flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>تم حفظ وتحديث إعدادات المكافآت بنجاح لكافة بطاقات الولاء!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Rewards Settings Form */}
        <div className="lg:col-span-7 p-6 bg-white rounded-3xl border border-stone-200/90 shadow-sm space-y-5">
          <div className="pb-3 border-b border-stone-100">
            <h3 className="font-black text-base text-stone-950 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              <span>إعدادات حوافز ومكافآت الولاء (Loyalty Rewards Program)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              حدد عدد الزيارات المطلوبة والهدية التي يستلمها العميل فور إكمال بطاقته.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                عدد الزيارات المطلوبة لاستحقاق الهدية المجانية:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRewardVisits(num)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      rewardVisits === num
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-black'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>{num} زيارات</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                عنوان الهدية المجانية:
              </label>
              <input
                type="text"
                required
                value={rewardGiftTitle}
                onChange={(e) => setRewardGiftTitle(e.target.value)}
                placeholder="مثال: كوب فلات وايت مجاني، حلى مجاني..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                الوصف المساعد للهدية:
              </label>
              <input
                type="text"
                required
                value={rewardGiftSubtitle}
                onChange={(e) => setRewardGiftSubtitle(e.target.value)}
                placeholder="مثال: مكافأة خاصة لزوار مقهانا الأوفياء..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-500 focus:outline-none text-xs text-stone-800"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingRewards}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingRewards ? 'جاري الحفظ...' : 'حفظ ونشر التعديلات'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT: Live Interactive Preview */}
        <div className="lg:col-span-5 p-6 bg-stone-50 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <span className="text-[11px] font-bold text-stone-500 block">
            معاينة كارت الهدية الظاهر للعميل:
          </span>

          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center mx-auto shadow-xs">
              <Gift className="w-6 h-6" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold font-mono">
                COMPLETION REWARD
              </span>
              <h4 className="text-base font-black text-stone-950 mt-1.5">{rewardGiftTitle}</h4>
              <p className="text-xs text-stone-500 mt-0.5">{rewardGiftSubtitle}</p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-stone-700 font-medium">
              يستحقها العميل تلقائياً عند إكمال <strong>{rewardVisits}</strong> أختام معتمدة.
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1.5 font-mono">
              <span>كود الصرف: #GIFT-XXXX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
