"use client";
/* eslint-disable @next/next/no-img-element -- Brand logos come from the public, validated PNG proxy. */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { MerchantNav } from "@/components/dashboard/MerchantNav";
import { StampyApertureMark } from "@/components/brand/StampyLogo";
import { DEFAULT_ACCENT, DEFAULT_PRIMARY, frameStyles, socialPlatforms,
  type PublicBrand, type SocialLinks } from "@/lib/brand";

type Branch = { id: string; name: string; google_maps_url: string | null; address: string | null;
  latitude: number | null; longitude: number | null };
type Response = { brand: PublicBrand; organizationId: string; slug: string; walletConfigured: boolean;
  role: string; organizationWide: boolean; canEditIdentity: boolean; branches: Branch[] };
const socialNames: Record<keyof SocialLinks, string> = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok",
  x: "X / Twitter", youtube: "YouTube", whatsapp: "WhatsApp", website: "الموقع الرسمي",
};
const frameNames = { film: "شريط فوتوبوث", polaroid: "بولارويد", editorial: "كارت تحريرى" };

export function BrandStudioClient() {
  const [data, setData] = useState<Response | null>(null);
  const [brand, setBrand] = useState<PublicBrand | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch('/api/v1/merchant/brand', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'تعذر تحميل هوية المنشأة');
    const next = body as Response;
    setData(next); setBrand(next.brand);
    setBranch((current) => next.branches.find((item) => item.id === current?.id) ?? next.branches[0] ?? null);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get('setup') === 'logo') {
        setNotice('حساب المنشأة اتعمل، لكن رفع اللوجو ما كملش. اختار اللوجو وارفعه من هنا؛ ما تعيدش إنشاء الحساب.');
      }
      load().catch((error) => setNotice(error.message));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function send(path: string, method: string, payload: object) {
    const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'تعذر الحفظ');
  }
  async function saveIdentity(event: FormEvent) {
    event.preventDefault();
    if (!brand) return;
    setBusy(true); setNotice('');
    try {
      await send('/api/v1/merchant/brand', 'PATCH', {
        name: brand.name, tagline: brand.tagline ?? '', primaryColor: brand.primaryColor,
        accentColor: brand.accentColor, frameStyle: brand.frameStyle,
        walletColorPreset: brand.walletColorPreset, socialLinks: brand.socialLinks,
      });
      await load(); setNotice('اتحفظت هوية المنشأة والروابط. الفريمات الجديدة هتستخدم الألوان المختارة.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر الحفظ'); }
    finally { setBusy(false); }
  }
  async function uploadLogo() {
    if (!logo || !data) return;
    setBusy(true); setNotice('');
    try {
      const form = new FormData();
      form.set('organizationId', data.organizationId);
      form.set('file', logo);
      const response = await fetch('/api/v1/merchant/brand/logo', { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'تعذر حفظ اللوجو');
      setLogo(null); await load(); setNotice('اتحفظ اللوجو. هيظهر على بطاقة الضيف والكارت المطبوع.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر رفع اللوجو'); }
    finally { setBusy(false); }
  }
  async function saveBranch(event: FormEvent) {
    event.preventDefault();
    if (!branch) return;
    setBusy(true); setNotice('');
    try {
      await send('/api/v1/merchant/brand', 'PUT', {
        branchId: branch.id, googleMapsUrl: branch.google_maps_url?.trim() || null,
        address: branch.address?.trim() || null,
        latitude: branch.latitude, longitude: branch.longitude,
      });
      await load(); setNotice('اتحفظ عنوان الفرع. إحداثيات Wallet لا تُستخدم إلا بموافقة الضيف.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر حفظ الفرع'); }
    finally { setBusy(false); }
  }
  if (!data || !brand) return <main dir="rtl" className="min-h-screen bg-paper p-8 text-ink">
    <div className="paper-card mx-auto max-w-xl rounded-3xl p-8">
      <p className="eyebrow text-rust">Brand Studio</p>
      <h1 className="display-heading mt-3 text-3xl">هوية المكان.</h1>
      <p role={notice ? 'alert' : 'status'} className="mt-5 text-sm">{notice || 'بنحمّل إعدادات المنشأة الحقيقية…'}</p>
      {notice && <button className="action-secondary mt-5" onClick={() => load().catch((error) => setNotice(error.message))}>إعادة المحاولة</button>}
    </div>
  </main>;
  return <main dir="rtl" className="min-h-screen bg-paper text-ink">
    <div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[245px_minmax(0,1fr)]">
      <MerchantNav organizationName={brand.name} active="brand" role={data.role} organizationWide={data.organizationWide} />
      <div className="min-w-0 space-y-8 px-5 py-8 md:px-9 md:py-11 xl:px-12">
        <header className="border-b border-forest/10 pb-7">
          <p className="eyebrow text-rust">مساحة المنشأة / الهوية</p>
          <h1 className="display-heading mt-2 text-3xl sm:text-4xl">شكل كارتك، وليه ضيوفك يرجعوا.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-8 text-ink/60">ضيف لوجو المكان وألوانه وروابطه. اسم stampy. ثابت جنب اسمك على كارت الولاء وفريم الذكريات؛ صور الضيوف الخاصة مش داخلة في المعاينة دي.</p>
        </header>
        {notice && <p role="status" className="rounded-2xl border border-rust/20 bg-[#fff2e9] p-4 text-sm text-rust">{notice}</p>}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="paper-card rounded-[1.75rem] p-6 sm:p-8">
              <p className="eyebrow text-rust">01 / شعار المكان</p>
              <h2 className="mt-2 text-2xl font-bold">اللوجو بتاعك، جنب لوجونا.</h2>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-[#DFAB56] flex items-center justify-center p-2 shadow-sm border border-[#682025]/20 shrink-0">
                  <StampyApertureMark size={36} color="#682025" strokeColor="#DFAB56" />
                </div>
                <span className="text-xl text-ink/35" aria-hidden="true">×</span>
                {brand.logoUrl ? <img src={brand.logoUrl} alt={`لوجو ${brand.name}`}
                  className="h-16 w-16 rounded-2xl border border-ink/10 bg-white object-contain p-1" />
                  : <span className="grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-ink/25 text-xs text-ink/45">لوجوك</span>}
              </div>
              {data.canEditIdentity ? <div className="mt-5 flex flex-wrap items-end gap-3">
                <label className="block flex-1 text-xs font-bold">ارفع لوجو JPG / PNG / WebP (حتى ٥ MB)
                  <input className="field mt-2" type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setLogo(event.target.files?.[0] ?? null)} />
                </label>
                <button type="button" className="action-secondary" disabled={!logo || busy} onClick={uploadLogo}>حفظ اللوجو</button>
              </div> : <p className="mt-4 text-xs text-ink/55">تعديل لوجو المنشأة لصاحب الحساب أو مشرف عام فقط.</p>}
            </section>
            <form onSubmit={saveIdentity} className="paper-card space-y-6 rounded-[1.75rem] p-6 sm:p-8">
              <div><p className="eyebrow text-rust">02 / الكارت والفريم</p><h2 className="mt-2 text-2xl font-bold">هوية ثابتة وقابلة للتعديل.</h2></div>
              <label className="block text-sm font-bold">اسم البيزنس
                <input required minLength={2} maxLength={100} disabled={!data.canEditIdentity} className="field mt-2" value={brand.name}
                  onChange={(event) => setBrand({ ...brand, name: event.target.value })} />
              </label>
              <label className="block text-sm font-bold">جملة قصيرة على الكارت
                <input maxLength={100} disabled={!data.canEditIdentity} className="field mt-2" value={brand.tagline ?? ''}
                  placeholder="مثلاً: كل زيارة ليها طعم مختلف" onChange={(event) => setBrand({ ...brand, tagline: event.target.value })} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                {[['primaryColor','لون الخلفية (داكن)'],['accentColor','لون التفاصيل']] .map(([key,label]) => <label key={key} className="block text-sm font-bold">{label}
                  <div className="mt-2 flex items-center gap-2"><input type="color" className="h-12 w-16 cursor-pointer rounded-lg border border-ink/15 bg-white p-1"
                    disabled={!data.canEditIdentity} value={brand[key as 'primaryColor' | 'accentColor'] || (key === 'primaryColor' ? DEFAULT_PRIMARY : DEFAULT_ACCENT)}
                    onChange={(event) => setBrand({ ...brand, [key]: event.target.value })} />
                    <span dir="ltr" className="text-sm text-ink/55">{brand[key as 'primaryColor' | 'accentColor']}</span></div>
                </label>)}
              </div>
              <fieldset disabled={!data.canEditIdentity}>
                <legend className="text-sm font-bold">فريم كارت الذكريات المطبوع</legend>
                <div className="mt-3 flex flex-wrap gap-2">{frameStyles.map((style) => <label key={style}
                  className={`rounded-full border px-4 py-2 text-xs font-bold ${brand.frameStyle === style ? 'border-forest bg-forest text-white' : 'border-ink/15'}`}>
                  <input className="sr-only" type="radio" name="frameStyle" value={style} checked={brand.frameStyle === style}
                    onChange={() => setBrand({ ...brand, frameStyle: style })} />{frameNames[style]}</label>)}</div>
              </fieldset>
              <label className="block text-sm font-bold">لون Wallet البديل (للخطة المجانية)
                <select disabled={!data.canEditIdentity} className="field mt-2" value={brand.walletColorPreset}
                  onChange={(event) => setBrand({ ...brand, walletColorPreset: event.target.value as PublicBrand['walletColorPreset'] })}>
                  {['green','dark','blue','orange','red','purple'].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <span className="mt-2 block text-xs font-normal text-ink/55">اللون المخصص واللوجو داخل Wallet يعتمدان على خطة WalletWallet Pro أو أعلى؛ المعاينة هنا لبطاقتنا الرقمية.</span>
              </label>
              <div className="border-t border-forest/10 pt-6">
                <h3 className="text-lg font-bold">روابط المكان الاجتماعية</h3>
                <p className="mt-1 text-xs text-ink/55">روابط https الرسمية فقط. هتظهر للضيف، ويتقدر ينسخ منشن Instagram لو حطيت حسابه.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">{socialPlatforms.map((platform) => <label key={platform} className="block text-xs font-bold">{socialNames[platform]}
                  <input type="url" dir="ltr" disabled={!data.canEditIdentity} value={brand.socialLinks[platform] ?? ''}
                    onChange={(event) => setBrand({ ...brand, socialLinks: { ...brand.socialLinks, [platform]: event.target.value } })}
                    className="field mt-2 text-sm" placeholder="https://" /></label>)}</div>
              </div>
              {data.canEditIdentity && <button disabled={busy} className="action-primary w-full sm:w-auto">{busy ? 'جارٍ الحفظ…' : 'حفظ الهوية والروابط'}</button>}
            </form>
            <section className="paper-card rounded-[1.75rem] p-6 sm:p-8">
              <p className="eyebrow text-rust">03 / الفروع والموقع</p>
              <h2 className="mt-2 text-2xl font-bold">رابط Google Maps وإحداثيات الفرع.</h2>
              <p className="mt-2 text-xs leading-7 text-ink/55">رابط Maps لزيارة الفرع. خط العرض والطول اختياريان، ويستخدمهما WalletWallet فقط على بطاقات اختار أصحابها تنبيه القرب وبعد تفعيل الخطة المناسبة. التطبيق لا يراقب موقع الضيف.</p>
              {data.branches.length > 1 && <select className="field mt-5" value={branch?.id ?? ''} onChange={(e) => setBranch(data.branches.find((item) => item.id === e.target.value) ?? null)}>
                {data.branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>}
              {branch ? <form onSubmit={saveBranch} className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold sm:col-span-2">عنوان الفرع
                  <input className="field mt-2" value={branch.address ?? ''} maxLength={240}
                    onChange={(e) => setBranch({ ...branch, address: e.target.value })} /></label>
                <label className="text-xs font-bold sm:col-span-2">رابط Google Maps
                  <input type="url" dir="ltr" className="field mt-2" placeholder="https://maps.app.goo.gl/…"
                    value={branch.google_maps_url ?? ''} onChange={(e) => setBranch({ ...branch, google_maps_url: e.target.value })} /></label>
                <label className="text-xs font-bold">خط العرض
                  <input type="number" step="any" min="-90" max="90" className="field mt-2" dir="ltr"
                    value={branch.latitude ?? ''} onChange={(e) => setBranch({ ...branch, latitude: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                <label className="text-xs font-bold">خط الطول
                  <input type="number" step="any" min="-180" max="180" className="field mt-2" dir="ltr"
                    value={branch.longitude ?? ''} onChange={(e) => setBranch({ ...branch, longitude: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                <button disabled={busy} className="action-secondary sm:col-span-2">حفظ موقع الفرع</button>
              </form> : <p className="mt-5 text-sm text-ink/55">لا يوجد فرع نشط بعد.</p>}
            </section>
          </div>
          <aside className="space-y-5 xl:sticky xl:top-8">
            <div className="stampy-ticket-card relative overflow-hidden rounded-[1.75rem] p-6 text-white shadow-xl" style={{ backgroundColor: brand.primaryColor }}>
              <p className="eyebrow" style={{ color: brand.accentColor }}>معاينة الكارت الرقمي • بدون بيانات ضيوف</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#DFAB56] flex items-center justify-center p-1.5 shadow-sm border border-[#682025]/20 shrink-0">
                  <StampyApertureMark size={22} color="#682025" strokeColor="#DFAB56" />
                </div>
                <span className="text-lg text-white/50">×</span>
                {brand.logoUrl ? <img src={brand.logoUrl} alt="لوجو المنشأة" className="h-10 w-10 rounded-xl bg-white object-contain p-1" />
                  : <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/30 text-[9px]">لوجوك</span>}
                <span className="mr-auto text-[10px] font-bold text-white/70">stampy.</span>
              </div>
              <h3 className="mt-6 text-2xl font-bold">{brand.name}</h3>
              <p className="mt-2 text-sm text-white/65">{brand.tagline || 'مكافأة عند كل زيارة حقيقية.'}</p>
              <div className="mt-8 grid grid-cols-5 gap-2" aria-label="معاينة أماكن الأختام، لا بيانات فعلية">
                {Array.from({ length: 5 }, (_, index) => <span key={index} className="grid aspect-square place-items-center rounded-full border border-dashed border-white/40 text-white/50">✳</span>)}
              </div>
              <p className="mt-7 border-t border-white/20 pt-4 text-xs text-white/60">زيارات الضيف تظهر بعد توثيق الموظف، ولن نعرض ختمًا تجريبيًا كرصيد.</p>
            </div>
            <div className="paper-card rounded-[1.75rem] p-6">
              <p className="eyebrow text-rust">معاينة الفريم • بدون صور ضيوف</p>
              <div className={`mt-4 rounded-2xl p-4 ${brand.frameStyle === 'polaroid' ? 'bg-white shadow-lg' : brand.frameStyle === 'editorial' ? 'border-4 border-rust/20 bg-[#f6ebdb]' : 'bg-forest'}`}>
                <div className="grid grid-cols-2 gap-2">{[1,2,3,4].map((number) => <div key={number}
                  className="grid h-24 place-items-center rounded-lg border border-dashed border-ink/15 bg-sand text-xs font-bold text-ink/50">مكان صورة زيارة {number}</div>)}</div>
                <p className={`mt-4 text-xs font-bold ${brand.frameStyle === 'film' ? 'text-white' : 'text-forest'}`}>stampy. × {brand.name}</p>
              </div>
              <p className="mt-4 text-xs leading-6 text-ink/55">الكارت الحقيقي يستخدم صور الضيف الخاصة فقط من زياراته المؤكدة، ويطبع من حسابه بإذنه.</p>
            </div>
            <div className="rounded-2xl border border-forest/15 bg-sage/35 p-5 text-xs leading-7 text-forest">
              {data.walletConfigured ? 'فيه اتصال WalletWallet مخصص للمنشأة. إصدار الكروت الحقيقية يتطلب موافقة الضيف وتفعيل إعدادات الخادم.'
                : 'إضافة Wallet لسه غير مفعّلة لهذه المنشأة. مسؤول المنصة يربط حساب WalletWallet من إدارة الـSaaS قبل ظهور زر الإصدار.'}
            </div>
          </aside>
        </div>
      </div>
    </div>
  </main>;
}
