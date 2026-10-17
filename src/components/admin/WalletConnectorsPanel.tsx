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
  return (
    <section className="bg-[#141212] rounded-2xl border border-white/10 shadow-xl p-6 sm:p-8 text-[#FBF9F5]" aria-label="اتصالات WalletWallet">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono tracking-widest text-[#DFAB56] font-bold uppercase">إدارة SAAS • اتصالات WALLET</p>
          <h2 className="mt-2 text-xl font-bold font-serif text-[#FBF9F5]">إدارة اتصالات WalletWallet ومفاتيح الربط المشفرة</h2>
        </div>
      </div>
      <p className="mt-2 max-w-3xl text-xs leading-relaxed text-stone-300">
        المفاتيح تُخزن مشفرة على الخادم بمفتاح منفصل (Envelope Encryption)، ولا تظهر في أي استجابة. أضف مفتاح WalletWallet ثم اختبره واخصصه للمنشأة المستهدفة.
      </p>

      {notice && (
        <p role="status" className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/40 p-3.5 text-xs text-amber-200 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => load().catch((error) => setNotice(error.message))} className="font-bold underline text-[#DFAB56] cursor-pointer">
            تحديث
          </button>
        </p>
      )}

      {!data && !notice && <p role="status" className="mt-6 text-xs text-stone-400">بنراجع حالة اتصالات المنصة…</p>}

      {data && (
        <>
          {!data.encryptionReady && (
            <p role="alert" className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3.5 text-xs leading-relaxed text-rose-200">
              الإصدار متوقف: اضبط WALLET_CONNECTOR_ENCRYPTION_KEY في بيئة الخادم أولًا. لا تدخل API key قبل ذلك، وممنوع وضعه في الكود أو المتصفح.
            </p>
          )}

          {data.health && (
            <div className="mt-5 grid gap-3 sm:grid-cols-4" aria-label="صحة Wallet على مستوى المنصة">
              {([
                ['تحديثات Wallet معلّقة', data.health.pendingUpdates],
                ['بطاقات تحتاج مراجعة', data.health.manualReviews],
                ['حملات مجهولة النتيجة', data.health.unknownCampaigns],
                ['حملات عالقة بالتنفيذ', data.health.staleProcessing],
              ] as const).map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <strong className="text-xl font-mono text-[#DFAB56]">{value}</strong>
                  <p className="mt-1 text-[11px] text-stone-400">{label}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={add} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
            <label className="text-xs font-bold text-stone-200">
              اسم الاتصال
              <input
                className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/15 focus:border-[#DFAB56] text-white text-xs rounded-xl outline-none placeholder:text-stone-500"
                minLength={2}
                maxLength={60}
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="حساب WalletWallet الأول"
              />
            </label>
            <label className="text-xs font-bold text-stone-200">
              API key (لا يظهر بعد الحفظ)
              <input
                className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/15 focus:border-[#DFAB56] text-white font-mono text-xs rounded-xl outline-none placeholder:text-stone-500"
                type="password"
                autoComplete="off"
                required
                pattern="ww_live_[0-9a-f]{32}"
                dir="ltr"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="ww_live_…"
              />
            </label>
            <button
              disabled={busy || !data.encryptionReady}
              className="px-4 py-2 bg-[#682025] hover:bg-[#8B3A2B] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer self-end h-[38px]"
            >
              إضافة
            </button>
          </form>

          {data.connectors.length === 0 ? (
            <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-stone-400">
              لا يوجد اتصال WalletWallet مفعّل حالياً. لن يظهر خيار إصدار البطاقات الرقمية بدون اتصال صالح.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {data.connectors.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs"
                >
                  <div>
                    <strong className="text-white text-sm">{item.label}</strong>
                    <p className="mt-1 text-stone-400">
                      WalletWallet · {item.verified_at ? `خطة ${item.plan} · آخر تحقق ${new Date(item.verified_at).toLocaleDateString('ar-EG')}` : 'لم يُختبر بعد'} ·{' '}
                      <span className={item.enabled ? 'text-emerald-400' : 'text-amber-400'}>
                        {item.enabled ? 'مفعّل للإصدار' : 'متوقف للإصدار الجديد'}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || !data.encryptionReady}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/15 transition cursor-pointer"
                      onClick={() => send('POST', `/api/v1/admin/wallet-connectors/${item.id}/test`)}
                    >
                      اختبار الاتصال
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/15 transition cursor-pointer"
                      onClick={() => send('PATCH', '/api/v1/admin/wallet-connectors', { id: item.id, enabled: !item.enabled })}
                    >
                      {item.enabled ? 'إيقاف الإصدار الجديد' : 'تفعيل'}
                    </button>
                  </div>
                  <details className="w-full border-t border-white/10 pt-3 text-xs">
                    <summary className="cursor-pointer font-bold text-[#DFAB56]">تدوير مفتاح نفس فريق WalletWallet</summary>
                    <p className="mt-2 leading-relaxed text-stone-400">
                      إذا كان المفتاح لفريق مختلف، لن تُحدّث البطاقات القديمة. المفتاح الجديد يُبطل الاختبار الحالي حتى تعيده.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        type="password"
                        autoComplete="off"
                        dir="ltr"
                        aria-label={`مفتاح جديد لاتصال ${item.label}`}
                        pattern="ww_live_[0-9a-f]{32}"
                        className="min-w-[230px] flex-1 px-3 py-1.5 bg-white/5 border border-white/15 text-white font-mono text-xs rounded-lg outline-none placeholder:text-stone-500"
                        value={rotationKeys[item.id] ?? ''}
                        onChange={(event) => setRotationKeys((current) => ({ ...current, [item.id]: event.target.value }))}
                        placeholder="ww_live_…"
                      />
                      <button
                        type="button"
                        disabled={busy || !data.encryptionReady || !/^ww_live_[0-9a-f]{32}$/.test(rotationKeys[item.id] ?? '')}
                        onClick={() => void rotate(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#DFAB56] hover:bg-[#DFAB56]/90 text-stone-900 font-bold transition cursor-pointer"
                      >
                        تبديل المفتاح ثم اختباره
                      </button>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="text-base font-bold text-white font-serif">تخصيص الاتصال لكل منشأة</h3>
            <p className="mt-1 text-xs text-stone-400">فقط حسابات المنصة الإدارية تستطيع تغيير التخصيص. إيقاف الاتصال لا يمسح البطاقات الصادرة.</p>
            <div className="mt-4 space-y-2">
              {data.organizations
                .filter((org) => org.status === 'active')
                .map((org) => (
                  <label key={org.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">
                    <span className="font-bold text-white">{org.name}</span>
                    <select
                      className="max-w-xs px-3 py-1.5 bg-[#1C1B1B] border border-white/20 text-white rounded-lg outline-none"
                      disabled={busy}
                      value={org.wallet_connector_id ?? ''}
                      onChange={(event) =>
                        send('PUT', '/api/v1/admin/wallet-connectors', {
                          organizationId: org.id,
                          connectorId: event.target.value || null,
                        })
                      }
                    >
                      <option value="">غير مربوط بـ WalletWallet</option>
                      {data.connectors.map((item) => (
                        <option key={item.id} value={item.id} disabled={!item.enabled && item.id !== org.wallet_connector_id}>
                          {item.label} · {item.plan}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
