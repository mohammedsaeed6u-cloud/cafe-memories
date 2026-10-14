'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BranchQr } from '@/components/dashboard/BranchQr';

type Branch = { id: string; name: string; slug: string };
type Rule = { id: string; name: string; threshold: number };
type Screen = { id: string; name: string; branch_id: string; status: string; last_heartbeat_at: string | null };
type QrCode = { slug: string; branch_id: string };
type MerchantContext = { organization: { id: string; name: string; slug: string }; role: string;
  organizationWide: boolean; branches: Branch[]; rules: Rule[]; screens: Screen[]; qrCodes: QrCode[] };
type Memory = { id: string; caption: string | null; status: string; visibility: string;
  customers: { display_name: string | null } | null; imageUrl: string };
type Overview = { today: { visits: number; uniqueCustomers: number; newMemories: number; rewardsRedeemed: number };
  attentionCenter: { pendingMemories: number; offlineScreens: number }; liveWall: { onlineScreens: number; totalScreens: number } };

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? 'تعذر جلب البيانات');
  return body as T;
}

export default function MerchantDashboard() {
  const router = useRouter();
  const [context, setContext] = useState<MerchantContext | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [branchId, setBranchId] = useState('');
  const [ruleName, setRuleName] = useState('مشروب مجاني');
  const [threshold, setThreshold] = useState(5);
  const [screenName, setScreenName] = useState('شاشة الصالة');
  const [pairCode, setPairCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const info = await getJson<MerchantContext>('/api/v1/merchant/context');
    const selectedBranch = branchId || info.branches[0]?.id || '';
    const query = new URLSearchParams({ organizationId: info.organization.id });
    if (selectedBranch) query.set('branchId', selectedBranch);
    const [stats, feed] = await Promise.all([
      getJson<Overview>(`/api/v1/analytics/overview?${query}`),
      getJson<{ memories: Memory[] }>(`/api/v1/memories?${query}&status=pending`),
    ]);
    setContext(info); setBranchId(selectedBranch); setOverview(stats); setMemories(feed.memories);
    if (info.rules[0]) { setRuleName(info.rules[0].name); setThreshold(info.rules[0].threshold); }
  }, [branchId]);

  useEffect(() => {
    const timer = window.setTimeout(() => load().catch((error) => setNotice(error.message)), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setNotice('');
    try { await action(); setNotice(success); await load(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر الحفظ'); }
    finally { setBusy(false); }
  }

  async function post(path: string, payload: object) {
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'تعذر الحفظ');
    return body;
  }

  async function moderate(memoryId: string, status: 'approved' | 'rejected') {
    await run(async () => {
      const response = await fetch('/api/v1/memories', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, status }) });
      if (!response.ok) throw new Error((await response.json()).error);
    }, status === 'approved' ? 'تمت الموافقة' : 'تم الرفض');
  }

  if (!context) return <main dir="rtl" className="mx-auto max-w-6xl p-6 text-stone-200">
    <h1 className="text-2xl font-bold">لوحة المنشأة</h1><p className="mt-5">{notice || 'جارٍ تحميل بيانات المنشأة...'}</p>
    {notice && <div className="flex gap-4 mt-3"><button onClick={() => { setNotice(''); load().catch((error) => setNotice(error.message)); }} className="underline">إعادة المحاولة</button>
      <Link href="/login" className="underline">تسجيل الدخول</Link></div>}
  </main>;

  const canManage = context.role !== 'staff';
  const currentBranch = context.branches.find((branch) => branch.id === branchId);
  const currentQr = context.qrCodes.find((qr) => qr.branch_id === branchId);
  const currentScreens = context.screens.filter((screen) => screen.branch_id === branchId);
  return <main dir="rtl" className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 text-[#fbf9f5]">
    <header className="flex flex-wrap gap-4 items-center justify-between border-b border-white/10 pb-6">
      <div><p className="text-xs text-[#dd0200] font-bold tracking-widest">CAFÉ MEMORIES · LIVE</p>
        <h1 className="text-3xl font-bold mt-2">{context.organization.name}</h1>
        <p className="text-stone-400 text-sm mt-1">بيانات الزيارات والصور من قاعدة البيانات مباشرة · {context.role}</p></div>
      <nav className="flex flex-wrap gap-3 text-sm items-center">
        <Link href="/terminal" className="rounded-lg bg-[#dd0200] px-4 py-2 font-bold">محطة الموظف</Link>
        <button className="rounded-lg border border-white/20 px-4 py-2" onClick={() => load().catch((error) => setNotice(error.message))}>تحديث</button>
        <button className="rounded-lg border border-white/20 px-4 py-2" onClick={async () => {
          await createClient().auth.signOut(); router.replace('/login');
        }}>خروج</button>
      </nav>
    </header>
    {context.branches.length > 1 && <label className="block text-sm">الفرع
      <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="block mt-2 rounded-lg bg-[#242222] p-3 border border-white/20">
        {context.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
      </select></label>}
    {notice && <p role="status" className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-amber-200">{notice}</p>}
    <section aria-label="مؤشرات اليوم" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {([['زيارات اليوم', overview?.today.visits], ['ضيوف فريدون', overview?.today.uniqueCustomers],
        ['ذكريات اليوم', overview?.today.newMemories], ['مكافآت مصروفة', overview?.today.rewardsRedeemed]] as const)
        .map(([label, value]) => <div key={label} className="bg-[#211f1f] border border-white/10 rounded-xl p-5">
          <p className="text-stone-400 text-sm">{label}</p><p className="text-3xl font-bold mt-3">{value ?? '—'}</p>
        </div>)}
    </section>
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="bg-[#211f1f] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-xl font-bold">الصور بانتظار المراجعة ({overview?.attentionCenter.pendingMemories ?? 0})</h2>
        {memories.length === 0 && <p className="text-stone-400 text-sm">لا توجد صور معلّقة في هذا الفرع.</p>}
        {memories.map((memory) => <article key={memory.id} className="flex gap-4 border-t border-white/10 pt-4">
          {/* Private image proxy re-checks merchant membership. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={memory.imageUrl} alt="ذكرى بانتظار المراجعة" className="w-20 h-20 rounded-lg object-cover" />
          <div className="min-w-0 flex-1"><p className="font-medium">{memory.customers?.display_name || 'ضيف'} · {memory.caption || 'بدون تعليق'}</p>
            <p className="text-xs text-stone-400">{memory.visibility === 'live_wall' ? 'طلب العرض على الشاشة' : 'ذكرى خاصة'}</p>
            {canManage && <div className="mt-3 flex gap-2 text-sm">
              <button disabled={busy} onClick={() => moderate(memory.id, 'approved')} className="rounded bg-emerald-800 px-3 py-1 disabled:opacity-50">قبول</button>
              <button disabled={busy} onClick={() => moderate(memory.id, 'rejected')} className="rounded bg-stone-700 px-3 py-1 disabled:opacity-50">رفض</button>
            </div>}</div>
        </article>)}
      </section>
      <div className="space-y-6">
        <section className="bg-[#211f1f] border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold">برنامج الولاء</h2><p className="text-sm text-stone-400">الزيارة تتطلب تأكيد موظف؛ لا تحتسب الصورة زيارة موثقة. تعديل قاعدة المنشأة متاح لمسؤول المنشأة فقط.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (canManage && context.organizationWide)
            run(() => post('/api/v1/merchant/rewards', { name: ruleName, threshold }), 'تم حفظ قاعدة المكافأة'); }} className="flex flex-wrap gap-2 items-end text-sm">
            <label className="flex-1 min-w-40">المكافأة<input value={ruleName} onChange={(e) => setRuleName(e.target.value)} className="mt-1 block w-full rounded bg-black/30 border border-white/20 p-2" /></label>
            <label>عدد الزيارات<input type="number" min="2" max="30" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="mt-1 block w-24 rounded bg-black/30 border border-white/20 p-2" /></label>
            {canManage && context.organizationWide && <button disabled={busy} className="rounded bg-[#dd0200] px-4 py-2 disabled:opacity-50">حفظ</button>}
          </form>
        </section>
        <section className="bg-[#211f1f] border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold">رمز الفرع {currentBranch?.name}</h2>
          {currentQr ? <div className="space-y-3"><BranchQr slug={currentQr.slug} />
            <a href={`/go/${currentQr.slug}`} target="_blank" rel="noreferrer" className="text-red-300 underline break-all">/go/{currentQr.slug}</a>
          </div> : <p className="text-sm text-stone-400">لا يوجد رمز QR لهذا الفرع بعد.</p>}
          {!currentQr && canManage && branchId && <button disabled={busy} onClick={() => run(() => post('/api/v1/merchant/qr', { branchId, source: 'table' }), 'تم إنشاء رابط المسح')} className="rounded bg-[#dd0200] px-4 py-2 disabled:opacity-50">إنشاء رابط QR</button>}
        </section>
        <section className="bg-[#211f1f] border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-xl font-bold">شاشات الصالة ({overview?.liveWall.onlineScreens ?? 0}/{overview?.liveWall.totalScreens ?? 0} متصلة)</h2>
          {currentScreens.map((screen) => <div key={screen.id} className="flex justify-between gap-2 text-sm border-t border-white/10 pt-3">
            <span>{screen.name} · {screen.status}</span><div className="flex gap-3"><Link href={`/wall/${screen.id}`} className="underline">فتح</Link>
              {canManage && <button className="text-red-300 underline" onClick={() => run(async () => {
                const response = await fetch(`/api/v1/screens/${screen.id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error((await response.json()).error);
              }, 'تم فصل الشاشة')}>فصل</button>}</div>
          </div>)}
          {canManage && branchId && <><div className="flex gap-2"><input value={screenName} onChange={(e) => setScreenName(e.target.value)} className="min-w-0 flex-1 rounded bg-black/30 border border-white/20 p-2" aria-label="اسم الشاشة" />
            <button disabled={busy} onClick={() => run(async () => {
              const result = await post('/api/v1/screens/pairing-code', { branchId, screenName });
              setPairCode(result);
            }, 'رمز الاقتران صالح لمدة 10 دقائق')} className="rounded bg-[#dd0200] px-3 py-2 disabled:opacity-50">رمز اقتران</button></div>
            {pairCode && <p className="text-center text-3xl font-mono tracking-widest" dir="ltr">{pairCode.code}</p>}
          </>}
        </section>
      </div>
    </div>
  </main>;
}
