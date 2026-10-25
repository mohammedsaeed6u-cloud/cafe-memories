'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  Store,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { BusinessSettings } from '@/types/photobooth';

import { DashboardNavBar, type DashboardTab } from '@/components/dashboard/DashboardNavBar';
import {
  DashboardOverviewTab,
  type OverviewMetrics,
} from '@/components/dashboard/DashboardOverviewTab';
import {
  DashboardMemoriesTab,
  type MemoryItem,
} from '@/components/dashboard/DashboardMemoriesTab';
import { DashboardWallTab, type ScreenRecord } from '@/components/dashboard/DashboardWallTab';
import {
  DashboardRewardsTab,
  type RewardRule,
} from '@/components/dashboard/DashboardRewardsTab';
import { DashboardQrTab } from '@/components/dashboard/DashboardQrTab';
import { CustomersTab } from '@/components/dashboard/CustomersTab';
import { StaffTab } from '@/components/dashboard/StaffTab';
import { PrintTab } from '@/components/dashboard/PrintTab';
import { SettingsTab } from '@/components/dashboard/SettingsTab';

interface BranchRecord {
  id: string;
  slug: string;
  name: string;
  address: string | null;
}

interface OrganizationRecord {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  tagline: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  frameStyle: string | null;
  walletColorPreset: string | null;
  socialLinks: Record<string, string> | null;
  timezone: string;
  currency: string;
}

interface MerchantContextResponse {
  source: 'merchant' | 'staff';
  memberId: string | null;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  organization: OrganizationRecord;
  branch: BranchRecord | null;
  branches: BranchRecord[];
  settings: BusinessSettings;
  rewardRule: {
    id: string;
    name: string;
    threshold: number;
    reward_type: string;
    reward_value: string | null;
    reward_description: string | null;
    is_active: boolean;
  } | null;
}

interface ApiErrorBody {
  error?: string;
  message?: string;
  code?: string;
}

async function getJson<T>(url: string): Promise<{ ok: boolean; status: number; body: T & ApiErrorBody }> {
  const response = await fetch(url, { cache: 'no-store' });
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  return { ok: response.ok, status: response.status, body };
}

export default function MerchantDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [context, setContext] = useState<MerchantContextResponse | null>(null);
  const [branchId, setBranchId] = useState<string>('');

  const [isBooting, setIsBooting] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [memoryNotice, setMemoryNotice] = useState<string | null>(null);

  const [screens, setScreens] = useState<ScreenRecord[]>([]);
  const [isLoadingScreens, setIsLoadingScreens] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpiresAt, setPairingExpiresAt] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isSavingWall, setIsSavingWall] = useState(false);
  const [wallNotice, setWallNotice] = useState<string | null>(null);
  const [wallError, setWallError] = useState<string | null>(null);

  const [rewardRule, setRewardRule] = useState<RewardRule | null>(null);
  const [isSavingReward, setIsSavingReward] = useState(false);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);

  const [printQueueCount, setPrintQueueCount] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const branchQuery = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
  const branchQueryJoin = branchId ? `&branchId=${encodeURIComponent(branchId)}` : '';

  const handleUnauthorized = useCallback((status: number) => {
    if (status === 401) {
      window.location.assign('/login');
      return true;
    }
    return false;
  }, []);

  /* ------------------------------- bootstrap ------------------------------ */

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setIsBooting(true);
      setBootError(null);
      try {
        const { ok, status, body } = await getJson<MerchantContextResponse>(
          '/api/v1/merchant/context'
        );
        if (cancelled) return;
        if (status === 401) {
          window.location.assign('/login');
          return;
        }
        if (!ok) {
          if (body.code === 'membership_required') {
            setNeedsOnboarding(true);
            return;
          }
          throw new Error(body.error || 'تعذر تحميل بيانات المنشأة');
        }
        setContext(body);
        setBranchId(body.branch?.id ?? '');
        if (body.rewardRule) {
          setRewardRule({
            id: body.rewardRule.id,
            name: body.rewardRule.name,
            threshold: body.rewardRule.threshold,
            rewardType: body.rewardRule.reward_type,
            rewardValue: body.rewardRule.reward_value,
            rewardDescription: body.rewardRule.reward_description,
            isActive: body.rewardRule.is_active,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setBootError(error instanceof Error ? error.message : 'تعذر تحميل البيانات');
        }
      } finally {
        if (!cancelled) setIsBooting(false);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  /* -------------------------------- loaders ------------------------------- */

  const loadMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    setMetricsError(null);
    try {
      const { ok, status, body } = await getJson<{ metrics: OverviewMetrics }>(
        `/api/v1/analytics/overview${branchQuery}`
      );
      if (handleUnauthorized(status)) return;
      if (!ok || !body.metrics) throw new Error(body.error || 'تعذر تحميل المؤشرات');
      setMetrics(body.metrics);
    } catch (error) {
      setMetricsError(error instanceof Error ? error.message : 'تعذر تحميل المؤشرات');
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [branchQuery, handleUnauthorized]);

  const loadMemories = useCallback(async () => {
    setIsLoadingMemories(true);
    try {
      const { ok, status, body } = await getJson<{
        memories: Array<{
          id: string;
          customerName: string;
          imageUrl: string | null;
          thumbnailUrl: string | null;
          caption: string | null;
          status: MemoryItem['status'];
          visibility: string;
          createdAt: string;
        }>;
      }>(`/api/v1/memories?scope=merchant&limit=100${branchQueryJoin}`);
      if (handleUnauthorized(status)) return;
      if (!ok) throw new Error(body.error || 'تعذر تحميل الذكريات');
      setMemories(
        (body.memories ?? []).map((memory) => ({
          id: memory.id,
          customerName: memory.customerName,
          originalUrl: memory.imageUrl || memory.thumbnailUrl || '',
          status: memory.status,
          visibility: memory.visibility,
          caption: memory.caption ?? undefined,
          createdAt: memory.createdAt,
        }))
      );
    } catch (error) {
      setMemoryNotice(error instanceof Error ? error.message : 'تعذر تحميل الذكريات');
    } finally {
      setIsLoadingMemories(false);
    }
  }, [branchQueryJoin, handleUnauthorized]);

  const loadScreens = useCallback(async () => {
    setIsLoadingScreens(true);
    try {
      const { ok, status, body } = await getJson<{ screens: ScreenRecord[] }>(
        `/api/v1/merchant/screens${branchQuery}`
      );
      if (handleUnauthorized(status)) return;
      if (!ok) throw new Error(body.error || 'تعذر تحميل الشاشات');
      setScreens(body.screens ?? []);
    } catch (error) {
      setWallError(error instanceof Error ? error.message : 'تعذر تحميل الشاشات');
    } finally {
      setIsLoadingScreens(false);
    }
  }, [branchQuery, handleUnauthorized]);

  const loadReward = useCallback(async () => {
    try {
      const { ok, status, body } = await getJson<{ activeRule: RewardRule | null }>(
        '/api/v1/merchant/rewards'
      );
      if (handleUnauthorized(status)) return;
      if (!ok) throw new Error(body.error || 'تعذر تحميل قاعدة المكافأة');
      setRewardRule(body.activeRule);
    } catch (error) {
      setRewardError(error instanceof Error ? error.message : 'تعذر تحميل قاعدة المكافأة');
    }
  }, [handleUnauthorized]);

  const loadPrintCount = useCallback(async () => {
    try {
      const { ok, status, body } = await getJson<{ jobs: unknown[] }>(
        `/api/v1/print/jobs?status=pending&limit=100${branchQueryJoin}`
      );
      if (handleUnauthorized(status)) return;
      if (ok) setPrintQueueCount(body.jobs?.length ?? 0);
    } catch {
      /* the badge is best effort */
    }
  }, [branchQueryJoin, handleUnauthorized]);

  useEffect(() => {
    if (!context) return;
    // Fetching inside a local async function keeps the effect body free of
    // synchronous setState calls (React's cascading-render rule).
    const run = async () => {
      await Promise.allSettled([
        loadMetrics(),
        loadMemories(),
        loadScreens(),
        loadPrintCount(),
      ]);
    };
    void run();
  }, [context, branchId, loadMetrics, loadMemories, loadScreens, loadPrintCount]);

  /* -------------------------------- actions ------------------------------- */

  const moderateMemory = async (
    id: string,
    status: 'approved' | 'rejected' | 'hidden'
  ) => {
    setMemoryNotice(null);
    try {
      const response = await fetch('/api/v1/memories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: id, status }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      if (!response.ok) throw new Error(body.error || 'تعذر تحديث الذكرى');
      setMemories((previous) =>
        previous.map((memory) => (memory.id === id ? { ...memory, status } : memory))
      );
      void loadMetrics();
    } catch (error) {
      setMemoryNotice(error instanceof Error ? error.message : 'تعذر تحديث الذكرى');
    }
  };

  const deleteMemory = async (id: string) => {
    if (!window.confirm('حذف هذه الذكرى نهائياً من لوحة التحكم؟')) return;
    setMemoryNotice(null);
    try {
      const response = await fetch(`/api/v1/memories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      if (!response.ok) throw new Error(body.error || 'تعذر حذف الذكرى');
      setMemories((previous) => previous.filter((memory) => memory.id !== id));
      void loadMetrics();
    } catch (error) {
      setMemoryNotice(error instanceof Error ? error.message : 'تعذر حذف الذكرى');
    }
  };

  const batchModerate = async (status: 'approved' | 'hidden') => {
    const targets = memories.filter((memory) =>
      status === 'approved' ? memory.status === 'pending' : memory.status !== 'hidden'
    );
    if (targets.length === 0) {
      setMemoryNotice('لا توجد ذكريات تحتاج هذا الإجراء');
      return;
    }
    setMemoryNotice(`جاري تحديث ${targets.length} ذكرى...`);
    for (const memory of targets) {
      await moderateMemory(memory.id, status);
    }
    setMemoryNotice(`تم تحديث ${targets.length} ذكرى`);
    void loadMetrics();
  };

  const generatePairingCode = async () => {
    setIsGeneratingCode(true);
    setWallNotice(null);
    setWallError(null);
    try {
      const response = await fetch('/api/v1/screens/pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchId ? { branchId } : {}),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        code?: string;
        expiresAt?: string;
      };
      if (!response.ok || !body.code) throw new Error(body.error || 'تعذر توليد رمز الاقتران');
      setPairingCode(body.code);
      setPairingExpiresAt(body.expiresAt ?? null);
    } catch (error) {
      setWallError(error instanceof Error ? error.message : 'تعذر توليد رمز الاقتران');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const unpairScreen = async (screenId: string) => {
    if (!window.confirm('إلغاء اقتران هذه الشاشة؟ ستحتاج إلى رمز جديد لإعادة ربطها.')) return;
    setWallNotice(null);
    setWallError(null);
    try {
      const response = await fetch(
        `/api/v1/merchant/screens?id=${encodeURIComponent(screenId)}`,
        { method: 'DELETE' }
      );
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      if (!response.ok) throw new Error(body.error || 'تعذر إلغاء الاقتران');
      setWallNotice('تم إلغاء اقتران الشاشة');
      await loadScreens();
    } catch (error) {
      setWallError(error instanceof Error ? error.message : 'تعذر إلغاء الاقتران');
    }
  };

  const patchWallSettings = async (updates: {
    blackout?: boolean;
    slideIntervalSeconds?: number;
  }) => {
    if (!context) return;
    const currentWall = context.settings.wallSettings;
    setIsSavingWall(true);
    setWallNotice(null);
    setWallError(null);
    try {
      const response = await fetch('/api/v1/merchant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            wallSettings: {
              mode: currentWall?.mode ?? 'slideshow',
              slideIntervalSeconds:
                updates.slideIntervalSeconds ?? currentWall?.slideIntervalSeconds ?? 8,
              blackout: updates.blackout ?? currentWall?.blackout ?? false,
            },
          },
        }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        settings?: BusinessSettings;
      };
      if (!response.ok || !body.settings) {
        throw new Error(body.error || 'تعذر حفظ إعدادات الشاشة');
      }
      setContext({ ...context, settings: body.settings });
      setWallNotice('تم تحديث إعدادات الشاشة');
    } catch (error) {
      setWallError(error instanceof Error ? error.message : 'تعذر حفظ إعدادات الشاشة');
    } finally {
      setIsSavingWall(false);
    }
  };

  const saveReward = async (rule: Omit<RewardRule, 'id' | 'isActive'>) => {
    setIsSavingReward(true);
    setRewardNotice(null);
    setRewardError(null);
    try {
      const response = await fetch('/api/v1/merchant/rewards', {
        method: rewardRule?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(rewardRule?.id ? { id: rewardRule.id } : {}),
          name: rule.name,
          description: rule.description,
          threshold: rule.threshold,
          rewardType: rule.rewardType,
          rewardValue: rule.rewardValue,
          rewardDescription: rule.rewardDescription,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        rule?: RewardRule;
      };
      if (!response.ok || !body.rule) {
        throw new Error(body.error || 'تعذر حفظ قاعدة المكافأة');
      }
      setRewardRule(body.rule);
      setRewardNotice('تم حفظ قاعدة المكافأة');
      await loadMetrics();
    } catch (error) {
      setRewardError(error instanceof Error ? error.message : 'تعذر حفظ قاعدة المكافأة');
    } finally {
      setIsSavingReward(false);
    }
  };

  const copyCustomerUrl = async () => {
    if (!context) return;
    const url = `${window.location.origin}/c/${context.organization.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(false);
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/v1/staff-session', { method: 'DELETE' });
    } catch {
      /* the cookie is cleared server-side when possible */
    }
    try {
      await createClient().auth.signOut();
    } catch {
      /* redirect anyway */
    }
    window.location.assign('/login');
  };

  const canManage = useMemo(
    () => Boolean(context && ['owner', 'admin', 'manager'].includes(context.role)),
    [context]
  );

  const customerLiveUrl = useMemo(
    () => (context ? `${window.location.origin}/c/${context.organization.slug}` : ''),
    [context]
  );

  /* -------------------------------- render -------------------------------- */

  if (isBooting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0A0A] text-[#FAF5EB]">
        <div className="flex items-center gap-2 text-xs text-[#A19E9B]">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري تحميل لوحة التحكم...
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingPanel onDone={() => window.location.reload()} />;
  }

  if (bootError || !context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0A0A] p-6 text-[#FAF5EB]">
        <div className="max-w-md space-y-4 rounded-2xl border border-rose-500/30 bg-[#141212] p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-300" />
          <h1 className="text-base font-bold">تعذر تحميل لوحة التحكم</h1>
          <p className="text-xs text-[#A19E9B]">{bootError ?? 'حدث خطأ غير متوقع'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mx-auto flex items-center gap-2 rounded-lg bg-[#DFAB56] px-4 py-2 text-xs font-bold text-[#12100E]"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0A0A] pb-16 font-sans text-[#FAF5EB]">
      <DashboardNavBar
        settings={context.settings}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSignOut={signOut}
        printQueueCount={printQueueCount}
        pendingMemoriesCount={
          metrics?.attentionCenter.pendingMemories ??
          memories.filter((memory) => memory.status === 'pending').length
        }
        role={context.role}
      />

      <main className="mx-auto max-w-7xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#141212] px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-[#FAF5EB]">
              <Store className="h-3.5 w-3.5 text-[#DFAB56]" />
              {context.organization.name}
            </span>
            <span className="font-mono text-[10px] text-[#A19E9B]" dir="ltr">
              /c/{context.organization.slug}
            </span>
            <span className="rounded-md border border-white/10 bg-[#1C1B1B] px-2 py-0.5 font-mono text-[10px] text-[#A19E9B]">
              {context.organization.currency} • {context.organization.timezone}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {context.branches.length > 0 && (
              <label className="flex items-center gap-2 text-[11px] text-[#A19E9B]">
                الفرع
                <select
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                  className="rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-1.5 text-[11px] font-bold text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
                >
                  <option value="">كل الفروع</option>
                  {context.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              onClick={() => {
                void loadMetrics();
                void loadMemories();
                void loadScreens();
                void loadPrintCount();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-1.5 text-[11px] font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
            >
              <RefreshCw className="h-3 w-3" />
              تحديث
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <DashboardOverviewTab
            settings={context.settings}
            metrics={metrics}
            isLoadingMetrics={isLoadingMetrics}
            onRefreshMetrics={() => void loadMetrics()}
            customerLiveUrl={customerLiveUrl}
            copiedUrl={copiedUrl}
            onCopyUrl={() => void copyCustomerUrl()}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'memories' && (
          <DashboardMemoriesTab
            memories={memories}
            isLoadingMemories={isLoadingMemories}
            onModerateMemory={(id, status) => void moderateMemory(id, status)}
            onDeleteMemory={(id) => void deleteMemory(id)}
            onBatchApprove={() => void batchModerate('approved')}
            onBatchHideAll={() => void batchModerate('hidden')}
            onRefresh={() => void loadMemories()}
            batchActionMsg={memoryNotice}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersTab rewardRuleId={rewardRule?.id ?? null} canManage={canManage} />
        )}

        {activeTab === 'wall' && (
          <DashboardWallTab
            screens={screens}
            isLoadingScreens={isLoadingScreens}
            pairingCode={pairingCode}
            pairingExpiresAt={pairingExpiresAt}
            isGeneratingCode={isGeneratingCode}
            onGenerateCode={() => void generatePairingCode()}
            isTvBlackout={Boolean(context.settings.wallSettings?.blackout)}
            tvSlideDuration={(context.settings.wallSettings?.slideIntervalSeconds ?? 8) * 1000}
            onToggleBlackout={() =>
              void patchWallSettings({
                blackout: !context.settings.wallSettings?.blackout,
              })
            }
            onChangeSlideDuration={(durationMs) =>
              void patchWallSettings({ slideIntervalSeconds: Math.round(durationMs / 1000) })
            }
            onUnpairScreen={(screenId) => void unpairScreen(screenId)}
            onRefreshScreens={() => void loadScreens()}
            wallUrl="/wall"
            notice={wallNotice}
            error={wallError}
            isSavingWall={isSavingWall}
          />
        )}

        {activeTab === 'rewards' && (
          <DashboardRewardsTab
            rule={rewardRule}
            onSave={saveReward}
            isSaving={isSavingReward}
            success={rewardNotice}
            error={rewardError}
          />
        )}

        {activeTab === 'staff' && (
          <StaffTab
            branches={context.branches}
            currentMemberId={context.memberId}
            canManage={canManage}
          />
        )}

        {activeTab === 'print' && <PrintTab canManage={canManage} />}

        {activeTab === 'qrcodes' && (
          <DashboardQrTab settings={context.settings} customerLiveUrl={customerLiveUrl} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            organization={context.organization}
            settings={context.settings}
            canManage={canManage}
            onSaved={(settings) => setContext({ ...context, settings })}
          />
        )}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Onboarding fallback                                                        */
/* -------------------------------------------------------------------------- */

function OnboardingPanel({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [branchName, setBranchName] = useState('الفرع الرئيسي');
  const [rewardTitle, setRewardTitle] = useState('هدية ترحيبية عند اكتمال البطاقة');
  const [totalStamps, setTotalStamps] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          businessName: businessName.trim(),
          slug: slug.trim().toLowerCase(),
          branchName: branchName.trim(),
          totalStamps,
          rewardTitle: rewardTitle.trim(),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      if (!response.ok) throw new Error(body.error || 'تعذر تجهيز المنشأة');
      onDone();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'تعذر تجهيز المنشأة');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0A0A] p-4 font-sans text-[#FAF5EB]">
      <form
        onSubmit={submit}
        className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-2xl"
      >
        <div className="space-y-1 border-b border-white/10 pb-3">
          <h1 className="flex items-center gap-2 text-base font-bold">
            <Sparkles className="h-4 w-4 text-[#DFAB56]" />
            جهّز منشأتك
          </h1>
          <p className="text-xs text-[#A19E9B]">
            حسابك جاهز لكنه غير مرتبط بمنشأة بعد. أدخل بيانات المكان لإنشاء أول فرع وبطاقة ولاء.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-200">
            {error}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-[#A19E9B]">
            اسمك
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </label>
          <label className="text-xs font-bold text-[#A19E9B]">
            اسم المنشأة
            <input
              required
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </label>
          <label className="text-xs font-bold text-[#A19E9B]">
            رابط المنشأة
            <input
              required
              dir="ltr"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase())}
              placeholder="my-cafe"
              pattern="[a-z0-9][a-z0-9-]{1,79}"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 font-mono text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </label>
          <label className="text-xs font-bold text-[#A19E9B]">
            اسم الفرع
            <input
              required
              value={branchName}
              onChange={(event) => setBranchName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </label>
          <label className="text-xs font-bold text-[#A19E9B] sm:col-span-2">
            اسم المكافأة
            <input
              required
              value={rewardTitle}
              onChange={(event) => setRewardTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </label>
          <label className="text-xs font-bold text-[#A19E9B] sm:col-span-2">
            عدد الزيارات المطلوبة: {totalStamps}
            <input
              type="range"
              min={2}
              max={20}
              value={totalStamps}
              onChange={(event) => setTotalStamps(Number(event.target.value))}
              className="mt-2 w-full accent-[#DFAB56]"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#DFAB56] px-4 py-2.5 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          إنشاء المنشأة
        </button>

        <Link href="/login" className="block text-center text-[11px] text-[#A19E9B] hover:text-[#FAF5EB]">
          تسجيل الدخول بحساب آخر
        </Link>
      </form>
    </div>
  );
}
