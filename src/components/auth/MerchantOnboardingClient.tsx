"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

export function MerchantOnboardingClient({ email }: { email: string | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const businessSlug = slugify(slug || name);
      if (name.trim().length < 2 || businessSlug.length < 3) {
        throw new Error(
          "اكتب اسم المنشأة ورابطًا إنجليزيًا من 3 أحرف على الأقل.",
        );
      }
      const response = await fetch("/api/v1/merchant/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: businessSlug }),
      });
      if (!response.ok) {
        if (response.status === 409)
          throw new Error("الرابط مستخدم بالفعل. جرّب رابطًا مختلفًا.");
        if (response.status === 401)
          throw new Error("انتهت جلسة الدخول. سجّل الدخول من جديد.");
        throw new Error("تعذر إنشاء المنشأة الآن. حاول مرة أخرى.");
      }
      router.replace("/dashboard");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر إنشاء المنشأة");
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setNotice("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.replace("/login");
    } catch {
      setNotice("تعذر تسجيل الخروج. حاول مرة أخرى.");
      setBusy(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="grid min-h-screen grid-cols-1 bg-paper text-ink lg:grid-cols-[1fr_1fr]"
    >
      <section className="flex flex-col justify-center px-5 py-10 sm:px-12 lg:px-18">
        <Link href="/" className="mb-12 flex w-fit items-center gap-3">
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
          <p className="eyebrow text-rust">خطوة واحدة وتبدأ</p>
          <h1 className="display-heading mt-3 text-4xl sm:text-5xl">
            حسابك جاهز.
            <br />
            سمّي مكانك.
          </h1>
          <p className="mt-5 text-sm leading-8 text-ink/60">
            تم الدخول بحساب Google بنجاح. اختر اسم المنشأة ورابطها؛ لن ننشئ
            بيانات منشأة افتراضية باسم حسابك الشخصي.
          </p>
          {email && (
            <p className="mt-4 text-xs text-ink/55">
              الحساب المتصل:{" "}
              <span dir="ltr" className="inline-block break-all font-bold">
                {email}
              </span>
            </p>
          )}
          {notice && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-rust/25 bg-[#fff2e9] p-4 text-sm text-rust"
            >
              {notice}
            </p>
          )}
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-sm font-bold">
              اسم المنشأة
              <input
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
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
                onChange={(event) => setSlug(slugify(event.target.value))}
                placeholder="my-cafe"
                className="field mt-2"
              />
              <span className="mt-2 block text-xs font-normal leading-6 text-ink/55">
                حروف إنجليزية صغيرة وأرقام وشرطة فقط · رابط ثابت لضيوفك.
              </span>
            </label>
            <button disabled={busy} className="action-primary w-full">
              {busy ? "جارٍ إنشاء المنشأة…" : "إنشاء منشأتي"}{" "}
              <span aria-hidden="true">↖</span>
            </button>
          </form>
          <button
            type="button"
            disabled={busy}
            onClick={signOut}
            className="mt-7 text-sm font-bold text-ink/55 underline underline-offset-4 disabled:opacity-50"
          >
            ده مش حسابي؟ تسجيل الخروج
          </button>
        </div>
      </section>
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-forest p-12 text-white lg:flex xl:p-18">
        <span
          aria-hidden="true"
          className="absolute -left-20 -top-28 text-[28rem] text-white/5"
        >
          ✳
        </span>
        <div className="relative">
          <p className="eyebrow text-[#f3c178]">من أول زيارة لأجمل عادة</p>
          <h2 className="display-heading mt-5 text-5xl leading-[1.28]">
            اسم المكان هو أول ذكرى.
          </h2>
          <p className="mt-6 max-w-md leading-9 text-white/65">
            بعد إنشاء المنشأة تقدر تضبط مكافأة، تطلع QR للفرع، وتأكد زيارات
            ضيوفك من محطة الموظف.
          </p>
        </div>
        <div className="relative rounded-[1.75rem] border border-white/15 bg-white/10 p-7">
          <p className="eyebrow text-[#f3c178]">الخطوة التالية</p>
          <p className="mt-3 text-lg font-bold">
            منشأة حقيقية. فروع حقيقية. زيارات مؤكدة.
          </p>
        </div>
      </aside>
    </main>
  );
}
