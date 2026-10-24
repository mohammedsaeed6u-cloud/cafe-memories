// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React, { useState } from 'react';
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

  it('suppresses audio chime and shift counter increment on duplicate replay (replayed: true)', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        visitId: 'visit-existing-uuid',
        replayed: true,
        currentVisits: 3,
      }),
    });
    global.fetch = fetchSpy as any;

    let selectedCustomerState = { ...customerA };
    const setSelectedCustomer = vi.fn();
    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    const { result } = renderHook(() =>
      useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        cafeSlug,
        selectedCustomer: selectedCustomerState,
        setSelectedCustomer,
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
      })
    );

    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(SoundEffectsService.playStampChime).not.toHaveBeenCalled();
    expect(recordShiftStamp).not.toHaveBeenCalled();
    expect(setSuccessNotice).toHaveBeenCalledWith(expect.stringContaining('طلب مكرر - لم تتم مضاعفة الختم'));
  });

  it('triggers audio chime and increments shift counter on fresh verified visit', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        visitId: 'visit-fresh-uuid',
        replayed: false,
        currentVisits: 4,
      }),
    });
    global.fetch = fetchSpy as any;

    let selectedCustomerState = { ...customerA };
    const setSelectedCustomer = vi.fn();
    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    const { result } = renderHook(() =>
      useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        cafeSlug,
        selectedCustomer: selectedCustomerState,
        setSelectedCustomer,
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
      })
    );

    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(SoundEffectsService.playStampChime).toHaveBeenCalledTimes(1);
    expect(recordShiftStamp).toHaveBeenCalledTimes(1);
    expect(setSuccessNotice).toHaveBeenCalledWith(expect.stringContaining('تم تأكيد وحفظ الزيارة بنجاح للعميل (Customer A)'));
  });

  it('does NOT corrupt customer card if customer selection changed during in-flight submission', async () => {
    let resolveFetch: (val: any) => void;
    const pendingFetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    global.fetch = vi.fn().mockReturnValue(pendingFetchPromise) as any;

    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    function TestTerminalHarness() {
      const [activeCustomer, setActiveCustomer] = useState<RegisteredCustomer | null>(customerA);
      const controller = useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        cafeSlug,
        selectedCustomer: activeCustomer,
        setSelectedCustomer: setActiveCustomer,
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
      });

      return { controller, activeCustomer, setActiveCustomer };
    }

    const { result } = renderHook(() => TestTerminalHarness());

    let stampPromise: Promise<void>;
    act(() => {
      stampPromise = result.current.controller.handleAddStamp();
    });

    act(() => {
      result.current.setActiveCustomer(customerB);
    });

    expect(result.current.activeCustomer?.id).toBe(customerB.id);

    await act(async () => {
      resolveFetch!({
        ok: true,
        json: async () => ({
          success: true,
          visitId: 'visit-cust-a',
          replayed: false,
          currentVisits: 4,
        }),
      });
      await stampPromise!;
    });

    expect(result.current.activeCustomer?.id).toBe(customerB.id);
    expect(result.current.activeCustomer?.totalVisits).toBe(1);
    expect(setSuccessNotice).toHaveBeenCalledWith(expect.stringContaining('Customer A'));
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
          visitId: 'visit-retry-uuid',
          replayed: false,
          currentVisits: 4,
        }),
      };
    });
    global.fetch = fetchSpy as any;

    let selectedCustomerState = { ...customerA };
    const setSelectedCustomer = vi.fn();
    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    const { result } = renderHook(() =>
      useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        cafeSlug,
        selectedCustomer: selectedCustomerState,
        setSelectedCustomer,
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
      })
    );

    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(result.current.networkWarning).toContain('انقطع الاتصال بالخادم');
    const firstCallPayload = JSON.parse(fetchSpy.mock.calls[0][1].body);

    await act(async () => {
      await result.current.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const secondCallPayload = JSON.parse(fetchSpy.mock.calls[1][1].body);

    expect(secondCallPayload.idempotencyKey).toBe(firstCallPayload.idempotencyKey);
    expect(secondCallPayload.customerId).toBe(customerA.id);
    expect(secondCallPayload.branchId).toBe(merchantBranchId);
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

    // 1. Initial attempt fails due to connection drop
    await act(async () => {
      await result.current.controller.handleAddStamp();
    });

    expect(result.current.controller.networkWarning).not.toBeNull();
    const firstCallPayload = JSON.parse(fetchSpy.mock.calls[0][1].body);

    // 2. Cashier clears keypad (selectedCustomer becomes null)
    act(() => {
      result.current.setCustomer(null);
    });
    expect(result.current.customer).toBeNull();

    // 3. Cashier clicks Retry while selectedCustomer is null
    await act(async () => {
      await result.current.controller.handleAddStamp();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const secondCallPayload = JSON.parse(fetchSpy.mock.calls[1][1].body);

    // Assert that the exact pinned operation payload was dispatched without requiring customer reselection
    expect(secondCallPayload.idempotencyKey).toBe(firstCallPayload.idempotencyKey);
    expect(secondCallPayload.customerId).toBe(customerA.id);
    expect(secondCallPayload.branchId).toBe(merchantBranchId);
    expect(setSuccessNotice).toHaveBeenCalledWith(expect.stringContaining(customerA.name!));
  });

  it('handleRefreshProgress never calls CRM search or swaps customer identity', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;

    let selectedCustomerState = { ...customerA };
    const setSelectedCustomer = vi.fn();
    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    const { result } = renderHook(() =>
      useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId,
        cafeSlug,
        selectedCustomer: selectedCustomerState,
        setSelectedCustomer,
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
      })
    );

    await act(async () => {
      await result.current.handleRefreshProgress();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setSelectedCustomer).not.toHaveBeenCalled();
    expect(result.current.progressWarning).toContain('مزامنة رصيد المكافآت التراكمي غير مفعلة');
  });

  it('blocks stamp dispatch when merchantBranchId is not matched to venue context', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;

    let selectedCustomerState = { ...customerA };
    const setSelectedCustomer = vi.fn();
    const recordShiftStamp = vi.fn();
    const setErrorNotice = vi.fn();
    const setSuccessNotice = vi.fn();

    const { result } = renderHook(() =>
      useTerminalVisitConfirmation({
        merchantUser,
        merchantBranchId: null,
        cafeSlug,
        selectedCustomer: selectedCustomerState,
        setSelectedCustomer,
        recordShiftStamp,
        setErrorNotice,
        setSuccessNotice,
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

    // Mock Supabase client
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

    // 1. Without userId, fails closed immediately
    const resNoUser = await resolveMerchantBranchContext(null, null, cafeSlug);
    expect(resNoUser.branchId).toBeNull();
    expect(resNoUser.error).toContain('يلزم تسجيل دخول تاجر معتمد');

    // 2. When branch does not match venue context slug
    const sbNoBranch = createMockSupabase({ branchData: null });
    const resNoBranch = await resolveMerchantBranchContext(sbNoBranch, 'user-1', 'unknown-cafe');
    expect(resNoBranch.branchId).toBeNull();
    expect(resNoBranch.error).toContain('تعذر مطابقة الفرع المخصص للكاونتر');

    // 3. When caller is not a member of the branch organization
    const sbNoMem = createMockSupabase({
      branchData: { id: mockBranchId, organization_id: mockOrgId, status: 'active', slug: cafeSlug },
      memberData: null,
    });
    const resNoMem = await resolveMerchantBranchContext(sbNoMem, 'user-1', cafeSlug);
    expect(resNoMem.branchId).toBeNull();
    expect(resNoMem.error).toContain('المستخدم ليس عضواً مصرحاً');

    // 4. When member is restricted to a different branch
    const sbDiffBranch = createMockSupabase({
      branchData: { id: mockBranchId, organization_id: mockOrgId, status: 'active', slug: cafeSlug },
      memberData: { organization_id: mockOrgId, branch_id: 'different-branch-uuid', role: 'cashier' },
    });
    const resDiffBranch = await resolveMerchantBranchContext(sbDiffBranch, 'user-1', cafeSlug);
    expect(resDiffBranch.branchId).toBeNull();
    expect(resDiffBranch.error).toContain('عضوية التاجر مقيدة بفرع آخر');

    // 5. Valid match (matching branch, active member in same org)
    const sbValid = createMockSupabase({
      branchData: { id: mockBranchId, organization_id: mockOrgId, status: 'active', slug: cafeSlug },
      memberData: { organization_id: mockOrgId, branch_id: mockBranchId, role: 'cashier' },
    });
    const resValid = await resolveMerchantBranchContext(sbValid, 'user-1', cafeSlug);
    expect(resValid.branchId).toBe(mockBranchId);
    expect(resValid.organizationId).toBe(mockOrgId);
    expect(resValid.error).toBeNull();
  });
});
