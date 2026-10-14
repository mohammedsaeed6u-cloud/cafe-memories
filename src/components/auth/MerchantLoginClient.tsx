"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

export default function MerchantLoginClient({
  initialMode,
  setupError,
  configured,
}: {
  initialMode: "signup" | "signin";
  setupError: string | null;
  configured: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!configured) return;
    setBusy(true);
    setNotice("");
    try {
      const db = createClient();
      if (mode === "signup") {
        const businessSlug = slugify(slug || name);
        if (!name.trim() || businessSlug.length < 3)
          throw new Error("أدخل اسم منشأة ورابطًا صالحًا");
        const callback = new URL("/auth/callback", window.location.origin);
        callback.searchParams.set("flow", "email");
        const { data, error } = await db.auth.signUp({
          email,
          password,
          options: {
            data: { cafe_name: name.trim(), cafe_slug: businessSlug },
            emailRedirectTo: callback.toString(),
          },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice(
            "تحقق من بريدك أولًا؛ بعد التأكيد هتكمل الاسم وترفع لوجو منشأتك قبل إنشائها.",
          );
          return;
        }
        router.replace("/onboarding");
      } else {
        const { data, error } = await db.auth.signInWithPassword({
          email,
          password,
        });
        if (error || !data.user) throw error ?? new Error("فشل تسجيل الدخول");
        const { data: member, error: membershipError } = await db.from("organization_members")
          .select("id").eq("user_id", data.user.id).limit(1).maybeSingle();
        if (membershipError) throw membershipError;
        router.replace(member ? "/dashboard" : "/onboarding");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!configured) return;
    setBusy(true);
    setNotice("");
    try {
      const intent = await fetch("/api/v1/merchant/oauth/intent", {
        method: "POST",
      });
      if (!intent.ok) throw new Error("تعذر بدء دخول Google. حاول مرة أخرى.");
      const { nonce } = await intent.json();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("flow", "google");
      callback.searchParams.set("nonce", nonce);
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });
      if (error) throw error;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر تسجيل الدخول");
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-paper text-ink">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1fr_1.05fr]">
        <section className="flex flex-col justify-center px-5 py-8 sm:px-12 lg:px-18 lg:py-12">
          <Link
            href="/"
            className="mb-12 flex w-fit items-center gap-3"
            aria-label="Café Memories - الرئيسية"
          >
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-[14px] bg-forest text-2xl text-[#f3c178]"
            >
              ✳
            </span>
            <span dir="ltr" className="text-lg font-bold">
              café<span className="text-rust">memories</span>
            </span>
          </Link>
          <div className="w-full max-w-md">
            <p className="eyebrow text-rust">مساحة أصحاب الأماكن</p>
            <h1 className="display-heading mt-3 text-4xl sm:text-5xl">
              {mode === "signup" ? "خلّي ضيوفك يرجعوا." : "نورت مكانك تاني."}
            </h1>
            <p className="mt-4 text-sm leading-8 text-ink/60">
              {mode === "signup"
                ? "ابدأ حساب منشأتك واضبط أول مكافأة حقيقية. كل زيارة تتسجل بعد تأكيد فريقك."
                : "ادخل علشان تتابع الزيارات والذكريات والمكافآت من لوحة واحدة."}
            </p>
            <div
              role="group"
              aria-label="طريقة الدخول"
              className="mt-8 grid grid-cols-2 rounded-2xl bg-sand/80 p-1"
            >
              <button
                type="button"
                aria-pressed={mode === "signin"}
                className={`rounded-xl px-3 py-3 text-sm font-bold transition ${mode === "signin" ? "bg-white text-forest shadow-sm" : "text-ink/55 hover:text-ink"}`}
                onClick={() => {
                  setMode("signin");
                  setNotice("");
                }}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                aria-pressed={mode === "signup"}
                className={`rounded-xl px-3 py-3 text-sm font-bold transition ${mode === "signup" ? "bg-white text-forest shadow-sm" : "text-ink/55 hover:text-ink"}`}
                onClick={() => {
                  setMode("signup");
                  setNotice("");
                }}
              >
                منشأة جديدة
              </button>
            </div>
            {!configured && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-amber-600/30 bg-amber-50 p-4 text-sm leading-7 text-amber-900"
              >
                الحسابات الحقيقية غير متاحة حتى يُضبط مشروع Supabase. أضف
                متغيرات البيئة من <code dir="ltr">.env.example</code> ثم أعد
                تشغيل الخادم؛ لن نُنشئ حسابًا تجريبيًا.
              </p>
            )}
            {setupError && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-rust/30 bg-[#fff1ec] p-4 text-sm text-rust"
              >
                {setupError}
              </p>
            )}
            {notice && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-rust/30 bg-[#fff1ec] p-4 text-sm leading-7 text-rust"
              >
                {notice}
              </p>
            )}
            <button
              type="button"
              onClick={google}
              disabled={busy || !configured}
              className="mt-7 flex min-h-13 w-full items-center justify-center gap-3 rounded-xl border border-ink/20 bg-white px-4 py-3 text-sm font-bold transition hover:border-forest hover:bg-[#f8faf5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className="text-lg font-bold text-[#4285f4]"
              >
                G
              </span>
              {mode === "signup"
                ? "البدء بحساب Google"
                : "المتابعة بحساب Google"}
            </button>
            {mode === "signup" && (
              <p className="mt-3 text-xs leading-6 text-ink/55">
                بعد الدخول بـ Google تختار اسم المنشأة ورابطها في خطوة منفصلة.
                الحقول أدناه للتسجيل بالبريد فقط.
              </p>
            )}
            <div className="relative my-6 text-center text-xs text-ink/45">
              <span className="absolute inset-x-0 top-1/2 border-t border-ink/15" />
              <span className="relative bg-paper px-3">
                أو بالبريد الإلكتروني
              </span>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <label className="block text-sm font-bold">
                    اسم المنشأة
                    <input
                      required
                      maxLength={100}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="اسم مكانك"
                      className="field mt-2"
                    />
                  </label>
                  <label className="block text-sm font-bold">
                    رابط المنشأة
                    <input
                      required
                      dir="ltr"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="my-cafe"
                      className="field mt-2"
                    />
                  </label>
                </>
              )}
              <label className="block text-sm font-bold">
                البريد الإلكتروني
                <input
                  required
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="field mt-2"
                />
              </label>
              <label className="block text-sm font-bold">
                كلمة المرور
                <div className="relative mt-2">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    minLength={8}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field pl-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                    }
                    className="absolute inset-y-1 left-2 px-3 text-xs font-bold text-forest/65 hover:text-forest"
                  >
                    {showPassword ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                disabled={busy || !configured}
                className="action-primary mt-2 w-full"
              >
                {busy
                  ? "لحظة واحدة…"
                  : mode === "signup"
                    ? "إنشاء حساب المنشأة"
                    : "تسجيل الدخول"}{" "}
                <span aria-hidden="true">↖</span>
              </button>
            </form>
            <p className="mt-6 text-center text-xs leading-6 text-ink/50">
              بتسجيلك توافق على{" "}
              <Link href="/terms" className="font-bold text-forest underline">
                الشروط
              </Link>{" "}
              و
              <Link href="/privacy" className="font-bold text-forest underline">
                الخصوصية
              </Link>
              . لن تُحفظ كلمة مرورك في المتصفح كنظام دخول محلي.
            </p>
          </div>
        </section>
        <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-forest p-12 text-white lg:flex xl:p-18">
          <div
            aria-hidden="true"
            className="absolute -left-20 -top-30 text-[28rem] leading-none text-white/5"
          >
            ✳
          </div>
          <div className="relative">
            <p className="eyebrow text-[#f3c178]">للمكان اللي الناس بتحبه</p>
            <h2 className="display-heading mt-5 max-w-lg text-5xl leading-[1.28]">
              مشوار بسيط من أول زيارة لأجمل عادة.
            </h2>
            <p className="mt-7 max-w-md leading-9 text-white/70">
              رابط فرعك، بطاقة ولاء واضحة، ومكافأة تخلي الضيف يرجع. أنت وفريقك
              تتحكموا في كل ختم مؤكد.
            </p>
          </div>
          <div className="relative space-y-4">
            <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
              <p className="eyebrow text-[#f3c178]">01 — 02 — 03</p>
              <p className="mt-3 text-xl font-bold">
                زيارة حقيقية ← ختم موثّق ← مكافأة مستحقة
              </p>
              <p className="mt-2 text-sm text-white/60">
                من غير بيانات وهمية أو أختام بمجرد فتح الرابط.
              </p>
            </div>
            <p className="text-xs text-white/45">
              ✳ Café Memories · المصمم لضيوفك
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
