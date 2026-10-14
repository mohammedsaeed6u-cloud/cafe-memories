'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type AdminOverview = { organizationCount: number; branchCount: number; billingEnabled: boolean;
  organizations: { id: string; name: string; slug: string; status: string; created_at: string }[] };

export default function AdminPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const response = await fetch('/api/v1/admin/overview', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'تعذر تحميل الإدارة');
    setData(body); setError('');
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => load().catch((issue) => setError(issue.message)), 0);
    return () => clearTimeout(timer);
  }, [load]);
  return <main dir="rtl" className="max-w-5xl mx-auto p-6 space-y-7">
    <header className="flex justify-between border-b border-white/10 pb-6"><div><p className="text-red-400 text-xs font-bold">PLATFORM · READ ONLY</p>
      <h1 className="text-3xl font-bold mt-2">إدارة المنصة</h1></div><Link href="/dashboard" className="text-sm underline">لوحة المنشأة</Link></header>
    {error && <div role="alert" className="text-amber-300 flex gap-4">{error}
      <button onClick={() => load().catch((issue) => setError(issue.message))} className="underline">إعادة المحاولة</button></div>}
    {!data && !error && <p className="text-stone-400">جارٍ تحميل بيانات المنصة...</p>}
    {data && <><div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border border-white/10 bg-[#211f1f] p-5">المنشآت <strong className="block text-3xl mt-2">{data.organizationCount}</strong></div>
      <div className="rounded-xl border border-white/10 bg-[#211f1f] p-5">الفروع <strong className="block text-3xl mt-2">{data.branchCount}</strong></div></div>
      <p className="text-stone-400 text-sm">لم تُفعّل الفوترة في هذه النسخة؛ لا نعرض إيرادات أو اشتراكات تقديرية.</p>
      <section className="rounded-xl border border-white/10 bg-[#211f1f] p-5"><h2 className="text-xl font-bold mb-4">أحدث المنشآت</h2>
        {data.organizations.map((org) => <div key={org.id} className="flex justify-between border-t border-white/10 py-3 text-sm">
          <span>{org.name} <span className="text-stone-400">({org.slug})</span></span><span>{org.status}</span>
        </div>)}</section></>}
  </main>;
}
