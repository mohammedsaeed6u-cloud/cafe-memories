/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import {
  useTerminalVisitConfirmation,
  resolveMerchantBranchContext,
} from '@/hooks/useTerminalVisitConfirmation';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { RegisteredCustomer } from '@/lib/services/customer-registry.service';

vi.mock('@/lib/services/sound-effects.service', () => ({
  SoundEffectsService: {
    playStampChime: vi.fn(),
  },
}));

describe('Terminal Visit Confirmation Controller & Interaction Resilience', () => {
  const merchantUser = { id: 'user-merchant-1', email: 'merchant@stampy.app' };
  const merchantBranchId = 'branch-uuid-1';
  const cafeSlug = 'stampy';

  const customerA: RegisteredCustomer = {
    id: 'cust-uuid-a',
    phone: '0501111111',
    name: 'Customer A',
    totalVisits: 3,
  };

  const customerB: RegisteredCustomer = {
    id: 'cust-uuid-b',
    phone: '0502222222',
    name: 'Customer B',
    totalVisits: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents double-click / parallel stamp submissions using synchronous in-flight guard', async () => {
    let resolveFetch: (val: any) => void;
    const pendingFetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    const fetchSpy = vi.fn().mockReturnValue(pendingFetchPromise);
    global.fetch = fetchSpy as any;

    let selectedCustomerState = { ...customerA };
    const setSelectedCustomer = vi.fn((update) => {
      if (typeof update === 'function') {
        selectedCustomerState = update(selectedCustomerState);
      } else {
        selectedCustomerState = update;
      }
    });

    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    const { result } = renderHook(() =>
      useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        merchantBranchVenue: cafeSlug,
        isCheckingMerchantAuth: false,
        cafeSlug,
        selectedCustomer: selectedCustomerState,
        setSelectedCustomer,
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
      })
    );

    let firstCallPromise: Promise<void>;
    act(() => {
      firstCallPromise = result.current.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch!({
        ok: true,
        json: async () => ({
          success: true,
          visitId: 'visit-123',
          replayed: false,
          currentVisits: 4,
        }),
      });
      await firstCallPromise!;
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(recordShiftStamp).toHaveBeenCalledTimes(1);
  });

  it('suppresses chime and shift counter increment when replayed is true', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        visitId: 'visit-replayed-1',
        replayed: true,
        currentVisits: 3,
      }),
    });
    global.fetch = fetchSpy as any;

    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    const { result } = renderHook(() =>
      useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        merchantBranchVenue: cafeSlug,
        isCheckingMerchantAuth: false,
        cafeSlug,
        selectedCustomer: customerA,
        setSelectedCustomer: vi.fn(),
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
      })
    );

    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(recordShiftStamp).not.toHaveBeenCalled();
    expect(SoundEffectsService.playStampChime).not.toHaveBeenCalled();
    expect(setSuccessNotice).toHaveBeenCalledWith(
      expect.stringContaining('طلب مكرر - لم تتم مضاعفة الختم')
    );
  });

  it('triggers chime and increments shift counter on fresh verified visit', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        visitId: 'visit-fresh-1',
        replayed: false,
        currentVisits: 4,
      }),
    });
    global.fetch = fetchSpy as any;

    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    const { result } = renderHook(() =>
      useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        merchantBranchVenue: cafeSlug,
        isCheckingMerchantAuth: false,
        cafeSlug,
        selectedCustomer: customerA,
        setSelectedCustomer: vi.fn(),
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
      })
    );

    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(recordShiftStamp).toHaveBeenCalledTimes(1);
    expect(SoundEffectsService.playStampChime).toHaveBeenCalledTimes(1);
    expect(setSuccessNotice).toHaveBeenCalledWith(
      expect.stringContaining('تم تأكيد وحفظ الزيارة بنجاح')
    );
  });

  it('preserves active customer card when switching customers during in-flight request', async () => {
    let resolveFetch: (val: any) => void;
    const inFlightPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    const fetchSpy = vi.fn().mockReturnValue(inFlightPromise);
    global.fetch = fetchSpy as any;

    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    function TestHarness() {
      const [customer, setCustomer] = useState<RegisteredCustomer | null>(customerA);
      const controller = useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        merchantBranchVenue: cafeSlug,
        isCheckingMerchantAuth: false,
        cafeSlug,
        selectedCustomer: customer,
        setSelectedCustomer: setCustomer,
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
      });

      return { controller, customer, setCustomer };
    }

    const { result } = renderHook(() => TestHarness());

    let stampPromise: Promise<void>;
    act(() => {
      stampPromise = result.current.controller.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const sentPayload = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(sentPayload.customerId).toBe(customerA.id);

    act(() => {
      result.current.setCustomer(customerB);
    });

    expect(result.current.customer?.id).toBe(customerB.id);

    await act(async () => {
      resolveFetch!({
        ok: true,
        json: async () => ({
          success: true,
          visitId: 'visit-cust-a-finished',
          replayed: false,
          currentVisits: 10,
        }),
      });
      await stampPromise!;
    });

    expect(result.current.customer?.id).toBe(customerB.id);
    expect(result.current.customer?.totalVisits).toBe(customerB.totalVisits);
  });

  it('guarantees immutable retry payload with identical idempotencyKey on retry after network failure', async () => {
    let callCount = 0;
    const fetchSpy = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Network timeout');
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          visitId: 'visit-retry-success',
          replayed: false,
          currentVisits: 4,
        }),
      };
    });
    global.fetch = fetchSpy as any;

    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    const { result } = renderHook(() =>
      useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        merchantBranchVenue: cafeSlug,
        isCheckingMerchantAuth: false,
        cafeSlug,
        selectedCustomer: customerA,
        setSelectedCustomer: vi.fn(),
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
      })
    );

    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(result.current.networkWarning).not.toBeNull();
    expect(result.current.isRetryPending).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const firstCallPayload = JSON.parse(fetchSpy.mock.calls[0][1].body);

    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const secondCallPayload = JSON.parse(fetchSpy.mock.calls[1][1].body);

    expect(secondCallPayload.idempotencyKey).toBe(firstCallPayload.idempotencyKey);
    expect(secondCallPayload.customerId).toBe(customerA.id);
    expect(secondCallPayload.branchId).toBe(merchantBranchId);
    expect(result.current.isRetryPending).toBe(false);
  });

  it('allows retrying pinned operation after clearing keypad when selectedCustomer is null', async () => {
    let callCount = 0;
    const fetchSpy = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Connection timeout');
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          visitId: 'visit-retry-cleared-keypad',
          replayed: false,
          currentVisits: 4,
        }),
      };
    });
    global.fetch = fetchSpy as any;

    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    function TestHarnessWithKeypadClear() {
      const [customer, setCustomer] = useState<RegisteredCustomer | null>(customerA);
      const controller = useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        merchantBranchVenue: cafeSlug,
        isCheckingMerchantAuth: false,
        cafeSlug,
        selectedCustomer: customer,
        setSelectedCustomer: setCustomer,
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
      });

      return { controller, customer, setCustomer };
    }

    const { result } = renderHook(() => TestHarnessWithKeypadClear());

    await act(async () => {
      await result.current.controller.handleAddStamp();
    });

    expect(result.current.controller.networkWarning).not.toBeNull();
    expect(result.current.controller.isRetryPending).toBe(true);
    const firstCallPayload = JSON.parse(fetchSpy.mock.calls[0][1].body);

    act(() => {
      result.current.setCustomer(null);
    });
    expect(result.current.customer).toBeNull();

    await act(async () => {
      await result.current.controller.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const secondCallPayload = JSON.parse(fetchSpy.mock.calls[1][1].body);

    expect(secondCallPayload.idempotencyKey).toBe(firstCallPayload.idempotencyKey);
    expect(secondCallPayload.customerId).toBe(customerA.id);
    expect(secondCallPayload.branchId).toBe(merchantBranchId);
    expect(result.current.controller.isRetryPending).toBe(false);
    expect(setSuccessNotice).toHaveBeenCalledWith(expect.stringContaining(customerA.name!));
  });

  it('handleRefreshProgress never calls CRM search or swaps customer identity', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;

    const { result } = renderHook(() =>
      useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        merchantBranchVenue: cafeSlug,
        isCheckingMerchantAuth: false,
        cafeSlug,
        selectedCustomer: customerA,
        setSelectedCustomer: vi.fn(),
        recordShiftStamp: vi.fn(),
        setErrorNotice: vi.fn(),
        setSuccessNotice: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleRefreshProgress();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.progressWarning).toContain('مزامنة رصيد المكافآت التراكمي غير مفعلة');
  });

  it('blocks stamp dispatch when counter venue does not match merchant branch context', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;
    const setErrorNotice = vi.fn();

    const { result } = renderHook(() =>
      useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId: null,
        merchantBranchVenue: null,
        isCheckingMerchantAuth: false,
        cafeSlug: 'different-slug',
        selectedCustomer: customerA,
        setSelectedCustomer: vi.fn(),
        recordShiftStamp: vi.fn(),
        setErrorNotice,
        setSuccessNotice: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setErrorNotice).toHaveBeenCalledWith(expect.stringContaining('تعذر تحديد فرع التاجر المطابق للكاونتر'));
  });

  it('resolveMerchantBranchContext strictly validates venue slug, membership, and branch scope', async () => {
    const mockOrgId = 'org-123';
    const mockBranchId = 'branch-match-uuid';

    const createMockSupabase = (opts: {
      branchData?: any;
      branchError?: any;
      memberData?: any;
      memberError?: any;
    }) => ({
      from: (table: string) => {
        if (table === 'branches') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: opts.branchData ?? null,
                    error: opts.branchError ?? null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'organization_members') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: opts.memberData ?? null,
                    error: opts.memberError ?? null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      },
    });

    const resNoUser = await resolveMerchantBranchContext(null, null, cafeSlug);
    expect(resNoUser.branchId).toBeNull();
    expect(resNoUser.error).toContain('يلزم تسجيل دخول تاجر معتمد');

    const sbNoBranch = createMockSupabase({ branchData: null });
    const resNoBranch = await resolveMerchantBranchContext(sbNoBranch, 'user-1', 'unknown-cafe');
    expect(resNoBranch.branchId).toBeNull();
    expect(resNoBranch.error).toContain('تعذر مطابقة الفرع المخصص للكاونتر');

    const sbNoMem = createMockSupabase({
      branchData: { id: mockBranchId, organization_id: mockOrgId, status: 'active', slug: cafeSlug },
      memberData: null,
    });
    const resNoMem = await resolveMerchantBranchContext(sbNoMem, 'user-1', cafeSlug);
    expect(resNoMem.branchId).toBeNull();
    expect(resNoMem.error).toContain('المستخدم ليس عضواً مصرحاً');

    const sbDiffBranch = createMockSupabase({
      branchData: { id: mockBranchId, organization_id: mockOrgId, status: 'active', slug: cafeSlug },
      memberData: { organization_id: mockOrgId, branch_id: 'different-branch-uuid', role: 'cashier' },
    });
    const resDiffBranch = await resolveMerchantBranchContext(sbDiffBranch, 'user-1', cafeSlug);
    expect(resDiffBranch.branchId).toBeNull();
    expect(resDiffBranch.error).toContain('عضوية التاجر مقيدة بفرع آخر');

    const sbValid = createMockSupabase({
      branchData: { id: mockBranchId, organization_id: mockOrgId, status: 'active', slug: cafeSlug },
      memberData: { organization_id: mockOrgId, branch_id: mockBranchId, role: 'cashier' },
    });
    const resValid = await resolveMerchantBranchContext(sbValid, 'user-1', cafeSlug);
    expect(resValid.branchId).toBe(mockBranchId);
    expect(resValid.organizationId).toBe(mockOrgId);
    expect(resValid.error).toBeNull();
  });

  it('blocks stamp dispatch using stale Branch A during delayed resolution of Context B, then allows Branch B upon resolution', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        visitId: 'visit-test-context-switch',
        replayed: false,
        currentVisits: 2,
      }),
    });
    global.fetch = fetchSpy as any;
    const setErrorNotice = vi.fn();

    // Test harness representing dynamic venue switching with delayed verification
    interface HarnessProps {
      slug: string;
      branchId: string | null;
      venue: string | null;
      isChecking: boolean;
    }

    function DynamicVenueHarness(props: HarnessProps) {
      return useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId: props.branchId,
        merchantBranchVenue: props.venue,
        isCheckingMerchantAuth: props.isChecking,
        cafeSlug: props.slug,
        selectedCustomer: customerA,
        setSelectedCustomer: vi.fn(),
        recordShiftStamp: vi.fn(),
        setErrorNotice,
        setSuccessNotice: vi.fn(),
      });
    }

    // Step 1: Context A resolved and active
    const { result, rerender } = renderHook(
      (props: HarnessProps) => DynamicVenueHarness(props),
      {
        initialProps: {
          slug: 'cafe-alpha',
          branchId: 'branch-alpha-uuid',
          venue: 'cafe-alpha',
          isChecking: false,
        },
      }
    );

    // Initial stamp in Context A succeeds with Branch A
    await act(async () => {
      await result.current.handleAddStamp();
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const callA = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(callA.branchId).toBe('branch-alpha-uuid');

    // Step 2: Context switches to Context B with delayed resolution (immediate de-authorization)
    rerender({
      slug: 'cafe-beta',
      branchId: null, // De-authorized immediately
      venue: null,
      isChecking: true,
    });

    // Attempting a stamp during pending resolution of Context B must be blocked synchronously
    await act(async () => {
      await result.current.handleAddStamp();
    });

    // Fetch must NOT be called with stale Branch A or invalid branch
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(setErrorNotice).toHaveBeenCalledWith(
      expect.stringContaining('جاري التحقق من فرع الكاونتر')
    );

    // Step 3: Context B resolution completes
    rerender({
      slug: 'cafe-beta',
      branchId: 'branch-beta-uuid',
      venue: 'cafe-beta',
      isChecking: false,
    });

    // Stamping in Context B now succeeds and dispatches Branch B
    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const callB = JSON.parse(fetchSpy.mock.calls[1][1].body);
    expect(callB.branchId).toBe('branch-beta-uuid');
  });

  it('fails closed when Context B resolution fails, preventing reversion to stale Branch A', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;
    const setErrorNotice = vi.fn();

    interface HarnessProps {
      slug: string;
      branchId: string | null;
      venue: string | null;
      isChecking: boolean;
    }

    const { result, rerender } = renderHook(
      (props: HarnessProps) =>
        useTerminalVisitConfirmation({
          merchantUser,
          merchantBranchId: props.branchId,
          merchantBranchVenue: props.venue,
          isCheckingMerchantAuth: props.isChecking,
          cafeSlug: props.slug,
          selectedCustomer: customerA,
          setSelectedCustomer: vi.fn(),
          recordShiftStamp: vi.fn(),
          setErrorNotice,
          setSuccessNotice: vi.fn(),
        }),
      {
        initialProps: {
          slug: 'cafe-alpha',
          branchId: 'branch-alpha-uuid',
          venue: 'cafe-alpha',
          isChecking: false,
        },
      }
    );

    // Context switches to Context B, and resolution fails closed
    rerender({
      slug: 'cafe-beta',
      branchId: null, // Failed closed
      venue: null,
      isChecking: false,
    });

    // Attempting to stamp must be blocked synchronously without reverting to Branch A
    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setErrorNotice).toHaveBeenCalledWith(
      expect.stringContaining('تعذر تحديد فرع التاجر المطابق للكاونتر (cafe-beta)')
    );
  });

  it('preserves in-flight pinned operation payload across venue context switches during retry', async () => {
    let callCount = 0;
    const fetchSpy = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Connection reset by peer');
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          visitId: 'visit-retry-isolated',
          replayed: false,
          currentVisits: 5,
        }),
      };
    });
    global.fetch = fetchSpy as any;

    interface HarnessProps {
      slug: string;
      branchId: string | null;
      venue: string | null;
      isChecking: boolean;
    }

    const { result, rerender } = renderHook(
      (props: HarnessProps) =>
        useTerminalVisitConfirmation({
          merchantUser,
          merchantBranchId: props.branchId,
          merchantBranchVenue: props.venue,
          isCheckingMerchantAuth: props.isChecking,
          cafeSlug: props.slug,
          selectedCustomer: customerA,
          setSelectedCustomer: vi.fn(),
          recordShiftStamp: vi.fn(),
          setErrorNotice: vi.fn(),
          setSuccessNotice: vi.fn(),
        }),
      {
        initialProps: {
          slug: 'cafe-alpha',
          branchId: 'branch-alpha-uuid',
          venue: 'cafe-alpha',
          isChecking: false,
        },
      }
    );

    // Initial dispatch in Context A fails due to network drop
    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(result.current.networkWarning).not.toBeNull();
    expect(result.current.isRetryPending).toBe(true);
    const firstCallPayload = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(firstCallPayload.branchId).toBe('branch-alpha-uuid');

    // Context switches to Context B
    rerender({
      slug: 'cafe-beta',
      branchId: 'branch-beta-uuid',
      venue: 'cafe-beta',
      isChecking: false,
    });

    // Cashier retries: Must retry the original pinned operation (Branch A) without being corrupted by Context B
    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const retryCallPayload = JSON.parse(fetchSpy.mock.calls[1][1].body);

    expect(retryCallPayload.idempotencyKey).toBe(firstCallPayload.idempotencyKey);
    expect(retryCallPayload.branchId).toBe('branch-alpha-uuid'); // Pinned payload preserved!
    expect(retryCallPayload.customerId).toBe(customerA.id);
    expect(result.current.isRetryPending).toBe(false);
  });
});
