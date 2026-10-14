'use client';

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { customerGoogleAction } from '@/lib/customer-google-flow';

type Memory = { id: string; caption: string | null; status: string; visibility: string;
  createdAt: string; imageUrl: string };
type Session = { customer: { id: string; displayName: string }; account: {
  authUserId: string; phone: string | null; email: string | null; isAnonymous: boolean;
  googleLinked: boolean; hasSavedData: boolean;
}; venue: { organizationName: string; branchName: string }; verifiedVisits: number; memories: Memory[] };
const authMessages: Record<string, string> = {
  'link-failed': 'لم يكتمل ربط Google. بقيت ذكرياتك في حساب الضيف الحالي. تحقّق من تفعيل ربط الهويات يدويًا؛ إذا كان Google مرتبطًا بحساب آخر فلا يمكن نقل الذكريات تلقائيًا.',
  'sign-in-failed': 'تعذر تسجيل الدخول بحساب Google. يمكنك إعادة المحاولة أو المتابعة كضيف.',
  'missing-code': 'رابط تسجيل الدخول غير صالح. ابدأ من صفحة الفرع مرة أخرى.',
};
type Progress = { verifiedVisits: number; totalSlots: number; stampedCount: number;
  availableRewards: number; rewardRule: { name: string } | null };

export function CustomerClient({ cafeSlug, branchSlug, authError }: {
  cafeSlug: string; branchSlug?: string; authError?: string;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [entry, setEntry] = useState<'checking' | 'choose' | 'ready'>('checking');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState(authError ? authMessages[authError] ?? '' : '');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (syncAccount = false): Promise<Session> => {
    const response = await fetch('/api/v1/customer/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeSlug, branchSlug }), cache: 'no-store',
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'تعذر بدء الجلسة');
    setSession(body);
    setEntry('ready');
    if (syncAccount) { setDisplayName(body.customer.displayName ?? ''); setPhone(body.account.phone ?? ''); }
    const query = new URLSearchParams({ cafeSlug });
    if (branchSlug) query.set('branchSlug', branchSlug);
    const loyalty = await fetch(`/api/v1/loyalty/stamps?${query}`, { cache: 'no-store' });
    setProgress(loyalty.ok ? await loyalty.json() : null);
    return body;
  }, [cafeSlug, branchSlug]);

  useEffect(() => {
    // An unexpected change of user ID during linking requires manual recovery;
    // do not automatically create a new customer on that identity.
    if (authError === 'identity-mismatch') return;
    let active = true;
    (async () => {
      const { data: { user }, error } = await createClient().auth.getUser();
      if (error) throw error;
      if (!active) return;
      if (!user) { setEntry('choose'); return; }
      await refresh(true);
    })().catch((error) => { if (active) setNotice(error instanceof Error ? error.message : 'تعذر الاتصال'); });
    return () => { active = false; };
  }, [refresh, authError]);

  async function continueAsGuest() {
    setBusy(true); setNotice('');
    try {
      const { error } = await createClient().auth.signInAnonymously();
      if (error) throw new Error('يرجى تفعيل دخول الضيوف في Supabase: ' + error.message);
      await refresh(true);
      setNotice('أنت الآن ضيف بهذا المتصفح. اربط حساب Google قبل مسح بيانات المتصفح للاحتفاظ بذكرياتك.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر بدء جلسة الضيف'); }
    finally { setBusy(false); }
  }

  async function google() {
    setBusy(true); setNotice('');
    try {
      const db = createClient();
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (authError) throw authError;
      if (session ? user?.id !== session.account.authUserId : Boolean(user)) {
        throw new Error('تغيّرت جلسة الدخول. أعد تحميل الصفحة قبل المتابعة.');
      }
      // Fail closed: checking only this venue's visible photos misses pending,
      // deleted or cross-venue visits and redeemed loyalty rewards.
      const current = session ? await refresh() : null;
      if (session && current?.account.authUserId !== session.account.authUserId) {
        throw new Error('تغيّر الحساب في تبويب آخر. أعد تحميل الصفحة قبل المتابعة.');
      }
      const action = customerGoogleAction(current?.account ?? null);
      if (action === 'already-linked') { setNotice('حسابك مرتبط بالفعل بـ Google.'); return; }
      const callback = new URL('/auth/customer/callback', window.location.origin);
      callback.searchParams.set('cafe', cafeSlug);
      if (branchSlug) callback.searchParams.set('branch', branchSlug);
      if (action === 'link') {
        const intent = await fetch('/api/v1/customer/oauth/link-intent', { method: 'POST' });
        if (!intent.ok) throw new Error('تعذر حماية عملية ربط الحساب. أعد المحاولة.');
        const { nonce } = await intent.json();
        callback.searchParams.set('flow', 'link');
        callback.searchParams.set('nonce', nonce);
        const { error } = await db.auth.linkIdentity({ provider: 'google',
          options: { redirectTo: callback.toString() } });
        if (error) throw error;
      } else {
        const { error } = await db.auth.signInWithOAuth({ provider: 'google',
          options: { redirectTo: callback.toString() } });
        if (error) throw error;
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر دخول Google'); }
    finally { setBusy(false); }
  }

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/v1/customer/account', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authUserId: session.account.authUserId, displayName, phone: phone.trim() || null }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? 'تعذر حفظ الإعدادات');
      await refresh(true);
      setNotice('تم حفظ إعدادات حسابك.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر حفظ الإعدادات'); }
    finally { setBusy(false); }
  }

  async function signOut() {
    if (!session) return;
    setBusy(true); setNotice('');
    try {
      const { data: { user }, error: authError } = await createClient().auth.getUser();
      if (authError || user?.id !== session.account.authUserId) {
        throw new Error('تغيّرت جلسة الدخول. أعد تحميل الصفحة.');
      }
      const latest = await refresh();
      if (latest.account.authUserId !== user.id) throw new Error('تغيّرت جلسة الدخول. أعد تحميل الصفحة.');
      if (latest.account.hasSavedData && (latest.account.isAnonymous ||
        (!latest.account.googleLinked && !latest.account.email))) {
        throw new Error('لا تخرج قبل ربط حساب يمكن استعادته بـ Google للحفاظ على ذكرياتك.');
      }
      const { error } = await createClient().auth.signOut({ scope: 'local' });
      if (error) throw error;
      if (preview) URL.revokeObjectURL(preview);
      setFile(null); setPreview(''); setSession(null); setProgress(null);
      setDisplayName(''); setPhone(''); setEntry('choose');
      setNotice('تم تسجيل الخروج من هذا الجهاز.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر تسجيل الخروج'); }
    finally { setBusy(false); }
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected); setPreview(selected ? URL.createObjectURL(selected) : '');
  }

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setBusy(true); setNotice('');
    try {
      const form = new FormData();
      form.set('file', file); form.set('cafeSlug', cafeSlug);
      if (branchSlug) form.set('branchSlug', branchSlug);
      form.set('caption', caption); form.set('liveWallConsent', String(consent));
      const response = await fetch('/api/v1/memories/upload', { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'فشل رفع الصورة');
      setFile(null); setCaption(''); setConsent(false);
      if (preview) URL.revokeObjectURL(preview);
      setPreview('');
      await refresh();
      setNotice('حُفظت ذكراك بشكل خاص. ستظهر على الشاشة فقط إذا وافقتَ عليها واعتمدها الفريق.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر رفع الصورة'); }
    finally { setBusy(false); }
  }

  async function changeConsent(memoryId: string, liveWallConsent: boolean) {
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/v1/memories/consent', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memoryId, liveWallConsent }) });
      if (!response.ok) throw new Error((await response.json()).error);
      await refresh(); setNotice(liveWallConsent ? 'تمت الموافقة على العرض العام بعد المراجعة' : 'أُلغي العرض العام فورًا');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر تغيير الإذن'); }
    finally { setBusy(false); }
  }

  if (authError === 'identity-mismatch') return <main dir="rtl" className="min-h-screen bg-[#141313] text-[#fbf9f5] px-4 py-12">
    <section role="alert" className="max-w-xl mx-auto rounded-2xl border border-red-500/50 bg-[#211f1f] p-6 space-y-3">
      <h1 className="text-xl font-bold">توقف ربط الحساب لحماية ذكرياتك</h1>
      <p className="text-sm text-stone-300 leading-7">تغيّرت هوية الحساب أثناء ربط Google. لم ننقل الصور أو الزيارات إلى حساب آخر. لا تمسح بيانات هذا المتصفح ولا تضف ذكريات جديدة حتى يراجع فريق الدعم الحسابين ويستعيد الوصول بشكل آمن.</p>
    </section>
  </main>;

  return <main dir="rtl" className="min-h-screen bg-[#141313] text-[#fbf9f5] px-4 py-8">
    <div className="max-w-xl mx-auto space-y-7">
      <header className="text-center space-y-2"><p className="text-[#dd0200] text-sm font-bold tracking-wider">CAFÉ MEMORIES</p>
        <h1 className="text-3xl font-bold">{session?.venue.organizationName ?? 'ذكرياتك تبدأ هنا'}</h1>
        <p className="text-stone-400 text-sm">{session?.venue.branchName ?? 'جارٍ التحقق من الفرع...'}</p></header>
      {notice && <p role="status" className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-sm">{notice}</p>}
      {entry === 'checking' && <p className="text-center text-stone-400 text-sm">جارٍ التحقق من حسابك...</p>}
      {entry === 'choose' && !session && <section className="rounded-2xl bg-[#211f1f] border border-white/10 p-6 space-y-4">
        <h2 className="text-xl font-bold">كيف تحب تحفظ ذكرياتك؟</h2>
        <p className="text-stone-300 text-sm leading-7">ادخل بحساب Google لاسترجاع صورك ورصيد زياراتك على أجهزتك، أو تابع كضيف مؤقت على هذا المتصفح.</p>
        <button type="button" onClick={google} disabled={busy} className="w-full rounded-lg bg-[#dd0200] p-3 font-bold disabled:opacity-50">الدخول بحساب Google</button>
        <button type="button" onClick={continueAsGuest} disabled={busy} className="w-full rounded-lg border border-white/25 p-3 disabled:opacity-50">المتابعة كضيف</button>
        <p className="text-xs text-stone-400">جلسة الضيف حقيقية في Supabase لكنها غير قابلة للاسترجاع بعد مسح بيانات المتصفح ما لم تربطها أولًا بـ Google.</p>
      </section>}
      {entry !== 'choose' && !session && notice && <button className="underline text-sm" onClick={() => window.location.reload()}>إعادة المحاولة</button>}
      {session && <>
        <section className="rounded-2xl bg-[#211f1f] border border-white/10 p-6">
          <details className="group">
            <summary className="cursor-pointer font-bold text-lg">إعدادات حساب {session.customer.displayName || 'الضيف'}</summary>
            <div className="pt-5 space-y-5">
              <p className="text-sm text-stone-300">{session.account.isAnonymous ? 'تستخدم جلسة ضيف مرتبطة بهذا المتصفح فقط.' : session.account.googleLinked ? 'حسابك مرتبط بـ Google ويمكنك الدخول من جهاز آخر.' : 'أنت داخل بحساب موثّق؛ يمكنك ربط Google بدون تغيير رصيدك.'}</p>
              {session.account.email && <p className="text-sm text-stone-300">البريد: <span dir="ltr" className="inline-block break-all">{session.account.email}</span></p>}
              <form onSubmit={saveAccount} className="space-y-4">
                <label className="block text-sm">الاسم المعروض
                  <input required minLength={2} maxLength={80} autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-2 w-full rounded-lg bg-black/30 border border-white/20 p-3" />
                </label>
                <label className="block text-sm">رقم تواصل اختياري
                  <input type="tel" inputMode="tel" autoComplete="tel" dir="ltr" pattern="[+]?[0-9]{8,15}" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01012345678" className="mt-2 w-full rounded-lg bg-black/30 border border-white/20 p-3" />
                </label>
                <p className="text-xs text-stone-400">رقم التواصل خاص بك، غير موثّق، ولا يُستخدم لتسجيل الدخول أو منح زيارات أو تحديد هوية الضيف.</p>
                <button disabled={busy} className="rounded-lg bg-[#dd0200] px-5 py-2 font-bold disabled:opacity-50">حفظ الإعدادات</button>
              </form>
              {!session.account.googleLinked && <div className="space-y-2 border-t border-white/10 pt-4">
                <button type="button" onClick={google} disabled={busy} className="w-full rounded-lg border border-white/25 p-3 font-bold disabled:opacity-50">
                  ربط هذا الحساب بحساب Google
                </button>
                {session.account.isAnonymous && <p className="text-xs text-amber-200 leading-6">سيُربط Google بنفس هوية الضيف للحفاظ على صورك وزياراتك. إذا كان Google مرتبطًا بحساب آخر، لن ننقلك إليه تلقائيًا. {session.account.hasSavedData ? 'احتفظ بجلسة هذا الضيف واطلب مساعدة الدعم للتحقق من الحسابين.' : 'إن لم تحفظ بيانات بعد، يمكنك الخروج من جلسة الضيف ثم الدخول إلى حساب Google الموجود.'}</p>}
              </div>}
              {session.account.isAnonymous && session.account.hasSavedData && <p className="text-xs text-amber-200">اربط هذا الضيف بـ Google قبل فقدان جلسته؛ لا يمكن استعادة الصور والرصيد من هاتف آخر دون ربط.</p>}
              <button type="button" onClick={signOut} disabled={busy || (session.account.hasSavedData && (session.account.isAnonymous || (!session.account.googleLinked && !session.account.email)))} className="text-sm text-red-300 underline disabled:opacity-40">تسجيل الخروج من هذا الجهاز</button>
            </div>
          </details>
        </section>
        <section className="rounded-2xl bg-[#211f1f] border border-white/10 p-6 space-y-4">
          <h2 className="text-lg font-bold">بطاقة الولاء</h2>
          <p className="text-stone-400 text-sm">الزيارات تُحسب بعد تأكيد موظف على عملية شراء، وليس بمجرد رفع صورة.</p>
          <div className="flex justify-between items-end"><strong className="text-4xl text-[#dd0200]">{progress?.verifiedVisits ?? session.verifiedVisits}</strong>
            <span className="text-sm text-stone-300">زيارة موثّقة · {progress?.rewardRule?.name ?? 'المكافأة تُحددها المنشأة'}</span></div>
          {progress?.rewardRule && progress.totalSlots > 0 && <><div className="flex gap-1" aria-label={`${progress.stampedCount} من ${progress.totalSlots} زيارات نحو المكافأة`}>
            {Array.from({ length: progress.totalSlots }, (_, index) => <span key={index} className={`h-2 rounded-full flex-1 ${index < progress.stampedCount ? 'bg-[#dd0200]' : 'bg-white/10'}`} />)}</div>
            {progress.availableRewards > 0 && <p className="text-emerald-300 font-bold">لديك {progress.availableRewards} مكافأة متاحة! اعرض المعرّف للموظف لصرفها.</p>}</>}
          <div className="bg-black/30 rounded-lg p-3"><p className="text-stone-400 text-xs mb-1">معرّف الضيف للموظف (أظهره في الفرع بعد فتح هذه الصفحة؛ حضورك صالح ساعتين)</p>
            <code dir="ltr" className="block text-xs break-all select-all">{session.customer.id}</code></div>
        </section>
        <form onSubmit={upload} className="rounded-2xl bg-[#211f1f] border border-white/10 p-6 space-y-4">
          <h2 className="text-lg font-bold">التقط ذكرى جديدة</h2>
          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-white/20 p-6 text-center">
            {preview ? <>
              {/* Blob URL is a local preview; Next Image cannot optimize it. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="معاينة الصورة" className="max-h-64 w-full object-contain rounded-lg" />
            </> : <span>اضغط لالتقاط صورة أو اختيارها</span>}
            <input type="file" accept="image/*" capture="environment" onChange={selectImage} className="sr-only" />
          </label>
          <input maxLength={280} placeholder="تعليق اختياري" value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full bg-black/30 rounded-lg border border-white/20 p-3" />
          <label className="flex items-start gap-3 text-sm text-stone-300"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-[#dd0200]" />
            أوافق على عرض هذه الصورة على شاشة هذا الفرع بعد مراجعة الفريق. يمكنني سحب الموافقة لاحقًا.</label>
          <button disabled={busy || !file} className="w-full bg-[#dd0200] rounded-lg p-3 font-bold disabled:opacity-50">{busy ? 'جارٍ الحفظ...' : 'حفظ الذكرى'}</button>
        </form>
        <section className="space-y-3"><h2 className="text-lg font-bold">ذكرياتي</h2>
          {session.memories.length === 0 && <p className="text-stone-400 text-sm">لم تحفظ أي صورة بعد.</p>}
          {session.memories.map((memory) => <article key={memory.id} className="flex gap-4 rounded-xl bg-[#211f1f] border border-white/10 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={memory.imageUrl} alt="ذكراك الخاصة" className="w-24 h-24 object-cover rounded-lg" />
            <div className="flex-1 min-w-0"><p className="text-sm">{memory.caption || 'ذكرى جديدة'}</p><p className="text-stone-400 text-xs mt-1">{memory.status === 'pending' ? 'بانتظار المراجعة' : memory.status === 'approved' ? 'تمت المراجعة' : 'غير منشورة'}</p>
              {memory.status !== 'deleted' && <button disabled={busy} onClick={() => changeConsent(memory.id, memory.visibility !== 'live_wall')}
                className="text-red-300 text-xs underline mt-3 disabled:opacity-50">{memory.visibility === 'live_wall' ? 'إلغاء العرض العام' : 'السماح بالعرض بعد المراجعة'}</button>}</div>
          </article>)}
        </section>
      </>}
    </div>
  </main>;
}
