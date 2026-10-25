'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Users,
  Image as ImageIcon,
  MapPin,
  Store,
  CheckCircle2,
  Ban,
  RotateCcw,
  ArrowRight,
  Layers,
  Activity,
} from 'lucide-react';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  customers: number;
  memories: number;
  visits: number;
}

interface Telemetry {
  totalTenants: number;
  activeTenants: number;
  customers: number;
  memories: number;
  visits: number;
}

interface ApiErrorBody {
  error?: string;
  message?: string;
  code?: string;
}

export default function SuperAdminPortalPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [busyTenantId, setBusyTenantId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/admin/tenants', { cache: 'no-store' });
      if (response.status === 401) {
        window.location.assign('/login');
        return;
      }
      if (response.status === 403) {
        setForbidden(true);
        setLoadError(null);
        return;
      }
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        tenants?: Tenant[];
        telemetry?: Telemetry;
      };
      if (!response.ok) throw new Error(body.error || 'تعذر تحميل بيانات المنشآت');
      setTenants(body.tenants ?? []);
      setTelemetry(body.telemetry ?? null);
      setForbidden(false);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'تعذر تحميل بيانات المنشآت');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    setForbidden(false);
    void load();
  }, [load]);

  useEffect(() => {
    // The first paint already renders the loading state; fetching inside a
    // local async function keeps the effect free of synchronous setState.
    const boot = async () => {
      await load();
    };
    void boot();
  }, [load]);

  const changeStatus = async (tenant: Tenant, status: 'active' | 'suspended') => {
    const verb = status === 'suspended' ? 'تعليق' : 'إعادة تنشيط';
    if (!window.confirm(`${verb} منشأة «${tenant.name}»؟`)) return;
    setBusyTenantId(tenant.id);
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/v1/admin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenant.id, status }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      if (response.status === 401) {
        window.location.assign('/login');
        return;
      }
      if (!response.ok) throw new Error(body.error || `تعذر ${verb} المنشأة`);
      setNotice(`تم ${verb} منشأة «${tenant.name}»`);
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : `تعذر ${verb} المنشأة`);
    } finally {
      setBusyTenantId(null);
    }
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tenants.filter((tenant) => {
      if (statusFilter !== 'all' && tenant.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        tenant.name.toLowerCase().includes(needle) || tenant.slug.toLowerCase().includes(needle)
      );
    });
  }, [tenants, query, statusFilter]);

  return (
    <div className="min-h-screen bg-[#0B0A0A] font-sans text-[#FAF5EB]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0E0D0D]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#DFAB56] to-[#3D2314] shadow-lg">
              <MemoriesArchIcon size={22} color="#FAF5EB" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-sm font-bold text-[#FAF5EB]">
                  Memories • بوابة الإدارة المركزية
                </h1>
                <span className="rounded-md border border-[#DFAB56]/40 bg-[#3D2314]/60 px-2 py-0.5 font-mono text-[10px] font-bold text-[#FAF5EB]">
                  PLATFORM
                </span>
              </div>
              <p className="text-[11px] text-[#A19E9B]">
                نظرة حقيقية على المنشآت المسجلة، مع تعليق أو إعادة تنشيط أي حساب.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-1.5 text-[11px] font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-1.5 text-[11px] font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
            >
              <ArrowRight className="h-3 w-3" />
              لوحة المنشأة
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6">
        {forbidden && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/30 p-8 text-center">
            <Shield className="h-8 w-8 text-amber-300" />
            <h2 className="text-sm font-bold text-amber-100">ليست لديك صلاحية الوصول</h2>
            <p className="max-w-md text-xs text-amber-200/80">
              بوابة الإدارة متاحة فقط لعناوين البريد المدرجة في قائمة{' '}
              <span className="font-mono" dir="ltr">
                SUPER_ADMIN_EMAILS
              </span>
              . تواصل مع مالك المنصة لإضافتك.
            </p>
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#DFAB56] px-4 py-2 text-xs font-bold text-[#12100E]"
            >
              العودة إلى لوحة المنشأة
            </Link>
          </div>
        )}

        {!forbidden && (
          <>
            {notice && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs font-bold text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}
            {actionError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs font-bold text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            {loadError && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/30 bg-[#141212] p-6 text-center">
                <AlertCircle className="h-6 w-6 text-rose-300" />
                <p className="text-xs text-rose-200">{loadError}</p>
                <button
                  type="button"
                  onClick={refresh}
                  className="flex items-center gap-2 rounded-lg bg-[#DFAB56] px-4 py-2 text-xs font-bold text-[#12100E]"
                >
                  <RefreshCw className="h-4 w-4" />
                  إعادة المحاولة
                </button>
              </div>
            )}

            {!loadError && (
              <>
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <MetricCard
                    label="إجمالي المنشآت"
                    value={telemetry?.totalTenants ?? 0}
                    icon={<Layers className="h-4 w-4 text-[#DFAB56]" />}
                  />
                  <MetricCard
                    label="منشآت نشطة"
                    value={telemetry?.activeTenants ?? 0}
                    icon={<Activity className="h-4 w-4 text-emerald-400" />}
                  />
                  <MetricCard
                    label="العملاء"
                    value={telemetry?.customers ?? 0}
                    icon={<Users className="h-4 w-4 text-sky-400" />}
                  />
                  <MetricCard
                    label="الذكريات"
                    value={telemetry?.memories ?? 0}
                    icon={<ImageIcon className="h-4 w-4 text-[#DFAB56]" />}
                  />
                  <MetricCard
                    label="الزيارات الموثقة"
                    value={telemetry?.visits ?? 0}
                    icon={<MapPin className="h-4 w-4 text-rose-300" />}
                  />
                </section>

                <section className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#141212] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A19E9B]" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="ابحث بالاسم أو الرابط"
                      className="w-full rounded-lg border border-white/10 bg-[#1C1B1B] py-2 pe-3 ps-8 text-[11px] text-[#FAF5EB] placeholder:text-[#A19E9B]/60 focus:border-[#DFAB56] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'الكل' },
                        { id: 'active', label: 'نشطة' },
                        { id: 'suspended', label: 'معلّقة' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatusFilter(tab.id)}
                        className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition ${
                          statusFilter === tab.id
                            ? 'border-[#DFAB56] bg-[#DFAB56] text-[#12100E]'
                            : 'border-white/10 bg-[#1C1B1B] text-[#A19E9B] hover:text-[#FAF5EB]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141212] shadow-xl">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 p-10 text-xs text-[#A19E9B]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري تحميل المنشآت...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 p-10 text-center">
                      <Store className="h-7 w-7 text-[#A19E9B]" />
                      <p className="text-xs text-[#A19E9B]">
                        {tenants.length === 0
                          ? 'لا توجد منشآت مسجلة بعد.'
                          : 'لا توجد منشآت مطابقة للبحث.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-start text-xs">
                        <thead className="border-b border-white/10 bg-[#0B0A0A] text-[10px] uppercase tracking-wide text-[#A19E9B]">
                          <tr>
                            <th className="px-4 py-3 text-start font-bold">المنشأة</th>
                            <th className="px-4 py-3 text-start font-bold">الحالة</th>
                            <th className="px-4 py-3 text-start font-bold">العملاء</th>
                            <th className="px-4 py-3 text-start font-bold">الذكريات</th>
                            <th className="px-4 py-3 text-start font-bold">الزيارات</th>
                            <th className="px-4 py-3 text-start font-bold">تاريخ الإنشاء</th>
                            <th className="px-4 py-3 text-start font-bold">إجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((tenant) => {
                            const active = tenant.status === 'active';
                            return (
                              <tr
                                key={tenant.id}
                                className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#1C1B1B] text-[#DFAB56]">
                                      <Store className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-[#FAF5EB]">{tenant.name}</div>
                                      <div
                                        className="font-mono text-[10px] text-[#A19E9B]"
                                        dir="ltr"
                                      >
                                        /c/{tenant.slug}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                                      active
                                        ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
                                        : 'border-amber-500/30 bg-amber-950/40 text-amber-200'
                                    }`}
                                  >
                                    {active ? (
                                      <CheckCircle2 className="h-3 w-3" />
                                    ) : (
                                      <Ban className="h-3 w-3" />
                                    )}
                                    {active ? 'نشطة' : 'معلّقة'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-[#FAF5EB]">
                                  {tenant.customers}
                                </td>
                                <td className="px-4 py-3 font-mono text-[#FAF5EB]">
                                  {tenant.memories}
                                </td>
                                <td className="px-4 py-3 font-mono text-[#FAF5EB]">
                                  {tenant.visits}
                                </td>
                                <td className="px-4 py-3 font-mono text-[10px] text-[#A19E9B]">
                                  {new Date(tenant.createdAt).toLocaleDateString('ar-SA')}
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    type="button"
                                    disabled={busyTenantId === tenant.id}
                                    onClick={() =>
                                      void changeStatus(tenant, active ? 'suspended' : 'active')
                                    }
                                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition disabled:opacity-50 ${
                                      active
                                        ? 'border-amber-500/30 bg-amber-950/30 text-amber-200 hover:bg-amber-950/60'
                                        : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-950/60'
                                    }`}
                                  >
                                    {busyTenantId === tenant.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : active ? (
                                      <Ban className="h-3 w-3" />
                                    ) : (
                                      <RotateCcw className="h-3 w-3" />
                                    )}
                                    {active ? 'تعليق' : 'إعادة تنشيط'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <p className="text-center text-[10px] text-[#A19E9B]">
                  كل الأرقام مقروءة مباشرة من قاعدة البيانات عبر{' '}
                  <span className="font-mono" dir="ltr">
                    platform_tenant_overview()
                  </span>
                  . لا توجد بيانات تجريبية.
                </p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#141212] p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#A19E9B]">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-[#1C1B1B]">
          {icon}
        </span>
      </div>
      <div className="mt-2 font-mono text-2xl font-bold text-[#FAF5EB]">
        {value.toLocaleString('en-US')}
      </div>
    </div>
  );
}
