'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  LayoutDashboard,
  Phone,
  Gift,
  Ticket,
  Printer,
  Image as ImageIcon,
  Plus,
  X,
  Copy,
  ArrowRight,
  ShieldCheck,
  UserRound,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PrintService, type PrintFormat } from '@/lib/services/print.service';
import type { BusinessSettings } from '@/types/photobooth';

/* -------------------------------------------------------------------------- */
/* API shapes                                                                 */
/* -------------------------------------------------------------------------- */

interface BranchRecord {
  id: string;
  slug: string;
  name: string;
  address: string | null;
}

interface TerminalContext {
  source: 'merchant' | 'staff';
  memberId: string | null;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  organization: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    tagline: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    timezone: string;
    currency: string;
  };
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

interface StaffSession {
  staffId: string;
  cafeSlug: string;
  role: string;
  expiresAt: string;
}

interface CustomerSearchResult {
  id: string;
  displayName: string;
  phone: string | null;
  totalVisits: number;
  lastVisit: string | null;
}

interface CustomerCard {
  customer: {
    id: string;
    displayName: string;
    phone: string | null;
    persona: string | null;
    createdAt: string;
  };
  loyalty: {
    stampedCount: number;
    maxSlots: number;
    completedCardsCount: number;
    totalVerifiedVisits: number;
    lastStampedAt: string | null;
    rewardName: string | null;
  };
  rewards: Array<{ id: string; name: string; threshold: number; unlockedAt: string }>;
  stamps: Array<{ memoryId: string; takenAt: string; thumbnailUrl: string }>;
  vouchers: Array<{
    code: string;
    title: string;
    status: string;
    expiresAt: string | null;
    createdAt: string;
  }>;
  memories: Array<{
    id: string;
    originalUrl: string;
    thumbnailUrl: string;
    caption: string | null;
    status: string;
    visibility: string;
    createdAt: string;
  }>;
  walletPass: { status: string; shareUrl: string | null } | null;
}

interface PrintJob {
  id: string;
  name: string;
  phone: string;
  photoStripUrl: string;
  format: string;
  copies: number;
  status: 'pending' | 'printing' | 'printed' | 'failed' | 'dismissed' | string;
  createdAt: string;
  printedAt: string | null;
  error: string | null;
  memoryId: string | null;
}

interface ApiErrorBody {
  error?: string;
  message?: string;
  code?: string;
}

const PRINT_FORMATS: Array<{ id: PrintFormat; label: string }> = [
  { id: 'standard-2x6', label: 'شريط 2×6' },
  { id: 'dual-4x6', label: 'مزدوج 4×6' },
  { id: 'thermal-80mm', label: 'حراري 80mm' },
  { id: 'thermal-58mm', label: 'حراري 58mm' },
];

const ROLE_LABELS: Record<string, string> = {
  owner: 'المالك',
  admin: 'مدير النظام',
  manager: 'مدير',
  staff: 'موظف',
};

async function getJson<T>(
  url: string
): Promise<{ ok: boolean; status: number; body: T & ApiErrorBody }> {
  const response = await fetch(url, { cache: 'no-store' });
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  return { ok: response.ok, status: response.status, body };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TerminalPage() {
  const [isBooting, setIsBooting] = useState(true);
  const [context, setContext] = useState<TerminalContext | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const [branchId, setBranchId] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [card, setCard] = useState<CustomerCard | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [voucherTitle, setVoucherTitle] = useState('هدية ترحيبية');
  const [voucherCode, setVoucherCode] = useState('');

  const [printFormat, setPrintFormat] = useState<PrintFormat>('standard-2x6');
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const branchQuery = branchId ? `branchId=${encodeURIComponent(branchId)}` : '';

  const handleUnauthorized = useCallback((status: number) => {
    if (status === 401) {
      setNeedsLogin(true);
      setContext(null);
      return true;
    }
    return false;
  }, []);

  /* ------------------------------- bootstrap ------------------------------ */

  const loadContext = useCallback(async () => {
    const { ok, status, body } = await getJson<TerminalContext>(
      `/api/v1/merchant/context${branchQuery ? `?${branchQuery}` : ''}`
    );
    if (status === 401) {
      setNeedsLogin(true);
      setContext(null);
      return false;
    }
    if (!ok) {
      if (body.code === 'membership_required') {
        throw new Error('حسابك غير مرتبط بمنشأة بعد. أكمل التجهيز من لوحة التحكم أولاً.');
      }
      throw new Error(body.error || 'تعذر تحميل بيانات المنشأة');
    }
    setContext(body);
    setNeedsLogin(false);
    setBranchId((previous) => previous || body.branch?.id || '');
    return true;
  }, [branchQuery]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      setIsBooting(true);
      setBootError(null);
      try {
        await loadContext();
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
    // The bootstrap runs once; branch changes reload through loadContext below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isBooting || needsLogin || !context) return;
    const run = async () => {
      await loadContext();
    };
    void run().catch((error) => {
      setBootError(error instanceof Error ? error.message : 'تعذر تحديث الفرع');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  /* --------------------------------- search -------------------------------- */

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const { ok, status, body } = await getJson<{ customers: CustomerSearchResult[] }>(
          `/api/v1/merchant/customers?query=${encodeURIComponent(trimmed)}`
        );
        if (cancelled) return;
        if (handleUnauthorized(status)) return;
        if (!ok) throw new Error(body.error || 'تعذر البحث عن العميل');
        setResults(body.customers ?? []);
      } catch (error) {
        if (!cancelled) {
          setSearchError(error instanceof Error ? error.message : 'تعذر البحث عن العميل');
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, handleUnauthorized]);

  /* ---------------------------------- card --------------------------------- */

  const loadCard = useCallback(
    async (customerId: string) => {
      setIsLoadingCard(true);
      setCardError(null);
      try {
        const { ok, status, body } = await getJson<{ card: CustomerCard }>(
          `/api/v1/merchant/customers/${customerId}/card`
        );
        if (handleUnauthorized(status)) return;
        if (!ok || !body.card) throw new Error(body.error || 'تعذر تحميل بطاقة العميل');
        setCard(body.card);
      } catch (error) {
        setCard(null);
        setCardError(error instanceof Error ? error.message : 'تعذر تحميل بطاقة العميل');
      } finally {
        setIsLoadingCard(false);
      }
    },
    [handleUnauthorized]
  );

  const selectCustomer = useCallback(
    (customerId: string) => {
      setSelectedId(customerId);
      setNotice(null);
      setActionError(null);
      void loadCard(customerId);
    },
    [loadCard]
  );

  /* ---------------------------------- jobs --------------------------------- */

  const loadJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const { ok, status, body } = await getJson<{ jobs: PrintJob[] }>(
        `/api/v1/print/jobs?status=all&limit=40${branchQuery ? `&${branchQuery}` : ''}`
      );
      if (handleUnauthorized(status)) return;
      if (!ok) throw new Error(body.error || 'تعذر تحميل طابور الطباعة');
      setJobs(body.jobs ?? []);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر تحميل طابور الطباعة');
    } finally {
      setIsLoadingJobs(false);
    }
  }, [branchQuery, handleUnauthorized]);

  useEffect(() => {
    if (!context) return;
    const run = async () => {
      await loadJobs();
    };
    void run();
  }, [context, loadJobs]);

  /* -------------------------------- actions -------------------------------- */

  const registerVisit = async () => {
    if (!card) return;
    setBusyAction('visit');
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/v1/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: card.customer.id,
          source: 'staff',
          ...(branchId ? { branchId } : {}),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        duplicate?: boolean;
      };
      if (handleUnauthorized(response.status)) return;
      if (response.status === 429) {
        throw new Error('تم تسجيل زيارة لهذا العميل خلال الساعة الأخيرة');
      }
      if (!response.ok) throw new Error(body.error || 'تعذر تسجيل الزيارة');
      setNotice(body.duplicate ? 'الزيارة مسجلة مسبقاً' : 'تم تسجيل الزيارة بنجاح');
      await loadCard(card.customer.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر تسجيل الزيارة');
    } finally {
      setBusyAction(null);
    }
  };

  const redeemReward = async (rewardName: string) => {
    if (!card || !context?.rewardRule) return;
    if (!window.confirm(`صرف مكافأة «${rewardName}» لهذا العميل؟`)) return;
    setBusyAction('redeem');
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/v1/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: card.customer.id,
          rewardRuleId: context.rewardRule.id,
          ...(branchId ? { branchId } : {}),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        rewardName?: string | null;
      };
      if (handleUnauthorized(response.status)) return;
      if (!response.ok) throw new Error(body.message || body.error || 'تعذر صرف المكافأة');
      setNotice(`تم صرف المكافأة${body.rewardName ? `: ${body.rewardName}` : ''}`);
      await loadCard(card.customer.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر صرف المكافأة');
    } finally {
      setBusyAction(null);
    }
  };

  const issueVoucher = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!card) return;
    const title = voucherTitle.trim();
    if (title.length < 2) return;
    setBusyAction('voucher');
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/v1/merchant/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: card.customer.id, title }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        voucher?: { code?: string };
      };
      if (handleUnauthorized(response.status)) return;
      if (!response.ok) throw new Error(body.error || 'تعذر إصدار القسيمة');
      setNotice(
        body.voucher?.code ? `تم إصدار القسيمة: ${body.voucher.code}` : 'تم إصدار القسيمة'
      );
      await loadCard(card.customer.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر إصدار القسيمة');
    } finally {
      setBusyAction(null);
    }
  };

  const redeemVoucher = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = voucherCode.trim().toUpperCase();
    if (code.length < 6) return;
    setBusyAction('voucher-redeem');
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/v1/merchant/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        voucher?: { title?: string };
      };
      if (handleUnauthorized(response.status)) return;
      if (!response.ok) throw new Error(body.error || 'تعذر استبدال القسيمة');
      setNotice(`تم استبدال القسيمة${body.voucher?.title ? `: ${body.voucher.title}` : ''}`);
      setVoucherCode('');
      if (selectedId) await loadCard(selectedId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر استبدال القسيمة');
    } finally {
      setBusyAction(null);
    }
  };

  const enqueuePrint = async (memoryId: string) => {
    setBusyAction(`print-${memoryId}`);
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/v1/print/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, format: printFormat, copies: 1 }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        duplicate?: boolean;
      };
      if (handleUnauthorized(response.status)) return;
      if (!response.ok) throw new Error(body.error || 'تعذر إضافة طلب الطباعة');
      setNotice(body.duplicate ? 'هذه الصورة في الطابور بالفعل' : 'تمت إضافة الصورة إلى الطابور');
      await loadJobs();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر إضافة طلب الطباعة');
    } finally {
      setBusyAction(null);
    }
  };

  const advanceJob = async (
    job: PrintJob,
    status: 'printing' | 'printed' | 'failed'
  ) => {
    setBusyAction(job.id);
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/v1/print/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: job.id,
          status,
          ...(status === 'failed' ? { error: 'print_failed' } : {}),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      if (handleUnauthorized(response.status)) return;
      if (!response.ok) throw new Error(body.error || 'تعذر تحديث طلب الطباعة');

      if (status === 'printing' && job.photoStripUrl) {
        PrintService.printStripImage(job.photoStripUrl, { format: printFormat });
        setNotice('أُرسلت الصورة إلى نافذة الطباعة. بعد انتهاء الطبع اضغط «تمت الطباعة».');
      } else {
        setNotice(status === 'printed' ? 'تم إغلاق الطلب كمطبوع' : 'تم تعليم الطلب كفاشل');
      }
      await loadJobs();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر تحديث طلب الطباعة');
    } finally {
      setBusyAction(null);
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/v1/staff-session', { method: 'DELETE' });
    } catch {
      /* the cookie is cleared server-side when possible */
    }
    window.location.assign('/login');
  };

  const copyVoucherCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      setCopiedCode(null);
    }
  };

  const activeJobs = useMemo(
    () => jobs.filter((job) => job.status === 'pending' || job.status === 'printing'),
    [jobs]
  );

  const progressSlots = useMemo(() => {
    if (!card) return [];
    return Array.from({ length: card.loyalty.maxSlots }, (_, index) => index < card.loyalty.stampedCount);
  }, [card]);

  /* -------------------------------- render -------------------------------- */

  if (isBooting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0A0A] text-[#FAF5EB]">
        <div className="flex items-center gap-2 text-xs text-[#A19E9B]">
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري تجهيز محطة الكاونتر...
        </div>
      </div>
    );
  }

  if (needsLogin) {
    return <StaffLogin onDone={() => window.location.reload()} />;
  }

  if (bootError || !context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0A0A] p-6 text-[#FAF5EB]">
        <div className="max-w-md space-y-4 rounded-2xl border border-rose-500/30 bg-[#141212] p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-300" />
          <h1 className="text-base font-bold">تعذر فتح محطة الكاونتر</h1>
          <p className="text-xs text-[#A19E9B]">{bootError ?? 'حدث خطأ غير متوقع'}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 rounded-lg bg-[#DFAB56] px-4 py-2 text-xs font-bold text-[#12100E]"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </button>
            <Link
              href="/login"
              className="rounded-lg border border-white/10 bg-[#1C1B1B] px-4 py-2 text-xs font-bold text-[#FAF5EB]"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0A0A] pb-16 font-sans text-[#FAF5EB]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0E0D0D]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DFAB56]/40 bg-[#3D2314] text-[#DFAB56]">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-sm font-bold text-[#FAF5EB]">{context.organization.name}</h1>
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-[#A19E9B]">
                  {ROLE_LABELS[context.role] ?? context.role}
                </span>
                {context.source === 'staff' && (
                  <span className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] text-emerald-200">
                    <ShieldCheck className="h-3 w-3" />
                    جلسة طاقم
                  </span>
                )}
              </div>
              <p className="font-mono text-[10px] text-[#A19E9B]" dir="ltr">
                /c/{context.organization.slug}
              </p>
            </div>
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
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-1.5 text-[11px] font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
            >
              <LayoutDashboard className="h-3 w-3" />
              لوحة التحكم
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-1.5 text-[11px] font-bold text-[#FAF5EB] hover:bg-[#211F1F]"
            >
              <LogOut className="h-3 w-3" />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 pt-4 sm:px-6">
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

        <div className="grid gap-4 lg:grid-cols-12">
          {/* ----------------------------- search ----------------------------- */}
          <section className="space-y-3 lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-[#141212] p-4 shadow-xl">
              <label
                htmlFor="customer-search"
                className="mb-2 flex items-center gap-2 text-xs font-bold text-[#FAF5EB]"
              >
                <Search className="h-4 w-4 text-[#DFAB56]" />
                ابحث عن العميل
              </label>
              <div className="relative">
                <input
                  id="customer-search"
                  value={query}
                  onChange={(event) => {
                    const next = event.target.value;
                    setQuery(next);
                    setSearchError(null);
                    if (next.trim().length < 2) {
                      setResults([]);
                      setIsSearching(false);
                    } else {
                      setIsSearching(true);
                    }
                  }}
                  placeholder="رقم الجوال أو الاسم"
                  autoComplete="off"
                  className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 pe-9 text-xs text-[#FAF5EB] placeholder:text-[#A19E9B]/60 focus:border-[#DFAB56] focus:outline-none"
                />
                {isSearching && (
                  <Loader2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#A19E9B]" />
                )}
              </div>
              <p className="mt-2 text-[10px] text-[#A19E9B]">
                الرقم يُستخدم للبحث فقط. الهوية الحقيقية للعميل هي بطاقة الولاء الخاصة بمنشأتك.
              </p>

              {searchError && (
                <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-2 text-[11px] text-rose-200">
                  {searchError}
                </p>
              )}

              {query.trim().length >= 2 && !isSearching && results.length === 0 && !searchError && (
                <p className="mt-2 rounded-lg border border-dashed border-white/15 bg-[#1C1B1B] p-3 text-center text-[11px] text-[#A19E9B]">
                  لا يوجد عميل مطابق. يمكن للعميل إنشاء بطاقته بمسح رمز الطاولة.
                </p>
              )}

              {results.length > 0 && (
                <ul className="mt-3 max-h-72 space-y-1.5 overflow-auto pe-1">
                  {results.map((customer) => (
                    <li key={customer.id}>
                      <button
                        type="button"
                        onClick={() => selectCustomer(customer.id)}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl border p-2.5 text-start transition ${
                          selectedId === customer.id
                            ? 'border-[#DFAB56]/60 bg-[#3D2314]/50'
                            : 'border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#141212] text-[#DFAB56]">
                            <UserRound className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-xs font-bold text-[#FAF5EB]">
                              {customer.displayName}
                            </span>
                            <span className="block font-mono text-[10px] text-[#A19E9B]" dir="ltr">
                              {customer.phone ?? 'بدون رقم'}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-[#A19E9B]">
                          {customer.totalVisits} زيارة
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form
              onSubmit={redeemVoucher}
              className="space-y-2 rounded-2xl border border-white/10 bg-[#141212] p-4 shadow-xl"
            >
              <h2 className="flex items-center gap-2 text-xs font-bold text-[#FAF5EB]">
                <Ticket className="h-4 w-4 text-[#DFAB56]" />
                استبدال قسيمة
              </h2>
              <div className="flex gap-2">
                <input
                  value={voucherCode}
                  onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                  placeholder="GIFT-XXXXXXX"
                  dir="ltr"
                  className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3 py-2 font-mono text-xs tracking-wider text-[#FAF5EB] placeholder:text-[#A19E9B]/60 focus:border-[#DFAB56] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busyAction === 'voucher-redeem' || voucherCode.trim().length < 6}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#DFAB56] px-3.5 py-2 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
                >
                  {busyAction === 'voucher-redeem' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                  استبدال
                </button>
              </div>
              <p className="text-[10px] text-[#A19E9B]">
                كل رمز يُستهلك مرة واحدة فقط. إعادة المحاولة تعيد نفس النتيجة دون خصم مزدوج.
              </p>
            </form>

            <div className="rounded-2xl border border-white/10 bg-[#141212] p-4 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-bold text-[#FAF5EB]">
                  <Printer className="h-4 w-4 text-[#DFAB56]" />
                  طابور الطباعة
                  <span className="rounded-md border border-[#DFAB56]/40 bg-[#3D2314]/60 px-1.5 py-0.5 font-mono text-[10px]">
                    {activeJobs.length}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => void loadJobs()}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#1C1B1B] px-2 py-1 text-[10px] font-bold text-[#A19E9B] hover:text-[#FAF5EB]"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingJobs ? 'animate-spin' : ''}`} />
                  تحديث
                </button>
              </div>

              <label className="mb-2 flex items-center gap-2 text-[10px] text-[#A19E9B]">
                مقاس الطباعة
                <select
                  value={printFormat}
                  onChange={(event) => setPrintFormat(event.target.value as PrintFormat)}
                  className="rounded-lg border border-white/10 bg-[#1C1B1B] px-2 py-1 text-[10px] font-bold text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
                >
                  {PRINT_FORMATS.map((format) => (
                    <option key={format.id} value={format.id}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </label>

              {activeJobs.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/15 bg-[#1C1B1B] p-3 text-center text-[11px] text-[#A19E9B]">
                  لا توجد طلبات نشطة.
                </p>
              ) : (
                <ul className="max-h-64 space-y-1.5 overflow-auto pe-1">
                  {activeJobs.map((job) => (
                    <li
                      key={job.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#1C1B1B] p-2"
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-9 w-9 overflow-hidden rounded-md border border-white/10 bg-[#141212]">
                          {job.photoStripUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={job.photoStripUrl}
                              alt={`صورة ${job.name}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[#A19E9B]">
                              <ImageIcon className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </span>
                        <span className="text-[11px]">
                          <span className="block font-bold text-[#FAF5EB]">{job.name}</span>
                          <span className="font-mono text-[10px] text-[#A19E9B]">
                            {job.status === 'printing' ? 'قيد الطباعة' : 'بانتظار الطباعة'}
                          </span>
                        </span>
                      </span>
                      <span className="flex shrink-0 gap-1">
                        {job.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busyAction === job.id}
                            onClick={() => void advanceJob(job, 'printing')}
                            className="rounded-md bg-[#DFAB56] px-2 py-1 text-[10px] font-bold text-[#12100E] disabled:opacity-50"
                          >
                            طباعة
                          </button>
                        )}
                        {job.status === 'printing' && (
                          <button
                            type="button"
                            disabled={busyAction === job.id}
                            onClick={() => void advanceJob(job, 'printed')}
                            className="rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-bold text-emerald-950 disabled:opacity-50"
                          >
                            تمت
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ------------------------------ card ------------------------------ */}
          <section className="lg:col-span-7">
            {!selectedId && (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-[#141212] p-8 text-center">
                <Sparkles className="h-7 w-7 text-[#DFAB56]" />
                <p className="text-sm font-bold text-[#FAF5EB]">ابدأ ببحث العميل</p>
                <p className="max-w-sm text-xs text-[#A19E9B]">
                  ابحث برقم الجوال أو الاسم لعرض بطاقة الولاء، تسجيل زيارة، صرف مكافأة، أو طباعة
                  ذكرى.
                </p>
              </div>
            )}

            {selectedId && isLoadingCard && (
              <div className="flex min-h-[320px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#141212] text-xs text-[#A19E9B]">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري تحميل البطاقة...
              </div>
            )}

            {selectedId && !isLoadingCard && cardError && (
              <div className="space-y-3 rounded-2xl border border-rose-500/30 bg-[#141212] p-6 text-center">
                <AlertCircle className="mx-auto h-6 w-6 text-rose-300" />
                <p className="text-xs text-rose-200">{cardError}</p>
                <button
                  type="button"
                  onClick={() => void loadCard(selectedId)}
                  className="mx-auto flex items-center gap-2 rounded-lg bg-[#DFAB56] px-4 py-2 text-xs font-bold text-[#12100E]"
                >
                  <RefreshCw className="h-4 w-4" />
                  إعادة المحاولة
                </button>
              </div>
            )}

            {selectedId && !isLoadingCard && card && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-[#141212] p-5 shadow-xl">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#DFAB56]/30 bg-[#3D2314]/60 text-lg font-bold text-[#DFAB56]">
                        {card.customer.displayName.slice(0, 1)}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#FAF5EB]">
                          {card.customer.displayName}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[10px] text-[#A19E9B]">
                          {card.customer.phone && (
                            <span className="flex items-center gap-1" dir="ltr">
                              <Phone className="h-3 w-3" />
                              {card.customer.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            عضو منذ {new Date(card.customer.createdAt).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void registerVisit()}
                      disabled={busyAction === 'visit'}
                      className="flex items-center gap-2 rounded-lg bg-[#DFAB56] px-4 py-2 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
                    >
                      {busyAction === 'visit' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      تسجيل زيارة
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-[#1C1B1B] p-3.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#FAF5EB]">
                        {card.loyalty.rewardName ?? context.rewardRule?.name ?? 'بطاقة الولاء'}
                      </span>
                      <span className="font-mono text-[#A19E9B]">
                        {card.loyalty.stampedCount} / {card.loyalty.maxSlots}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {progressSlots.map((filled, index) => (
                        <span
                          key={index}
                          className={`h-7 flex-1 rounded-md border ${
                            filled
                              ? 'border-[#DFAB56] bg-[#DFAB56]'
                              : 'border-white/10 bg-[#141212]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-3 font-mono text-[10px] text-[#A19E9B]">
                      <span>{card.loyalty.totalVerifiedVisits} زيارة موثقة</span>
                      <span>{card.loyalty.completedCardsCount} مكافأة مستحقة</span>
                      {card.loyalty.lastStampedAt && (
                        <span>
                          آخر زيارة{' '}
                          {new Date(card.loyalty.lastStampedAt).toLocaleDateString('ar-SA')}
                        </span>
                      )}
                    </div>
                  </div>

                  {card.rewards.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {card.rewards.map((reward) => (
                        <div
                          key={reward.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DFAB56]/30 bg-[#3D2314]/40 p-2.5"
                        >
                          <span className="flex items-center gap-2 text-[11px] font-bold text-[#FAF5EB]">
                            <Gift className="h-4 w-4 text-[#DFAB56]" />
                            {reward.name}
                            <span className="font-mono text-[10px] text-[#A19E9B]">
                              ({reward.threshold} زيارات)
                            </span>
                          </span>
                          <button
                            type="button"
                            disabled={!context.rewardRule || busyAction === 'redeem'}
                            onClick={() => void redeemReward(reward.name)}
                            className="flex items-center gap-1.5 rounded-lg bg-[#DFAB56] px-3 py-1.5 text-[10px] font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
                          >
                            {busyAction === 'redeem' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Gift className="h-3.5 w-3.5" />
                            )}
                            صرف المكافأة
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-[#141212] p-4 shadow-xl">
                    <h3 className="flex items-center gap-2 text-xs font-bold text-[#FAF5EB]">
                      <Ticket className="h-4 w-4 text-[#DFAB56]" />
                      القسائم المتاحة
                    </h3>
                    {card.vouchers.length === 0 ? (
                      <p className="mt-2 rounded-lg border border-dashed border-white/15 bg-[#1C1B1B] p-3 text-center text-[11px] text-[#A19E9B]">
                        لا توجد قسائم.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {card.vouchers.map((voucher) => (
                          <li
                            key={voucher.code}
                            className="rounded-lg border border-white/10 bg-[#1C1B1B] p-2.5 text-[11px]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#FAF5EB]">{voucher.title}</span>
                              <button
                                type="button"
                                onClick={() => void copyVoucherCode(voucher.code)}
                                className="flex items-center gap-1 rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-[#A19E9B] hover:text-[#FAF5EB]"
                              >
                                {copiedCode === voucher.code ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                {voucher.code}
                              </button>
                            </div>
                            {voucher.expiresAt && (
                              <p className="mt-1 font-mono text-[10px] text-[#A19E9B]">
                                تنتهي {new Date(voucher.expiresAt).toLocaleDateString('ar-SA')}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    <form onSubmit={issueVoucher} className="mt-3 flex gap-2">
                      <input
                        value={voucherTitle}
                        onChange={(event) => setVoucherTitle(event.target.value)}
                        placeholder="عنوان القسيمة"
                        className="w-full rounded-lg border border-white/10 bg-[#1C1B1B] px-2.5 py-2 text-[11px] text-[#FAF5EB] placeholder:text-[#A19E9B]/60 focus:border-[#DFAB56] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={busyAction === 'voucher' || voucherTitle.trim().length < 2}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-[#DFAB56] px-3 py-2 text-[10px] font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
                      >
                        {busyAction === 'voucher' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        إصدار
                      </button>
                    </form>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#141212] p-4 shadow-xl">
                    <h3 className="flex items-center gap-2 text-xs font-bold text-[#FAF5EB]">
                      <ImageIcon className="h-4 w-4 text-[#DFAB56]" />
                      ذكريات العميل
                    </h3>
                    {card.memories.length === 0 ? (
                      <p className="mt-2 rounded-lg border border-dashed border-white/15 bg-[#1C1B1B] p-3 text-center text-[11px] text-[#A19E9B]">
                        لا توجد ذكريات بعد.
                      </p>
                    ) : (
                      <div className="mt-2 grid max-h-56 grid-cols-3 gap-1.5 overflow-auto pe-1">
                        {card.memories.map((memory) => (
                          <div
                            key={memory.id}
                            className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#1C1B1B]"
                          >
                            <button
                              type="button"
                              onClick={() => setPreviewUrl(memory.originalUrl)}
                              className="block aspect-square w-full"
                              title="معاينة"
                            >
                              {memory.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={memory.thumbnailUrl}
                                  alt={memory.caption ?? 'ذكرى'}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[#A19E9B]">
                                  <ImageIcon className="h-4 w-4" />
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={busyAction === `print-${memory.id}`}
                              onClick={() => void enqueuePrint(memory.id)}
                              className="absolute bottom-1 end-1 rounded-md bg-[#12100E]/85 p-1 text-[#DFAB56] opacity-90 hover:bg-[#12100E] disabled:opacity-50"
                              title="إضافة إلى طابور الطباعة"
                            >
                              {busyAction === `print-${memory.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Printer className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-[#141212] p-3">
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute end-3 top-3 rounded-lg border border-white/10 bg-[#1C1B1B] p-1.5 text-[#FAF5EB]"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="معاينة الذكرى"
              className="max-h-[82vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Staff login                                                                */
/* -------------------------------------------------------------------------- */

function StaffLogin({ onDone }: { onDone: () => void }) {
  const [staffCode, setStaffCode] = useState('');
  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinRef = useRef<HTMLInputElement | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/staff-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffCode: staffCode.trim(),
          pin: pin.trim(),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        staff?: { name?: string };
      };
      if (response.status === 429) {
        throw new Error('محاولات كثيرة. انتظر 15 دقيقة ثم حاول مرة أخرى.');
      }
      if (!response.ok) {
        throw new Error(body.error || 'رمز الدخول غير صحيح');
      }
      onDone();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'تعذر تسجيل الدخول');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0A0A] p-4 font-sans text-[#FAF5EB]">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#141212] p-6 shadow-2xl"
      >
        <div className="space-y-1 border-b border-white/10 pb-3 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl border border-[#DFAB56]/40 bg-[#3D2314] text-[#DFAB56]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-base font-bold">محطة الكاونتر</h1>
          <p className="text-[11px] text-[#A19E9B]">
            أدخل رمز الموظف ورمز الدخول الذي أنشأه المالك من لوحة التحكم.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-2.5 text-[11px] text-rose-200">
            {error}
          </p>
        )}

        <label className="block text-xs font-bold text-[#A19E9B]">
          رمز الموظف
          <input
            required
            dir="ltr"
            autoComplete="username"
            value={staffCode}
            onChange={(event) => setStaffCode(event.target.value)}
            placeholder="SARA-01"
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 font-mono text-xs text-[#FAF5EB] placeholder:text-[#A19E9B]/60 focus:border-[#DFAB56] focus:outline-none"
          />
        </label>

        <label className="block text-xs font-bold text-[#A19E9B]">
          رمز الدخول (PIN)
          <input
            ref={pinRef}
            required
            dir="ltr"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="••••"
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#1C1B1B] px-3.5 py-2.5 font-mono text-lg tracking-[0.4em] text-[#FAF5EB] placeholder:text-[#A19E9B]/60 focus:border-[#DFAB56] focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={isSaving || pin.length < 4 || staffCode.trim().length < 1}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#DFAB56] px-4 py-2.5 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          دخول المحطة
        </button>

        <Link
          href="/login"
          className="block text-center text-[11px] text-[#A19E9B] hover:text-[#FAF5EB]"
        >
          الدخول بحساب المالك
        </Link>
      </form>
    </div>
  );
}
