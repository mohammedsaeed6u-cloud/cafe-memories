/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect } from 'react';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { RegisteredCustomer } from '@/lib/services/customer-registry.service';

export interface BranchResolutionResult {
  branchId: string | null;
  organizationId: string | null;
  error: string | null;
}

export interface SupabaseLikeClient {
  from(table: string): {
    select(columns: string): {
      eq(col: string, val: string): {
        eq(col: string, val: string): {
          maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: unknown | null }>;
        };
        maybeSingle?(): Promise<{ data: Record<string, unknown> | null; error: unknown | null }>;
      };
    };
  };
}

/**
 * Deterministically resolves the active branch context for a merchant user against the counter venue context (cafeSlug).
 * Never uses arbitrary limit(1) fallbacks.
 */
export async function resolveMerchantBranchContext(
  supabase: any | null | undefined,
  userId: string | null | undefined,
  cafeSlug: string
): Promise<BranchResolutionResult> {
  if (!userId || !supabase) {
    return {
      branchId: null,
      organizationId: null,
      error: 'يلزم تسجيل دخول تاجر معتمد.',
    };
  }

  // 1. Resolve branch strictly by venue context (cafeSlug)
  const { data: branchData, error: branchError } = await supabase
    .from('branches')
    .select('id, organization_id, status, slug')
    .eq('slug', cafeSlug)
    .eq('status', 'active')
    .maybeSingle();

  const branch = branchData as { id: string; organization_id: string; status: string; slug: string } | null;

  if (branchError || !branch) {
    return {
      branchId: null,
      organizationId: null,
      error: `تعذر مطابقة الفرع المخصص للكاونتر (${cafeSlug}) مع فروع المنشأة المسجلة.`,
    };
  }

  // 2. Resolve caller membership strictly in the branch's organization
  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id, branch_id, role')
    .eq('user_id', userId)
    .eq('organization_id', branch.organization_id)
    .maybeSingle();

  const member = memberData as { organization_id: string; branch_id: string | null; role: string } | null;

  if (memberError || !member) {
    return {
      branchId: null,
      organizationId: branch.organization_id,
      error: 'المستخدم ليس عضواً مصرحاً في المنشأة المالكة لهذا الفرع.',
    };
  }

  // 3. Enforce branch scope if member is restricted
  if (member.branch_id && member.branch_id !== branch.id) {
    return {
      branchId: null,
      organizationId: branch.organization_id,
      error: `عضوية التاجر مقيدة بفرع آخر ولا تملك صلاحية الختم في فرع (${cafeSlug}).`,
    };
  }

  return {
    branchId: branch.id,
    organizationId: branch.organization_id,
    error: null,
  };
}

export interface UseTerminalVisitConfirmationProps {
  merchantUser: { id: string; email?: string } | null;
  merchantBranchId: string | null;
  merchantBranchVenue?: string | null;
  isCheckingMerchantAuth?: boolean;
  cafeSlug: string;
  selectedCustomer: RegisteredCustomer | null;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<RegisteredCustomer | null>>;
  recordShiftStamp: () => void;
  setErrorNotice: (msg: string | null) => void;
  setSuccessNotice: (msg: string | null) => void;
}

export function useTerminalVisitConfirmation({
  merchantUser,
  merchantBranchId,
  merchantBranchVenue,
  isCheckingMerchantAuth = false,
  cafeSlug,
  selectedCustomer,
  setSelectedCustomer,
  recordShiftStamp,
  setErrorNotice,
  setSuccessNotice,
}: UseTerminalVisitConfirmationProps) {
  const [isSubmittingStamp, setIsSubmittingStamp] = useState(false);
  const isSubmittingStampRef = useRef(false);
  const [isRefreshingProgress, setIsRefreshingProgress] = useState(false);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);
  const [progressWarning, setProgressWarning] = useState<string | null>(null);
  const [isRetryPending, setIsRetryPending] = useState(false);
  const pendingOperationRef = useRef<{
    idempotencyKey: string;
    customerId: string;
    branchId: string;
    customerName: string;
  } | null>(null);

  const selectedCustomerRef = useRef(selectedCustomer);
  useEffect(() => {
    selectedCustomerRef.current = selectedCustomer;
  }, [selectedCustomer]);

  const handleAddStamp = async () => {
    if (isSubmittingStampRef.current) {
      return; // Immediate synchronous guard against parallel / double-click submissions
    }

    if (!merchantUser) {
      setErrorNotice('يلزم تسجيل دخول تاجر معتمد لختم الزيارات خادمياً.');
      return;
    }

    // Check if we already have a pending pinned operation to retry (decoupled from active selectedCustomer)
    let operation = pendingOperationRef.current;

    if (!operation) {
      // 1. Immediate synchronous context readiness guard: block new stamp while checking auth/branch
      if (isCheckingMerchantAuth) {
        setErrorNotice('جاري التحقق من فرع الكاونتر، يرجى الانتظار لحظات.');
        return;
      }

      // 2. Strict venue-to-branch binding check
      if (!merchantBranchId || (merchantBranchVenue !== undefined && merchantBranchVenue !== cafeSlug)) {
        setErrorNotice(`تعذر تحديد فرع التاجر المطابق للكاونتر (${cafeSlug}). يرجى التحقق من إعدادات الفروع.`);
        return;
      }

      if (!selectedCustomer) return;

      if (!selectedCustomer.id) {
        setErrorNotice('معرّف العميل الموثق غير متوفر. يلزم تسجيل حضور العميل (Check-in) في هذا الفرع أولاً.');
        return;
      }

      operation = {
        idempotencyKey: crypto.randomUUID(),
        customerId: selectedCustomer.id,
        branchId: merchantBranchId,
        customerName: selectedCustomer.name || 'العميل',
      };
      pendingOperationRef.current = operation;
    }

    isSubmittingStampRef.current = true;
    setIsSubmittingStamp(true);
    setErrorNotice(null);
    setNetworkWarning(null);
    setProgressWarning(null);

    try {
      const res = await fetch('/api/v1/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: operation.customerId,
          branchId: operation.branchId,
          idempotencyKey: operation.idempotencyKey,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const errorMsg = data?.error || 'فشل تسجيل الزيارة في الخادم.';
        if (res.status === 409 || res.status === 429 || res.status === 403 || res.status === 400 || res.status === 404) {
          pendingOperationRef.current = null;
          setIsRetryPending(false);
          setErrorNotice(errorMsg);
        } else {
          setIsRetryPending(true);
          setNetworkWarning(`حدث خطأ من الخادم (${res.status}). يمكنك إعادة المحاولة بأمان بنفس العملية.`);
        }
        return;
      }

      // Success: Clear pending operation
      pendingOperationRef.current = null;
      setIsRetryPending(false);

      // Handle Replay vs Fresh Visit:
      if (data.replayed) {
        // Do NOT increment shift counter or trigger celebratory audio on duplicate replay
        setSuccessNotice(
          `ℹ️ تم استرجاع الزيارة المسجلة مسبقاً للعميل (${operation.customerName}) بنجاح (طلب مكرر - لم تتم مضاعفة الختم). المعرف: ${data.visitId}`
        );
      } else {
        // Fresh verified visit
        recordShiftStamp();
        SoundEffectsService.playStampChime();
        setSuccessNotice(
          `✨ تم تأكيد وحفظ الزيارة بنجاح للعميل (${operation.customerName})! المعرف: ${data.visitId}`
        );
      }

      // Strictly bind customer card mutations to the pinned operation's target customer
      if (selectedCustomerRef.current?.id === operation.customerId) {
        if (data.progressFetchFailed) {
          setProgressWarning(
            'تم تأكيد الزيارة بنجاح في قاعدة البيانات، ولكن تعذر تحديث رصيد الولاء مؤقتاً.'
          );
        } else if (data.currentVisits !== null && data.currentVisits !== undefined) {
          setSelectedCustomer((prev) => (prev && prev.id === operation.customerId ? { ...prev, totalVisits: data.currentVisits } : prev));
        }
      }

      setTimeout(() => setSuccessNotice(null), 5000);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('stampy-stamp-added'));
      }
    } catch (netErr: unknown) {
      // Network interruption or timeout: KEEP pendingOperationRef intact for safe retry!
      console.warn('Network error during visit confirmation:', netErr);
      setIsRetryPending(true);
      setNetworkWarning(
        'انقطع الاتصال بالخادم أثناء تأكيد الزيارة. النتيجة غير مؤكدة — اضغط "إعادة المحاولة" لإرسال نفس العملية الموثقة بأمان دون تكرار الختم.'
      );
    } finally {
      isSubmittingStampRef.current = false;
      setIsSubmittingStamp(false);
    }
  };

  const handleRefreshProgress = async () => {
    if (!selectedCustomer) return;
    setIsRefreshingProgress(true);
    setProgressWarning(null);
    try {
      // In this limited slice, customer progress synchronization is decoupled.
      // We never perform CRM phone search guessing or identity swapping.
      setProgressWarning('مزامنة رصيد المكافآت التراكمي غير مفعلة في هذه الشريحة المحدودة. الزيارات مؤكدة ومحفوظة خادمياً.');
    } finally {
      setIsRefreshingProgress(false);
    }
  };

  return {
    isSubmittingStamp,
    isSubmittingStampRef,
    isRefreshingProgress,
    isRetryPending,
    networkWarning,
    progressWarning,
    pendingOperationRef,
    handleAddStamp,
    handleRefreshProgress,
    setNetworkWarning,
    setProgressWarning,
  };
}
