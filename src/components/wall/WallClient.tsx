'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Feed = { screen: { name: string; organizationName: string };
  memories: { id: string; caption: string | null; customerName: string; imageUrl: string }[] };

export function WallClient({ screenId }: { screenId?: string }) {
  const router = useRouter();
  const [pairingCode, setPairingCode] = useState('');
  const [feed, setFeed] = useState<Feed | null>(null);
  const [screenState, setScreenState] = useState<'loading' | 'pair' | 'offline' | 'ready'>(screenId ? 'loading' : 'pair');
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!screenId) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(`/api/v1/screens/${encodeURIComponent(screenId)}/feed`,
        { cache: 'no-store', signal: controller.signal });
      if (response.status === 401) {
        setFeed(null); setScreenState('pair');
        setNotice('الشاشة غير مرتبطة أو تم إلغاء ارتباطها. أدخل رمز اقتران جديدًا.');
        return;
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'تعذر عرض الصور');
      setFeed(body); setScreenState('ready'); setNotice('');
    } catch (error) {
      // Old frames must not survive a lost connection after consent can change.
      setFeed(null); setScreenState('offline');
      throw error;
    } finally { clearTimeout(timeout); }
  }, [screenId]);

  useEffect(() => {
    const initial = setTimeout(() => refresh().catch((error) => setNotice(error instanceof Error ? error.message : 'تعذر الاتصال')), 0);
    const feedTimer = setInterval(() => refresh().catch((error) => setNotice(error.message)), 15_000);
    const heartbeatTimer = screenId ? setInterval(() => {
      fetch('/api/v1/screens/heartbeat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenId }) }).catch(() => {});
    }, 45_000) : null;
    return () => { clearTimeout(initial); clearInterval(feedTimer); if (heartbeatTimer) clearInterval(heartbeatTimer); };
  }, [refresh, screenId]);

  useEffect(() => {
    const timer = setInterval(() => setIndex((previous) => previous + 1), 7000);
    return () => clearInterval(timer);
  }, []);

  async function pair(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/v1/screens/pair', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pairingCode }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'تعذر الاقتران');
      router.replace(`/wall/${body.screenId}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر الاقتران'); }
    finally { setBusy(false); }
  }

  if (!feed && screenId && screenState !== 'pair') return <main dir="rtl" className="min-h-screen bg-[#141313] text-white flex justify-center items-center p-6">
    <div className="max-w-md rounded-xl border border-white/10 bg-[#211f1f] p-8 space-y-4 text-center">
      <h1 className="text-2xl font-bold">شاشة الصالة</h1>
      <p className="text-stone-300">{screenState === 'loading' ? 'جارٍ التحقق من اقتران الشاشة...' : 'تعذر التحقق من الإذن. أخفينا الصور حتى يعود الاتصال.'}</p>
      {notice && <p role="alert" className="text-amber-300">{notice}</p>}
      {screenState === 'offline' && <button className="rounded-lg bg-[#dd0200] px-5 py-3" onClick={() => refresh().catch((error) => setNotice(error.message))}>إعادة المحاولة</button>}
    </div>
  </main>;

  if (!feed) return <main dir="rtl" className="min-h-screen bg-[#141313] text-white flex justify-center items-center p-6">
    <form onSubmit={pair} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#211f1f] p-8 space-y-5 text-center">
      <p className="text-red-400 font-bold tracking-wider">CAFÉ MEMORIES · SCREEN</p><h1 className="text-2xl font-bold">اقتران شاشة الصالة</h1>
      <p className="text-stone-400 text-sm">أدخل الرمز المكوّن من 8 أرقام من لوحة التاجر. لا تُعرض صور تجريبية دون اقتران.</p>
      <input inputMode="numeric" pattern="[0-9]{8}" maxLength={8} required dir="ltr" autoComplete="off"
        value={pairingCode} onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
        aria-label="رمز الاقتران" className="w-full text-center text-3xl tracking-[.2em] font-mono rounded-lg bg-black/30 border border-white/20 p-4" />
      <button disabled={busy} className="w-full bg-[#dd0200] p-3 rounded-lg font-bold disabled:opacity-50">{busy ? 'جارٍ الاقتران...' : 'ربط الشاشة'}</button>
      {notice && <p role="alert" className="text-amber-300 text-sm">{notice}</p>}
    </form>
  </main>;

  const photo = feed.memories[index % feed.memories.length];
  return <main dir="rtl" className="min-h-screen bg-[#141313] text-[#fbf9f5] flex flex-col">
    <header className="p-6 flex justify-between items-center border-b border-white/10">
      <div><p className="text-sm font-bold text-[#dd0200]">CAFÉ MEMORIES</p><h1 className="text-2xl font-bold">{feed.screen.organizationName || feed.screen.name}</h1></div>
      <span className="text-stone-400 text-sm">{feed.screen.name}</span>
    </header>
    {notice && <div role="alert" className="bg-amber-950/40 text-amber-100 text-center p-3">
      {notice} <button className="underline mr-3" onClick={() => refresh().catch((error) => setNotice(error.message))}>إعادة المحاولة</button>
    </div>}
    <section className="flex-1 flex items-center justify-center p-8">
      {photo ? <div key={photo.id} className="max-w-5xl w-full text-center space-y-5">
        {/* Browser image request carries the device cookie. Proxy checks consent on each fetch. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.imageUrl} alt={photo.caption || 'ذكرى ضيف'}
          onError={() => { setFeed(null); setScreenState('offline'); setNotice('تعذر التحقق من الصورة أو سُحب الإذن. أوقفنا العرض.'); }}
          className="max-h-[68vh] max-w-full mx-auto object-contain rounded-2xl shadow-2xl" />
        <p className="text-xl">{photo.caption || 'لحظات لا تُنسى'}</p>
        <p className="text-stone-400 text-sm">{photo.customerName}</p>
      </div> : <div className="text-center space-y-3"><p className="text-3xl font-bold">الذكريات تبدأ هنا ✨</p>
        <p className="text-stone-400">ننتظر أول صورة معتمدة بموافقة صاحبها لهذا الفرع.</p></div>}
    </section>
    <footer className="text-center text-xs text-stone-500 p-4">تُحدّث الصور كل 15 ثانية · الخصوصية أولًا</footer>
  </main>;
}
