'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  Store,
} from 'lucide-react';
import {
  DISCOVERY_AMENITIES,
  DISCOVERY_CATEGORIES,
  WEEKDAYS,
  type DiscoveryAmenity,
  type DiscoveryCategory,
  type OpeningHours,
  type WeekdayId,
} from '@/lib/discovery';
import { growthErrorMessage, growthFetch } from './api';
import type { DiscoveryBranch, DiscoveryOrganization } from './types';

interface DiscoveryPanelProps {
  canManage: boolean;
}

interface BranchDraft {
  isDiscoverable: boolean;
  description: string;
  phone: string;
  address: string;
  latitude: string;
  longitude: string;
  amenities: DiscoveryAmenity[];
  hours: Partial<Record<WeekdayId, { enabled: boolean; open: string; close: string }>>;
}

function toDraft(branch: DiscoveryBranch): BranchDraft {
  const hours: BranchDraft['hours'] = {};
  for (const day of WEEKDAYS) {
    const window = branch.openingHours?.[day.id];
    hours[day.id] = window
      ? { enabled: true, open: window.open, close: window.close }
      : { enabled: false, open: '09:00', close: '23:00' };
  }
  return {
    isDiscoverable: branch.isDiscoverable,
    description: branch.description ?? '',
    phone: branch.phone ?? '',
    address: branch.address ?? '',
    latitude: branch.latitude === null ? '' : String(branch.latitude),
    longitude: branch.longitude === null ? '' : String(branch.longitude),
    amenities: branch.amenities.filter((item): item is DiscoveryAmenity =>
      DISCOVERY_AMENITIES.some((amenity) => amenity.id === item)
    ),
    hours,
  };
}

function draftHours(draft: BranchDraft): OpeningHours {
  const hours: OpeningHours = {};
  for (const day of WEEKDAYS) {
    const window = draft.hours[day.id];
    if (window?.enabled) hours[day.id] = { open: window.open, close: window.close };
  }
  return hours;
}

export function DiscoveryPanel({ canManage }: DiscoveryPanelProps) {
  const router = useRouter();
  const [organization, setOrganization] = useState<DiscoveryOrganization | null>(null);
  const [branches, setBranches] = useState<DiscoveryBranch[]>([]);
  const [drafts, setDrafts] = useState<Record<string, BranchDraft>>({});
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<'organization' | 'branch' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State is written only after the request resolves, so mounting the panel
  // cannot cascade into a second render.
  const load = useCallback(async () => {
    try {
      const { ok, status, body } = await growthFetch<{
        organization: DiscoveryOrganization;
        branches: DiscoveryBranch[];
      }>('/api/v1/merchant/discovery');
      if (status === 401) {
        router.replace('/login');
        return;
      }
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر تحميل إعدادات الاكتشاف'));
      setOrganization(body.organization);
      setBranches(body.branches);
      setDrafts(Object.fromEntries(body.branches.map((branch) => [branch.id, toDraft(branch)])));
      setSelectedBranchId((current) =>
        current && body.branches.some((branch) => branch.id === current)
          ? current
          : (body.branches[0]?.id ?? '')
      );
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل إعدادات الاكتشاف');
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

  const draft = selectedBranchId ? drafts[selectedBranchId] : undefined;
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null;

  const activeHours = useMemo(
    () => (draft ? WEEKDAYS.filter((day) => draft.hours[day.id]?.enabled).length : 0),
    [draft]
  );

  const updateDraft = (patch: Partial<BranchDraft>) => {
    if (!selectedBranchId) return;
    setDrafts((current) => ({
      ...current,
      [selectedBranchId]: { ...current[selectedBranchId], ...patch },
    }));
  };

  const toggleAmenity = (amenity: DiscoveryAmenity) => {
    if (!draft) return;
    updateDraft({
      amenities: draft.amenities.includes(amenity)
        ? draft.amenities.filter((item) => item !== amenity)
        : [...draft.amenities, amenity],
    });
  };

  const saveOrganization = async () => {
    if (!organization) return;
    setNotice(null);
    setError(null);
    setSaving('organization');
    try {
      const { ok, body } = await growthFetch<{ saved: boolean }>(
        '/api/v1/merchant/discovery',
        {
          method: 'PATCH',
          body: JSON.stringify({
            organization: {
              category: organization.category,
              isDiscoverable: organization.isDiscoverable,
              headStartStamps: organization.headStartStamps,
            },
          }),
        }
      );
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر حفظ إعدادات الاكتشاف'));
      setNotice('تم حفظ إعدادات الظهور. التغيير يظهر في دليل الاكتشاف فورًا.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ إعدادات الاكتشاف');
    } finally {
      setSaving(null);
    }
  };

  const saveBranch = async () => {
    if (!selectedBranch || !draft) return;
    const latitude = draft.latitude.trim() === '' ? null : Number(draft.latitude);
    const longitude = draft.longitude.trim() === '' ? null : Number(draft.longitude);
    if (
      (latitude === null) !== (longitude === null) ||
      (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
    ) {
      setError('أدخل خط العرض وخط الطول معًا، بقيم صحيحة.');
      return;
    }
    const hours = draftHours(draft);
    for (const day of WEEKDAYS) {
      const window = hours[day.id];
      if (window && window.open === window.close) {
        setError(`${day.label}: وقت الفتح والإغلاق متطابقان.`);
        return;
      }
    }

    setNotice(null);
    setError(null);
    setSaving('branch');
    try {
      const { ok, body } = await growthFetch<{ saved: boolean }>(
        '/api/v1/merchant/discovery',
        {
          method: 'PATCH',
          body: JSON.stringify({
            branch: {
              id: selectedBranch.id,
              isDiscoverable: draft.isDiscoverable,
              description: draft.description.trim() || null,
              phone: draft.phone.trim() || null,
              address: draft.address.trim() || null,
              latitude,
              longitude,
              openingHours: hours,
              amenities: draft.amenities,
            },
          }),
        }
      );
      if (!ok) throw new Error(growthErrorMessage(body, 'تعذر حفظ بيانات الفرع'));
      setBranches((current) =>
        current.map((branch) =>
          branch.id === selectedBranch.id
            ? {
                ...branch,
                isDiscoverable: draft.isDiscoverable,
                description: draft.description.trim() || null,
                phone: draft.phone.trim() || null,
                address: draft.address.trim() || null,
                latitude,
                longitude,
                openingHours: hours,
                amenities: draft.amenities,
              }
            : branch
        )
      );
      setNotice('تم حفظ بيانات الفرع.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ بيانات الفرع');
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#141212] p-8 text-xs text-[#A19E9B]">
        <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[#FAF5EB]">الظهور في الاكتشاف</h2>
          <p className="text-[11px] leading-relaxed text-[#A19E9B]">
            يظهر فرعك في دليل العملاء القريب عندما تفعّل الظهور وتحدد الفئة والموقع. لا تُنشر
            أي بيانات عملاء — فقط اسم المنشأة وبيانات الفرع التي تكتبها هنا.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/discover"
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#141212] px-2.5 py-1.5 text-[11px] font-bold text-[#A19E9B] hover:text-[#FAF5EB]"
          >
            <ExternalLink className="h-3.5 w-3.5" /> معاينة الدليل
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              void load();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#141212] px-2.5 py-1.5 text-[11px] font-bold text-[#A19E9B] hover:text-[#FAF5EB]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> تحديث
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-[11px] text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-[11px] text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
        </div>
      )}

      {organization && (
        <section className="space-y-3 rounded-2xl border border-white/10 bg-[#141212] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-[#FAF5EB]">
              <Store className="h-4 w-4 text-[#DFAB56]" /> المنشأة
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-[#A19E9B]">
              <input
                type="checkbox"
                checked={organization.isDiscoverable}
                disabled={!canManage}
                onChange={(event) =>
                  setOrganization({ ...organization, isDiscoverable: event.target.checked })
                }
                className="h-4 w-4 accent-[#DFAB56]"
              />
              أظهر المنشأة في الدليل
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[11px] font-bold text-[#A19E9B]">
              الفئة
              <select
                value={organization.category ?? ''}
                disabled={!canManage}
                onChange={(event) =>
                  setOrganization({
                    ...organization,
                    category: (event.target.value || null) as DiscoveryCategory | null,
                  })
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              >
                <option value="">بدون فئة</option>
                {DISCOVERY_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-[11px] font-bold text-[#A19E9B]">
              أختام ترحيبية لأول نقرة: {organization.headStartStamps}
              <input
                type="range"
                min={0}
                max={10}
                value={organization.headStartStamps}
                disabled={!canManage}
                onChange={(event) =>
                  setOrganization({
                    ...organization,
                    headStartStamps: Number(event.target.value),
                  })
                }
                className="mt-2 w-full accent-[#DFAB56]"
              />
              <span className="mt-1 block text-[10px] font-normal text-[#6F6C69]">
                تُمنح مرة واحدة فقط لكل عميل في منشأتك، وليست ختمًا متكررًا.
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => void saveOrganization()}
            disabled={!canManage || saving !== null}
            className="flex items-center gap-2 rounded-lg bg-[#DFAB56] px-3 py-2 text-[11px] font-black text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
          >
            {saving === 'organization' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            حفظ إعدادات المنشأة
          </button>
        </section>
      )}

      {selectedBranch && draft && (
        <section className="space-y-3 rounded-2xl border border-white/10 bg-[#141212] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-[#FAF5EB]">
              <MapPin className="h-4 w-4 text-[#DFAB56]" /> بيانات الفرع
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedBranchId}
                onChange={(event) => setSelectedBranchId(event.target.value)}
                className="rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-1.5 text-[11px] font-bold text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-[#A19E9B]">
                <input
                  type="checkbox"
                  checked={draft.isDiscoverable}
                  disabled={!canManage}
                  onChange={(event) => updateDraft({ isDiscoverable: event.target.checked })}
                  className="h-4 w-4 accent-[#DFAB56]"
                />
                ظاهر
              </label>
            </div>
          </div>

          <label className="block text-[11px] font-bold text-[#A19E9B]">
            وصف قصير
            <textarea
              value={draft.description}
              maxLength={240}
              rows={2}
              disabled={!canManage}
              onChange={(event) => updateDraft({ description: event.target.value })}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
            <span className="mt-1 block text-[10px] font-normal text-[#6F6C69]">
              {draft.description.length}/240
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[11px] font-bold text-[#A19E9B]">
              هاتف الفرع
              <input
                dir="ltr"
                value={draft.phone}
                maxLength={24}
                disabled={!canManage}
                onChange={(event) => updateDraft({ phone: event.target.value })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 font-mono text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </label>
            <label className="text-[11px] font-bold text-[#A19E9B]">
              العنوان
              <input
                value={draft.address}
                maxLength={200}
                disabled={!canManage}
                onChange={(event) => updateDraft({ address: event.target.value })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </label>
            <label className="text-[11px] font-bold text-[#A19E9B]">
              خط العرض
              <input
                dir="ltr"
                inputMode="decimal"
                value={draft.latitude}
                disabled={!canManage}
                onChange={(event) => updateDraft({ latitude: event.target.value })}
                placeholder="24.7136"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 font-mono text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </label>
            <label className="text-[11px] font-bold text-[#A19E9B]">
              خط الطول
              <input
                dir="ltr"
                inputMode="decimal"
                value={draft.longitude}
                disabled={!canManage}
                onChange={(event) => updateDraft({ longitude: event.target.value })}
                placeholder="46.6753"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 font-mono text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-[#A19E9B]">ساعات العمل</p>
              <span className="text-[10px] text-[#6F6C69]">{activeHours} أيام مفعّلة</span>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {WEEKDAYS.map((day) => {
                const window = draft.hours[day.id] ?? {
                  enabled: false,
                  open: '09:00',
                  close: '23:00',
                };
                return (
                  <div
                    key={day.id}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1C1B1B] px-2 py-1.5"
                  >
                    <label className="flex w-20 shrink-0 items-center gap-1.5 text-[11px] font-bold text-[#A19E9B]">
                      <input
                        type="checkbox"
                        checked={window.enabled}
                        disabled={!canManage}
                        onChange={(event) =>
                          updateDraft({
                            hours: {
                              ...draft.hours,
                              [day.id]: { ...window, enabled: event.target.checked },
                            },
                          })
                        }
                        className="h-3.5 w-3.5 accent-[#DFAB56]"
                      />
                      {day.label}
                    </label>
                    <input
                      type="time"
                      value={window.open}
                      disabled={!canManage || !window.enabled}
                      onChange={(event) =>
                        updateDraft({
                          hours: {
                            ...draft.hours,
                            [day.id]: { ...window, open: event.target.value },
                          },
                        })
                      }
                      className="w-full rounded border border-white/10 bg-[#141212] px-1.5 py-1 font-mono text-[10px] text-[#FAF5EB] disabled:opacity-40"
                    />
                    <span className="text-[10px] text-[#6F6C69]">–</span>
                    <input
                      type="time"
                      value={window.close}
                      disabled={!canManage || !window.enabled}
                      onChange={(event) =>
                        updateDraft({
                          hours: {
                            ...draft.hours,
                            [day.id]: { ...window, close: event.target.value },
                          },
                        })
                      }
                      className="w-full rounded border border-white/10 bg-[#141212] px-1.5 py-1 font-mono text-[10px] text-[#FAF5EB] disabled:opacity-40"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-[#A19E9B]">المرافق</p>
            <div className="flex flex-wrap gap-1.5">
              {DISCOVERY_AMENITIES.map((amenity) => {
                const active = draft.amenities.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    disabled={!canManage}
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                      active
                        ? 'border-[#DFAB56] bg-[#DFAB56]/15 text-[#DFAB56]'
                        : 'border-white/10 bg-[#1C1B1B] text-[#A19E9B] hover:text-[#FAF5EB]'
                    } disabled:opacity-50`}
                  >
                    {amenity.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void saveBranch()}
            disabled={!canManage || saving !== null}
            className="flex items-center gap-2 rounded-lg bg-[#DFAB56] px-3 py-2 text-[11px] font-black text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
          >
            {saving === 'branch' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            حفظ بيانات الفرع
          </button>
        </section>
      )}

      {branches.length === 0 && (
        <p className="rounded-xl border border-white/10 bg-[#141212] p-4 text-[11px] text-[#A19E9B]">
          لا يوجد فرع بعد. أنشئ فرعًا من الإعدادات ثم ارجع لتفعيل الظهور.
        </p>
      )}
    </div>
  );
}
