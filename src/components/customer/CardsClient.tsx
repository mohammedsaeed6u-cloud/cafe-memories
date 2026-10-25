'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Award,
  ChevronLeft,
  Gift,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface CardSummary {
  customerId: string;
  displayName: string;
  venue: {
    name: string;
    slug: string;
    tagline: string | null;
    primaryColor: string | null;
    logoUrl: string | null;
  };
  openStamps: number;
  usedStamps: number;
  availableRewards: number;
  rewardName: string | null;
  threshold: number | null;
  nextTier: { threshold: number; title: string } | null;
  lastSeenAt: string | null;
  memberSince: string;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(value));
}

function VenueMark({ card }: { card: CardSummary }) {
  if (card.venue.logoUrl) {
    return (
      // The logo is a small, already-optimized PNG served from our own route.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={card.venue.logoUrl}
        alt={card.venue.name}
        className="h-11 w-11 rounded-xl border border-[#3D2314]/10 bg-white object-contain p-1"
      />
    );
  }
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#3D2314]/10 text-base font-black text-[#3D2314]"
      style={{ backgroundColor: card.venue.primaryColor ?? '#EADDC4' }}
    >
      {card.venue.name.trim().charAt(0) || 'S'}
    </div>
  );
}

export function CardsClient() {
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only writes state after the first await, so mounting cannot cascade.
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/customer/cards', { cache: 'no-store' });
      const body = (await response.json().catch(() => ({}))) as {
        cards?: CardSummary[];
        error?: string;
      };
      if (!response.ok) throw new Error(body.error || 'تعذر تحميل البطاقات');
      setCards(body.cards ?? []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل البطاقات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // `load` only writes state after its first await; the compiler rule scans
    // the whole async body and cannot see that boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <main className="w-full max-w-xl mx-auto px-3 sm:px-4 py-6 space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-black text-[#3D2314]">
            <Award className="h-5 w-5 text-[#B83A26]" /> بطاقاتي
          </h1>
          <p className="mt-1 text-[11px] leading-relaxed text-[#3D2314]/60">
            كل بطاقات الولاء التي جمعتها، في مكان واحد. لا تحتاج تطبيقًا — البطاقة نفسها
            محفوظة على هذا المتصفح.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            void load();
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#3D2314]/15 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#3D2314]/70 hover:border-[#DFAB56]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> تحديث
        </button>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-3 text-[11px] font-bold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {isLoading && cards.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#3D2314]/10 bg-white p-10 text-xs text-[#3D2314]/60">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ تحميل بطاقاتك…
        </div>
      ) : cards.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-[#3D2314]/10 bg-white p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-[#DFAB56]" />
          <p className="text-sm font-black text-[#3D2314]">لا توجد بطاقات بعد</p>
          <p className="text-[11px] leading-relaxed text-[#3D2314]/60">
            امسح شريحة NFC عند الكاونتر، أو ابحث عن مكان قريب وابدأ جمع الأختام.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#3D2314] px-3 py-2 text-[11px] font-black text-[#FAF5EB] hover:bg-[#523320]"
          >
            <MapPin className="h-3.5 w-3.5" /> اكتشف أماكن قريبة
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => {
            const threshold = card.threshold ?? card.nextTier?.threshold ?? null;
            const progress =
              threshold && threshold > 0
                ? Math.min(100, Math.round((card.openStamps / threshold) * 100))
                : 0;
            return (
              <article
                key={card.customerId}
                className="space-y-3 rounded-2xl border border-[#3D2314]/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <VenueMark card={card} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-black text-[#3D2314]">
                        {card.venue.name}
                      </h2>
                      {card.availableRewards > 0 && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                          {card.availableRewards} مكافأة جاهزة
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[10px] text-[#3D2314]/50">
                      {card.venue.tagline || `عضو منذ ${formatDate(card.memberSince)}`}
                    </p>
                  </div>
                  <Link
                    href={`/c/${encodeURIComponent(card.venue.slug)}`}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-[#3D2314]/15 px-2 py-1.5 text-[10px] font-bold text-[#3D2314] hover:border-[#DFAB56]"
                  >
                    افتح <ChevronLeft className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#3D2314]/70">
                    <span className="flex items-center gap-1">
                      <Gift className="h-3 w-3 text-[#B83A26]" />
                      {card.rewardName || 'المكافأة القادمة'}
                    </span>
                    <span className="font-mono">
                      {card.openStamps}
                      {threshold ? ` / ${threshold}` : ''}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#EADDC4]">
                    <div
                      className="h-full rounded-full bg-[#DFAB56] transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#3D2314]/45">
                    {card.nextTier
                      ? `الهدف التالي: ${card.nextTier.title} عند ${card.nextTier.threshold} ختمًا`
                      : `آخر زيارة: ${formatDate(card.lastSeenAt)}`}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
