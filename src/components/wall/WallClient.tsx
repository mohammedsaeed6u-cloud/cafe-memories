"use client";
/* eslint-disable @next/next/no-img-element -- Device-scoped image requests must re-check consent through the private media proxy. */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { PublicBrand } from '@/lib/brand';

type Feed = {
  screen: { name: string; organizationName: string; brand: PublicBrand | null };
  memories: {
    id: string;
    caption: string | null;
    customerName: string;
    imageUrl: string;
  }[];
};

export function WallClient({ screenId }: { screenId?: string }) {
  const router = useRouter();
  const [pairingCode, setPairingCode] = useState("");
  const [feed, setFeed] = useState<Feed | null>(null);
  const [screenState, setScreenState] = useState<
    "loading" | "pair" | "offline" | "ready"
  >(screenId ? "loading" : "pair");
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!screenId) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(
        `/api/v1/screens/${encodeURIComponent(screenId)}/feed`,
        { cache: "no-store", signal: controller.signal },
      );
      if (response.status === 401) {
        setFeed(null);
        setScreenState("pair");
        setNotice(
          "الشاشة غير مرتبطة أو تم إلغاء ارتباطها. أدخل رمز اقتران جديدًا.",
        );
        return;
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "تعذر عرض الصور");
      setFeed(body);
      setScreenState("ready");
      setNotice("");
    } catch (error) {
      // Old frames must not survive a lost connection after consent can change.
      setFeed(null);
      setScreenState("offline");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }, [screenId]);

  useEffect(() => {
    const initial = setTimeout(
      () =>
        refresh().catch((error) =>
          setNotice(error instanceof Error ? error.message : "تعذر الاتصال"),
        ),
      0,
    );
    const feedTimer = setInterval(
      () => refresh().catch((error) => setNotice(error.message)),
      15_000,
    );
    const heartbeatTimer = screenId
      ? setInterval(() => {
          fetch("/api/v1/screens/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ screenId }),
          }).catch(() => {});
        }, 45_000)
      : null;
    return () => {
      clearTimeout(initial);
      clearInterval(feedTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    };
  }, [refresh, screenId]);

  useEffect(() => {
    const timer = setInterval(() => setIndex((previous) => previous + 1), 7000);
    return () => clearInterval(timer);
  }, []);

  async function pair(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/v1/screens/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairingCode }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "تعذر الاقتران");
      router.replace(`/wall/${body.screenId}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر الاقتران");
    } finally {
      setBusy(false);
    }
  }

  if (!feed && screenId && screenState !== "pair")
    return (
      <main
        dir="rtl"
        className="grid min-h-screen place-items-center bg-forest p-6 text-white"
      >
        <div className="w-full max-w-md rounded-[2rem] border border-white/15 bg-white/5 p-8 text-center shadow-2xl">
          <img src="/brand/stampy-app-icon-64.png" alt="" aria-hidden="true" className="mx-auto h-14 w-14 rounded-2xl" />
          <p className="eyebrow mt-4 text-[#f2c77f]">
            stampy. / شاشة الصالة
          </p>
          <h1 className="display-heading mt-3 text-3xl">
            {screenState === "loading"
              ? "بنتحقق من الشاشة…"
              : "الصور مخفية لحمايتها."}
          </h1>
          <p className="mt-4 text-sm leading-8 text-white/65">
            {screenState === "loading"
              ? "بنراجع الاقتران والأذونات قبل عرض أي صورة."
              : "تعذر التأكد من الإذن أو الاتصال. لن نعرض الذكريات حتى يرجع الاتصال ويتم التحقق من جديد."}
          </p>
          {notice && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-[#f2c77f]/10 p-3 text-xs leading-6 text-[#f2c77f]"
            >
              {notice}
            </p>
          )}
          {screenState === "offline" && (
            <button
              className="mt-6 rounded-full bg-[#f2c77f] px-6 py-3 text-sm font-bold text-forest"
              onClick={() =>
                refresh().catch((error) => setNotice(error.message))
              }
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      </main>
    );

  if (!feed)
    return (
      <main
        dir="rtl"
        className="grid min-h-screen place-items-center bg-forest p-5 text-white"
      >
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <span className="absolute -right-25 -top-40 text-[30rem] text-white/5">
            ✳
          </span>
        </div>
        <form
          onSubmit={pair}
          className="relative w-full max-w-md rounded-[2rem] border border-white/15 bg-white/8 p-7 shadow-2xl sm:p-10"
        >
          <img src="/brand/stampy-app-icon-64.png" alt="" aria-hidden="true" className="h-12 w-12 rounded-2xl" />
          <p className="eyebrow mt-7 text-[#f2c77f]">أهلًا بالشاشة</p>
          <h1 className="display-heading mt-2 text-3xl">اربط شاشة الصالة.</h1>
          <p className="mt-4 text-sm leading-8 text-white/65">
            أدخل الرمز المكوّن من 8 أرقام من لوحة المنشأة. الصور لن تظهر قبل
            اقتران حقيقي وموافقة أصحابها.
          </p>
          <label className="mt-7 block text-sm font-bold">
            رمز الاقتران
            <input
              inputMode="numeric"
              pattern="[0-9]{8}"
              maxLength={8}
              required
              dir="ltr"
              autoComplete="off"
              value={pairingCode}
              onChange={(e) =>
                setPairingCode(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              className="mt-2 w-full rounded-xl border border-white/25 bg-white/10 p-4 text-center font-mono text-2xl tracking-[.25em] text-white outline-none focus:border-[#f2c77f]"
              placeholder="00000000"
            />
          </label>
          <button
            disabled={busy}
            className="mt-5 w-full rounded-full bg-[#f2c77f] px-6 py-3 font-bold text-forest transition hover:bg-white disabled:opacity-50"
          >
            {busy ? "جارٍ الاقتران…" : "ربط الشاشة"}
          </button>
          {notice && (
            <p role="alert" className="mt-5 text-sm leading-7 text-[#f2c77f]">
              {notice}
            </p>
          )}
        </form>
      </main>
    );

  const photo = feed.memories[index % feed.memories.length];
  return (
    <main dir="rtl" className="flex min-h-screen flex-col bg-forest text-white"
      style={feed.screen.brand ? { backgroundColor: feed.screen.brand.primaryColor } : undefined}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 px-6 py-5 md:px-12">
        <div className="flex items-center gap-3">
          <img src="/brand/stampy-app-icon-64.png" alt="شعار stampy." className="h-11 w-11 rounded-xl" />
          <span className="text-white/50" aria-hidden="true">×</span>
          {feed.screen.brand?.logoUrl && <img src={feed.screen.brand.logoUrl} alt={`شعار ${feed.screen.organizationName}`}
            className="h-11 w-11 rounded-xl bg-white object-contain p-1" />}
          <div>
            <p className="eyebrow text-[#f2c77f]">stampy. × لحظات من المكان</p>
            <h1 className="text-xl font-bold">
              {feed.screen.organizationName || feed.screen.name}
            </h1>
          </div>
        </div>
        <span className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/65">
          {feed.screen.name}
        </span>
      </header>
      {notice && (
        <div
          role="alert"
          className="bg-[#f2c77f]/10 p-3 text-center text-sm text-[#f2c77f]"
        >
          {notice}{" "}
          <button
            className="mr-3 underline"
            onClick={() => refresh().catch((error) => setNotice(error.message))}
          >
            إعادة المحاولة
          </button>
        </div>
      )}
      <section className="flex flex-1 items-center justify-center p-6 md:p-10">
        {photo ? (
          <div key={photo.id} className="w-full max-w-5xl text-center">
            <div className="flex min-h-[45vh] items-center justify-center rounded-[1.75rem] border border-white/10 bg-black/20 p-3 md:p-5">
              <img
                src={photo.imageUrl}
                alt={photo.caption || "ذكرى ضيف"}
                onError={() => {
                  setFeed(null);
                  setScreenState("offline");
                  setNotice(
                    "تعذر التحقق من الصورة أو سُحب الإذن. أوقفنا العرض.",
                  );
                }}
                className="stampy-wall-photo max-h-[73vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>
            <p className="mt-6 text-xl font-bold md:text-3xl">
              {photo.caption || "لحظات تستاهل نفتكرها"}
            </p>
            <p className="mt-2 text-sm text-[#f2c77f]">{photo.customerName}</p>
          </div>
        ) : (
          <div className="max-w-xl text-center">
            <span aria-hidden="true" className="text-6xl text-[#f2c77f]">
              ✳
            </span>
            <h2 className="display-heading mt-5 text-3xl md:text-5xl">
              الذكريات تبدأ من هنا.
            </h2>
            <p className="mt-5 text-sm leading-8 text-white/65">
لما ضيف يختار يشارك ذكرى في الفرع ويتراجع العرض، هتظهر هنا. الصور الخاصة مش جزء من الشاشة.
            </p>
          </div>
        )}
      </section>
      <footer className="border-t border-white/10 p-4 text-center text-xs text-white/45">
        الصور تتحدّث كل 15 ثانية · خصوصية الضيف أولًا
      </footer>
    </main>
  );
}
