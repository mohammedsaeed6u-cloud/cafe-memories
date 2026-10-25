'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Gift,
  Loader2,
  Plus,
  Save,
  Stamp,
  Trash2,
} from 'lucide-react';
import { growthErrorMessage, growthFetch } from './api';
import type { LadderTier } from './types';

interface LadderPanelProps {
  canManage: boolean;
}

interface DraftTier {
  key: string;
  threshold: number;
  title: string;
  description: string;
  rewardKind: 'voucher' | 'card';
  voucherValidDays: number;
  isActive: boolean;
}

const DEFAULT_TIERS: DraftTier[] = [
  {
    key: 'voucher-3',
    threshold: 3,
    title: 'خصم ١٠٪ على زيارتك القادمة',
    description: 'يُصدر ككوبون لمرة واحدة داخل الدورة.',
    rewardKind: 'voucher',
    voucherValidDays: 30,
    isActive: true,
  },
  {
    key: 'card-6',
    threshold: 6,
    title: 'مشروب مجاني',
    description: 'المكافأة الكبرى: تُغلق الكارت وتبدأ دورة جديدة.',
    rewardKind: 'card',
    voucherValidDays: 30,
    isActive: true,
  },
];

function toDraft(tier: LadderTier): DraftTier {
  return {
    key: tier.id,
    threshold: tier.threshold,
    title: tier.title,
    description: tier.description ?? '',
    rewardKind: tier.rewardKind,
    voucherValidDays: tier.voucherValidDays,
    isActive: tier.isActive,
  };
}

export function LadderPanel({ canManage }: LadderPanelProps) {
  const router = useRouter();
  const [tiers, setTiers] = useState<DraftTier[]>(DEFAULT_TIERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State is only written after the request resolves, so mounting the panel
  // cannot cascade into a second render.
  const load = useCallback(async () => {
    try {
      const { ok, status, body } = await growthFetch<{ tiers: LadderTier[] }>(
        '/api/v1/merchant/reward-ladder'
      );
      if (status === 401) {
        router.replace('/login');
        return;
      }
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر تحميل سلم المكافآت'));
      setTiers(body.tiers.length > 0 ? body.tiers.map(toDraft) : DEFAULT_TIERS);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل سلم المكافآت');
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

  const update = (key: string, patch: Partial<DraftTier>) => {
    setTiers((current) =>
      current.map((tier) => (tier.key === key ? { ...tier, ...patch } : tier))
    );
  };

  const addTier = () => {
    if (tiers.length >= 5) return;
    const nextThreshold = Math.min(
      30,
      Math.max(...tiers.map((tier) => tier.threshold), 2) + 1
    );
    setTiers((current) => [
      ...current,
      {
        key: `new-${Date.now()}`,
        threshold: nextThreshold,
        title: 'مكافأة جديدة',
        description: '',
        rewardKind: 'voucher',
        voucherValidDays: 30,
        isActive: true,
      },
    ]);
  };

  const removeTier = (key: string) => {
    setTiers((current) => current.filter((tier) => tier.key !== key));
  };

  const makeCard = (key: string) => {
    setTiers((current) =>
      current.map((tier) => ({
        ...tier,
        rewardKind: tier.key === key ? 'card' : tier.rewardKind === 'card' ? 'voucher' : tier.rewardKind,
      }))
    );
  };

  const save = async () => {
    setNotice(null);
    setError(null);
    setIsSaving(true);
    try {
      const payload = {
        tiers: tiers
          .slice()
          .sort((a, b) => a.threshold - b.threshold)
          .map((tier) => ({
            threshold: tier.threshold,
            title: tier.title.trim(),
            description: tier.description.trim() || null,
            rewardKind: tier.rewardKind,
            voucherValidDays: tier.voucherValidDays,
            isActive: tier.isActive,
          })),
      };
      const { ok, body } = await growthFetch<{ tiers: LadderTier[] }>(
        '/api/v1/merchant/reward-ladder',
        { method: 'PUT', body: JSON.stringify(payload) }
      );
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر حفظ سلم المكافآت'));
      setTiers(body.tiers.map(toDraft));
      setNotice('تم حفظ سلم المكافآت. الدورة الجديدة ستستخدمه فورًا.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ سلم المكافآت');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[#FAF5EB]">سلم المكافآت</h2>
          <p className="text-[11px] text-[#A19E9B]">
            مكافآت متعددة على كارت واحد. الكوبونات تُصرف مرة واحدة لكل دورة، والمكافأة الكبرى
            تُغلق الكارت.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => void save()}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-[#DFAB56] px-3 py-2 text-[11px] font-black text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            حفظ السلم
          </button>
        )}
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

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#141212] p-8 text-xs text-[#A19E9B]">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
        </div>
      ) : (
        <div className="space-y-3">
          {tiers
            .slice()
            .sort((a, b) => a.threshold - b.threshold)
            .map((tier) => (
              <div
                key={tier.key}
                className={`rounded-2xl border p-4 ${
                  tier.rewardKind === 'card'
                    ? 'border-[#DFAB56]/40 bg-[#1C1811]'
                    : 'border-white/10 bg-[#141212]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DFAB56]/15 text-[#DFAB56]">
                      {tier.rewardKind === 'card' ? (
                        <Gift className="h-4 w-4" />
                      ) : (
                        <Stamp className="h-4 w-4" />
                      )}
                    </span>
                    <span className="text-[11px] font-black text-[#FAF5EB]">
                      {tier.rewardKind === 'card' ? 'مكافأة الكارت' : 'كوبون مرحلي'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tier.rewardKind !== 'card' && canManage && (
                      <button
                        type="button"
                        onClick={() => makeCard(tier.key)}
                        className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-[#A19E9B] hover:text-[#DFAB56]"
                      >
                        اجعلها مكافأة الكارت
                      </button>
                    )}
                    {canManage && tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(tier.key)}
                        className="rounded-lg border border-rose-500/20 p-1.5 text-rose-300 hover:bg-rose-950/30"
                        aria-label="حذف المرحلة"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-[10px] font-bold text-[#A19E9B]">
                    عدد الأختام
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={tier.threshold}
                      disabled={!canManage}
                      onChange={(event) =>
                        update(tier.key, {
                          threshold: Math.max(2, Math.min(30, Number(event.target.value) || 2)),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 font-mono text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
                    />
                  </label>
                  <label className="text-[10px] font-bold text-[#A19E9B] sm:col-span-2 lg:col-span-2">
                    عنوان المكافأة
                    <input
                      value={tier.title}
                      disabled={!canManage}
                      onChange={(event) => update(tier.key, { title: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
                    />
                  </label>
                  <label className="text-[10px] font-bold text-[#A19E9B]">
                    صلاحية الكوبون (أيام)
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={tier.voucherValidDays}
                      disabled={!canManage || tier.rewardKind === 'card'}
                      onChange={(event) =>
                        update(tier.key, {
                          voucherValidDays: Math.max(1, Math.min(365, Number(event.target.value) || 30)),
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 font-mono text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
                    />
                  </label>
                  <label className="text-[10px] font-bold text-[#A19E9B] sm:col-span-2 lg:col-span-4">
                    الوصف
                    <input
                      value={tier.description}
                      disabled={!canManage}
                      onChange={(event) => update(tier.key, { description: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none disabled:opacity-60"
                    />
                  </label>
                </div>
              </div>
            ))}

          {canManage && tiers.length < 5 && (
            <button
              type="button"
              onClick={addTier}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-3 text-[11px] font-bold text-[#A19E9B] hover:border-[#DFAB56]/50 hover:text-[#DFAB56]"
            >
              <Plus className="h-4 w-4" /> إضافة مرحلة
            </button>
          )}

          <p className="text-[10px] leading-relaxed text-[#6F6C69]">
            القاعدة: مرحلة واحدة فقط تكون «مكافأة الكارت»، ويجب أن تكون الأعلى في السلم. باقي
            المراحل تُصدر كوبونات لا تعيد ضبط الكارت.
          </p>
        </div>
      )}
    </div>
  );
}
