"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Connector = { id: string; provider: string; label: string; plan: string;
  enabled: boolean; verified_at: string | null; created_at: string };
type Organization = { id: string; name: string; status: string; wallet_connector_id: string | null };
type Data = { encryptionReady: boolean; connectors: Connector[]; organizations: Organization[];
  health: { pendingUpdates:number; manualReviews:number; unknownCampaigns:number; staleProcessing:number } | null };

export function WalletConnectorsPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [label, setLabel] = useState('');
  const [key, setKey] = useState('');
  const [rotationKeys, setRotationKeys] = useState<Record<string,string>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch('/api/v1/admin/wallet-connectors', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'تعذر تحميل اتصالات WalletWallet');
    setData(body as Data);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => load().catch((error) => setNotice(error.message)), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function send(method: string, url: string, body?: object) {
    setBusy(true); setNotice('');
    try {
      const response = await fetch(url, { method,
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'تعذر الاتصال');
      await load();
      setNotice(result.tested ? `اتحققنا من المزوّد: ${result.plan} · ${result.remaining} استخدام متبقّي.`
        : result.requiresTest ? 'اتحفظ المفتاح الجديد. اختبر الاتصال من جديد قبل أي إصدار أو حملة.' : 'اتحفظ التعديل.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر الاتصال'); }
    finally { setBusy(false); }
  }
  async function add(event: FormEvent) {
    event.preventDefault();
    await send('POST', '/api/v1/admin/wallet-connectors', { label, apiKey: key });
    // Even on failure, don't keep a secret in component state after a submission.
    setKey('');
  }
  async function rotate(id:string) {
    const apiKey = rotationKeys[id];
    if (!apiKey || !window.confirm('هل المفتاح الجديد من نفس فريق WalletWallet؟ البطاقات القديمة تحتاج نفس الفريق. بعد التغيير لازم تختبر الاتصال.')) return;
    await send('PATCH','/api/v1/admin/wallet-connectors',{id,apiKey});
    setRotationKeys((current)=>({...current,[id]:''}));
  }
  return <section className="paper-card rounded-[1.75rem] p-6 sm:p-8" aria-label="اتصالات WalletWallet">
    <p className="eyebrow text-rust">إدارة SaaS / اتصالات Wallet</p>
    <h2 className="mt-2 text-2xl font-bold">أكثر من مفتاح، وكل منشأة اتصالها.</h2>
    <p className="mt-3 max-w-3xl text-xs leading-7 text-ink/60">المفاتيح تتخزن مشفرة على الخادم بمفتاح منفصل، ومش بترجع في أي استجابة. أضف مفتاح WalletWallet ثم اختبره واربطه بالمنشأة. تغيير اتصال منشأة لا ينقل البطاقات القديمة تلقائيًا؛ تفضل مرتبطة بمفتاحها الأصلي لتحديثها.</p>
    {notice && <p role="status" className="mt-5 rounded-xl bg-[#fff2e9] p-4 text-sm text-rust">{notice} <button onClick={() => load().catch((error) => setNotice(error.message))} className="font-bold underline">تحديث</button></p>}
    {!data && !notice && <p role="status" className="mt-6 text-sm text-ink/55">بنراجع حالة اتصالات المنصة…</p>}
    {data && <>
      {!data.encryptionReady && <p role="alert" className="mt-5 rounded-xl border border-rust/20 bg-[#fff2e9] p-4 text-sm leading-7 text-rust">الإصدار متوقف: اضبط WALLET_CONNECTOR_ENCRYPTION_KEY في بيئة الخادم أولًا. لا تدخل API key قبل كده، وممنوع وضعه في الكود أو المتصفح.</p>}
      {data.health && <div className="mt-5 grid gap-2 sm:grid-cols-4" aria-label="صحة Wallet على مستوى المنصة">
        {([['تحديثات Wallet معلّقة',data.health.pendingUpdates],
          ['بطاقات تحتاج مراجعة',data.health.manualReviews],
          ['حملات مجهولة النتيجة',data.health.unknownCampaigns],
          ['حملات عالقة بالتنفيذ',data.health.staleProcessing]] as const).map(([label,value]) =>
          <div key={label} className="rounded-xl bg-sand/60 p-3"><strong className="text-xl text-rust">{value}</strong>
            <p className="mt-1 text-[11px] text-ink/55">{label}</p></div>)}</div>}
      <form onSubmit={add} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
        <label className="text-xs font-bold">اسم الاتصال
          <input className="field mt-2" minLength={2} maxLength={60} required value={label}
            onChange={(e) => setLabel(e.target.value)} placeholder="حساب WalletWallet الأول" /></label>
        <label className="text-xs font-bold">API key (لا يظهر بعد الحفظ)
          <input className="field mt-2" type="password" autoComplete="off" required
            pattern="ww_live_[0-9a-f]{32}" dir="ltr" value={key}
            onChange={(e) => setKey(e.target.value)} placeholder="ww_live_…" /></label>
        <button disabled={busy || !data.encryptionReady} className="action-primary self-end">إضافة</button>
      </form>
      {data.connectors.length === 0 ? <p className="mt-7 rounded-xl bg-sand/50 p-5 text-sm text-ink/60">لسه مفيش اتصال WalletWallet فعلي. لن نعرض زر Wallet للضيوف بدون اتصال صالح.</p>
        : <div className="mt-7 space-y-3">{data.connectors.map((item) => <div key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-forest/10 p-4 text-sm">
            <div><strong>{item.label}</strong><p className="mt-1 text-xs text-ink/50">WalletWallet · {item.verified_at ? `خطة ${item.plan} · آخر تحقق ${new Date(item.verified_at).toLocaleString('ar-EG')}` : 'لم يُختبر بعد'} · {item.enabled ? 'مفعّل للإصدار' : 'متوقف للإصدار الجديد'}</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || !data.encryptionReady} className="action-secondary text-xs"
              onClick={() => send('POST', `/api/v1/admin/wallet-connectors/${item.id}/test`)}>اختبار الاتصال</button>
              <button type="button" disabled={busy} className="action-secondary text-xs"
                onClick={() => send('PATCH', '/api/v1/admin/wallet-connectors', { id: item.id, enabled: !item.enabled })}>
                {item.enabled ? 'إيقاف الإصدار الجديد' : 'تفعيل'}</button></div>
            <details className="w-full border-t border-forest/10 pt-3 text-xs">
              <summary className="cursor-pointer font-bold text-rust">تدوير مفتاح نفس فريق WalletWallet</summary>
              <p className="mt-2 leading-6 text-ink/55">لو المفتاح لفريق مختلف، البطاقات القديمة لن تُحدَّث. المفتاح الجديد يُبطل الاختبار الحالي حتى تعيده.</p>
              <div className="mt-3 flex flex-wrap gap-2"><input type="password" autoComplete="off" dir="ltr"
                aria-label={`مفتاح جديد لاتصال ${item.label}`} pattern="ww_live_[0-9a-f]{32}"
                className="field min-w-[230px] flex-1" value={rotationKeys[item.id] ?? ''}
                onChange={(event)=>setRotationKeys((current)=>({...current,[item.id]:event.target.value}))}
                placeholder="ww_live_…" />
                <button type="button" disabled={busy || !data.encryptionReady || !/^ww_live_[0-9a-f]{32}$/.test(rotationKeys[item.id] ?? '')}
                  onClick={() => void rotate(item.id)} className="action-secondary text-xs">تبديل المفتاح ثم اختباره</button></div>
            </details>
          </div>)}</div>}
      <div className="mt-8 border-t border-forest/10 pt-6">
        <h3 className="text-lg font-bold">تخصيص الاتصال لكل منشأة</h3>
        <p className="mt-1 text-xs text-ink/55">فقط حسابات المنصة الإدارية تقدر تغيّر التخصيص. الإيقاف لا يمسح البطاقات المصدّرة.</p>
        <div className="mt-4 space-y-2">{data.organizations.filter((org) => org.status === 'active').map((org) =>
          <label key={org.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand/35 p-3 text-sm">
            <span className="font-bold">{org.name}</span>
            <select className="field max-w-xs text-xs" disabled={busy} value={org.wallet_connector_id ?? ''}
              onChange={(event) => send('PUT', '/api/v1/admin/wallet-connectors', {
                organizationId: org.id, connectorId: event.target.value || null,
              })}>
              <option value="">غير مربوط بـ WalletWallet</option>
              {data.connectors.map((item) => <option key={item.id} value={item.id} disabled={!item.enabled && item.id !== org.wallet_connector_id}>{item.label} · {item.plan}</option>)}
            </select>
          </label>)}</div>
      </div>
    </>}
  </section>;
}
