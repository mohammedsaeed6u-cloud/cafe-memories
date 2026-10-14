"use client";

import { useCallback, useEffect, useState, type FormEvent } from 'react';

type WalletView = {
  available: boolean; plan: string | null; reason: string | null;
  pass: { status: string; shareUrl: string | null; syncPending: boolean;
    revocationRequested: boolean; marketingAvailable: boolean } | null;
  preferences: { walletConsent: boolean; marketingConsent: boolean; nearbyConsent: boolean };
};

export function CustomerWalletPanel({ cafeSlug }: { cafeSlug: string }) {
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch(`/api/v1/customer/wallet?${new URLSearchParams({ cafeSlug })}`, { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'تعذر قراءة البطاقة');
    const next = body as WalletView;
    setWallet(next); setMarketing(next.preferences.marketingConsent); setNearby(next.preferences.nearbyConsent);
  }, [cafeSlug]);
  useEffect(() => {
    const timer = window.setTimeout(() => load().catch((error) => setNotice(error.message)), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function issue(event: FormEvent) {
    event.preventDefault();
    if (!agreed || !wallet?.available) return;
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/v1/customer/wallet', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeSlug, walletConsent: true, marketingConsent: marketing,
          nearbyConsent: nearby }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'تعذر إصدار البطاقة');
      await load(); setNotice('الكارت الحقيقي اتعمل عند WalletWallet. افتح رابط الإضافة لتثبيته على جهازك؛ إصدار الرابط لا يثبت أنه اتضاف بالفعل.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر إصدار البطاقة'); }
    finally { setBusy(false); }
  }
  async function savePreferences(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/v1/customer/wallet', { method:'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafeSlug, marketingConsent: marketing, nearbyConsent: nearby }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'تعذر حفظ الاختيارات');
      await load();
      setNotice(result.synced ? 'اتحفظت اختياراتك واتحدّث كارت Wallet عند المزوّد.'
        : result.note || 'اتحفظت اختياراتك، لكن تحديث Wallet لسه معلّق.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر تحديث الاختيارات'); }
    finally { setBusy(false); }
  }
  async function revoke() {
    if (!window.confirm('تأكيد إلغاء كارت Wallet؟ هتحتاج دعم المنصة لو عايز تصدر كارت جديد لنفس المكان.')) return;
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/v1/customer/wallet', { method:'DELETE',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cafeSlug }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'تعذر التأكد من الإلغاء');
      await load(); setNotice('أُلغيت البطاقة عند المزوّد. امسحها من تطبيق Wallet على جهازك أيضًا.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر التأكد من الإلغاء'); }
    finally { setBusy(false); }
  }
  const issued = wallet?.pass?.status === 'issued';
  return <section className="paper-card rounded-[1.75rem] p-6 sm:p-8" aria-label="كارت Wallet">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow text-rust">stampy. × WalletWallet</p>
        <h2 className="mt-2 text-xl font-bold">كارت ولائك على Apple وGoogle Wallet.</h2></div>
      <span aria-hidden="true" className="text-3xl text-rust">◈</span>
    </div>
    <p className="mt-3 text-xs leading-7 text-ink/60">ده كارت حقيقي لا يطلع إلا من مزوّد WalletWallet بعد موافقتك. هنشارك معاه معرّف بطاقتك ورصيد الأختام واسم المكان؛ <strong>مش هنرسل الصور أو التليفون أو الإيميل</strong>. الكارت لا يمنح ختمًا بمجرد عرضه، وتحديثاته الوظيفية قد تظهر كإشعار من نظام جهازك.</p>
    {notice && <p role="status" className="mt-5 rounded-xl bg-[#fff2e9] p-4 text-xs leading-7 text-rust">{notice} <button className="font-bold underline" onClick={() => load().catch((error) => setNotice(error.message))}>تحديث</button></p>}
    {!wallet && !notice && <p role="status" className="mt-5 text-sm text-ink/55">بنراجع اتصال Wallet…</p>}
    {wallet && <>
      {issued && wallet.pass?.shareUrl && <a href={wallet.pass.shareUrl} target="_blank" rel="noopener noreferrer"
        className="action-primary mt-6 w-full text-sm sm:w-auto">افتح صفحة الإضافة إلى Wallet ↗</a>}
      {issued && !wallet.pass?.shareUrl && <p role="alert" className="mt-5 text-xs text-rust">رابط الإضافة غير صالح أو لم يعد متاحًا؛ اطلب مراجعة مسؤول المنصة بدل رابط وهمي.</p>}
      {wallet.pass?.syncPending && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-950">تحديث البطاقة عند المزوّد لسه معلّق، لكن رصيدك الصحيح في حسابك هنا.</p>}
      {wallet.pass?.status === 'pending' || wallet.pass?.status === 'needs_review' ?
        <p role="alert" className="mt-5 text-xs text-rust">طلب Wallet يحتاج مراجعة مسؤول المنصة (إصدار أو إلغاء غير مؤكد). مش هنكرر إصدار الكارت ولا ندّعي إلغاءه تلقائيًا؛ لإيقاف أي إشعار فورًا امسح البطاقة من جهازك.</p> : null}
      {wallet.pass?.status === 'revoked' && <p className="mt-5 text-xs text-ink/60">كارت المكان اتلغى عند المزوّد. لو حابب تبدأ تاني تواصل مع الدعم.</p>}
      {!wallet.available && !issued && <p className="mt-5 rounded-xl bg-sand/60 p-4 text-xs leading-7 text-ink/65">الإصدار متوقف الآن: {wallet.reason}. مفيش رابط Wallet وهمي؛ بطاقتك الرقمية داخل حسابك شغالة.</p>}
      {(issued || (!wallet.pass && wallet.available)) &&
        <form onSubmit={issued ? savePreferences : issue} className="mt-5 space-y-3 border-t border-forest/10 pt-5">
          {!issued && <label className="flex items-start gap-3 text-xs leading-6">
            <input className="mt-1.5 h-4 w-4 accent-rust" type="checkbox" checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)} />
            أوافق على إصدار بطاقة بمعرّفي لدى WalletWallet كمزوّد مستقل، وأعرف إن لينك الإضافة محتاج خطوة مني على الجهاز.
          </label>}
          {(wallet.plan !== 'free' || issued) && <>
            <label className="flex items-start gap-3 text-xs leading-6">
              <input className="mt-1.5 h-4 w-4 accent-rust" type="checkbox" checked={marketing}
                disabled={issued && !wallet.pass?.marketingAvailable && !marketing}
                onChange={(event) => setMarketing(event.target.checked)} />
              أوافق على رسائل حملات المكان على بطاقتي في Wallet. أقدر ألغيها بعدين.
            </label>
            {issued && !wallet.pass?.marketingAvailable && <p className="text-xs leading-6 text-rust">البطاقة دي صدرت على خطة Free من غير حقل إشعارات مسبق، أو خطة المزوّد اتغيّرت. تفعيل حملات عليها يحتاج مراجعة دعم المنصة وإصدارًا آمنًا جديدًا.</p>}
            <label className="flex items-start gap-3 text-xs leading-6">
              <input className="mt-1.5 h-4 w-4 accent-rust" type="checkbox" checked={nearby}
                onChange={(event) => setNearby(event.target.checked)} />
              أوافق على إظهار بطاقتي قرب فروع المكان بواسطة Wallet، حسب إعدادات وموافقة الموقع في جهازي. التطبيق نفسه لا يتتبع مكاني.
            </label>
          </>}
          <p className="text-xs leading-6 text-ink/50">إيقاف التنبيه عند المزوّد يحتاج اتصالًا؛ لو تعذر تحديثه، امسح البطاقة من جهازك لإيقافه فورًا. ظهور تنبيه القرب ليس مضمونًا؛ نظام هاتفك يقرره.</p>
          <button disabled={busy || (!issued && !agreed)} className={issued ? 'action-secondary text-sm' : 'action-primary text-sm'}>
            {busy ? 'جارٍ التنفيذ…' : issued ? 'حفظ أذونات الرسائل والقرب' : 'إصدار كارت Wallet الحقيقي'}
          </button>
        </form>}
      {(issued || wallet.pass?.revocationRequested) && <div className="mt-6 border-t border-forest/10 pt-4">
        <button type="button" disabled={busy} onClick={revoke} className="text-xs font-bold text-rust underline underline-offset-4 disabled:opacity-50">
          {wallet.pass?.revocationRequested ? 'إعادة محاولة إلغاء البطاقة عند المزوّد' : 'إلغاء البطاقة من WalletWallet'}</button>
      </div>}
    </>}
  </section>;
}
