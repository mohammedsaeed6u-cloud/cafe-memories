'use client';

import React, { useState } from 'react';
import { Gift, CheckCircle, Save, AlertCircle, Loader2 } from 'lucide-react';

export interface RewardRule {
  id?: string;
  name: string;
  description?: string | null;
  threshold: number;
  rewardType: string;
  rewardValue?: string | null;
  rewardDescription?: string | null;
  isActive: boolean;
}

interface DashboardRewardsTabProps {
  rule: RewardRule | null;
  onSave: (rule: Omit<RewardRule, 'id' | 'isActive'>) => Promise<void>;
  isSaving: boolean;
  success: string | null;
  error: string | null;
}

const REWARD_TYPES: Array<{ id: string; label: string }> = [
  { id: 'free_item', label: 'منتج مجاني' },
  { id: 'discount_percentage', label: 'خصم نسبة' },
  { id: 'fixed_discount', label: 'خصم مبلغ' },
  { id: 'free_print', label: 'طباعة مجانية' },
  { id: 'bonus_visit', label: 'زيارة إضافية' },
  { id: 'custom', label: 'مكافأة مخصصة' },
];

export const DashboardRewardsTab: React.FC<DashboardRewardsTabProps> = ({
  rule,
  onSave,
  isSaving,
  success,
  error,
}) => {
  const [threshold, setThreshold] = useState(rule?.threshold ?? 5);
  const [name, setName] = useState(rule?.name ?? '');
  const [description, setDescription] = useState(rule?.description ?? '');
  const [rewardType, setRewardType] = useState(rule?.rewardType ?? 'free_item');
  const [rewardValue, setRewardValue] = useState(rule?.rewardValue ?? '');
  const [rewardDescription, setRewardDescription] = useState(rule?.rewardDescription ?? '');

  // Re-seed the form when a different rule arrives from the server. The
  // guarded render-phase update replaces a setState-in-effect cascade.
  const [lastRule, setLastRule] = useState(rule);
  if (lastRule !== rule) {
    setLastRule(rule);
    setThreshold(rule?.threshold ?? 5);
    setName(rule?.name ?? '');
    setDescription(rule?.description ?? '');
    setRewardType(rule?.rewardType ?? 'free_item');
    setRewardValue(rule?.rewardValue ?? '');
    setRewardDescription(rule?.rewardDescription ?? '');
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSave({
      name: name.trim(),
      description: description.trim() || null,
      threshold,
      rewardType,
      rewardValue: rewardValue.trim() || null,
      rewardDescription: rewardDescription.trim() || null,
    });
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs font-bold text-emerald-200">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-bold text-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-xl"
      >
        <div className="border-b border-white/10 pb-3">
          <h3 className="flex items-center gap-2 font-serif text-base font-bold text-[#FAF5EB]">
            <Gift className="w-5 h-5 text-[#DFAB56]" />
            <span>برنامج الولاء</span>
          </h3>
          <p className="mt-1 text-xs text-[#A19E9B]">
            قاعدة واحدة نشطة لكل منشأة. كل زيارة معتمدة تحتسب ختمًا واحدًا، وعند بلوغ الحد
            تُصدر بطاقة مكافأة جاهزة للاستبدال من محطة الطاقم.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">اسم المكافأة</label>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثال: قهوة مجانية"
              className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">
              عدد الزيارات المطلوبة
            </label>
            <div className="grid grid-cols-6 gap-2">
              {[3, 4, 5, 6, 8, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setThreshold(value)}
                  className={`rounded-lg border py-2.5 text-xs font-bold transition ${
                    threshold === value
                      ? 'border-[#DFAB56] bg-[#DFAB56] text-[#12100E]'
                      : 'border-white/10 bg-[#1C1B1B] text-[#A19E9B] hover:text-[#FAF5EB]'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">نوع المكافأة</label>
            <select
              value={rewardType}
              onChange={(event) => setRewardType(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            >
              {REWARD_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">
              القيمة (اختياري)
            </label>
            <input
              value={rewardValue}
              onChange={(event) => setRewardValue(event.target.value)}
              placeholder="مثال: 20% أو 10 SAR"
              className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">وصف المكافأة</label>
            <textarea
              rows={2}
              value={rewardDescription}
              onChange={(event) => setRewardDescription(event.target.value)}
              placeholder="ما الذي يحصل عليه العميل عند الاستبدال؟"
              className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold text-[#A19E9B]">
              وصف داخلي (اختياري)
            </label>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="ملاحظات للفريق"
              className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#DFAB56] px-5 py-2.5 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {rule ? 'حفظ التعديلات' : 'إنشاء قاعدة المكافأة'}
        </button>
      </form>
    </div>
  );
};
