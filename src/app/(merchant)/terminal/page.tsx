'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Branch = { id: string; name: string };
type Context = { organization: { name: string }; branches: Branch[] };
type Customer = { customer: { id: string; displayName: string }; verifiedVisits: number;
  rule: { id: string; name: string; threshold: number } | null; availableRewards: number };

export default function StaffTerminalPage() {
  const router = useRouter();
  const [context, setContext] = useState<Context | null>(null);
  const [branchId, setBranchId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const visitKey = useRef<string | null>(null);
  const rewardKey = useRef<string | null>(null);

  const loadContext = useCallback(async () => {
    const response = await fetch('/api/v1/merchant/context', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'تعذر تحميل بيانات المنشأة');
    setContext(body); setBranchId(body.branches[0]?.id ?? ''); setNotice('');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadContext().catch((error) => setNotice(error instanceof Error ? error.message : 'تعذر الاتصال')), 0);
    return () => clearTimeout(timer);
  }, [loadContext]);

  async function lookup(id: string) {
    setNotice(''); setBusy(true);
    try {
      const response = await fetch(`/api/v1/merchant/customer?customerId=${encodeURIComponent(id)}&branchId=${branchId}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setCustomer(body);
    } catch (error) { setCustomer(null); setNotice(error instanceof Error ? error.message : 'تعذر البحث'); }
    finally { setBusy(false); }
  }

  async function transact(path: string, payload: object, key: React.RefObject<string | null>, success: string) {
    if (!customer) return;
    setBusy(true); setNotice('');
    key.current ??= crypto.randomUUID();
    try {
      const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.customer.id, branchId, idempotencyKey: key.current, ...payload }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'تعذر إتمام العملية');
      key.current = null;
      await lookup(customer.customer.id);
      setNotice(success);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر إتمام العملية'); }
    finally { setBusy(false); }
  }

  return <main dir="rtl" className="max-w-4xl mx-auto p-5 md:p-10 space-y-8">
    <header className="flex justify-between items-center gap-4 border-b border-white/10 pb-5">
      <div><p className="text-xs text-red-400 font-bold">CAFÉ MEMORIES · STAFF</p><h1 className="text-2xl font-bold mt-2">محطة الموظف</h1>
        <p className="text-sm text-stone-400">{context?.organization.name ?? 'جارٍ تحميل المنشأة...'}</p></div>
      <div className="flex gap-3 text-sm"><Link className="underline" href="/dashboard">لوحة الإدارة</Link>
        <button className="underline" onClick={async () => { await createClient().auth.signOut(); router.replace('/login'); }}>خروج</button></div>
    </header>
    {notice && <p role="status" className="bg-[#332221] border border-red-900/50 rounded-xl p-4">{notice}</p>}
    {!context && notice && <button className="underline" onClick={() => loadContext().catch((error) => setNotice(error.message))}>إعادة تحميل بيانات المنشأة</button>}
    {context && <section className="rounded-xl bg-[#211f1f] border border-white/10 p-6 space-y-5">
      <h2 className="text-xl font-bold">تأكيد زيارة / صرف مكافأة</h2>
      <p className="text-sm text-stone-400">اطلب من الضيف فتح صفحة هذا الفرع وعرض معرّفه خلال ساعتين من الحضور. لا تستخدم رقم الهاتف أو صورة فقط لإثبات الشراء.</p>
      {context.branches.length > 1 && <label className="block text-sm">الفرع<select value={branchId} onChange={(e) => { setBranchId(e.target.value); setCustomer(null); }} className="block mt-2 rounded bg-black/30 border border-white/20 p-2">
        {context.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); visitKey.current = null; rewardKey.current = null; lookup(customerId.trim()); }}>
        <input required value={customerId} onChange={(e) => { setCustomerId(e.target.value); setCustomer(null); }} placeholder="معرّف الضيف UUID" dir="ltr" className="min-w-0 flex-1 rounded bg-black/30 border border-white/20 p-3" />
        <button disabled={busy || !branchId} className="rounded bg-[#dd0200] px-5 font-bold disabled:opacity-50">بحث</button>
      </form>
      {customer && <div className="space-y-4 border-t border-white/10 pt-5">
        <p className="font-bold">{customer.customer.displayName}</p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-black/30 p-4"><strong className="text-3xl">{customer.verifiedVisits}</strong><p className="text-stone-400 text-sm">زيارات موثقة</p></div>
          <div className="rounded-lg bg-black/30 p-4"><strong className="text-3xl">{customer.availableRewards}</strong><p className="text-stone-400 text-sm">مكافآت متاحة</p></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button disabled={busy} onClick={() => transact('/api/v1/visits', {}, visitKey, 'تم توثيق الزيارة في قاعدة البيانات')}
            className="rounded-lg bg-[#dd0200] px-5 py-3 font-bold disabled:opacity-50">تأكيد شراء وزيارة</button>
          <button disabled={busy || !customer.rule || customer.availableRewards < 1}
            onClick={() => customer.rule && transact('/api/v1/rewards/redeem', { rewardRuleId: customer.rule.id }, rewardKey, 'تم صرف المكافأة')}
            className="rounded-lg bg-emerald-800 px-5 py-3 font-bold disabled:opacity-50">صرف {customer.rule?.name ?? 'مكافأة'}</button>
        </div>
      </div>}
    </section>}
  </main>;
}
