"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { WalletConnectorsPanel } from '@/components/admin/WalletConnectorsPanel';

type AdminOverview = {
  organizationCount: number;
  branchCount: number;
  billingEnabled: boolean;
  organizations: {
    id: string;
    name: string;
    slug: string;
    status: string;
    created_at: string;
  }[];
};

export default function AdminPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/v1/admin/overview", {
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "تعذر تحميل الإدارة");
    setData(body);
    setError("");
  }, []);
  useEffect(() => {
    const timer = setTimeout(
      () => load().catch((issue) => setError(issue.message)),
      0,
    );
    return () => clearTimeout(timer);
  }, [load]);
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-paper px-5 py-9 text-ink md:px-10 md:py-14"
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-forest/10 pb-7">
          <div>
            <p className="eyebrow text-rust">إدارة المنصة / اتصالات المنشآت</p>
            <h1 className="display-heading mt-3 text-3xl sm:text-4xl">
              منشآت Café Memories.
            </h1>
            <p className="mt-3 text-sm text-ink/55">
              بيانات حقيقية للمنشآت والفروع؛ لا فوترة مفترضة.
            </p>
          </div>
          <Link href="/dashboard" className="action-secondary text-sm">
            لوحة المنشأة <span aria-hidden="true">↖</span>
          </Link>
        </header>
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rust/25 bg-[#fff2e9] p-5 text-sm text-rust"
          >
            {error}{" "}
            <button
              onClick={() => load().catch((issue) => setError(issue.message))}
              className="mr-3 font-bold underline"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        {!data && !error && (
          <p
            role="status"
            className="paper-card rounded-2xl p-6 text-sm text-ink/60"
          >
            جارٍ تحميل بيانات المنصة…
          </p>
        )}
        {data && (
          <>
            <section
              aria-label="ملخص المنصة"
              className="grid grid-cols-2 gap-4"
            >
              <div className="paper-card rounded-[1.5rem] p-6">
                <span aria-hidden="true" className="text-2xl text-rust">
                  ✳
                </span>
                <p className="mt-3 text-sm text-ink/55">المنشآت</p>
                <strong className="mt-2 block text-4xl">
                  {data.organizationCount}
                </strong>
              </div>
              <div className="paper-card rounded-[1.5rem] p-6">
                <span aria-hidden="true" className="text-2xl text-rust">
                  ⌁
                </span>
                <p className="mt-3 text-sm text-ink/55">الفروع</p>
                <strong className="mt-2 block text-4xl">
                  {data.branchCount}
                </strong>
              </div>
            </section>
            <p className="rounded-xl bg-sage/60 p-4 text-xs leading-7 text-forest">
              الفوترة غير مفعّلة في النسخة الحالية. لن نعرض إيرادات أو اشتراكات
              تخمينية.
            </p>
            <section className="paper-card rounded-[1.75rem] p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow text-rust">السجل الفعلي</p>
                  <h2 className="mt-2 text-xl font-bold">أحدث المنشآت</h2>
                </div>
                <span aria-hidden="true" className="text-2xl text-rust">
                  ✳
                </span>
              </div>
              {data.organizations.length === 0 ? (
                <p className="mt-7 text-sm text-ink/55">
                  لسه مفيش منشآت مسجّلة.
                </p>
              ) : (
                <div className="mt-5 divide-y divide-forest/10">
                  {data.organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm"
                    >
                      <div>
                        <p className="font-bold">{org.name}</p>
                        <p dir="ltr" className="mt-1 text-xs text-ink/50">
                          {org.slug}
                        </p>
                      </div>
                      <span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-forest">
                        {org.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <WalletConnectorsPanel />
          </>
        )}
      </div>
    </main>
  );
}
