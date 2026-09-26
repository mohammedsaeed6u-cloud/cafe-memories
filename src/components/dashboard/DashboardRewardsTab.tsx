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
        <div className="p-4 rounded-xl bg-[#141212] border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in flex items-center gap-2 shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تم حفظ وتحديث إعدادات المكافآت بنجاح لكافة بطاقات الولاء!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Rewards Settings Form */}
        <div className="lg:col-span-7 p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl space-y-5">
          <div className="pb-3 border-b border-white/10">
            <h3 className="font-bold text-base text-[#FBF9F5] flex items-center gap-2 font-serif">
              <Gift className="w-5 h-5 text-[#DD0200]" />
              <span>إعدادات حوافز ومكافآت الولاء (Loyalty Rewards Program)</span>
            </h3>
            <p className="text-xs text-[#A19E9B] mt-1">
              حدد عدد الزيارات المطلوبة والهدية التي يستلمها العميل فور إكمال بطاقته.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
                عدد الزيارات المطلوبة لاستحقاق الهدية المجانية:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRewardVisits(num)}
                    className={`py-2.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      rewardVisits === num
                        ? 'bg-[#DD0200] text-[#FBF9F5] border-[#DD0200] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] font-bold'
                        : 'bg-[#1C1B1B] border-white/10 text-[#A19E9B] hover:text-[#FBF9F5] hover:bg-[#211F1F]'
                    }`}
                  >
                    <span>{num} زيارات</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
                عنوان الهدية المجانية:
              </label>
              <input
                type="text"
                required
                value={rewardGiftTitle}
                onChange={(e) => setRewardGiftTitle(e.target.value)}
                placeholder="مثال: كوب فلات وايت مجاني، حلى مجاني..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] focus:border-[#DD0200] focus:outline-none text-xs font-bold text-[#FBF9F5] placeholder:text-[#A19E9B]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A19E9B] mb-1.5">
                الوصف المساعد للهدية:
              </label>
              <input
                type="text"
                required
                value={rewardGiftSubtitle}
                onChange={(e) => setRewardGiftSubtitle(e.target.value)}
                placeholder="مثال: مكافأة خاصة لزوار مقهانا الأوفياء..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#0B0A0A] focus:border-[#DD0200] focus:outline-none text-xs text-[#FBF9F5] placeholder:text-[#A19E9B]/40"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingRewards}
              className="w-full py-3 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingRewards ? 'جاري الحفظ...' : 'حفظ ونشر التعديلات'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT: Live Interactive Preview */}
        <div className="lg:col-span-5 p-6 bg-[#141212] rounded-2xl border border-white/10 shadow-xl space-y-4">
          <span className="text-[11px] font-bold text-[#A19E9B] block font-mono uppercase tracking-wider">
            معاينة كارت الهدية الظاهر للعميل:
          </span>

          <div className="p-6 rounded-xl bg-[#1C1B1B] border border-white/10 shadow-lg space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#55100D] border border-[#DD0200]/40 text-[#DD0200] flex items-center justify-center mx-auto shadow-md">
              <Gift className="w-6 h-6" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-md bg-[#55100D]/70 border border-[#DD0200]/40 text-[#FBF9F5] text-[10px] font-bold font-mono tracking-wider">
                COMPLETION REWARD
              </span>
              <h4 className="text-base font-bold text-[#FBF9F5] mt-1.5 font-serif">{rewardGiftTitle}</h4>
              <p className="text-xs text-[#A19E9B] mt-0.5">{rewardGiftSubtitle}</p>
            </div>

            <div className="p-3 bg-[#0B0A0A] rounded-lg border border-white/10 text-xs text-[#A19E9B] font-medium">
              يستحقها العميل تلقائياً عند إكمال <strong className="text-[#FBF9F5]">{rewardVisits}</strong> أختام معتمدة.
            </div>

            <div className="p-2.5 rounded-lg bg-[#141212] border border-white/10 text-[11px] font-bold text-[#FBF9F5] flex items-center justify-center gap-1.5 font-mono">
              <span className="text-[#A19E9B]">كود الصرف:</span>
              <span className="text-[#DD0200]">#GIFT-XXXX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
