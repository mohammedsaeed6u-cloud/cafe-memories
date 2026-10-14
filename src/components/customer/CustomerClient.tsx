"use client";
/* eslint-disable @next/next/no-img-element -- Private memory images and local blob previews bypass the public image optimizer. */

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { customerGoogleAction } from "@/lib/customer-google-flow";
import { visibleStampCount } from "@/lib/loyalty-progress";

type Memory = {
  id: string;
  caption: string | null;
  status: string;
  visibility: string;
  createdAt: string;
  imageUrl: string;
};
type Session = {
  customer: { id: string; displayName: string };
  account: {
    authUserId: string;
    phone: string | null;
    email: string | null;
    isAnonymous: boolean;
    googleLinked: boolean;
    hasSavedData: boolean;
  };
  venue: { organizationName: string; branchName: string };
  verifiedVisits: number;
  memories: Memory[];
};
const authMessages: Record<string, string> = {
  "link-failed":
    "لم يكتمل ربط Google. بقيت ذكرياتك في حساب الضيف الحالي. تحقّق من تفعيل ربط الهويات يدويًا؛ إذا كان Google مرتبطًا بحساب آخر فلا يمكن نقل الذكريات تلقائيًا.",
  "sign-in-failed":
    "تعذر تسجيل الدخول بحساب Google. يمكنك إعادة المحاولة أو المتابعة كضيف.",
  "missing-code": "رابط تسجيل الدخول غير صالح. ابدأ من صفحة الفرع مرة أخرى.",
};
type Progress = {
  verifiedVisits: number;
  totalSlots: number;
  stampedCount: number;
  availableRewards: number;
  rewardRule: { name: string } | null;
};

export function CustomerClient({
  cafeSlug,
  branchSlug,
  authError,
}: {
  cafeSlug: string;
  branchSlug?: string;
  authError?: string;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [entry, setEntry] = useState<"checking" | "choose" | "ready">(
    "checking",
  );
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [progressError, setProgressError] = useState("");
  const [tab, setTab] = useState<"card" | "memories" | "account">("card");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState(
    authError ? (authMessages[authError] ?? "") : "",
  );
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const refresh = useCallback(
    async (syncAccount = false): Promise<Session> => {
      const response = await fetch("/api/v1/customer/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cafeSlug, branchSlug }),
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "تعذر بدء الجلسة");
      setSession(body);
      setEntry("ready");
      if (syncAccount) {
        setDisplayName(body.customer.displayName ?? "");
        setPhone(body.account.phone ?? "");
      }
      const query = new URLSearchParams({ cafeSlug });
      if (branchSlug) query.set("branchSlug", branchSlug);
      try {
        const loyalty = await fetch(`/api/v1/loyalty/stamps?${query}`, {
          cache: "no-store",
        });
        if (!loyalty.ok) throw new Error("Could not load loyalty progress");
        setProgress(await loyalty.json());
        setProgressError("");
      } catch {
        setProgress(null);
        setProgressError(
          "تعذر تحميل تفاصيل المكافأة الآن. الزيارات المؤكدة ما زالت ظاهرة، ويمكنك المحاولة مجددًا.",
        );
      }
      return body;
    },
    [cafeSlug, branchSlug],
  );

  useEffect(() => {
    // An unexpected change of user ID during linking requires manual recovery;
    // do not automatically create a new customer on that identity.
    if (authError === "identity-mismatch") return;
    let active = true;
    (async () => {
      const {
        data: { user },
        error,
      } = await createClient().auth.getUser();
      if (error) throw error;
      if (!active) return;
      if (!user) {
        setEntry("choose");
        return;
      }
      await refresh(true);
    })().catch((error) => {
      if (active)
        setNotice(error instanceof Error ? error.message : "تعذر الاتصال");
    });
    return () => {
      active = false;
    };
  }, [refresh, authError]);

  async function continueAsGuest() {
    setBusy(true);
    setNotice("");
    try {
      const { error } = await createClient().auth.signInAnonymously();
      if (error)
        throw new Error("يرجى تفعيل دخول الضيوف في Supabase: " + error.message);
      await refresh(true);
      setNotice(
        "أنت الآن ضيف بهذا المتصفح. اربط حساب Google قبل مسح بيانات المتصفح للاحتفاظ بذكرياتك.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر بدء جلسة الضيف");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    setNotice("");
    try {
      const db = createClient();
      const {
        data: { user },
        error: authError,
      } = await db.auth.getUser();
      if (authError) throw authError;
      if (session ? user?.id !== session.account.authUserId : Boolean(user)) {
        throw new Error("تغيّرت جلسة الدخول. أعد تحميل الصفحة قبل المتابعة.");
      }
      // Fail closed: checking only this venue's visible photos misses pending,
      // deleted or cross-venue visits and redeemed loyalty rewards.
      const current = session ? await refresh() : null;
      if (
        session &&
        current?.account.authUserId !== session.account.authUserId
      ) {
        throw new Error(
          "تغيّر الحساب في تبويب آخر. أعد تحميل الصفحة قبل المتابعة.",
        );
      }
      const action = customerGoogleAction(current?.account ?? null);
      if (action === "already-linked") {
        setNotice("حسابك مرتبط بالفعل بـ Google.");
        return;
      }
      const callback = new URL(
        "/auth/customer/callback",
        window.location.origin,
      );
      callback.searchParams.set("cafe", cafeSlug);
      if (branchSlug) callback.searchParams.set("branch", branchSlug);
      if (action === "link") {
        const intent = await fetch("/api/v1/customer/oauth/link-intent", {
          method: "POST",
        });
        if (!intent.ok)
          throw new Error("تعذر حماية عملية ربط الحساب. أعد المحاولة.");
        const { nonce } = await intent.json();
        callback.searchParams.set("flow", "link");
        callback.searchParams.set("nonce", nonce);
        const { error } = await db.auth.linkIdentity({
          provider: "google",
          options: { redirectTo: callback.toString() },
        });
        if (error) throw error;
      } else {
        const { error } = await db.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: callback.toString() },
        });
        if (error) throw error;
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر دخول Google");
    } finally {
      setBusy(false);
    }
  }

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/v1/customer/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUserId: session.account.authUserId,
          displayName,
          phone: phone.trim() || null,
        }),
      });
      if (!response.ok)
        throw new Error((await response.json()).error ?? "تعذر حفظ الإعدادات");
      await refresh(true);
      setNotice("تم حفظ إعدادات حسابك.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر حفظ الإعدادات");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!session) return;
    setBusy(true);
    setNotice("");
    try {
      const {
        data: { user },
        error: authError,
      } = await createClient().auth.getUser();
      if (authError || user?.id !== session.account.authUserId) {
        throw new Error("تغيّرت جلسة الدخول. أعد تحميل الصفحة.");
      }
      const latest = await refresh();
      if (latest.account.authUserId !== user.id)
        throw new Error("تغيّرت جلسة الدخول. أعد تحميل الصفحة.");
      if (
        latest.account.hasSavedData &&
        (latest.account.isAnonymous ||
          (!latest.account.googleLinked && !latest.account.email))
      ) {
        throw new Error(
          "لا تخرج قبل ربط حساب يمكن استعادته بـ Google للحفاظ على ذكرياتك.",
        );
      }
      const { error } = await createClient().auth.signOut({ scope: "local" });
      if (error) throw error;
      if (preview) URL.revokeObjectURL(preview);
      setFile(null);
      setPreview("");
      setSession(null);
      setProgress(null);
      setDisplayName("");
      setPhone("");
      setEntry("choose");
      setTab("card");
      setNotice("تم تسجيل الخروج من هذا الجهاز.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر تسجيل الخروج");
    } finally {
      setBusy(false);
    }
  }

  async function copyCustomerId() {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.customer.id);
      setNotice("تم نسخ معرّف الضيف. اعرضه للموظف بعد إثبات الشراء.");
    } catch {
      setNotice("حدّد معرّف الضيف أدناه لنسخه يدويًا.");
    }
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = ""; // Selecting the same photo again should still trigger a change.
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : "");
  }

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setNotice("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("cafeSlug", cafeSlug);
      if (branchSlug) form.set("branchSlug", branchSlug);
      form.set("caption", caption);
      form.set("liveWallConsent", String(consent));
      const response = await fetch("/api/v1/memories/upload", {
        method: "POST",
        body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "فشل رفع الصورة");
      setFile(null);
      setCaption("");
      setConsent(false);
      if (preview) URL.revokeObjectURL(preview);
      setPreview("");
      await refresh();
      setTab("memories");
      setNotice(
        "حُفظت ذكراك بشكل خاص. ستظهر على الشاشة فقط إذا وافقتَ عليها واعتمدها الفريق.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر رفع الصورة");
    } finally {
      setBusy(false);
    }
  }

  async function changeConsent(memoryId: string, liveWallConsent: boolean) {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/v1/memories/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryId, liveWallConsent }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await refresh();
      setNotice(
        liveWallConsent
          ? "تمت الموافقة على العرض العام بعد المراجعة"
          : "أُلغي العرض العام فورًا",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر تغيير الإذن");
    } finally {
      setBusy(false);
    }
  }

  const visibleStamps = visibleStampCount(progress);

  if (authError === "identity-mismatch")
    return (
      <main dir="rtl" className="min-h-screen bg-paper px-5 py-16 text-ink">
        <section
          role="alert"
          className="paper-card mx-auto max-w-xl rounded-[2rem] p-8"
        >
          <span aria-hidden="true" className="text-4xl text-rust">
            ✳
          </span>
          <h1 className="display-heading mt-5 text-3xl">
            وقفنا ربط الحساب لحماية ذكرياتك.
          </h1>
          <p className="mt-4 text-sm leading-8 text-ink/65">
            تغيّرت هوية الحساب أثناء ربط Google. لم ننقل الصور أو الزيارات إلى
            حساب آخر. لا تمسح بيانات هذا المتصفح ولا تضف ذكريات جديدة حتى يراجع
            فريق الدعم الحسابين ويستعيد الوصول بشكل آمن.
          </p>
        </section>
      </main>
    );

  return (
    <main dir="rtl" className="min-h-screen bg-paper pb-20 text-ink">
      <header className="border-b border-forest/10 bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-[14px] bg-forest text-2xl text-[#f3c178]"
            >
              ✳
            </span>
            <div>
              <p dir="ltr" className="text-sm font-bold">
                café<span className="text-rust">memories</span>
              </p>
              <p className="text-xs text-ink/55">
                {session?.venue.organizationName ?? "مساحة الضيف"}
              </p>
            </div>
          </div>
          {session && (
            <button
              type="button"
              onClick={() => setTab("account")}
              className="flex items-center gap-2 rounded-full border border-forest/15 bg-paper px-4 py-2 text-xs font-bold text-forest transition hover:bg-sage"
            >
              <span aria-hidden="true">◉</span> حسابي
            </button>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-7 px-5 pt-9 md:pt-12">
        {notice && (
          <div
            role="status"
            className="rounded-2xl border border-rust/25 bg-[#fff3eb] p-4 text-sm leading-7 text-[#8a3e2e]"
          >
            {notice}
          </div>
        )}
        {entry === "checking" && (
          <div
            role="status"
            className="paper-card mx-auto max-w-xl rounded-[2rem] p-10 text-center"
          >
            <span aria-hidden="true" className="text-4xl text-rust">
              ✳
            </span>
            <h1 className="mt-4 text-xl font-bold">بنجهّز بطاقتك…</h1>
            <p className="mt-2 text-sm text-ink/55">
              جارٍ التحقق من حسابك والفرع.
            </p>
          </div>
        )}
        {entry === "choose" && !session && (
          <section className="mx-auto grid max-w-4xl overflow-hidden rounded-[2rem] border border-forest/10 bg-white shadow-xl md:grid-cols-[.95fr_1fr]">
            <div className="flex flex-col justify-between bg-forest p-8 text-white sm:p-10">
              <div>
                <p className="eyebrow text-[#efc68e]">أهلًا بيك في المكان</p>
                <h1 className="display-heading mt-5 text-4xl">
                  كل زيارة
                  <br />
                  تقربك لحاجة حلوة.
                </h1>
                <p className="mt-5 text-sm leading-8 text-white/70">
                  بطاقتك هنا تجمع زياراتك المؤكدة، وذكرياتك تفضل لك وحدك إلا لو
                  اخترت تشاركها.
                </p>
              </div>
              <div
                aria-hidden="true"
                className="mt-10 flex gap-2 text-3xl text-[#eac186]"
              >
                ✳ ✳ ✳ ✳ ✳
              </div>
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10">
              <p className="eyebrow text-rust">بطاقتك تبدأ هنا</p>
              <h2 className="display-heading mt-3 text-3xl">
                تحب تحفظها إزاي؟
              </h2>
              <p className="mt-4 text-sm leading-8 text-ink/60">
                Google يخلي حسابك قابل للاسترجاع على أجهزتك. أو تقدر تبدأ كضيف
                على المتصفح الحالي.
              </p>
              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={google}
                  disabled={busy}
                  className="action-primary w-full"
                >
                  المتابعة بحساب Google <span aria-hidden="true">↖</span>
                </button>
                <button
                  type="button"
                  onClick={continueAsGuest}
                  disabled={busy}
                  className="action-secondary w-full"
                >
                  المتابعة كضيف
                </button>
              </div>
              <p className="mt-6 text-xs leading-6 text-ink/50">
                جلسة الضيف حقيقية في Supabase لكنها مرتبطة بهذا المتصفح. اربطها
                بـ Google قبل مسح بياناته لو حفظت ذكريات أو زيارات.
              </p>
            </div>
          </section>
        )}
        {entry !== "choose" && !session && notice && (
          <button
            className="action-secondary"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة
          </button>
        )}
        {session && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-rust">{session.venue.branchName}</p>
                <h1 className="display-heading mt-2 text-3xl sm:text-4xl">
                  أهلًا {session.customer.displayName || "يا ضيفنا"}.
                </h1>
                <p className="mt-2 text-sm text-ink/55">
                  كل زيارة ليها حكاية، وكل حكاية تقربك من مكافأتك.
                </p>
              </div>
              <span className="rounded-full bg-sage px-4 py-2 text-xs font-bold text-forest">
                ✳ &nbsp; {session.venue.organizationName}
              </span>
            </div>
            <nav
              aria-label="أقسام حساب الضيف"
              className="flex gap-2 overflow-x-auto border-b border-forest/15 pb-2"
            >
              {(
                [
                  ["card", "بطاقتي"],
                  ["memories", "ذكرياتي"],
                  ["account", "حسابي"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition ${tab === key ? "bg-forest text-white" : "text-ink/55 hover:bg-sand hover:text-ink"}`}
                >
                  {label}
                </button>
              ))}
            </nav>
            {tab === "card" && (
              <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
                <section className="relative overflow-hidden rounded-[2rem] bg-forest p-6 text-white shadow-[0_24px_60px_-32px_#183a32] sm:p-9">
                  <span
                    aria-hidden="true"
                    className="absolute -left-10 -top-16 text-[13rem] leading-none text-white/5"
                  >
                    ✳
                  </span>
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow text-[#efc68e]">بطاقة الولاء</p>
                      <h2 className="mt-2 text-2xl font-bold">
                        {session.venue.organizationName}
                      </h2>
                      <p className="mt-1 text-xs text-white/55">
                        رصيدك واحد في كل فروع المكان
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="text-3xl text-[#efc68e]"
                    >
                      ✳
                    </span>
                  </div>
                  <div className="relative mt-9">
                    <p className="text-sm text-white/65">زيارات مؤكدة</p>
                    <p className="mt-1 text-5xl font-bold tabular-nums text-[#f2c77f]">
                      {progress?.verifiedVisits ?? session.verifiedVisits}
                    </p>
                  </div>
                  {progress?.rewardRule && progress.totalSlots > 0 ? (
                    <div className="relative mt-9">
                      <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs text-white/55">
                            مكافأتك القادمة
                          </p>
                          <p className="mt-1 text-lg font-bold">
                            {progress.rewardRule.name}
                          </p>
                        </div>
                        <p className="text-xs font-bold text-[#efc68e]">
                          {visibleStamps} / {progress.totalSlots}
                        </p>
                      </div>
                      <div
                        role="img"
                        className="grid grid-cols-6 gap-2"
                        aria-label={`${visibleStamps} من ${progress.totalSlots} أختام في البطاقة الحالية`}
                      >
                        {Array.from(
                          { length: progress.totalSlots },
                          (_, index) => (
                            <span
                              key={index}
                              aria-hidden="true"
                              className={`grid aspect-square place-items-center rounded-full border text-xl ${index < visibleStamps ? "border-[#f2c77f] bg-[#f2c77f] text-forest" : "border-dashed border-white/40 text-white/30"}`}
                            >
                              ✳
                            </span>
                          ),
                        )}
                      </div>
                      {progress.availableRewards > 0 && (
                        <p className="mt-6 rounded-xl bg-[#f2c77f] p-3 text-sm font-bold text-forest">
                          ✦ عندك {progress.availableRewards} مكافأة جاهزة. اعرض
                          معرّفك للموظف لصرفها.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="relative mt-8 rounded-xl border border-white/15 bg-white/5 p-4 text-sm leading-7 text-white/70">
                      {progressError ||
                        "المنشأة لم تحدد مكافأة بعد. زياراتك الموثّقة محفوظة ولن تضيع."}
                    </p>
                  )}
                  {progressError && (
                    <button
                      type="button"
                      onClick={() =>
                        refresh().catch((error) =>
                          setNotice(
                            error instanceof Error
                              ? error.message
                              : "تعذر تحديث البطاقة",
                          ),
                        )
                      }
                      className="relative mt-4 text-xs font-bold text-[#f2c77f] underline underline-offset-4"
                    >
                      إعادة تحميل المكافأة
                    </button>
                  )}
                  <p className="relative mt-8 border-t border-white/15 pt-5 text-xs leading-6 text-white/55">
                    الختم يظهر بعد تأكيد الموظف لعملية شراء. مسح رابط الفرع أو
                    رفع صورة مش دليل شراء.
                  </p>
                </section>
                <div className="space-y-5">
                  <section className="paper-card rounded-[1.75rem] p-6">
                    <span
                      aria-hidden="true"
                      className="grid h-11 w-11 place-items-center rounded-2xl bg-sage text-xl text-forest"
                    >
                      ⌁
                    </span>
                    <h2 className="mt-5 text-xl font-bold">في الفرع دلوقتي؟</h2>
                    <p className="mt-2 text-sm leading-7 text-ink/60">
                      اعرض المعرّف ده للموظف بعد الشراء. فتح الصفحة يسجل طلب
                      حضور صالحًا ساعتين، لكن الموظف هو اللي يتحقق من الشراء؛
                      الرابط وحده لا يثبت وجودك.
                    </p>
                    <code
                      dir="ltr"
                      className="mt-5 block select-all break-all rounded-xl bg-sand/70 p-3 text-xs text-forest"
                    >
                      {session.customer.id}
                    </code>
                    <button
                      type="button"
                      onClick={copyCustomerId}
                      className="action-secondary mt-4 w-full text-sm"
                    >
                      نسخ معرّف الضيف
                    </button>
                  </section>
                  <section className="rounded-[1.75rem] bg-[#e3e9dc] p-6">
                    <span className="text-2xl text-rust" aria-hidden="true">
                      ✳
                    </span>
                    <h2 className="mt-3 text-lg font-bold">
                      ذكرياتك مكانها هنا.
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-ink/60">
                      خلي صورة زيارتك خاصة بيك، أو اختار عرضها بعد مراجعة
                      الفريق.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTab("memories")}
                      className="mt-4 text-sm font-bold text-rust underline underline-offset-4"
                    >
                      أضف ذكرى ←
                    </button>
                  </section>
                </div>
              </div>
            )}
            {tab === "memories" && (
              <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
                <form
                  onSubmit={upload}
                  className="paper-card h-fit rounded-[1.75rem] p-6 sm:p-7"
                >
                  <p className="eyebrow text-rust">من اللحظة للمكان</p>
                  <h2 className="mt-2 text-2xl font-bold">احفظ ذكرى جديدة.</h2>
                  <p className="mt-2 text-sm leading-7 text-ink/55">
                    صورتك خاصة في الأصل؛ أنت صاحب قرار عرضها على شاشة الفرع.
                  </p>
                  <label className="mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-forest/25 bg-sand/30 p-5 text-center transition hover:border-rust/60 hover:bg-sand/60">
                    {preview ? (
                      <>
                        <img
                          src={preview}
                          alt="معاينة الصورة"
                          className="max-h-64 w-full rounded-xl object-contain"
                        />
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true" className="text-4xl text-rust">
                          ▧
                        </span>
                        <span className="mt-2 text-sm font-bold">
                          التقط صورة أو اختارها من جهازك
                        </span>
                        <span className="mt-1 text-xs text-ink/45">
                          حد أقصى 10 ميجابايت
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={selectImage}
                      className="sr-only"
                      aria-label="اختيار صورة الذكرى"
                    />
                  </label>
                  <label className="mt-5 block text-sm font-bold">
                    تعليق اختياري
                    <input
                      maxLength={280}
                      placeholder="إيه اللي خلّى اللحظة دي مميزة؟"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="field mt-2"
                    />
                  </label>
                  <label className="mt-5 flex items-start gap-3 text-xs leading-6 text-ink/65">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1.5 h-4 w-4 accent-rust"
                    />
                    أوافق على عرض الصورة على شاشة هذا الفرع بعد مراجعة الفريق.
                    أقدر أسحب موافقتي بعدين.
                  </label>
                  <button
                    disabled={busy || !file}
                    className="action-primary mt-6 w-full"
                  >
                    {busy ? "جارٍ الحفظ…" : "حفظ الذكرى"}{" "}
                    <span aria-hidden="true">↖</span>
                  </button>
                </form>
                <section>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="eyebrow text-rust">ألبومك الخاص</p>
                      <h2 className="mt-2 text-2xl font-bold">آخر ذكرياتك</h2>
                    </div>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold text-ink/65">
                      {session.memories.length} صورة
                    </span>
                  </div>
                  {session.memories.length === 0 ? (
                    <div className="paper-card mt-5 rounded-[1.75rem] p-9 text-center">
                      <span aria-hidden="true" className="text-4xl text-rust">
                        ✳
                      </span>
                      <p className="mt-3 font-bold">لسه مفيش صور هنا.</p>
                      <p className="mt-2 text-sm text-ink/55">
                        أول ذكرى هتظهر بعد ما تحفظها، خاصة بيك.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {session.memories.map((memory) => (
                        <article
                          key={memory.id}
                          className="paper-card overflow-hidden rounded-2xl"
                        >
                          <img
                            src={memory.imageUrl}
                            alt={memory.caption || "صورة من ذكرياتك"}
                            className="h-44 w-full bg-sand object-cover"
                          />
                          <div className="p-4">
                            <p className="line-clamp-2 text-sm font-bold">
                              {memory.caption || "ذكرى من المكان"}
                            </p>
                            <p className="mt-2 text-xs text-ink/55">
                              {memory.status === "pending"
                                ? "بانتظار مراجعة الفريق"
                                : memory.status === "approved"
                                  ? "اتراجعت"
                                  : "غير منشورة"}{" "}
                              ·{" "}
                              {memory.visibility === "live_wall"
                                ? "مسموح بالعرض"
                                : "خاصة"}
                            </p>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                changeConsent(
                                  memory.id,
                                  memory.visibility !== "live_wall",
                                )
                              }
                              className="mt-4 text-xs font-bold text-rust underline underline-offset-4 disabled:opacity-50"
                            >
                              {memory.visibility === "live_wall"
                                ? "إلغاء العرض العام"
                                : "السماح بالعرض بعد المراجعة"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
            {tab === "account" && (
              <section className="paper-card mx-auto max-w-2xl rounded-[2rem] p-6 sm:p-9">
                <p className="eyebrow text-rust">بياناتك تحت تحكمك</p>
                <h2 className="display-heading mt-2 text-3xl">
                  إعدادات الحساب.
                </h2>
                <p className="mt-3 text-sm leading-7 text-ink/60">
                  {session.account.isAnonymous
                    ? "بتستخدم جلسة ضيف مرتبطة بالمتصفح ده فقط."
                    : session.account.googleLinked
                      ? "حسابك مرتبط بـ Google وتقدر ترجعله من جهاز تاني."
                      : "أنت داخل بحساب موثّق، وتقدر تربطه بـ Google من غير ما رصيدك يتغيّر."}
                </p>
                {session.account.email && (
                  <p className="mt-5 rounded-xl bg-sage/50 p-3 text-sm">
                    البريد المرتبط:{" "}
                    <span
                      dir="ltr"
                      className="inline-block break-all font-bold"
                    >
                      {session.account.email}
                    </span>
                  </p>
                )}
                <form onSubmit={saveAccount} className="mt-7 space-y-5">
                  <label className="block text-sm font-bold">
                    الاسم المعروض
                    <input
                      required
                      minLength={2}
                      maxLength={80}
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="field mt-2"
                    />
                  </label>
                  <label className="block text-sm font-bold">
                    رقم تواصل اختياري
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      pattern="[+]?[0-9]{8,15}"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      className="field mt-2"
                    />
                  </label>
                  <p className="text-xs leading-6 text-ink/50">
                    رقم التواصل خاص بك، مش موثّق، ومش وسيلة للدخول أو لإثبات
                    الزيارة.
                  </p>
                  <button disabled={busy} className="action-primary">
                    حفظ التغييرات
                  </button>
                </form>
                {!session.account.googleLinked && (
                  <div className="mt-9 border-t border-forest/15 pt-7">
                    <h3 className="text-lg font-bold">خلي حسابك معاك.</h3>
                    <button
                      type="button"
                      onClick={google}
                      disabled={busy}
                      className="action-secondary mt-4 w-full"
                    >
                      ربط الحساب بـ Google
                    </button>
                    {session.account.isAnonymous && (
                      <p className="mt-3 text-xs leading-7 text-amber-900">
                        الربط يحافظ على هوية الضيف وصوره وزياراته. لو Google
                        مرتبط بحساب مختلف، مش هننقل بياناتك تلقائيًا.{" "}
                        {session.account.hasSavedData
                          ? "احتفظ بجلسة الضيف واطلب مساعدة الدعم."
                          : "لو لسه مفيش بيانات، تقدر تخرج وتدخل بحساب Google موجود."}
                      </p>
                    )}
                  </div>
                )}
                {session.account.isAnonymous &&
                  session.account.hasSavedData && (
                    <p className="mt-6 rounded-xl bg-[#fff3e8] p-4 text-xs leading-7 text-amber-900">
                      اربط هذا الضيف بـ Google قبل فقدان جلسته؛ لا يمكن استعادة
                      الصور والرصيد من جهاز آخر بدون ربط.
                    </p>
                  )}
                <button
                  type="button"
                  onClick={signOut}
                  disabled={
                    busy ||
                    (session.account.hasSavedData &&
                      (session.account.isAnonymous ||
                        (!session.account.googleLinked &&
                          !session.account.email)))
                  }
                  className="mt-8 text-sm font-bold text-rust underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  تسجيل الخروج من هذا الجهاز
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
