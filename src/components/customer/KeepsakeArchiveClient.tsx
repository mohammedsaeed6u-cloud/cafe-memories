"use client";

import Link from "next/link";
import { StampyLogo } from "@/components/brand/StampyLogo";
import { useEffect, useState } from "react";
import type { KeepsakeStory } from "@/lib/keepsakes";

export function KeepsakeArchiveClient({ cafeSlug }: { cafeSlug: string }) {
  const [story, setStory] = useState<KeepsakeStory | null>(null);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(`/api/v1/customer/story?${new URLSearchParams({ cafeSlug })}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401
          ? "سجّل دخولك بنفس حساب الضيف علشان تفتح كروت ذكرياتك."
          : "تعذر تحميل كروت الذكريات. حاول تاني.");
        return response.json() as Promise<KeepsakeStory>;
      })
      .then((result) => { if (active) { setStory(result); setPage(0); setError(""); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "تعذر الاتصال"); });
    return () => { active = false; };
  }, [cafeSlug, attempt]);

  async function more() {
    if (!story || busy) return;
    setBusy(true);
    try {
      const next = page + 1;
      const response = await fetch(`/api/v1/customer/story?${new URLSearchParams({
        cafeSlug, page: String(next),
      })}`, { cache: "no-store" });
      if (!response.ok) throw new Error("تعذر تحميل الكروت الأقدم.");
      const result = await response.json() as KeepsakeStory;
      setStory({ ...result, cards: [...story.cards, ...result.cards] });
      setPage(next);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر الاتصال");
    } finally { setBusy(false); }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-paper pb-20 text-ink">
      <header className="border-b border-forest/10 bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" aria-label="stampy. الرئيسية"><StampyLogo size="xs" showTagline={false} /></Link>
          <Link href={`/c/${cafeSlug}`} className="text-sm font-bold text-rust underline underline-offset-4">
            → بطاقة الفرع
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-8 px-5 pt-10 sm:pt-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-forest p-7 text-white sm:p-10">
          <span aria-hidden="true" className="absolute -left-8 -top-16 text-[12rem] leading-none text-white/5">✳</span>
          <div className="relative">
            <p className="eyebrow text-[#efc68e]">أرشيف الضيف الخاص</p>
            <h1 className="display-heading mt-3 text-3xl sm:text-4xl">الذكريات اللي فضلت معاك.</h1>
            <p className="mt-4 max-w-xl text-sm leading-8 text-white/70">
              كروتك المكتملة محفوظة هنا في حسابك. تقدر تفتح أي كارت وتشوف صوره
              وتطبعه أو تحفظه PDF؛ حتى لو تغيّرت مكافأة المكان بعد استحقاقه.
            </p>
          </div>
        </div>
        {error && <div role="alert" className="paper-card rounded-2xl p-6 text-sm text-rust">
          {error}{" "}<button type="button" className="font-bold underline underline-offset-4"
            onClick={() => { setError(""); setAttempt((value) => value + 1); }}>إعادة المحاولة</button>
          <p className="mt-3 text-xs text-ink/55">لو رابط الفرع مش متاح، ارجع للرئيسية. الكارت يفضل مرتبط بحسابك طالما البيانات محفوظة.</p>
        </div>}
        {!story && !error && <p role="status" className="text-sm text-ink/55">بنحمّل كروتك الخاصة…</p>}
        {story && <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-rust">{story.organizationName}</p>
              <h2 className="mt-2 text-2xl font-bold">كروت مكافآتك</h2>
            </div>
            <span className="rounded-full bg-sage px-4 py-2 text-xs font-bold text-forest">
              {story.cardsTotal} كارت
            </span>
          </div>
          {story.cards.length === 0 ? <p className="paper-card mt-6 rounded-2xl p-8 text-sm leading-8 text-ink/60">
            لسه ما اكتملتش دورة أختام. صور زياراتك المؤكدة تفضل في حسابك، وأول كارت هيظهر عند بلوغ المكافأة.
          </p> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {story.cards.map((card) => <article key={card.id} className="paper-card rounded-[1.6rem] p-6">
              <p className="eyebrow text-rust">كارت صور · {card.threshold} أختام</p>
              <h3 className="mt-3 text-xl font-bold">{card.rewardName}</h3>
              <p className="mt-2 text-xs text-ink/55">
                {card.redeemedAt ? "الهدية اتسلّمت" : "الهدية جاهزة للاستلام"}
              </p>
              <Link href={`/c/${cafeSlug}/keepsake/${card.id}`}
                className="action-secondary mt-6 w-full text-sm">افتح كارت الذكريات ↖</Link>
            </article>)}
          </div>}
          {story.cards.length < story.cardsTotal && <button type="button" disabled={busy}
            onClick={more} className="action-secondary mt-7 text-sm">
            {busy ? "جارٍ التحميل…" : "عرض كروت أقدم"}
          </button>}
        </section>}
      </div>
    </main>
  );
}
