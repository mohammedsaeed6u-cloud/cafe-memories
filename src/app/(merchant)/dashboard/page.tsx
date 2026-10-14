"use client";
/* eslint-disable @next/next/no-img-element -- Private media proxy needs request-time membership checks. */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BranchQr } from "@/components/dashboard/BranchQr";
import { MerchantNav } from "@/components/dashboard/MerchantNav";

type Branch = { id: string; name: string; slug: string };
type Rule = { id: string; name: string; threshold: number };
type Screen = {
  id: string;
  name: string;
  branch_id: string;
  status: string;
  last_heartbeat_at: string | null;
};
type QrCode = { slug: string; branch_id: string };
type MerchantContext = {
  organization: { id: string; name: string; slug: string };
  role: string;
  organizationWide: boolean;
  branches: Branch[];
  rules: Rule[];
  screens: Screen[];
  qrCodes: QrCode[];
};
type Memory = {
  id: string;
  caption: string | null;
  status: string;
  visibility: string;
  customers: { display_name: string | null } | null;
  imageUrl: string;
};
type Overview = {
  today: {
    visits: number;
    uniqueCustomers: number;
    newMemories: number;
    rewardsRedeemed: number;
  };
  attentionCenter: { pendingMemories: number; offlineScreens: number };
  liveWall: { onlineScreens: number; totalScreens: number };
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "تعذر جلب البيانات");
  return body as T;
}

export default function MerchantDashboard() {
  const loadId = useRef(0);
  const [context, setContext] = useState<MerchantContext | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [branchId, setBranchId] = useState("");
  const [ruleName, setRuleName] = useState("مشروب مجاني");
  const [threshold, setThreshold] = useState(5);
  const [screenName, setScreenName] = useState("شاشة الصالة");
  const [pairCode, setPairCode] = useState<{
    code: string;
    expiresAt: string;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const requestId = ++loadId.current;
    const info = await getJson<MerchantContext>("/api/v1/merchant/context");
    const selectedBranch = info.branches.some(
      (branch) => branch.id === branchId,
    )
      ? branchId
      : info.branches[0]?.id || "";
    const query = new URLSearchParams({ organizationId: info.organization.id });
    if (selectedBranch) query.set("branchId", selectedBranch);
    const [stats, feed] = await Promise.all([
      getJson<Overview>(`/api/v1/analytics/overview?${query}`),
      getJson<{ memories: Memory[] }>(
        `/api/v1/memories?${query}&status=pending`,
      ),
    ]);
    if (requestId !== loadId.current) return; // A newer branch selection owns the screen.
    setContext(info);
    setBranchId(selectedBranch);
    setOverview(stats);
    setMemories(feed.memories);
    if (info.rules[0]) {
      setRuleName(info.rules[0].name);
      setThreshold(info.rules[0].threshold);
    }
  }, [branchId]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => load().catch((error) => setNotice(error.message)),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setNotice("");
    try {
      await action();
      setNotice(success);
      try {
        await load();
      } catch {
        setNotice(
          `${success}، لكن تعذر تحديث اللوحة. اضغط تحديث للمحاولة مجددًا.`,
        );
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  async function post(path: string, payload: object) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "تعذر الحفظ");
    return body;
  }

  async function moderate(memoryId: string, status: "approved" | "rejected") {
    await run(
      async () => {
        const response = await fetch("/api/v1/memories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memoryId, status }),
        });
        if (!response.ok) throw new Error((await response.json()).error);
      },
      status === "approved" ? "تمت الموافقة" : "تم الرفض",
    );
  }

  async function copyBranchLink(slug: string) {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/go/${slug}`,
      );
      setNotice("تم نسخ رابط الفرع.");
    } catch {
      setNotice("تعذر النسخ التلقائي؛ استخدم الرابط الظاهر لنسخه يدويًا.");
    }
  }

  if (!context)
    return (
      <main dir="rtl" className="min-h-screen bg-paper px-5 py-14 text-ink">
        <div className="paper-card mx-auto max-w-xl rounded-[2rem] p-8">
          <span aria-hidden="true" className="text-3xl text-rust">
            ✳
          </span>
          <h1 className="display-heading mt-4 text-3xl">لوحة المنشأة.</h1>
          <p role="status" className="mt-4 text-sm leading-7 text-ink/60">
            {notice || "جارٍ تحميل بيانات منشأتك الحقيقية…"}
          </p>
          {notice && (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setNotice("");
                  load().catch((error) => setNotice(error.message));
                }}
                className="action-primary"
              >
                إعادة المحاولة
              </button>
              <Link href="/login" className="action-secondary">
                تسجيل الدخول
              </Link>
            </div>
          )}
        </div>
      </main>
    );

  const canManage = context.role !== "staff";
  const currentBranch = context.branches.find(
    (branch) => branch.id === branchId,
  );
  const currentQr = context.qrCodes.find((qr) => qr.branch_id === branchId);
  const currentScreens = context.screens.filter(
    (screen) => screen.branch_id === branchId,
  );
  const metrics = [
    {
      label: "زيارات مؤكدة اليوم",
      value: overview?.today.visits,
      icon: "✳",
      color: "bg-sage",
    },
    {
      label: "ضيوف فريدون",
      value: overview?.today.uniqueCustomers,
      icon: "◉",
      color: "bg-[#f4e5cf]",
    },
    {
      label: "ذكريات جديدة",
      value: overview?.today.newMemories,
      icon: "▧",
      color: "bg-[#eeddd3]",
    },
    {
      label: "مكافآت مصروفة",
      value: overview?.today.rewardsRedeemed,
      icon: "✦",
      color: "bg-[#dce9e5]",
    },
  ];
  return (
    <main dir="rtl" className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[245px_minmax(0,1fr)]">
        <MerchantNav
          organizationName={context.organization.name}
          active="dashboard"
          role={context.role}
          organizationWide={context.organizationWide}
        />
        <div className="min-w-0 space-y-8 px-5 py-8 md:px-9 md:py-11 xl:px-12">
          <header className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow text-rust">نظرة عامة / اليوم</p>
              <h1 className="display-heading mt-2 text-3xl sm:text-4xl">
                أهلًا في {context.organization.name}.
              </h1>
              <p className="mt-3 text-sm text-ink/55">
                أرقام فعلية من الزيارات المؤكدة والصور ومكافآت منشأتك.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  load().catch((error) => setNotice(error.message))
                }
                className="action-secondary text-sm"
              >
                ↻ &nbsp; تحديث
              </button>
              <Link href="/terminal" className="action-primary text-sm">
                محطة الموظف <span aria-hidden="true">↖</span>
              </Link>
            </div>
          </header>
          {context.branches.length > 1 && (
            <label className="block max-w-xs text-xs font-bold text-ink/65">
              الفرع المعروض
              <select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setOverview(null);
                  setMemories([]);
                  setPairCode(null);
                  setNotice("");
                }}
                className="field mt-2 text-sm"
              >
                {context.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {notice && (
            <p
              role="status"
              className="rounded-xl border border-rust/25 bg-[#fff2e9] p-4 text-sm leading-7 text-[#8a3e2e]"
            >
              {notice}
            </p>
          )}
          <section
            aria-label="مؤشرات اليوم"
            className="grid grid-cols-2 gap-3 xl:grid-cols-4"
          >
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="paper-card min-h-37 rounded-[1.5rem] p-5"
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl text-xl text-forest ${metric.color}`}
                  aria-hidden="true"
                >
                  {metric.icon}
                </div>
                <p className="mt-5 text-xs text-ink/55">{metric.label}</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  {metric.value ?? "—"}
                </p>
              </div>
            ))}
          </section>
          <div className="grid items-start gap-6 xl:grid-cols-[1.05fr_.95fr]">
            <section className="paper-card rounded-[1.75rem] p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="eyebrow text-rust">تحتاج اهتمامك</p>
                  <h2 className="mt-2 text-xl font-bold">
                    الذكريات بانتظار المراجعة
                  </h2>
                </div>
                <span className="rounded-full bg-[#f7e7d9] px-3 py-1.5 text-xs font-bold text-rust">
                  {overview?.attentionCenter.pendingMemories ?? "—"} معلّقة
                </span>
              </div>
              <p className="mt-3 text-xs leading-6 text-ink/55">
                هنا تظهر فقط الصور التي اختار أصحابها تقديمها لشاشة الفرع. الصور الخاصة لا يراها الفريق أصلًا؛ وبعد موافقة الضيف تظل المراجعة مطلوبة قبل العرض.
              </p>
              {memories.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-forest/20 bg-sage/20 p-8 text-center">
                  <span aria-hidden="true" className="text-3xl text-forest/45">
                    ✳
                  </span>
                  <p className="mt-2 text-sm text-ink/60">
                    {overview
                      ? "مفيش ذكريات معلّقة في الفرع ده حاليًا."
                      : "جارٍ تحديث القائمة…"}
                  </p>
                </div>
              )}
              <div className="mt-5 divide-y divide-forest/10">
                {memories.map((memory) => (
                  <article key={memory.id} className="flex gap-4 py-4">
                    <img
                      src={memory.imageUrl}
                      alt="ذكرى بانتظار المراجعة"
                      className="h-22 w-22 shrink-0 rounded-xl bg-sand object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">
                        {memory.customers?.display_name || "ضيف"}
                      </p>
                      <p className="mt-1 break-words text-xs leading-6 text-ink/60">
                        {memory.caption || "بدون تعليق"}
                      </p>
                      <p className="mt-2 text-[11px] text-ink/45">
                        {memory.visibility === "live_wall"
                          ? "طلب العرض على الشاشة بعد المراجعة"
                          : "ذكرى خاصة"}
                      </p>
                      {canManage && (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => moderate(memory.id, "approved")}
                            className="rounded-full bg-forest px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                          >
                            قبول
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => moderate(memory.id, "rejected")}
                            className="rounded-full border border-ink/20 px-4 py-1.5 text-xs font-bold disabled:opacity-50"
                          >
                            رفض
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <div className="space-y-6">
              <section className="rounded-[1.75rem] bg-forest p-6 text-white sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="eyebrow text-[#f2c77f]">برنامج الولاء</p>
                    <h2 className="mt-2 text-xl font-bold">
                      مكافأة تستاهل الرجوع.
                    </h2>
                  </div>
                  <span aria-hidden="true" className="text-3xl text-[#f2c77f]">
                    ✳
                  </span>
                </div>
                <p className="mt-3 text-xs leading-6 text-white/60">
                  الزيارة تتطلب تأكيد موظف لعملية الشراء. تغيير القاعدة متاح
                  لصاحب المنشأة أو المدير المخوّل.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (canManage && context.organizationWide)
                      run(
                        () =>
                          post("/api/v1/merchant/rewards", {
                            name: ruleName.trim(),
                            threshold,
                          }),
                        "تم حفظ قاعدة المكافأة",
                      );
                  }}
                  className="mt-6 space-y-4 text-sm"
                >
                  <label className="block font-bold">
                    اسم المكافأة
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/25 bg-white/10 p-3 text-white outline-none focus:border-[#f2c77f]"
                    />
                  </label>
                  <label className="block font-bold">
                    عدد الزيارات المطلوبة
                    <input
                      required
                      type="number"
                      min="2"
                      max="30"
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="mt-2 block w-28 rounded-xl border border-white/25 bg-white/10 p-3 text-white outline-none focus:border-[#f2c77f]"
                    />
                  </label>
                  {canManage && context.organizationWide && (
                    <button
                      disabled={busy}
                      className="min-h-11 rounded-full bg-[#f2c77f] px-6 text-sm font-bold text-forest transition hover:bg-white disabled:opacity-50"
                    >
                      حفظ المكافأة
                    </button>
                  )}
                  {!context.organizationWide && (
                    <p className="text-xs text-white/55">
                      تعديل المكافأة متاح لصلاحيات المنشأة، وليس لموظف الفرع
                      فقط.
                    </p>
                  )}
                </form>
              </section>
              <section className="paper-card rounded-[1.75rem] p-6 sm:p-7">
                <p className="eyebrow text-rust">بداية الرحلة</p>
                <h2 className="mt-2 text-xl font-bold">
                  رابط الفرع · {currentBranch?.name ?? "لا يوجد فرع"}
                </h2>
                <p className="mt-2 text-xs leading-6 text-ink/55">
                  ضع الرمز على الطاولة ليفتح الضيف بطاقته. مسحه وحده لا يسجل
                  زيارة.
                </p>
                {currentQr ? (
                  <div className="mt-5 flex flex-wrap items-center gap-5">
                    <BranchQr slug={currentQr.slug} />
                    <div className="min-w-0 flex-1 space-y-3">
                      <a
                        href={`/go/${currentQr.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block break-all text-xs font-bold text-rust underline underline-offset-4"
                      >
                        /go/{currentQr.slug} ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => copyBranchLink(currentQr.slug)}
                        className="action-secondary text-xs"
                      >
                        نسخ الرابط
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 rounded-xl bg-sand/40 p-4 text-xs text-ink/60">
                    لسه مفيش رمز QR للفرع ده.
                  </p>
                )}
                {!currentQr && canManage && branchId && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          post("/api/v1/merchant/qr", {
                            branchId,
                            source: "table",
                          }),
                        "اتعمل رابط الفرع",
                      )
                    }
                    className="action-primary mt-4 text-sm"
                  >
                    إنشاء رابط QR
                  </button>
                )}
              </section>
            </div>
          </div>
          <section className="paper-card rounded-[1.75rem] p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow text-rust">من الفرع للشاشة</p>
                <h2 className="mt-2 text-xl font-bold">شاشات الصالة</h2>
                <p className="mt-2 text-xs text-ink/55">
                  الصور لا تظهر إلا بعد المراجعة وموافقة الضيف، وتتوقف عند
                  انقطاع الاتصال.
                </p>
              </div>
              <span className="rounded-full bg-sage px-4 py-2 text-xs font-bold text-forest">
                {overview?.liveWall.onlineScreens ?? "—"} /{" "}
                {overview?.liveWall.totalScreens ?? "—"} متصلة
              </span>
            </div>
            {currentScreens.length === 0 && (
              <p className="mt-6 rounded-xl bg-sand/40 p-5 text-sm text-ink/60">
                لسه مفيش شاشة مرتبطة بالفرع ده.
              </p>
            )}
            <div className="mt-5 divide-y divide-forest/10">
              {currentScreens.map((screen) => (
                <div
                  key={screen.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
                >
                  <div>
                    <p className="font-bold">{screen.name}</p>
                    <p className="mt-1 text-xs text-ink/50">
                      {screen.status === "online" ? "● متصلة" : "○ غير متصلة"}
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-bold">
                    <Link
                      href={`/wall/${screen.id}`}
                      className="text-forest underline underline-offset-4"
                    >
                      فتح الشاشة
                    </Link>
                    {canManage && (
                      <button
                        type="button"
                        disabled={busy}
                        className="text-rust underline underline-offset-4 disabled:opacity-50"
                        onClick={() =>
                          run(async () => {
                            const response = await fetch(
                              `/api/v1/screens/${screen.id}`,
                              { method: "DELETE" },
                            );
                            if (!response.ok)
                              throw new Error((await response.json()).error);
                          }, "تم فصل الشاشة")
                        }
                      >
                        فصل
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {canManage && branchId && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-forest/10 pt-5">
                <input
                  value={screenName}
                  maxLength={80}
                  onChange={(e) => setScreenName(e.target.value)}
                  className="field min-w-40 flex-1 text-sm"
                  aria-label="اسم الشاشة الجديدة"
                />
                <button
                  type="button"
                  disabled={busy || !screenName.trim()}
                  onClick={() =>
                    run(async () => {
                      const result = await post(
                        "/api/v1/screens/pairing-code",
                        { branchId, screenName: screenName.trim() },
                      );
                      setPairCode(result);
                    }, "رمز الاقتران جاهز لمدة 10 دقائق")
                  }
                  className="action-primary text-sm"
                >
                  إنشاء رمز اقتران
                </button>
              </div>
            )}
            {pairCode && (
              <div role="status" className="mt-5 rounded-2xl bg-sage/60 p-5">
                <p className="text-xs text-ink/65">
                  أدخل الرمز في{" "}
                  <Link href="/wall" className="font-bold text-rust underline">
                    صفحة الشاشة
                  </Link>{" "}
                  قبل انتهاء صلاحيته.
                </p>
                <p
                  className="mt-2 select-all text-3xl font-bold tracking-widest text-forest"
                  dir="ltr"
                >
                  {pairCode.code}
                </p>
                <p className="mt-2 text-xs text-ink/55">
                  ينتهي:{" "}
                  {new Date(pairCode.expiresAt).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
