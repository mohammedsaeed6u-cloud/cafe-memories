'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { formatDateTime, growthErrorMessage, growthFetch, toLocalInput } from './api';
import type { GrowthBranch, Promotion } from './types';

interface PromotionsPanelProps {
  branches: GrowthBranch[];
  canManage: boolean;
}

const DAY_LABELS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function startOfToday(): string {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  return toLocalInput(date);
}

function endOfWeek(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return toLocalInput(date);
}

export function PromotionsPanel({ branches, canManage }: PromotionsPanelProps) {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('ساعة الذروة ×٢');
  const [description, setDescription] = useState('');
  const [multiplier, setMultiplier] = useState(2);
  const [startsAt, setStartsAt] = useState(startOfToday);
  const [endsAt, setEndsAt] = useState(endOfWeek);
  const [days, setDays] = useState<number[]>([]);
  const [startHour, setStartHour] = useState('');
  const [endHour, setEndHour] = useState('');
  const [branchId, setBranchId] = useState('');

  const load = useCallback(async () => {
    try {
      const { ok, status, body } = await growthFetch<{ promotions: Promotion[] }>(
        '/api/v1/merchant/promotions'
      );
      if (status === 401) {
        router.replace('/login');
        return;
      }
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر تحميل العروض'));
      setPromotions(body.promotions);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل العروض');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // `load` only writes state after its first await; the compiler rule scans
    // the whole async body and cannot see that boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const activeCount = useMemo(
    () => promotions.filter((promotion) => promotion.isActive).length,
    [promotions]
  );

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setError(null);
    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        multiplier,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        daysOfWeek: days.length > 0 ? days : null,
        startHour: startHour === '' ? null : Number(startHour),
        endHour: endHour === '' ? null : Number(endHour),
        branchId: branchId || null,
        isActive: true,
      };
      const { ok, body } = await growthFetch<{ promotion: Promotion }>(
        '/api/v1/merchant/promotions',
        { method: 'POST', body: JSON.stringify(payload) }
      );
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر إنشاء العرض'));
      setPromotions((current) => [body.promotion, ...current]);
      setNotice('تم إنشاء العرض. سيُطبَّق تلقائيًا على أول نقرة داخل النافذة.');
      setDescription('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'تعذر إنشاء العرض');
    } finally {
      setIsSaving(false);
    }
  };

  const toggle = async (promotion: Promotion) => {
    setError(null);
    try {
      const { ok, body } = await growthFetch<{ promotion: Promotion }>(
        '/api/v1/merchant/promotions',
        {
          method: 'PATCH',
          body: JSON.stringify({ id: promotion.id, isActive: !promotion.isActive }),
        }
      );
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر تحديث العرض'));
      setPromotions((current) =>
        current.map((item) => (item.id === promotion.id ? body.promotion : item))
      );
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'تعذر تحديث العرض');
    }
  };

  const archive = async (promotion: Promotion) => {
    if (!window.confirm('أرشفة هذا العرض؟ لن يُحذف السجل المرتبط بالأختام السابقة.')) return;
    setError(null);
    try {
      const { ok, body } = await growthFetch<{ archived: boolean }>(
        `/api/v1/merchant/promotions?id=${encodeURIComponent(promotion.id)}`,
        { method: 'DELETE' }
      );
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر أرشفة العرض'));
      setPromotions((current) =>
        current.map((item) => (item.id === promotion.id ? { ...item, isActive: false } : item))
      );
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'تعذر أرشفة العرض');
    }
  };

  const toggleDay = (day: number) => {
    setDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort()
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-black text-[#FAF5EB]">عروض الأختام</h2>
        <p className="text-[11px] text-[#A19E9B]">
          ضاعف الأختام في نافذة زمنية. {activeCount > 0 ? `${activeCount} عرض نشط الآن.` : 'لا يوجد عرض نشط.'}
        </p>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> {notice}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs font-bold text-rose-200">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {canManage && (
        <form
          onSubmit={create}
          className="space-y-3 rounded-2xl border border-white/10 bg-[#141212] p-4"
        >
          <div className="flex items-center gap-2 text-xs font-black text-[#FAF5EB]">
            <Sparkles className="h-4 w-4 text-[#DFAB56]" /> عرض جديد
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-[10px] font-bold text-[#A19E9B] sm:col-span-2">
              العنوان
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </label>
            <label className="text-[10px] font-bold text-[#A19E9B]">
              المضاعف
              <select
                value={multiplier}
                onChange={(event) => setMultiplier(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs font-bold text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              >
                <option value={2}>×٢</option>
                <option value={3}>×٣</option>
                <option value={4}>×٤</option>
                <option value={5}>×٥</option>
              </select>
            </label>
            <label className="text-[10px] font-bold text-[#A19E9B]">
              الفرع
              <select
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              >
                <option value="">كل الفروع</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold text-[#A19E9B]">
              يبدأ
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </label>
            <label className="text-[10px] font-bold text-[#A19E9B]">
              ينتهي
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </label>
            <label className="text-[10px] font-bold text-[#A19E9B]">
              من ساعة (اختياري)
              <input
                type="number"
                min={0}
                max={23}
                value={startHour}
                onChange={(event) => setStartHour(event.target.value)}
                placeholder="16"
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 font-mono text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </label>
            <label className="text-[10px] font-bold text-[#A19E9B]">
              إلى ساعة (اختياري)
              <input
                type="number"
                min={1}
                max={24}
                value={endHour}
                onChange={(event) => setEndHour(event.target.value)}
                placeholder="20"
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 font-mono text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </label>
            <label className="text-[10px] font-bold text-[#A19E9B] sm:col-span-2 lg:col-span-4">
              الوصف
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#A19E9B]">أيام الأسبوع (اتركها فارغة لكل يوم):</span>
            {DAY_LABELS.map((label, day) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${
                  days.includes(day)
                    ? 'border-[#DFAB56] bg-[#DFAB56]/15 text-[#DFAB56]'
                    : 'border-white/10 text-[#A19E9B]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-[#DFAB56] px-3 py-2 text-[11px] font-black text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            إنشاء العرض
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#141212] p-8 text-xs text-[#A19E9B]">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#141212] p-8 text-center text-xs text-[#A19E9B]">
          لا توجد عروض بعد. أنشئ عرضًا لمضاعفة الأختام في ساعات الذروة.
        </div>
      ) : (
        <div className="space-y-2">
          {promotions.map((promotion) => (
            <div
              key={promotion.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#141212] p-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DFAB56]/15 font-mono text-sm font-black text-[#DFAB56]">
                  ×{promotion.multiplier}
                </span>
                <div>
                  <p className="flex items-center gap-2 text-xs font-black text-[#FAF5EB]">
                    {promotion.title}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        promotion.isActive
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-white/10 text-[#A19E9B]'
                      }`}
                    >
                      {promotion.isActive ? 'نشط' : 'متوقف'}
                    </span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-[#A19E9B]">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      {formatDateTime(promotion.startsAt)} → {formatDateTime(promotion.endsAt)}
                    </span>
                    <span>{promotion.branchName ?? 'كل الفروع'}</span>
                    {promotion.startHour !== null && promotion.endHour !== null && (
                      <span className="font-mono" dir="ltr">
                        {promotion.startHour}:00–{promotion.endHour}:00
                      </span>
                    )}
                    {promotion.daysOfWeek && promotion.daysOfWeek.length > 0 && (
                      <span>{promotion.daysOfWeek.map((day) => DAY_LABELS[day]).join('، ')}</span>
                    )}
                  </p>
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggle(promotion)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-[#A19E9B] hover:text-[#DFAB56]"
                  >
                    <Zap className="h-3 w-3" />
                    {promotion.isActive ? 'إيقاف' : 'تشغيل'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void archive(promotion)}
                    className="rounded-lg border border-rose-500/20 p-1.5 text-rose-300 hover:bg-rose-950/30"
                    aria-label="أرشفة العرض"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
