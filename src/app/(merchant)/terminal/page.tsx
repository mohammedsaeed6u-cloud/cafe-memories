"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MerchantNav } from "@/components/dashboard/MerchantNav";

type Branch = { id: string; name: string };
type Context = { organization: { name: string }; branches: Branch[] };
type Customer = {
  customer: { id: string; displayName: string };
  verifiedVisits: number;
  rule: { id: string; name: string; threshold: number } | null;
  availableRewards: number;
  nextRewardName: string | null;
};

export default function StaffTerminalPage() {
  const [context, setContext] = useState<Context | null>(null);
  const [branchId, setBranchId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [purchaseConfirmed, setPurchaseConfirmed] = useState(false);
  const [rewardDelivered, setRewardDelivered] = useState(false);
  const visitKey = useRef<string | null>(null);
  const rewardKey = useRef<string | null>(null);

  const loadContext = useCallback(async () => {
    const response = await fetch("/api/v1/merchant/context", {
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok)
      throw new Error(body.error ?? "تعذر تحميل بيانات المنشأة");
    setContext(body);
    setBranchId(body.branches[0]?.id ?? "");
    setNotice("");
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () =>
        loadContext().catch((error) =>
          setNotice(error instanceof Error ? error.message : "تعذر الاتصال"),
        ),
      0,
    );
    return () => clearTimeout(timer);
  }, [loadContext]);

  async function lookup(id: string): Promise<boolean> {
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch(
        `/api/v1/merchant/customer?customerId=${encodeURIComponent(id)}&branchId=${branchId}`,
        { cache: "no-store" },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setCustomer(body);
      return true;
    } catch (error) {
      setCustomer(null);
      setNotice(error instanceof Error ? error.message : "تعذر البحث");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function transact(
    path: string,
    payload: object,
    key: React.RefObject<string | null>,
    success: string,
  ) {
    if (!customer) return;
    setBusy(true);
    setNotice("");
    key.current ??= crypto.randomUUID();
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.customer.id,
          branchId,
          idempotencyKey: key.current,
          ...payload,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر إتمام العملية");
      key.current = null;
      if (path === "/api/v1/visits") setPurchaseConfirmed(false);
      else setRewardDelivered(false);
      const refreshed = await lookup(customer.customer.id);
      setNotice(
        refreshed
          ? success
          : `${success}، لكن تعذر تحديث بيانات الضيف. ابحث عنه من جديد.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر إتمام العملية");
    } finally {
      setBusy(false);
    }
  }

  function clearCustomer() {
    setCustomer(null);
    setPurchaseConfirmed(false);
    setRewardDelivered(false);
    visitKey.current = null;
    rewardKey.current = null;
  }

  async function pasteCustomerId() {
    try {
      setCustomerId((await navigator.clipboard.readText()).trim());
      clearCustomer();
      setNotice("تم لصق المعرّف. اضغط بحث للتحقق منه.");
    } catch {
      setNotice(
        "تعذر قراءة الحافظة. اطلب من الضيف نسخ المعرّف ثم الصقه يدويًا.",
      );
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[245px_minmax(0,1fr)]">
        <MerchantNav
          organizationName={context?.organization.name ?? "مساحة المنشأة"}
          active="terminal"
        />
        <div className="min-w-0 px-5 py-8 md:px-9 md:py-11 xl:px-12">
          <div className="mx-auto max-w-4xl space-y-8">
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-rust">
                  المكان اللي الزيارات بتتحسب فيه
                </p>
                <h1 className="display-heading mt-2 text-3xl sm:text-4xl">
                  محطة الموظف.
                </h1>
                <p className="mt-3 text-sm leading-7 text-ink/55">
                  تأكيد شراء حقيقي، ثم ختم أو صرف مكافأة. المعرف وحده لا يمنح
                  ختمًا.
                </p>
              </div>
              <Link href="/dashboard" className="action-secondary text-sm">
                لوحة التحكم <span aria-hidden="true">↖</span>
              </Link>
            </header>
            {notice && (
              <p
                role="status"
                className="rounded-xl border border-rust/25 bg-[#fff2e9] p-4 text-sm leading-7 text-[#8a3e2e]"
              >
                {notice}
              </p>
            )}
            {!context && (
              <div className="paper-card rounded-[1.75rem] p-7">
                <p className="text-sm text-ink/60">
                  {notice
                    ? "تعذر تحميل بيانات المنشأة."
                    : "جارٍ تحميل بيانات المنشأة الحقيقية…"}
                </p>
                {notice && (
                  <button
                    className="action-primary mt-5"
                    onClick={() =>
                      loadContext().catch((error) => setNotice(error.message))
                    }
                  >
                    إعادة المحاولة
                  </button>
                )}
              </div>
            )}
            {context && (
              <>
                <section className="paper-card rounded-[1.75rem] p-6 sm:p-8">
                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage text-xl text-forest"
                    >
                      01
                    </span>
                    <div>
                      <p className="eyebrow text-rust">تعريف الضيف</p>
                      <h2 className="text-xl font-bold">
                        اطلب المعرّف من بطاقته.
                      </h2>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-8 text-ink/60">
                    يفتح الضيف صفحة الفرع من رمز QR ويعرض معرّفه. طلب الحضور
                    صالح لساعتين، لكن عليك أنت التحقق من حصول شراء فعلي؛ الرابط
                    أو الصورة ليسا إثبات شراء.
                  </p>
                  {context.branches.length > 1 && (
                    <label className="mt-6 block text-sm font-bold">
                      الفرع
                      <select
                        value={branchId}
                        onChange={(e) => {
                          setBranchId(e.target.value);
                          clearCustomer();
                        }}
                        className="field mt-2"
                      >
                        {context.branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {context.branches.length === 0 && (
                    <p className="mt-5 rounded-xl bg-[#fff2e9] p-4 text-sm text-rust">
                      لا يوجد فرع نشط لهذا الحساب. تواصل مع مسؤول المنشأة.
                    </p>
                  )}
                  <form
                    className="mt-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      clearCustomer();
                      lookup(customerId.trim());
                    }}
                  >
                    <label htmlFor="customer-id" className="text-sm font-bold">
                      معرّف الضيف
                    </label>
                    <div className="mt-2 space-y-2">
                      <input
                        id="customer-id"
                        required
                        pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                        title="المعرّف 36 حرفًا مفصولًا بشرطات"
                        value={customerId}
                        onChange={(e) => {
                          setCustomerId(e.target.value);
                          clearCustomer();
                        }}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        dir="ltr"
                        autoComplete="off"
                        className="field w-full text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={pasteCustomerId}
                          className="action-secondary flex-1 text-sm"
                        >
                          لصق المعرّف
                        </button>
                        <button
                          disabled={busy || !branchId}
                          className="action-primary flex-1 text-sm"
                        >
                          {busy ? "جارٍ البحث…" : "بحث عن الضيف"}
                        </button>
                      </div>
                    </div>
                  </form>
                </section>
                {customer ? (
                  <section className="paper-card rounded-[1.75rem] p-6 sm:p-8">
                    <div className="flex items-center gap-4">
                      <span
                        aria-hidden="true"
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f6e7cf] text-xl text-rust"
                      >
                        02
                      </span>
                      <div>
                        <p className="eyebrow text-rust">تأكيد المعاملة</p>
                        <h2 className="text-xl font-bold">
                          {customer.customer.displayName || "الضيف"}
                        </h2>
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-sage/50 p-5">
                        <p className="text-xs text-ink/60">زيارات مؤكدة</p>
                        <p className="mt-2 text-3xl font-bold tabular-nums text-forest">
                          {customer.verifiedVisits}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#f5e6d2] p-5">
                        <p className="text-xs text-ink/60">مكافآت جاهزة</p>
                        <p className="mt-2 text-3xl font-bold tabular-nums text-rust">
                          {customer.availableRewards}
                        </p>
                      </div>
                    </div>
                    <div className="mt-7 grid gap-5 border-t border-forest/10 pt-7 sm:grid-cols-2">
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold">زيارة جديدة</h3>
                        <p className="text-xs leading-6 text-ink/60">
                          بعد تحققك من شراء فعلي فقط، يُسجّل الختم في قاعدة
                          البيانات.
                        </p>
                        <label className="flex items-start gap-2 text-xs leading-6 text-ink/70">
                          <input
                            type="checkbox"
                            checked={purchaseConfirmed}
                            onChange={(e) =>
                              setPurchaseConfirmed(e.target.checked)
                            }
                            className="mt-1.5 h-4 w-4 accent-forest"
                          />
                          تأكدت بنفسي من شراء الضيف في الفرع.
                        </label>
                        <button
                          type="button"
                          disabled={busy || !purchaseConfirmed}
                          onClick={() =>
                            transact(
                              "/api/v1/visits",
                              {},
                              visitKey,
                              "تم توثيق الزيارة. الضيف يقدر يضيف صورتها الاختيارية من موبايله لكارت الذكريات",
                            )
                          }
                          className="action-primary w-full text-sm"
                        >
                          تأكيد الشراء وإضافة ختم
                        </button>
                      </div>
                      <div className="space-y-4 sm:border-r sm:border-forest/10 sm:pr-5">
                        <h3 className="text-lg font-bold">صرف مكافأة</h3>
                        <p className="text-xs leading-6 text-ink/60">
                          {customer.rule
                            ? `${customer.nextRewardName ?? customer.rule.name} · مكافأة لزيارات موثّقة`
                            : "المنشأة لم تحدد مكافأة نشطة."}
                        </p>
                        <label className="flex items-start gap-2 text-xs leading-6 text-ink/70">
                          <input
                            type="checkbox"
                            checked={rewardDelivered}
                            onChange={(e) =>
                              setRewardDelivered(e.target.checked)
                            }
                            className="mt-1.5 h-4 w-4 accent-forest"
                          />
                          تأكدت من استحقاق المكافأة وسلّمتها، وأخبرت الضيف إن كارت صوره جاهز للطباعة من حسابه.
                        </label>
                        <button
                          type="button"
                          disabled={
                            busy ||
                            !rewardDelivered ||
                            !customer.rule ||
                            customer.availableRewards < 1
                          }
                          onClick={() =>
                            customer.rule &&
                            transact(
                              "/api/v1/rewards/redeem",
                              { rewardRuleId: customer.rule.id },
                              rewardKey,
                              "تم صرف المكافأة. افتح كارت الذكريات من حساب الضيف لطباعة نسخة في الفرع",
                            )
                          }
                          className="action-secondary w-full text-sm"
                        >
                          صرف {customer.nextRewardName ?? customer.rule?.name ?? "المكافأة"}
                        </button>
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="rounded-[1.75rem] bg-[#e4ebdf] p-6 sm:p-8">
                    <span aria-hidden="true" className="text-2xl text-rust">
                      ✳
                    </span>
                    <h2 className="mt-2 text-lg font-bold">
                      كل ضيف له تقدّم حقيقي.
                    </h2>
                    <p className="mt-2 max-w-lg text-sm leading-7 text-ink/60">
                      بعد البحث بمعرّف الضيف في الفرع الصحيح، هتشوف رصيده الفعلي
                      والخطوات المتاحة. لا توجد حسابات أو زيارات تجريبية.
                    </p>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
