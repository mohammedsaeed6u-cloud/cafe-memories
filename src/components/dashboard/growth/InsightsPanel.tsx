'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Stamp,
  Users,
} from 'lucide-react';
import { growthErrorMessage, growthFetch, formatNumber, formatPercent } from './api';
import type { Insights, InsightMetric } from './types';

const DOW_LABELS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

interface InsightsPanelProps {
  branchId: string;
}

function delta(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function MetricCard({
  label,
  value,
  current,
  previous,
  icon,
  suffix,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
  icon: React.ReactNode;
  suffix?: string;
}) {
  const change = delta(current, previous);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#141212] p-4">
      <div className="flex items-center justify-between text-[11px] font-bold text-[#A19E9B]">
        <span>{label}</span>
        <span className="text-[#DFAB56]">{icon}</span>
      </div>
      <p className="mt-2 font-mono text-2xl font-black text-[#FAF5EB]" dir="ltr">
        {value}
        {suffix ? <span className="text-sm text-[#A19E9B]"> {suffix}</span> : null}
      </p>
      {change === null ? (
        <p className="mt-1 text-[10px] text-[#6F6C69]">لا توجد فترة مقارنة</p>
      ) : (
        <p
          className={`mt-1 flex items-center gap-1 text-[10px] font-bold ${
            change >= 0 ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          {change >= 0 ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {Math.abs(change)}% عن الفترة السابقة
        </p>
      )}
    </div>
  );
}

export function InsightsPanel({ branchId }: InsightsPanelProps) {
  const router = useRouter();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  // No state is written before the first `await`: an effect that triggers a
  // synchronous render cascade is both slow and easy to loop.
  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams({ days: String(days) });
      if (branchId) query.set('branchId', branchId);
      const { ok, status, body } = await growthFetch<{ insights: Insights }>(
        `/api/v1/merchant/insights?${query.toString()}`
      );
      if (status === 401) {
        router.replace('/login');
        return;
      }
      if (!ok || !body.insights) throw new Error(growthErrorMessage(body, 'تعذر تحميل التحليلات'));
      setInsights(body.insights);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل التحليلات');
    } finally {
      setIsLoading(false);
    }
  }, [branchId, days, router]);

  useEffect(() => {
    // `load` only writes state after its first await; the compiler rule scans
    // the whole async body and cannot see that boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const heatmapMax = useMemo(
    () => Math.max(1, ...(insights?.peakHours ?? []).map((cell) => cell.count)),
    [insights]
  );

  const heatmap = useMemo(() => {
    const grid = new Map<string, number>();
    for (const cell of insights?.peakHours ?? []) grid.set(`${cell.dow}:${cell.hour}`, cell.count);
    return grid;
  }, [insights]);

  const seriesMax = useMemo(
    () => Math.max(1, ...(insights?.series ?? []).map((point) => point.taps || point.visits)),
    [insights]
  );

  const metric: InsightMetric | null = insights?.current ?? null;
  const previous: InsightMetric | null = insights?.previous ?? null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[#FAF5EB]">تحليلات النمو</h2>
          <p className="text-[11px] text-[#A19E9B]">
            النقرات، الأختام، العملاء الجدد والعائدون، والاستبدال — محسوبة داخل قاعدة البيانات.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(event) => {
              setIsLoading(true);
              setDays(Number(event.target.value));
            }}
            className="rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-1.5 text-[11px] font-bold text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
          >
            <option value={7}>آخر ٧ أيام</option>
            <option value={30}>آخر ٣٠ يومًا</option>
            <option value={90}>آخر ٩٠ يومًا</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              void load();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-1.5 text-[11px] font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
          >
            <RefreshCw className="h-3 w-3" />
            تحديث
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs font-bold text-rose-200">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {isLoading && !insights ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#141212] p-8 text-xs text-[#A19E9B]">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ الحساب…
        </div>
      ) : insights && metric && previous ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="نقرات NFC"
              value={formatNumber(metric.taps)}
              current={metric.taps}
              previous={previous.taps}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              label="أختام ممنوحة"
              value={formatNumber(metric.stamps)}
              current={metric.stamps}
              previous={previous.stamps}
              icon={<Stamp className="h-4 w-4" />}
            />
            <MetricCard
              label="عملاء نشطون"
              value={formatNumber(metric.customers)}
              current={metric.customers}
              previous={previous.customers}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              label="معدل العودة"
              value={formatPercent(metric.returnRate)}
              current={metric.returnRate}
              previous={previous.returnRate}
              icon={<RefreshCw className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#141212] p-4">
              <p className="text-[11px] font-bold text-[#A19E9B]">عملاء جدد</p>
              <p className="mt-1 font-mono text-xl font-black text-[#FAF5EB]" dir="ltr">
                {formatNumber(metric.newCustomers)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#141212] p-4">
              <p className="text-[11px] font-bold text-[#A19E9B]">عملاء عائدون</p>
              <p className="mt-1 font-mono text-xl font-black text-[#FAF5EB]" dir="ltr">
                {formatNumber(metric.returningCustomers)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#141212] p-4">
              <p className="text-[11px] font-bold text-[#A19E9B]">مكافآت مستبدلة</p>
              <p className="mt-1 font-mono text-xl font-black text-[#FAF5EB]" dir="ltr">
                {formatNumber(metric.rewardsClaimed)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#141212] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black text-[#FAF5EB]">النشاط اليومي</p>
              <p className="text-[10px] text-[#A19E9B]">أعمدة ذهبية = نقرات، رمادية = زيارات</p>
            </div>
            <div className="flex h-32 items-end gap-1" dir="ltr">
              {(insights.series ?? []).slice(-30).map((point) => (
                <div
                  key={point.date}
                  className="group flex h-full flex-1 flex-col justify-end gap-0.5"
                  title={`${point.date} — ${point.taps} نقرة / ${point.visits} زيارة`}
                >
                  <div
                    className="w-full rounded-t bg-[#DFAB56]"
                    style={{ height: `${Math.max(2, (point.taps / seriesMax) * 70)}%` }}
                  />
                  <div
                    className="w-full rounded-t bg-white/20"
                    style={{ height: `${Math.max(2, (point.visits / seriesMax) * 30)}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#141212] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black text-[#FAF5EB]">ساعات الذروة</p>
              <p className="text-[10px] text-[#A19E9B]">أغمق = زيارات أكثر</p>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[560px]" dir="ltr">
                <div className="mb-1 flex gap-1 ps-14">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <span key={hour} className="flex-1 text-center text-[8px] text-[#6F6C69]">
                      {hour}
                    </span>
                  ))}
                </div>
                {DOW_LABELS.map((label, dow) => (
                  <div key={label} className="mb-1 flex items-center gap-1">
                    <span className="w-14 text-[9px] font-bold text-[#A19E9B]" dir="rtl">
                      {label}
                    </span>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const count = heatmap.get(`${dow}:${hour}`) ?? 0;
                      const intensity = count === 0 ? 0 : 0.15 + (count / heatmapMax) * 0.85;
                      return (
                        <div
                          key={hour}
                          title={`${label} ${hour}:00 — ${count} زيارة`}
                          className="h-4 flex-1 rounded-sm border border-white/5"
                          style={{ backgroundColor: `rgba(223, 171, 86, ${intensity})` }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#141212] p-4">
              <p className="mb-3 text-xs font-black text-[#FAF5EB]">مقارنة الفروع</p>
              <div className="space-y-2">
                {(insights.branches ?? []).map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-[#1C1B1B] px-3 py-2"
                  >
                    <span className="text-[11px] font-bold text-[#FAF5EB]">{branch.name}</span>
                    <span className="flex items-center gap-3 font-mono text-[10px] text-[#A19E9B]" dir="ltr">
                      <span>{formatNumber(branch.taps)} taps</span>
                      <span>{formatNumber(branch.customers)} guests</span>
                      <span>{formatNumber(branch.rewardsClaimed)} rewards</span>
                    </span>
                  </div>
                ))}
                {(insights.branches ?? []).length === 0 && (
                  <p className="text-[11px] text-[#6F6C69]">لا توجد فروع نشطة.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141212] p-4">
              <p className="mb-3 text-xs font-black text-[#FAF5EB]">أفضل العملاء</p>
              <div className="space-y-2">
                {(insights.topCustomers ?? []).map((customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-[#1C1B1B] px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-[11px] font-bold text-[#FAF5EB]">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DFAB56]/15 font-mono text-[9px] text-[#DFAB56]">
                        {index + 1}
                      </span>
                      {customer.name}
                    </span>
                    <span className="font-mono text-[10px] text-[#A19E9B]" dir="ltr">
                      {formatNumber(customer.stamps)} stamps
                    </span>
                  </div>
                ))}
                {(insights.topCustomers ?? []).length === 0 && (
                  <p className="text-[11px] text-[#6F6C69]">لا توجد زيارات في هذه الفترة.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#141212] p-8 text-center text-xs text-[#A19E9B]">
          لا توجد بيانات بعد. أول نقرة NFC ستظهر هنا.
        </div>
      )}
    </div>
  );
}
