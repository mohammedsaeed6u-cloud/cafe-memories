'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export default function MerchantLoginClient({ initialMode, setupError, configured, googleEnabled }: {
  initialMode: 'signup' | 'signin'; setupError: string | null; configured: boolean;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'signup' | 'signin'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const onboard = async (businessName: string, businessSlug: string) => {
    const result = await fetch('/api/v1/merchant/onboard', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: businessName, slug: businessSlug }),
    });
    if (!result.ok) throw new Error((await result.json()).error ?? 'تعذر إنشاء المنشأة');
    router.replace('/dashboard');
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!configured) return;
    setBusy(true); setNotice('');
    try {
      const db = createClient();
      if (mode === 'signup') {
        const businessSlug = slugify(slug || name);
        if (!name.trim() || businessSlug.length < 3) throw new Error('أدخل اسم منشأة ورابطًا صالحًا');
        const { data, error } = await db.auth.signUp({ email, password, options: {
          data: { cafe_name: name.trim(), cafe_slug: businessSlug },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        } });
        if (error) throw error;
        if (!data.session) { setNotice('تحقق من بريدك لتأكيد الحساب؛ بعد التأكيد ستُنشأ منشأتك في قاعدة البيانات تلقائيًا.'); return; }
        await onboard(name.trim(), businessSlug);
      } else {
        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error || !data.user) throw error ?? new Error('فشل تسجيل الدخول');
        const metadataName = data.user.user_metadata?.cafe_name;
        const metadataSlug = data.user.user_metadata?.cafe_slug;
        const emailPrefix = data.user.email?.split('@')[0];
        const businessName = typeof metadataName === 'string' && metadataName.trim().length >= 2
          ? metadataName.trim().slice(0, 100)
          : emailPrefix && emailPrefix.length >= 2 ? emailPrefix : 'منشأة جديدة';
        const businessSlug = typeof metadataSlug === 'string' && /^[a-z0-9][a-z0-9-]{2,39}$/.test(metadataSlug)
          ? metadataSlug : `cafe-${data.user.id.slice(0, 8)}`;
        await onboard(businessName, businessSlug);
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر تسجيل الدخول'); }
    finally { setBusy(false); }
  }

  async function google() {
    if (!configured) return;
    setBusy(true); setNotice('');
    try {
      const { error } = await createClient().auth.signInWithOAuth({ provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر تسجيل الدخول'); setBusy(false); }
  }

  return <main dir="rtl" className="min-h-screen bg-[#141313] text-[#fbf9f5] flex items-center justify-center p-5">
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1b1b] p-7 space-y-6 shadow-2xl">
      <div><h1 className="text-2xl font-bold">Café Memories</h1><p className="text-stone-400 text-sm mt-2">لوحة إدارة ذكريات وولاء ضيوفك</p></div>
      {!configured && <p role="alert" className="rounded-lg bg-amber-950/50 border border-amber-500/40 p-3 text-sm text-amber-100">
        إنشاء الحسابات غير متاح حتى يُضبط مشروع Supabase. أضف قيم البيئة من ملف .env.example ثم أعد تشغيل الخادم؛ لا تُنشأ حسابات تجريبية محليًا.
      </p>}
      {setupError && <p role="alert" className="rounded-lg bg-amber-950/50 p-3 text-sm text-amber-100">{setupError}</p>}
      <div className="grid grid-cols-2 rounded-lg bg-black/30 p-1 text-sm">
        <button type="button" className={`p-2 rounded-md ${mode === 'signin' ? 'bg-[#dd0200]' : ''}`} onClick={() => setMode('signin')}>دخول</button>
        <button type="button" className={`p-2 rounded-md ${mode === 'signup' ? 'bg-[#dd0200]' : ''}`} onClick={() => setMode('signup')}>تسجيل منشأة</button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && <><label className="block text-sm">اسم المنشأة<input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-lg bg-black/30 border border-white/20 p-3" /></label>
          <label className="block text-sm">رابط المنشأة<input required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="my-cafe" className="mt-2 w-full rounded-lg bg-black/30 border border-white/20 p-3" /></label></>}
        <label className="block text-sm">البريد الإلكتروني<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg bg-black/30 border border-white/20 p-3" /></label>
        <label className="block text-sm">كلمة المرور<input required type="password" minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg bg-black/30 border border-white/20 p-3" /></label>
        <button type="submit" disabled={busy || !configured} className="w-full rounded-lg bg-[#dd0200] p-3 font-bold disabled:opacity-50">{busy ? 'انتظر...' : mode === 'signup' ? 'إنشاء الحساب' : 'تسجيل الدخول'}</button>
      </form>
      {googleEnabled && <button type="button" onClick={google} disabled={busy || !configured} className="w-full rounded-lg border border-white/20 p-3 disabled:opacity-50">الدخول بواسطة Google</button>}
      {notice && <p role="alert" className="text-sm text-amber-300">{notice}</p>}
      <p className="text-xs text-stone-400">لا تُخزَّن كلمات المرور أو بيانات دخول الموظفين في هذا المتصفح.</p>
    </div>
  </main>;
}
