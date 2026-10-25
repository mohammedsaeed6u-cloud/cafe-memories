'use client';

import React, { useCallback, useState } from 'react';
import {
  Search,
  Loader2,
  UserRound,
  Award,
  Gift,
  Plus,
  Ticket,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
} from 'lucide-react';

interface CustomerSummary {
  id: string;
  displayName: string;
  phone?: string | null;
  totalVisits: number;
  lastVisit?: string | null;
}

interface CustomerCard {
  customer: {
    id: string;
    displayName: string;
    phone: string | null;
    createdAt: string;
  };
  loyalty: {
    stampedCount: number;
    maxSlots: number;
    completedCardsCount: number;
    totalVerifiedVisits: number;
    lastStampedAt: string | null;
    rewardName: string | null;
  };
  rewards: Array<{ id: string; name: string; threshold: number; unlockedAt: string }>;
  vouchers: Array<{ code: string; title: string; status: string; expiresAt: string | null }>;
  memories: Array<{ id: string; thumbnailUrl: string; createdAt: string }>;
}

interface CustomersTabProps {
  rewardRuleId: string | null;
  canManage: boolean;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ rewardRuleId, canManage }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selected, setSelected] = useState<CustomerSummary | null>(null);
  const [card, setCard] = useState<CustomerCard | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);

  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const loadCard = useCallback(async (customerId: string) => {
    setIsLoadingCard(true);
    setCard(null);
    try {
      const response = await fetch(`/api/v1/merchant/customers/${customerId}/card`, {
        cache: 'no-store',
      });
      const body = (await response.json().catch(() => ({}))) as {
        card?: CustomerCard;
        error?: string;
      };
      if (!response.ok || !body.card) throw new Error(body.error || 'تعذر تحميل البطاقة');
      setCard(body.card);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر تحميل البطاقة');
    } finally {
      setIsLoadingCard(false);
    }
  }, []);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    const clean = query.trim();
    if (clean.length < 2) {
      setSearchError('اكتب حرفين على الأقل للبحث');
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    setActionError(null);
    setSelected(null);
    setCard(null);
    try {
      const response = await fetch(
        `/api/v1/merchant/customers?query=${encodeURIComponent(clean)}`,
        { cache: 'no-store' }
      );
      const body = (await response.json().catch(() => ({}))) as {
        customers?: CustomerSummary[];
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || 'تعذر البحث');
      setResults(body.customers ?? []);
      if ((body.customers ?? []).length === 0) setSearchError('لا يوجد عميل مطابق');
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'تعذر البحث');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCustomer = async (customer: CustomerSummary) => {
    setSelected(customer);
    setActionNotice(null);
    setActionError(null);
    await loadCard(customer.id);
  };

  const addVisit = async () => {
    if (!selected) return;
    setIsActing(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const response = await fetch('/api/v1/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selected.id,
          source: 'staff',
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'تعذر تسجيل الزيارة');
      setActionNotice('تم تسجيل زيارة معتمدة جديدة');
      await loadCard(selected.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر تسجيل الزيارة');
    } finally {
      setIsActing(false);
    }
  };

  const redeemReward = async () => {
    if (!selected || !rewardRuleId || !card || card.rewards.length === 0) return;
    setIsActing(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const response = await fetch('/api/v1/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selected.id,
          rewardRuleId,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        rewardName?: string | null;
      };
      if (!response.ok) throw new Error(body.error || 'تعذر استبدال المكافأة');
      setActionNotice(`تم استبدال: ${body.rewardName || 'المكافأة'}`);
      await loadCard(selected.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر استبدال المكافأة');
    } finally {
      setIsActing(false);
    }
  };

  const issueVoucher = async () => {
    if (!selected) return;
    const title = window.prompt('عنوان القسيمة (مثال: قهوة مجانية)');
    if (!title || title.trim().length < 2) return;
    setIsActing(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const response = await fetch('/api/v1/merchant/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selected.id, title: title.trim() }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        voucher?: { code: string };
      };
      if (!response.ok) throw new Error(body.error || 'تعذر إصدار القسيمة');
      setActionNotice(`تم إصدار القسيمة: ${body.voucher?.code ?? ''}`);
      await loadCard(selected.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر إصدار القسيمة');
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="space-y-6">
      {actionNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs font-bold text-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-bold text-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <form
        onSubmit={search}
        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#141212] p-5 shadow-xl sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث برقم الجوال أو الاسم..."
            className="w-full rounded-xl border border-white/10 bg-[#1C1B1B] py-2.5 pe-3 ps-10 text-xs text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
          />
          <Search className="absolute start-3 top-3 h-4 w-4 text-[#A19E9B]" />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#DFAB56] px-5 py-2.5 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          بحث
        </button>
      </form>

      {searchError && (
        <p className="rounded-xl border border-white/10 bg-[#1C1B1B] p-4 text-center text-xs text-[#A19E9B]">
          {searchError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-[#141212] p-4 shadow-xl lg:col-span-4">
          <h3 className="mb-2 border-b border-white/10 pb-2 text-xs font-bold text-[#FAF5EB]">
            نتائج البحث ({results.length})
          </h3>
          {results.length === 0 ? (
            <p className="p-4 text-center text-xs text-[#A19E9B]">ابدأ البحث لعرض العملاء.</p>
          ) : (
            <ul className="space-y-1.5">
              {results.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => void selectCustomer(customer)}
                    className={`w-full rounded-xl border p-3 text-right text-xs transition ${
                      selected?.id === customer.id
                        ? 'border-[#DFAB56]/50 bg-[#3D2314]/50'
                        : 'border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-[#FAF5EB]">
                      <UserRound className="h-4 w-4 text-[#DFAB56]" />
                      {customer.displayName}
                    </div>
                    <div className="mt-1 flex items-center gap-3 font-mono text-[10px] text-[#A19E9B]">
                      {customer.phone && (
                        <span className="flex items-center gap-1" dir="ltr">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                      <span>{customer.totalVisits} زيارة</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-[#141212] p-5 shadow-xl lg:col-span-8">
          {!selected ? (
            <p className="p-8 text-center text-xs text-[#A19E9B]">
              اختر عميلًا من النتائج لعرض بطاقة الولاء وسجل الزيارات.
            </p>
          ) : isLoadingCard ? (
            <div className="flex items-center justify-center gap-2 p-8 text-xs text-[#A19E9B]">
              <Loader2 className="h-4 w-4 animate-spin" /> جاري تحميل البطاقة...
            </div>
          ) : card ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#FAF5EB]">{card.customer.displayName}</h3>
                  <p className="font-mono text-[11px] text-[#A19E9B]" dir="ltr">
                    {card.customer.phone ?? 'بدون رقم'}
                  </p>
                </div>
                <span className="rounded-md border border-[#DFAB56]/40 bg-[#3D2314]/70 px-2.5 py-1 font-mono text-[10px] font-bold text-[#FAF5EB]">
                  {card.loyalty.totalVerifiedVisits} زيارة معتمدة
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#1C1B1B] p-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-[#FAF5EB]">
                    <Award className="h-4 w-4 text-[#DFAB56]" />
                    تقدم البطاقة
                  </span>
                  <span className="font-mono text-[#A19E9B]">
                    {card.loyalty.stampedCount} / {card.loyalty.maxSlots}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#DFAB56]"
                    style={{
                      width: `${Math.min(
                        100,
                        (card.loyalty.stampedCount / Math.max(1, card.loyalty.maxSlots)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#A19E9B]">
                  <span>مكافآت جاهزة: {card.loyalty.completedCardsCount}</span>
                  <span>
                    آخر زيارة:{' '}
                    {card.loyalty.lastStampedAt
                      ? new Date(card.loyalty.lastStampedAt).toLocaleDateString('ar-SA')
                      : '—'}
                  </span>
                </div>
              </div>

              {canManage && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void addVisit()}
                    disabled={isActing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#DFAB56] px-4 py-2 text-xs font-bold text-[#12100E] hover:bg-[#C99645] disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    تسجيل زيارة
                  </button>
                  <button
                    type="button"
                    onClick={() => void redeemReward()}
                    disabled={isActing || !rewardRuleId || card.rewards.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-4 py-2 text-xs font-bold text-[#FAF5EB] hover:bg-[#211F1F] disabled:opacity-40"
                  >
                    <Gift className="h-4 w-4" />
                    استبدال مكافأة
                  </button>
                  <button
                    type="button"
                    onClick={() => void issueVoucher()}
                    disabled={isActing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] px-4 py-2 text-xs font-bold text-[#FAF5EB] hover:bg-[#211F1F] disabled:opacity-40"
                  >
                    <Ticket className="h-4 w-4" />
                    إصدار قسيمة
                  </button>
                </div>
              )}

              {card.rewards.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-[#FAF5EB]">مكافآت جاهزة للاستبدال</h4>
                  {card.rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between rounded-lg border border-[#DFAB56]/30 bg-[#3D2314]/30 px-3 py-2 text-xs"
                    >
                      <span className="font-bold text-[#FAF5EB]">{reward.name}</span>
                      <span className="font-mono text-[10px] text-[#A19E9B]">
                        {new Date(reward.unlockedAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {card.vouchers.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-[#FAF5EB]">القسائم</h4>
                  {card.vouchers.map((voucher) => (
                    <div
                      key={voucher.code}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-[#1C1B1B] px-3 py-2 text-xs"
                    >
                      <span className="font-bold text-[#FAF5EB]">{voucher.title}</span>
                      <span className="font-mono text-[10px] text-[#DFAB56]" dir="ltr">
                        {voucher.code} • {voucher.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {card.memories.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#FAF5EB]">
                    <Clock className="h-3.5 w-3.5 text-[#DFAB56]" />
                    آخر الذكريات
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {card.memories.slice(0, 10).map((memory) => (
                      <div
                        key={memory.id}
                        className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-[#1C1B1B]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={memory.thumbnailUrl}
                          alt="ذكرى"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="p-8 text-center text-xs text-[#A19E9B]">تعذر عرض البطاقة.</p>
          )}
        </div>
      </div>
    </div>
  );
};
