"use client";
/* eslint-disable @next/next/no-img-element -- Private photos are served through the authenticated media route. */

import Link from "next/link";
import { useEffect, useState } from "react";
import { keepsakePages, type KeepsakeStory } from "@/lib/keepsakes";

function visitDate(date: string) {
  if (!date) return "زيارة موثّقة";
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Cairo",
  }).format(new Date(date));
}

export function KeepsakePrintClient({ cafeSlug, cardId }: {
  cafeSlug: string;
  cardId: string;
}) {
  const [story, setStory] = useState<KeepsakeStory | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    fetch(`/api/v1/customer/story?${new URLSearchParams({ cafeSlug, cardId })}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401
          ? "افتح بطاقة الضيف بنفس حسابك الأول علشان تشوف صورك."
          : response.status === 404 ? "الكارت مش موجود في حسابك."
            : "تعذر تحميل صور الكارت. حاول تاني.");
        return response.json() as Promise<KeepsakeStory>;
      })
      .then((result) => { if (active) { setStory(result); setError(""); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "تعذر الاتصال"); });
    return () => { active = false; };
  }, [cafeSlug, cardId, attempt]);

  const card = story?.card;
  const brand = story?.brand;
  const lightFrame = brand?.frameStyle === 'polaroid' || brand?.frameStyle === 'editorial';
  const pages = card ? keepsakePages(card.visits) : [];

  async function printCard() {
    // Wait for private media before opening the print dialog. Missing images
    // remain labeled stamp slots, never substituted with illustrative photos.
    const images = [...document.querySelectorAll<HTMLImageElement>(".keepsake-sheet img")];
    await Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    })));
    window.print();
  }

  return (
    <main dir="rtl" className="keepsake-page min-h-screen bg-paper px-4 pb-14 text-ink sm:px-6">
      <style>{`
        @page { size: 105mm 148mm; margin: 0; }
        @media print {
          html, body { width: 105mm !important; margin: 0 !important; padding: 0 !important;
            background: #ffffff !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .keepsake-page { min-height: 0 !important; margin: 0 !important; padding: 0 !important;
            background: white !important; }
          .keepsake-toolbar { display: none !important; }
          .keepsake-sheet { width: 105mm !important; height: 148mm !important;
            margin: 0 !important; box-shadow: none !important; border-radius: 0 !important;
            break-after: page; page-break-after: always; }
          .keepsake-sheet:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>
      <div className="keepsake-toolbar mx-auto max-w-4xl py-7 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href={`/c/${cafeSlug}/keepsakes`} className="text-sm font-bold text-rust underline underline-offset-4">
            → كل كروت ذكرياتي
          </Link>
          <span className="eyebrow text-rust">café memories / YOUR KEEPSAKE</span>
        </div>
        <h1 className="display-heading mt-5 text-3xl sm:text-4xl">كارت ذكرياتك، مع مكافأتك.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-8 text-ink/65">
          كل صورة هنا من زيارة أكدها الموظف. لو اخترت ما تضيفش صورة، ختمك محفوظ
          ومكانه ظاهر في الكارت. الصور خاصة بحسابك، ومش بتتبعت للطابعة تلقائيًا.
        </p>
        {card && <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" onClick={printCard} className="action-primary">
            طباعة الكارت / حفظ PDF ↖
          </button>
          <p className="text-xs leading-6 text-ink/55">
            من نافذة الطباعة اختار طابعة الفرع أو «حفظ كـ PDF»؛ لو أكتر من ٦ زيارات، هيظهر أكتر من ورقة.
          </p>
        </div>}
      </div>
      {error && <div role="alert" className="keepsake-toolbar paper-card mx-auto max-w-xl rounded-2xl p-7">
        <p className="text-sm text-rust">{error}</p>
        <button type="button" onClick={() => { setError(""); setAttempt((value) => value + 1); }}
          className="action-secondary mt-4">إعادة المحاولة</button>
      </div>}
      {!story && !error && <p role="status" className="keepsake-toolbar text-center text-sm text-ink/55">
        بنجهز ذكرياتك الخاصة…
      </p>}
      {story && !card && <p role="alert" className="keepsake-toolbar text-center text-sm text-rust">
        الكارت مش متاح لهذا الحساب.
      </p>}
      {card && <div className="flex flex-wrap items-start justify-center gap-6 print:block">
        {pages.map((visits, pageIndex) => (
          <article key={pageIndex}
            aria-label={`كارت ذكرياتك، ورقة ${pageIndex + 1} من ${pages.length}`}
            className={`keepsake-sheet relative flex h-[148mm] w-[min(100%,105mm)] flex-col overflow-hidden rounded-[1.5rem] p-[6mm] shadow-[0_24px_75px_-35px_#183a32b3] print:rounded-none ${lightFrame ? 'text-forest' : 'text-white'}`}
            style={{ backgroundColor: !lightFrame ? brand?.primaryColor ?? '#183a32' :
              brand?.frameStyle === 'editorial' ? '#f3e9d8' : '#fffdf8' }}>
            <div aria-hidden="true" className={`pointer-events-none absolute -left-8 -top-10 text-[8rem] leading-none ${lightFrame ? 'text-forest/5' : 'text-white/5'}`}>✳</div>
            <header className="relative flex shrink-0 items-start justify-between gap-2 pb-[4mm]">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: lightFrame ? brand?.primaryColor : brand?.accentColor }}>
                  CAFÉ MEMORIES × {story.organizationName}
                </p>
                <h2 className="mt-1 line-clamp-2 text-[18px] font-bold leading-tight">{story.organizationName}</h2>
                <p className={`mt-1 text-[10px] ${lightFrame ? 'text-forest/65' : 'text-white/65'}`}>{brand?.tagline || 'ذكريات زيارة ورا زيارة'} · {card.threshold} أختام حقيقية</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5" aria-label={`Café Memories مع ${story.organizationName}`}>
                <img src="/icon.svg" alt="شعار Café Memories" className="h-9 w-9 rounded-lg" />
                <span aria-hidden="true" className="text-xs">×</span>
                {brand?.logoUrl ? <img src={brand.logoUrl} alt={`شعار ${story.organizationName}`}
                  className="h-9 w-9 rounded-lg bg-white object-contain p-0.5" />
                  : <span className="grid h-9 w-9 place-items-center rounded-lg border border-current/25 text-sm font-bold">{story.organizationName.slice(0, 1)}</span>}
              </div>
            </header>
            <div className="relative grid min-h-0 flex-1 grid-cols-2 gap-[2mm]"
              style={{ gridTemplateRows: `repeat(${Math.ceil(visits.length / 2)}, minmax(0, 1fr))` }}>
              {visits.map((visit, index) => (
                <div key={visit.id} className={`relative min-h-0 overflow-hidden text-forest ${brand?.frameStyle === 'polaroid'
                  ? 'rounded-[1mm] border-[2mm] border-white bg-white shadow-sm' : brand?.frameStyle === 'editorial'
                    ? 'rounded-none border border-forest/20 bg-[#ecdfc8]' : 'rounded-[2mm] border border-white/10 bg-[#ecdfc8]'}`}>
                  <div className="absolute inset-0 grid place-items-center bg-[#ecdfc8] text-center">
                    <div>
                      <span aria-hidden="true" className="text-3xl text-rust/55">✳</span>
                      <p className="mt-1 text-[10px] font-bold">زيارة موثّقة</p>
                      {!visit.photo && <p className="text-[9px] text-forest/65">من غير صورة، والختم محفوظ</p>}
                    </div>
                  </div>
                  {visit.photo && <img src={visit.photo.imageUrl}
                    alt={visit.photo.caption || `صورة الزيارة رقم ${pageIndex * 6 + index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(event) => { event.currentTarget.style.display = "none"; }} />}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#162e27]/95 via-[#162e27]/75 to-transparent px-[2mm] pb-[1.5mm] pt-[4mm] text-white">
                    <p className="text-[10px] font-bold">#{pageIndex * 6 + index + 1} · {visitDate(visit.verifiedAt)}</p>
                    <p className="truncate text-[9px] text-white/75">{visit.branchName}</p>
                  </div>
                </div>
              ))}
            </div>
            <footer className="relative shrink-0 pt-[3mm]">
              <div className={`flex items-end justify-between gap-2 border-t pt-[2mm] ${lightFrame ? 'border-forest/25' : 'border-white/25'}`}>
                <div className="min-w-0">
                  <p className="text-[9px]" style={{ color: lightFrame ? brand?.primaryColor : brand?.accentColor }}>
                    {card.redeemedAt ? "المكافأة اتسلّمت" : "المكافأة جاهزة للاستلام"}</p>
                  <p className="line-clamp-2 text-[11px] font-bold leading-tight">{card.rewardName}</p>
                </div>
                <p className={`shrink-0 text-[9px] ${lightFrame ? 'text-forest/65' : 'text-white/65'}`}>{pageIndex + 1} / {pages.length}</p>
              </div>
              <p className={`mt-[1mm] text-[8px] ${lightFrame ? 'text-forest/60' : 'text-white/55'}`} dir="ltr">Café Memories × {story.organizationName}</p>
            </footer>
          </article>
        ))}
      </div>}
    </main>
  );
}
