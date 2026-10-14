'use client';

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

type Memory = { id: string; caption: string | null; status: string; visibility: string;
  createdAt: string; imageUrl: string };
type Session = { customer: { id: string; displayName: string }; venue: {
  organizationName: string; branchName: string }; verifiedVisits: number; memories: Memory[] };
type Progress = { verifiedVisits: number; totalSlots: number; stampedCount: number;
  availableRewards: number; rewardRule: { name: string } | null };

export function CustomerClient({ cafeSlug, branchSlug }: { cafeSlug: string; branchSlug?: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch('/api/v1/customer/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafeSlug, branchSlug }), cache: 'no-store',
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'تعذر بدء الجلسة');
    setSession(body);
    const query = new URLSearchParams({ cafeSlug });
    if (branchSlug) query.set('branchSlug', branchSlug);
    const loyalty = await fetch(`/api/v1/loyalty/stamps?${query}`, { cache: 'no-store' });
    if (loyalty.ok) setProgress(await loyalty.json());
  }, [cafeSlug, branchSlug]);

  useEffect(() => {
    let active = true;
    (async () => {
      const db = createClient();
      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        const { error } = await db.auth.signInAnonymously();
        if (error) throw new Error('يرجى تفعيل Anonymous Sign-in في Supabase: ' + error.message);
      }
      if (active) await refresh();
    })().catch((error) => { if (active) setNotice(error instanceof Error ? error.message : 'تعذر الاتصال'); });
    return () => { active = false; };
  }, [refresh]);

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

  return <main dir="rtl" className="min-h-screen bg-[#141313] text-[#fbf9f5] px-4 py-8">
    <div className="max-w-xl mx-auto space-y-7">
      <header className="text-center space-y-2"><p className="text-[#dd0200] text-sm font-bold tracking-wider">CAFÉ MEMORIES</p>
        <h1 className="text-3xl font-bold">{session?.venue.organizationName ?? 'ذكرياتك تبدأ هنا'}</h1>
        <p className="text-stone-400 text-sm">{session?.venue.branchName ?? 'جارٍ التحقق من الفرع...'}</p></header>
      {notice && <p role="status" className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-sm">{notice}</p>}
      {!session && notice && <button className="underline text-sm" onClick={() => window.location.reload()}>إعادة المحاولة</button>}
      {session && <>
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
