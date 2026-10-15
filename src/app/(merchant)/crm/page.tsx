"use client";

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { MerchantNav } from '@/components/dashboard/MerchantNav';

type CustomerRow = { id: string; displayName: string; lastVisitAt: string;
  verifiedVisits: number; rewardsRedeemed: number; walletIssued: boolean; walletMarketingOptIn: boolean };
type Cursor = { beforeAt: string; beforeCustomer: string };
type Context = { organization: { id: string; name: string }; role: string; organizationWide: boolean;
  branches: { id: string; name: string }[] };

export default function CRMPage() {
  const [context, setContext] = useState<Context | null>(null);
  const [branch, setBranch] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const loadPage = useCallback(async (branchId: string, needle: string, before: Cursor | null, append: boolean) => {
    setLoading(true); setNotice('');
    try {
      const params = new URLSearchParams();
      if (branchId) params.set('branchId',branchId);
      if (needle) params.set('search',needle);
      if (before) { params.set('beforeAt',before.beforeAt); params.set('beforeCustomer',before.beforeCustomer); }
      const response = await fetch(`/api/v1/crm/customers?${params}`, { cache:'no-store' });
      if (!response.ok) {
        const text = await response.text();
        let errMsg = 'تعذر تحميل علاقات الضيوف';
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          if (response.status === 401) errMsg = 'تسجيل الدخول مطلوب للوصول إلى علاقات الضيوف';
        }
        throw new Error(errMsg);
      }
      const body = await response.json();
      setRows((current) => append ? [...current,...(body.customers || [])] : (body.customers || []));
      setCursor(body.nextCursor || null);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر الاتصال'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('/api/v1/merchant/context', { cache:'no-store' }).then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          let errMsg = 'تعذر تحميل بيانات المنشأة';
          try {
            const parsed = JSON.parse(text);
            if (parsed.error) errMsg = parsed.error;
          } catch {
            if (response.status === 401) errMsg = 'تسجيل الدخول مطلوب للوصول إلى بيانات المنشأة';
          }
          throw new Error(errMsg);
        }
        const body = await response.json();
        setContext(body);
        if (!['owner','admin','manager'].includes(body.role)) {
          setNotice('صفحة العلاقات متاحة للمدير فقط.'); return;
        }
        const initialBranch = body.organizationWide ? '' : body.branches[0]?.id ?? '';
        setBranch(initialBranch); void loadPage(initialBranch,'',null,false);
      }).catch((error) => setNotice(error instanceof Error ? error.message : 'تعذر الاتصال'));
    },0);
    return () => clearTimeout(timer);
  }, [loadPage]);
  function chooseBranch(id: string) {
    setBranch(id); setRows([]); setCursor(null);
    void loadPage(id,search,null,false);
  }
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const needle = query.trim(); setSearch(needle); setRows([]); setCursor(null);
    void loadPage(branch,needle,null,false);
  }
  const eligible = rows.filter((row) => row.walletMarketingOptIn).length;
  return <main dir="rtl" className="min-h-screen bg-paper text-ink">
    <div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[245px_minmax(0,1fr)]">
      <MerchantNav organizationName={context?.organization.name ?? 'مساحة المنشأة'} active="crm" role={context?.role} organizationWide={context?.organizationWide} />
      <div className="min-w-0 px-5 py-8 md:px-9 md:py-11 xl:px-12"><div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow text-rust">العلاقة لا الصورة الخاصة</p>
            <h1 className="display-heading mt-2 text-3xl sm:text-4xl">ضيوف بيرجعوا لك.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/55">ملخص زيارات مؤكّدة ومكافآت صُرفت فعلاً. صور الضيوف الخاصة أو المرفوضة مش موجودة هنا أساساً، حتى كعدد.</p></div>
          {context?.organizationWide && <Link href="/campaigns" className="action-secondary text-sm">حملات Wallet ↖</Link>}
        </header>
        {notice && <p role="alert" className="rounded-xl bg-[#fff2e9] p-4 text-sm text-rust">{notice}</p>}
        {context && ['owner','admin','manager'].includes(context.role) && <>
          <section className="paper-card rounded-[1.75rem] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div><p className="eyebrow text-rust">الملف المبني على الواقع</p>
                <h2 className="mt-2 text-xl font-bold">{rows.length} ضيف في النتائج المعروضة</h2>
                <p className="mt-2 text-xs leading-6 text-ink/50">{eligible} موافقين على رسائل Wallet ضمن النتائج. إصدار البطاقة مش معناه إنها اتثبتت.</p></div>
              {context.organizationWide && context.branches.length > 1 && <label className="text-xs font-bold">الفرع
                <select className="field mt-2" value={branch} onChange={(event) => chooseBranch(event.target.value)} disabled={loading}>
                  <option value="">كل الفروع</option>
                  {context.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>}
            </div>
            <form onSubmit={submitSearch} className="mt-6 flex flex-wrap gap-3">
              <label className="min-w-[210px] flex-1 text-xs font-bold">ابحث باسم الضيف
                <input className="field mt-2" placeholder="الاسم فقط، من غير صور أو بيانات اتصال" maxLength={80}
                  value={query} onChange={(event) => setQuery(event.target.value)} /></label>
              <button disabled={loading} className="action-primary self-end text-sm">بحث</button>
            </form>
          </section>
          {rows.length === 0 && <div className="paper-card rounded-[1.75rem] p-8 text-sm text-ink/60">
            {loading ? 'بنقرأ الزيارات المؤكدة…' : 'لسه مفيش ضيوف مطابقين بزيارات مؤكدة. المعلّق والمجرّد من موافقة مش بيظهر.'}
          </div>}
          {rows.length > 0 && <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((row) => <article key={row.id} className="paper-card rounded-[1.5rem] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3"><div>
                <p className="eyebrow text-rust">{row.verifiedVisits >= 3 ? 'ضيف متكرر' : 'زيارات مؤكدة'}</p>
                <h3 className="mt-2 text-lg font-bold">{row.displayName}</h3>
              </div><span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-forest">{row.verifiedVisits} أختام</span></div>
              <p className="mt-4 text-xs text-ink/55">آخر زيارة: {new Date(row.lastVisitAt).toLocaleDateString('ar-EG')}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-sand px-3 py-1">{row.rewardsRedeemed} مكافآت اتصرفت</span>
                {row.walletIssued && <span className="rounded-full bg-sand px-3 py-1">صدر له رابط Wallet</span>}
                {row.walletMarketingOptIn && <span className="rounded-full bg-sage px-3 py-1 text-forest">موافق على الرسائل</span>}
              </div>
            </article>)}
          </div>}
          {cursor && <button disabled={loading} onClick={() => void loadPage(branch,search,cursor,true)} className="action-secondary text-sm">
            {loading ? 'جارٍ التحميل…' : 'ضيوف أكثر'}</button>}
          <p className="text-xs leading-6 text-ink/45">قائمة العملاء دي للمكان ده بس؛ لا بتعرض صورهم ولا أرقامهم ولا تتبع موقعهم. إرسال أي رسالة محتاج موافقة صريحة لرسائل Wallet.</p>
        </>}
      </div></div>
    </div>
  </main>;
}
