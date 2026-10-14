"use client";

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { MerchantNav } from '@/components/dashboard/MerchantNav';

type Campaign = { id:string; name:string; status:string; createdAt:string;
  config:{channel:'wallet'; audience:'all'|'returning'|'inactive30'; message:string};
  counts:{accepted:number; unknown:number; processing:number} };
type Context = { organization:{name:string}; role:string; organizationWide:boolean };
const audienceNames = { all:'كل الموافقين', returning:'ضيوف رجعوا ٣ مرات فأكثر',
  inactive30:'ضيوف بقالهم ٣٠ يوم من غير زيارة' };

export default function CampaignsPage() {
  const [context,setContext] = useState<Context|null>(null);
  const [campaigns,setCampaigns] = useState<Campaign[]>([]);
  const [ready,setReady] = useState(false);
  const [name,setName] = useState('');
  const [message,setMessage] = useState('');
  const [audience,setAudience] = useState<'all'|'returning'|'inactive30'>('all');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const load = useCallback(async () => {
    const [venue,list] = await Promise.all([
      fetch('/api/v1/merchant/context',{cache:'no-store'}),
      fetch('/api/v1/campaigns',{cache:'no-store'}),
    ]);
    const [org,body] = await Promise.all([venue.json(),list.json()]);
    if (!venue.ok || !list.ok) throw new Error(body.error ?? org.error ?? 'تعذر تحميل الحملات');
    setContext(org); setCampaigns(body.campaigns); setReady(body.walletReady);
  },[]);
  useEffect(() => {
    const timer = setTimeout(() => load().catch((error) => setNotice(error.message)),0);
    return () => clearTimeout(timer);
  },[load]);
  async function create(event:FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/v1/campaigns',{ method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name,message,audience}) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'تعذر حفظ المسودة');
      setName(''); setMessage(''); await load();
      setNotice('اتحفظت كمسودة فقط. محدش جاله إشعار؛ راجعها وبعدين اضغط ابدأ.');
    } catch(error) { setNotice(error instanceof Error ? error.message : 'تعذر الحفظ'); }
    finally {setBusy(false);}
  }
  async function action(id:string,kind:'send'|'end') {
    if (kind==='send' && !window.confirm('هتبدأ حملة Wallet حقيقية. هنرسل لأول ٥ كروت مؤهّلة، والمجدول يكمل لو متوصل. متأكد؟')) return;
    if (kind==='end' && !window.confirm('توقّف الحجوزات الجديدة. الرسائل اللي بدأت عند المزوّد ممكن تكون وصلت بالفعل.')) return;
    setBusy(true); setNotice('');
    try {
      const response = await fetch(`/api/v1/campaigns/${id}`,{method:kind==='send'?'POST':'PATCH',
        headers:{'Content-Type':'application/json'},
        body:kind==='end'?JSON.stringify({action:'end'}):undefined });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'تعذر تنفيذ الحملة');
      await load();
      setNotice(kind==='end' ? 'تم إنهاء الحملة للدفعات الجديدة.' :
        `المزوّد قبل ${body.accepted} تحديث، و${body.unknown} نتيجة غير مؤكدة بدون إعادة إرسال تلقائي. ${body.claimed===0?'لا توجد بطاقات مؤهلة جديدة حالياً.':'تذكير: القبول لا يعني عرض إشعار على الجهاز.'}`);
    } catch(error) { setNotice(error instanceof Error ? error.message : 'تعذر التنفيذ'); }
    finally {setBusy(false);}
  }
  return <main dir="rtl" className="min-h-screen bg-paper text-ink"><div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[245px_minmax(0,1fr)]">
    <MerchantNav organizationName={context?.organization.name ?? 'مساحة المنشأة'} active="campaigns" role={context?.role} organizationWide={context?.organizationWide} />
    <div className="min-w-0 px-5 py-8 md:px-9 md:py-11 xl:px-12"><div className="mx-auto max-w-5xl space-y-7">
      <header><p className="eyebrow text-rust">Wallet أولاً</p>
        <h1 className="display-heading mt-2 text-3xl sm:text-4xl">رسالة على الكارت، مش سبام.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/55">رسائل WalletWallet بتستخدم الكارت اللي الضيف وافق عليه، لمين وافق على التسويق بس. مفيش صور عملاء، ولا أرقام تليفونات، ولا تتبع مباشر للقرب.</p>
      </header>
      {notice && <p role="status" className="rounded-xl bg-[#fff2e9] p-4 text-sm leading-7 text-rust">{notice} <button onClick={() => load().catch((e)=>setNotice(e.message))} className="font-bold underline">تحديث</button></p>}
      {context && <>
        {!ready && <div className="rounded-xl border border-rust/20 bg-sand/60 p-5 text-sm leading-7 text-ink/70">إرسال Wallet محتاج مسؤول المنصة يربط WalletWallet بخطة Pro أو Business ويختبره خلال ٢٤ ساعة. صياغة المسودة ممكنة، لكن مفيش إرسال تجريبي أو إشعار وهمي.</div>}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.7fr)]">
          <section className="paper-card rounded-[1.75rem] p-6 sm:p-8"><p className="eyebrow text-rust">اكتب واختر بهدوء</p>
            <h2 className="mt-2 text-xl font-bold">مسودة حملة جديدة</h2>
            <form onSubmit={create} className="mt-6 space-y-5">
              <label className="block text-xs font-bold">اسم الحملة الداخلي
                <input className="field mt-2" value={name} required minLength={3} maxLength={60}
                  onChange={(event)=>setName(event.target.value)} placeholder="تحية زوّارنا المنتظمين" /></label>
              <label className="block text-xs font-bold">مين من الموافقين يستقبلها؟
                <select className="field mt-2" value={audience} onChange={(event)=>setAudience(event.target.value as typeof audience)}>
                  {Object.entries(audienceNames).map(([key,label])=><option key={key} value={key}>{label}</option>)}
                </select></label>
              <label className="block text-xs font-bold">النص الظاهر على الكارت (حتى ١١٠ حرف)
                <textarea className="field mt-2 min-h-24" value={message} required minLength={3} maxLength={110}
                  onChange={(event)=>setMessage(event.target.value)} placeholder="وجبتك الجاية عندنا ليها مفاجأة…" /></label>
              <button disabled={busy} className="action-primary text-sm">حفظ كمسودة — بلا إرسال</button>
            </form>
          </section>
          <aside className="rounded-[1.75rem] bg-forest p-6 text-white sm:p-8">
            <p className="eyebrow text-[#edbc87]">معاينة نصية · ليست إرسالاً</p>
            <p dir="ltr" className="mt-5 text-xs font-bold tracking-widest text-white/65">STAMPY. × {context.organization.name}</p>
            <p className="mt-6 rounded-2xl bg-white/10 p-5 text-base leading-8">{message || 'نصّك هيتشاف هنا قبل ما تبدأ الحملة.'}</p>
            <p className="mt-8 text-xs leading-7 text-white/60">قبول WalletWallet للتحديث مش ضمان إشعار على قفل الشاشة. لازم يكون الضيف ضاف البطاقة لجهازه والنظام يسمح. المواقع دي بتخلي البطاقة مناسبة قرب فرعك فقط بموافقته؛ مش خدمة بث بتعرف مكانه.</p>
          </aside>
        </div>
        <section className="space-y-4"><div><p className="eyebrow text-rust">أثر قابل للمراجعة</p>
          <h2 className="mt-2 text-xl font-bold">الحملات المحفوظة</h2></div>
          {!campaigns.length && <p className="paper-card rounded-2xl p-6 text-sm text-ink/55">مفيش حملات حتى الآن؛ أول واحدة تبدأ مسودة.</p>}
          {campaigns.map((campaign)=><article key={campaign.id} className="paper-card rounded-[1.5rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow text-rust">{campaign.status==='draft'?'مسودة':campaign.status==='active'?'جارية':'منتهية'} · {audienceNames[campaign.config.audience]}</p>
              <h3 className="mt-2 text-lg font-bold">{campaign.name}</h3>
              <p className="mt-2 text-sm text-ink/60">«{campaign.config.message}»</p></div>
              <div className="text-xs leading-7 text-ink/50">
                <p>{campaign.counts.accepted} قبلها المزوّد</p>
                <p>{campaign.counts.unknown} نتيجة مجهولة — بدون تكرار تلقائي</p>
                {campaign.counts.processing>0 && <p>{campaign.counts.processing} جارية أو تحتاج مراجعة</p>}
              </div></div>
            {campaign.status!=='ended' && <div className="mt-5 flex flex-wrap gap-3 border-t border-forest/10 pt-5">
              <button disabled={busy||!ready} onClick={()=>void action(campaign.id,'send')} className="action-primary text-sm">
                {campaign.status==='draft'?'ابدأ بإرسال ٥ بطاقات مؤهلة':'كمّل دفعة جديدة (حتى ٥)'}</button>
              <button disabled={busy} onClick={()=>void action(campaign.id,'end')} className="action-secondary text-sm">إنهاء الحملة</button>
            </div>}
          </article>)}
        </section>
        <p className="text-xs leading-7 text-ink/50">الدفعات التالية محتاجة مجدول الخادم أو ضغط يدوي؛ أي محاولة مش معروف وصلت ولا لا بتبقى «مجهولة» بدل ما نكررها تلقائي. إلغاء موافقة ضيف يمنعه من الدفعات اللاحقة.</p>
      </>}
    </div></div>
  </div></main>;
}
