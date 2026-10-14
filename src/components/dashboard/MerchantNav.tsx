"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const roleLabels: Record<string, string> = {
  owner: "مالك",
  admin: "مشرف",
  manager: "مدير",
  staff: "موظف",
};

export function MerchantNav({
  organizationName,
  active,
  role,
}: {
  organizationName: string;
  active: "dashboard" | "terminal";
  role?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  async function signOut() {
    setLeaving(true);
    setError("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.replace("/login");
    } catch {
      setError("تعذر تسجيل الخروج. حاول مرة أخرى.");
      setLeaving(false);
    }
  }
  const links = [
    { href: "/dashboard", name: "لوحة التحكم", icon: "▦", key: "dashboard" },
    { href: "/terminal", name: "محطة الموظف", icon: "✳", key: "terminal" },
  ] as const;
  return (
    <aside className="flex flex-col justify-between gap-5 bg-forest px-5 py-5 text-white lg:sticky lg:top-0 lg:h-screen lg:min-h-screen lg:px-6 lg:py-9">
      <div>
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-3"
          aria-label="Café Memories - لوحة التحكم"
        >
          <span
            aria-hidden="true"
            className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#f4cf97] text-2xl text-forest"
          >
            ✳
          </span>
          <span dir="ltr" className="text-lg font-bold">
            café<span className="text-[#edbc87]">memories</span>
          </span>
        </Link>
        <div className="mt-7 hidden border-t border-white/15 pt-7 lg:block">
          <p className="eyebrow text-[#efc68e]">مساحة المنشأة</p>
          <p className="mt-2 line-clamp-2 text-xl font-bold">
            {organizationName}
          </p>
          {role && (
            <p className="mt-1 text-xs text-white/50">
              الصلاحية: {roleLabels[role] ?? role}
            </p>
          )}
        </div>
        <nav
          aria-label="تنقل المنشأة"
          className="mt-5 flex gap-2 overflow-x-auto lg:mt-9 lg:flex-col"
        >
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              aria-current={active === link.key ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${active === link.key ? "bg-white text-forest" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              <span aria-hidden="true" className="text-lg">
                {link.icon}
              </span>
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="hidden border-t border-white/15 pt-5 lg:block">
        <p className="mb-4 text-xs leading-6 text-white/50">
          كل ختم يحتاج زيارة يؤكدها موظف، مش مجرد مسح رمز.
        </p>
        <button
          type="button"
          disabled={leaving}
          onClick={signOut}
          className="text-sm font-bold text-white/75 underline underline-offset-4 transition hover:text-white disabled:opacity-50"
        >
          {leaving ? "جارٍ الخروج…" : "تسجيل الخروج"}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-xs text-[#f4cf97]">
            {error}
          </p>
        )}
      </div>
      <div className="lg:hidden">
        <button
          type="button"
          disabled={leaving}
          onClick={signOut}
          className="text-xs text-white/70 underline underline-offset-4"
        >
          {leaving ? "جارٍ الخروج…" : "تسجيل الخروج"}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-xs text-[#f4cf97]">
            {error}
          </p>
        )}
      </div>
    </aside>
  );
}
