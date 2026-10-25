'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Gift,
  Loader2,
  Nfc,
  Sparkles,
  Stamp,
  Ticket,
} from 'lucide-react';
import { readTagSecret } from '@/lib/nfc-tag';

interface TapLoyalty {
  stampedCount: number;
  maxSlots: number;
  completedCardsCount: number;
  rewardName: string | null;
  nextTier: { threshold: number; title: string; remaining: number } | null;
}

interface TapReward {
  id: string;
  name: string;
  threshold: number;
  unlockedAt: string;
}

interface TapVoucher {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  source: string;
  expiresAt: string | null;
}

interface TapTier {
  id: string;
  threshold: number;
  title: string;
  description: string | null;
  rewardKind: 'voucher' | 'card';
  unlocked: boolean;
  isNext: boolean;
}

interface TapCard {
  customer: { displayName: string };
  loyalty: TapLoyalty;
  rewards: TapReward[];
  vouchers: TapVoucher[];
  ladder: TapTier[];
  promotion: { title: string; multiplier: number; endsAt: string } | null;
}

interface TapResult {
  status: string;
  replayed: boolean;
  tapId: string | null;
  stampsAwarded: number;
  multiplier: number;
  headStart: number;
  message: string | null;
  nextTapAt: string | null;
  venue: {
    organizationName: string;
    organizationSlug: string;
    branchName: string;
    branchSlug: string;
  };
  card: TapCard | null;
}

interface TapClientProps {
  publicId: string;
}

type Phase = 'reading' | 'tapping' | 'done' | 'error';

export function TapClient({ publicId }: TapClientProps) {
  const [phase, setPhase] = useState<Phase>('reading');
  const [result, setResult] = useState<TapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showStamp, setShowStamp] = useState(false);
  const started = useRef(false);
  // The fragment is stripped from the address bar after the first read, so the
  // bearer secret has to live in memory for the redeem call and the refresh.
  const secretRef = useRef<string | null>(null);

  const tap = useCallback(async () => {
    const secret = secretRef.current ?? readTagSecret(window.location.hash);
    if (!secret) {
      setError('لم نجد سر الشريحة في الرابط. قرّب الهاتف من شريحة NFC مرة أخرى.');
      setPhase('error');
      return;
    }
    secretRef.current = secret;

    // The secret is a bearer credential: keep it in memory, then strip it from
    // the address bar so a screenshot or a shared link cannot replay the tap.
    window.history.replaceState(null, '', window.location.pathname);

    setPhase('tapping');
    setError(null);
    try {
      const response = await fetch('/api/v1/taps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId,
          secret,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as TapResult & {
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || 'تعذر تسجيل النقرة');

      setResult(body);
      setPhase('done');
      if (body.stampsAwarded > 0) {
        setShowStamp(true);
        window.setTimeout(() => setShowStamp(false), 2200);
      }
    } catch (tapError) {
      setError(tapError instanceof Error ? tapError.message : 'تعذر تسجيل النقرة');
      setPhase('error');
    }
  }, [publicId]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void tap();
  }, [tap]);

  const redeem = async (kind: 'card' | 'voucher', rewardId: string, key: string) => {
    const secret = secretRef.current ?? readTagSecret(window.location.hash);
    if (!secret) {
      setError('انتهت صلاحية الجلسة مع الشريحة. أعد التمرير على الشريحة.');
      return;
    }
    setRedeeming(key);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch('/api/v1/taps/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId,
          secret,
          rewardKind: kind,
          rewardId,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        status?: string;
        rewardName?: string | null;
        code?: string | null;
        error?: string;
        message?: string | null;
      };
      if (!response.ok) throw new Error(body.error || 'تعذر استبدال المكافأة');
      if (body.status === 'nothing_to_redeem') {
        throw new Error(body.message || 'هذه المكافأة لم تعد متاحة');
      }
      setNotice(
        body.rewardName
          ? `تم استبدال «${body.rewardName}»${body.code ? ` — الكود ${body.code}` : ''}. أظهر هذه الشاشة للكاشير.`
          : 'تم استبدال المكافأة. أظهر هذه الشاشة للكاشير.'
      );
      // Reload the tap to reflect the new balance.
      started.current = false;
      await tap();
    } catch (redeemError) {
      setError(redeemError instanceof Error ? redeemError.message : 'تعذر استبدال المكافأة');
    } finally {
      setRedeeming(null);
    }
  };

  const venue = result?.venue;
  const card = result?.card;

  return (
    <main className="flex min-h-screen flex-col gap-4 py-6" dir="rtl">
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-black tracking-tight text-[#3D2314]">
          stampy<span className="text-[#DFAB56]">.</span>
        </span>
        {venue?.organizationSlug ? (
          <Link
            href={`/c/${venue.organizationSlug}`}
            className="flex items-center gap-1 rounded-full border border-[#3D2314]/10 bg-white/60 px-3 py-1.5 text-[11px] font-bold text-[#3D2314]"
          >
            الكارت الكامل
            <ArrowLeft className="h-3 w-3" />
          </Link>
        ) : null}
      </div>

      {phase === 'reading' || phase === 'tapping' ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl border border-[#3D2314]/10 bg-white/70 p-8 text-center shadow-sm">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#DFAB56]/20" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#DFAB56] text-[#3D2314] shadow-lg">
              <Nfc className="h-9 w-9" />
            </span>
          </div>
          <p className="text-sm font-black text-[#3D2314]">جارٍ تسجيل النقرة…</p>
          <p className="text-[11px] text-[#3D2314]/60">لا تغلق الصفحة، يستغرق الأمر لحظات.</p>
        </section>
      ) : null}

      {phase === 'error' ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-rose-300 bg-rose-50 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-sm font-black text-rose-900">{error}</p>
          <p className="text-[11px] text-rose-900/60">
            تأكد أن الشريحة ما زالت نشطة من لوحة التاجر، ثم أعد المحاولة.
          </p>
          <button
            type="button"
            onClick={() => {
              started.current = false;
              void tap();
            }}
            className="rounded-xl bg-[#3D2314] px-4 py-2 text-xs font-black text-[#FAF5EB]"
          >
            إعادة المحاولة
          </button>
        </section>
      ) : null}

      {phase === 'done' && result ? (
        <>
          {notice && (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-[11px] font-bold text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {notice}
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-[11px] font-bold text-rose-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <section className="relative overflow-hidden rounded-3xl border border-[#DFAB56]/40 bg-gradient-to-b from-[#FFFDF8] to-[#F5EBD9] p-5 text-center shadow-sm">
            {showStamp && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#FAF5EB]/70 backdrop-blur-[1px]">
                <div className="animate-[bounce_0.6s_ease-out] flex flex-col items-center">
                  <span className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#DFAB56] bg-[#3D2314] text-[#DFAB56] shadow-2xl">
                    <Stamp className="h-11 w-11" />
                  </span>
                  <span className="mt-2 font-mono text-2xl font-black text-[#3D2314]">
                    +{result.stampsAwarded}
                  </span>
                </div>
              </div>
            )}

            <p className="text-[11px] font-bold text-[#3D2314]/60">
              {venue?.organizationName} · {venue?.branchName}
            </p>

            {result.status === 'ok' ? (
              <>
                <h1 className="mt-1 text-lg font-black text-[#3D2314]">
                  {result.stampsAwarded > 0 ? 'تم تسجيل ختمك!' : 'تم تسجيل الزيارة'}
                </h1>
                <p className="mt-1 text-[11px] text-[#3D2314]/70">
                  {result.multiplier > 1
                    ? `عرض ×${result.multiplier} مطبّق — حصلت على ${result.stampsAwarded} أختام.`
                    : result.stampsAwarded > 0
                      ? 'ختم واحد أضيف إلى كارتك.'
                      : 'لم يُضف ختم جديد هذه المرة.'}
                  {result.headStart > 0 ? ` كما حصلت على ${result.headStart} أختام ترحيبية.` : ''}
                </p>
              </>
            ) : result.status === 'cooldown' ? (
              <>
                <h1 className="mt-1 text-lg font-black text-[#3D2314]">ختمك محفوظ بالفعل</h1>
                <p className="mt-1 text-[11px] text-[#3D2314]/70">
                  {result.message ?? 'تم تسجيل ختم في هذا الفرع خلال الساعة الأخيرة.'}
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-1 text-lg font-black text-[#3D2314]">لم نتمكن من منح الختم</h1>
                <p className="mt-1 text-[11px] text-[#3D2314]/70">
                  {result.message ?? 'حاول مرة أخرى لاحقًا أو اسأل الكاشير.'}
                </p>
              </>
            )}

            {result.multiplier > 1 && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#DFAB56]/20 px-3 py-1 text-[10px] font-black text-[#8A5A14]">
                <Sparkles className="h-3 w-3" /> عرض ×{result.multiplier}
              </span>
            )}
          </section>

          {card && (
            <>
              <section className="rounded-3xl border border-[#3D2314]/10 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-[#3D2314]">كارت {card.customer.displayName}</p>
                  <p className="font-mono text-[11px] font-bold text-[#3D2314]/60" dir="ltr">
                    {card.loyalty.stampedCount}/{card.loyalty.maxSlots}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {Array.from({ length: card.loyalty.maxSlots }, (_, index) => {
                    const filled = index < card.loyalty.stampedCount;
                    return (
                      <span
                        key={index}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                          filled
                            ? 'border-[#DFAB56] bg-[#DFAB56] text-[#3D2314]'
                            : 'border-dashed border-[#3D2314]/20 text-[#3D2314]/20'
                        }`}
                      >
                        <Stamp className="h-4 w-4" />
                      </span>
                    );
                  })}
                </div>

                <p className="mt-3 text-center text-[11px] text-[#3D2314]/70">
                  {card.loyalty.nextTier
                    ? `باقي ${card.loyalty.nextTier.remaining} ختم للوصول إلى «${card.loyalty.nextTier.title}».`
                    : card.loyalty.rewardName
                      ? `مكافأتك القادمة: ${card.loyalty.rewardName}.`
                      : 'أكمل الكارت للحصول على مكافأتك.'}
                </p>

                {card.promotion && (
                  <p className="mt-2 rounded-xl bg-[#DFAB56]/15 px-3 py-2 text-center text-[10px] font-bold text-[#8A5A14]">
                    {card.promotion.title} — ×{card.promotion.multiplier} حتى{' '}
                    {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(
                      new Date(card.promotion.endsAt)
                    )}
                  </p>
                )}
              </section>

              {card.ladder.length > 0 && (
                <section className="rounded-3xl border border-[#3D2314]/10 bg-white/80 p-4 shadow-sm">
                  <p className="mb-2 text-xs font-black text-[#3D2314]">سلم المكافآت</p>
                  <div className="space-y-2">
                    {card.ladder.map((tier) => (
                      <div
                        key={tier.id}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                          tier.isNext
                            ? 'border-[#DFAB56] bg-[#DFAB56]/10'
                            : 'border-[#3D2314]/10'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-[11px] font-bold text-[#3D2314]">
                          {tier.rewardKind === 'card' ? (
                            <Gift className="h-3.5 w-3.5 text-[#DFAB56]" />
                          ) : (
                            <Ticket className="h-3.5 w-3.5 text-[#DFAB56]" />
                          )}
                          {tier.title}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold ${
                            tier.unlocked ? 'text-emerald-600' : 'text-[#3D2314]/50'
                          }`}
                        >
                          {tier.unlocked ? 'جاهز' : `${tier.threshold} ختم`}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {card.rewards.length > 0 && (
                <section className="space-y-2 rounded-3xl border border-[#DFAB56]/40 bg-[#FFFDF8] p-4 shadow-sm">
                  <p className="text-xs font-black text-[#3D2314]">مكافآت جاهزة</p>
                  {card.rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#DFAB56]/30 bg-white px-3 py-2"
                    >
                      <span className="text-[11px] font-bold text-[#3D2314]">{reward.name}</span>
                      <button
                        type="button"
                        disabled={redeeming === reward.id}
                        onClick={() => void redeem('card', reward.id, reward.id)}
                        className="flex items-center gap-1 rounded-lg bg-[#3D2314] px-3 py-1.5 text-[10px] font-black text-[#FAF5EB] disabled:opacity-50"
                      >
                        {redeeming === reward.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Gift className="h-3 w-3" />
                        )}
                        استبدال
                      </button>
                    </div>
                  ))}
                </section>
              )}

              {card.vouchers.length > 0 && (
                <section className="space-y-2 rounded-3xl border border-[#3D2314]/10 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs font-black text-[#3D2314]">كوبوناتك</p>
                  {card.vouchers.map((voucher) => (
                    <div
                      key={voucher.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#3D2314]/10 px-3 py-2"
                    >
                      <div>
                        <p className="text-[11px] font-bold text-[#3D2314]">{voucher.title}</p>
                        <p className="font-mono text-[10px] text-[#3D2314]/50" dir="ltr">
                          {voucher.code}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={redeeming === voucher.id}
                        onClick={() => void redeem('voucher', voucher.id, voucher.id)}
                        className="flex items-center gap-1 rounded-lg border border-[#3D2314]/20 px-3 py-1.5 text-[10px] font-black text-[#3D2314] disabled:opacity-50"
                      >
                        {redeeming === voucher.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Ticket className="h-3 w-3" />
                        )}
                        استخدام
                      </button>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}

          <p className="text-center text-[10px] text-[#3D2314]/40">
            النقرة موثقة من القارئ داخل الفرع. لا حاجة لتطبيق أو رقم هاتف.
          </p>
        </>
      ) : null}
    </main>
  );
}
