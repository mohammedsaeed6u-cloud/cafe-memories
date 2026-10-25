'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Coffee,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Search,
  Store,
} from 'lucide-react';
import { DISCOVERY_AMENITIES } from '@/lib/discovery';

interface Venue {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  category: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  tagline: string | null;
  branchId: string;
  branchSlug: string;
  branchName: string;
  address: string | null;
  description: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: Record<string, unknown>;
  amenities: string[];
  googleMapsUrl: string | null;
  distanceKm: number | null;
}

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: '', label: 'الكل' },
  { id: 'cafe', label: 'كافيهات' },
  { id: 'restaurant', label: 'مطاعم' },
  { id: 'retail', label: 'متاجر' },
  { id: 'salon', label: 'صالونات' },
  { id: 'entertainment', label: 'ترفيه' },
  { id: 'events', label: 'فعاليات' },
  { id: 'general', label: 'أخرى' },
];

function formatDistance(km: number | null): string | null {
  if (km === null) return null;
  if (km < 1) return `${Math.round(km * 1000)} م`;
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 1 }).format(km)} كم`;
}

function amenityLabel(id: string): string {
  return DISCOVERY_AMENITIES.find((amenity) => amenity.id === id)?.label ?? id;
}

function VenueMark({ venue }: { venue: Venue }) {
  if (venue.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={venue.logoUrl}
        alt={venue.organizationName}
        className="h-10 w-10 rounded-xl border border-[#3D2314]/10 bg-white object-contain p-1"
      />
    );
  }
  return (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-xl text-[#3D2314]"
      style={{ backgroundColor: venue.primaryColor ?? '#DFAB56' }}
    >
      <Coffee className="h-5 w-5" />
    </span>
  );
}

export function DiscoverClient() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [locationState, setLocationState] = useState<'idle' | 'asking' | 'granted' | 'denied'>(
    'asking'
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Nothing is written before the first `await`, so mounting cannot cascade.
  const load = useCallback(
    async (position: { lat: number; lng: number } | null, selectedCategory: string) => {
      try {
        const params = new URLSearchParams({ radius: '50', limit: '100' });
        if (position) {
          params.set('lat', String(position.lat));
          params.set('lng', String(position.lng));
        }
        if (selectedCategory) params.set('category', selectedCategory);
        const response = await fetch(`/api/v1/public/venues/nearby?${params.toString()}`, {
          cache: 'no-store',
        });
        const body = (await response.json().catch(() => ({}))) as {
          venues?: Venue[];
          error?: string;
        };
        if (!response.ok) throw new Error(body.error || 'تعذر تحميل الأماكن');
        setVenues(body.venues ?? []);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل الأماكن');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      // No location API: list everything alphabetically. The UI derives the
      // "no location" hint from the finished load instead of writing state
      // synchronously here. `load` only writes state after its first await.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load(null, '');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(next);
        setLocationState('granted');
        void load(next, '');
      },
      () => {
        setLocationState('denied');
        void load(null, '');
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 10 * 60_000 }
    );
  }, [load]);

  const selectCategory = (next: string) => {
    setIsLoading(true);
    setCategory(next);
    void load(coords, next);
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return venues;
    return venues.filter((venue) =>
      `${venue.organizationName} ${venue.branchName} ${venue.address ?? ''}`
        .toLowerCase()
        .includes(needle)
    );
  }, [venues, query]);

  const mapPoints = useMemo(() => {
    const located = visible.filter(
      (venue) => venue.latitude !== null && venue.longitude !== null
    );
    if (located.length === 0) return [];
    const lats = located.map((venue) => venue.latitude as number);
    const lngs = located.map((venue) => venue.longitude as number);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const spanLat = Math.max(0.01, maxLat - minLat);
    const spanLng = Math.max(0.01, maxLng - minLng);
    return located.map((venue) => ({
      venue,
      x: 10 + (((venue.longitude as number) - minLng) / spanLng) * 80,
      y: 90 - (((venue.latitude as number) - minLat) / spanLat) * 80,
    }));
  }, [visible]);

  return (
    <main className="flex min-h-screen flex-col gap-4 py-6" dir="rtl">
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-black tracking-tight text-[#3D2314]">
          stampy<span className="text-[#DFAB56]">.</span>
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/cards"
            className="flex items-center gap-1 rounded-full border border-[#3D2314]/10 bg-white/60 px-3 py-1.5 text-[11px] font-bold text-[#3D2314]"
          >
            <Award className="h-3 w-3" />
            بطاقاتي
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 rounded-full border border-[#3D2314]/10 bg-white/60 px-3 py-1.5 text-[11px] font-bold text-[#3D2314]"
          >
            الرئيسية
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-black text-[#3D2314]">
          <Navigation className="h-5 w-5 text-[#DFAB56]" />
          اكتشف أماكن stampy
        </h1>
        <p className="text-[11px] text-[#3D2314]/60">
          كافيهات ومطاعم ومتاجر تمنحك أختامًا على كل زيارة. امسح شريحة NFC في الفرع وابدأ.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-[#3D2314]/10 bg-white/80 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-[#3D2314]/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث بالاسم أو العنوان"
            className="w-full bg-transparent text-[11px] text-[#3D2314] placeholder:text-[#3D2314]/40 focus:outline-none"
          />
        </label>
        {locationState === 'asking' && isLoading && (
          <span className="flex items-center gap-1 text-[10px] text-[#3D2314]/50">
            <Loader2 className="h-3 w-3 animate-spin" /> تحديد موقعك…
          </span>
        )}
        {(locationState === 'denied' || (!isLoading && coords === null)) && (
          <span className="text-[10px] text-[#3D2314]/50">بدون موقع — مرتبة أبجديًا</span>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectCategory(item.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold ${
              category === item.id
                ? 'border-[#DFAB56] bg-[#DFAB56] text-[#3D2314]'
                : 'border-[#3D2314]/10 bg-white/70 text-[#3D2314]/60'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-[11px] font-bold text-rose-900">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {mapPoints.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-[#3D2314]/10 bg-[#EAF0E6] p-2 shadow-sm">
          <svg viewBox="0 0 100 100" className="h-48 w-full" role="img" aria-label="خريطة الأماكن">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#3D2314" strokeOpacity="0.06" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            {mapPoints.map((point) => (
              <a
                key={point.venue.branchId}
                href={`/c/${point.venue.organizationSlug}`}
                aria-label={point.venue.organizationName}
              >
                <circle cx={point.x} cy={point.y} r="4.5" fill="#DFAB56" fillOpacity="0.25" />
                <circle cx={point.x} cy={point.y} r="2" fill="#3D2314" />
              </a>
            ))}
          </svg>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-[#3D2314]/10 bg-white/70 p-10 text-xs text-[#3D2314]/60">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ البحث…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-[#3D2314]/10 bg-white/70 p-10 text-center">
          <Store className="mx-auto h-8 w-8 text-[#3D2314]/20" />
          <p className="mt-2 text-xs font-bold text-[#3D2314]">لا توجد أماكن مطابقة بعد</p>
          <p className="mt-1 text-[10px] text-[#3D2314]/50">
            جرّب فئة أخرى أو وسّع نطاق البحث. الأماكن تظهر هنا بعد تفعيل الاكتشاف من لوحة التاجر.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((venue) => (
            <Link
              key={venue.branchId}
              href={`/c/${venue.organizationSlug}`}
              className="block rounded-2xl border border-[#3D2314]/10 bg-white/80 p-3 shadow-sm transition hover:border-[#DFAB56]/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <VenueMark venue={venue} />
                  <div>
                    <p className="text-xs font-black text-[#3D2314]">{venue.organizationName}</p>
                    <p className="text-[10px] text-[#3D2314]/60">
                      {venue.branchName}
                      {venue.address ? ` · ${venue.address}` : ''}
                    </p>
                  </div>
                </div>
                {formatDistance(venue.distanceKm) && (
                  <span className="flex items-center gap-1 rounded-full bg-[#DFAB56]/15 px-2 py-0.5 font-mono text-[9px] font-bold text-[#8A5A14]">
                    <MapPin className="h-3 w-3" />
                    {formatDistance(venue.distanceKm)}
                  </span>
                )}
              </div>

              {venue.description && (
                <p className="mt-2 text-[10px] leading-relaxed text-[#3D2314]/60">
                  {venue.description}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {venue.category && (
                  <span className="rounded-full bg-[#3D2314]/5 px-2 py-0.5 text-[9px] font-bold text-[#3D2314]/60">
                    {CATEGORIES.find((item) => item.id === venue.category)?.label ?? venue.category}
                  </span>
                )}
                {venue.amenities.slice(0, 4).map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-[#3D2314]/5 px-2 py-0.5 text-[9px] text-[#3D2314]/60"
                  >
                    {amenityLabel(amenity)}
                  </span>
                ))}
                {venue.phone && (
                  <span className="flex items-center gap-1 text-[9px] text-[#3D2314]/50" dir="ltr">
                    <Phone className="h-2.5 w-2.5" />
                    {venue.phone}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
