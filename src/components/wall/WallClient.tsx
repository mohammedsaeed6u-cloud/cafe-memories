'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Tv,
  Sparkles,
  Maximize2,
  Clock,
  Wifi,
  WifiOff,
  CheckCircle2,
  Play,
  Pause,
  Radio,
  RotateCw,
  KeyRound,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface WallClientProps {
  /** Optional screen identifier from the URL. It is only a local cache key. */
  screenId?: string;
}

interface PairedScreen {
  screenId: string;
  deviceToken: string;
  cafeSlug: string;
  organizationName: string;
  branchName: string | null;
  logoUrl: string | null;
}

interface WallMemoryItem {
  id: string;
  customerName: string;
  photoUrl: string;
  caption?: string;
  createdAt: string;
}

interface VenueSettingsResponse {
  venue: {
    organization: {
      name: string;
      slug: string;
      logoUrl: string | null;
      tagline: string | null;
    };
    branch: { slug: string; name: string };
    settings: {
      wallSettings?: {
        mode?: 'board' | 'grid' | 'slideshow';
        slideIntervalSeconds?: number;
        blackout?: boolean;
      };
    };
  };
}

const STORAGE_KEY = 'stampy_paired_screen_v1';
const TOKEN_KEY = 'stampy_screen_device_token_v1';
const FEED_CACHE_KEY = 'stampy_wall_feed_cache_v1';
const HEARTBEAT_MS = 45_000;
const FEED_POLL_MS = 20_000;
const SETTINGS_POLL_MS = 60_000;

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function readPaired(): PairedScreen | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PairedScreen;
    if (!parsed?.screenId || !parsed?.deviceToken || !parsed?.cafeSlug) return null;
    return parsed;
  } catch {
    return null;
  }
}

function timeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return date.toLocaleDateString('ar-SA');
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function WallClient({ screenId }: WallClientProps) {
  const [paired, setPaired] = useState<PairedScreen | null>(null);
  const [booted, setBooted] = useState(false);

  const [code, setCode] = useState('');
  const [pairError, setPairError] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);

  const [memories, setMemories] = useState<WallMemoryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isBlackout, setIsBlackout] = useState(false);
  const [slideIntervalMs, setSlideIntervalMs] = useState(8000);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const newestIdRef = useRef<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clamp during render instead of resetting through an effect when the feed
  // shrinks (moderation, deletion, or a smaller page).
  const activeIndex = memories.length > 0 ? Math.min(currentIndex, memories.length - 1) : 0;

  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  /* ------------------------------- bootstrap ------------------------------ */

  useEffect(() => {
    const boot = async () => {
      setPaired(readPaired());
      setBooted(true);
      setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    };
    void boot();
  }, []);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  /* -------------------------------- pairing ------------------------------- */

  const submitCode = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const clean = code.replace(/\D/g, '').slice(0, 6);
      if (clean.length !== 6) {
        setPairError('أدخل الرمز المكوّن من 6 أرقام');
        return;
      }
      setIsPairing(true);
      setPairError(null);
      try {
        let deviceToken = localStorage.getItem(TOKEN_KEY);
        if (!deviceToken || deviceToken.length < 32) {
          deviceToken = randomToken();
          localStorage.setItem(TOKEN_KEY, deviceToken);
        }

        const response = await fetch('/api/v1/screens/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: clean,
            deviceToken,
            screenName: screenId ? `شاشة ${screenId}` : 'شاشة الصالة',
            resolution: `${window.screen.width}x${window.screen.height}`,
            orientation: window.screen.width >= window.screen.height ? 'landscape' : 'portrait',
          }),
        });
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
          screenId?: string;
          cafeSlug?: string | null;
          organizationName?: string | null;
          branchName?: string | null;
        };
        if (!response.ok || !body.screenId || !body.cafeSlug) {
          throw new Error(body.error || 'تعذر إقران الشاشة');
        }

        const next: PairedScreen = {
          screenId: body.screenId,
          deviceToken,
          cafeSlug: body.cafeSlug,
          organizationName: body.organizationName ?? body.cafeSlug,
          branchName: body.branchName ?? null,
          logoUrl: null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setPaired(next);
        setCode('');
      } catch (error) {
        setPairError(error instanceof Error ? error.message : 'تعذر إقران الشاشة');
      } finally {
        setIsPairing(false);
      }
    },
    [code, screenId]
  );

  const unpair = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPaired(null);
    setMemories([]);
    setCurrentIndex(0);
  }, []);

  /* ------------------------------ heartbeat ------------------------------- */

  useEffect(() => {
    if (!paired) return;
    let cancelled = false;

    const beat = async () => {
      try {
        const response = await fetch('/api/v1/screens/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenId: paired.screenId,
            deviceToken: paired.deviceToken,
            currentMemoryId: memories[activeIndex]?.id ?? null,
          }),
        });
        if (cancelled) return;
        if (response.status === 401) {
          unpair();
          return;
        }
        if (!response.ok) {
          setIsOnline(false);
          return;
        }
        setIsOnline(true);
        const body = (await response.json()) as {
          cafeSlug?: string | null;
          branchName?: string | null;
        };
        if (body.cafeSlug && body.cafeSlug !== paired.cafeSlug) {
          const next = { ...paired, cafeSlug: body.cafeSlug, branchName: body.branchName ?? paired.branchName };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setPaired(next);
        }
      } catch {
        if (!cancelled) setIsOnline(false);
      }
    };

    void beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [paired, memories, activeIndex, unpair]);

  /* -------------------------- settings + feed ----------------------------- */

  const loadSettings = useCallback(async (slug: string) => {
    try {
      const response = await fetch(`/api/v1/public/settings?cafeSlug=${encodeURIComponent(slug)}`, {
        cache: 'no-store',
      });
      if (!response.ok) return;
      const body = (await response.json()) as VenueSettingsResponse;
      const wall = body.venue.settings?.wallSettings;
      if (typeof wall?.slideIntervalSeconds === 'number') {
        setSlideIntervalMs(Math.max(3, Math.min(120, wall.slideIntervalSeconds)) * 1000);
      }
      setIsBlackout(Boolean(wall?.blackout));
      setPaired((previous) => {
        if (!previous) return previous;
        const next: PairedScreen = {
          ...previous,
          organizationName: body.venue.organization.name,
          branchName: body.venue.branch.name,
          logoUrl: body.venue.organization.logoUrl,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    } catch {
      /* keep the last known settings */
    }
  }, []);

  const loadFeed = useCallback(async (slug: string) => {
    try {
      const response = await fetch(
        `/api/v1/memories?cafeSlug=${encodeURIComponent(slug)}&limit=30`,
        { cache: 'no-store' }
      );
      if (!response.ok) {
        setFeedError('تعذر تحديث الشاشة');
        return;
      }
      const body = (await response.json()) as {
        memories?: Array<{
          id: string;
          customerName?: string;
          imageUrl?: string;
          thumbnailUrl?: string;
          caption?: string | null;
          createdAt: string;
        }>;
      };
      const mapped: WallMemoryItem[] = (body.memories ?? [])
        .filter((item) => Boolean(item.imageUrl || item.thumbnailUrl))
        .map((item) => ({
          id: item.id,
          customerName: item.customerName?.trim() || 'ضيف مميز',
          photoUrl: (item.imageUrl || item.thumbnailUrl) as string,
          caption: item.caption ?? undefined,
          createdAt: item.createdAt,
        }));

      setFeedError(null);
      setLastSync(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
      setMemories(mapped);
      try {
        localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(mapped));
      } catch {
        /* cache is best effort */
      }

      const newest = mapped[0]?.id ?? null;
      if (newest && newestIdRef.current && newest !== newestIdRef.current) {
        setToast(`وصلت ذكرى جديدة من ${mapped[0].customerName} ✨`);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 6000);
      }
      newestIdRef.current = newest;
    } catch {
      setFeedError('تعذر تحديث الشاشة');
      try {
        const cached = localStorage.getItem(FEED_CACHE_KEY);
        if (cached && memories.length === 0) {
          const parsed = JSON.parse(cached) as WallMemoryItem[];
          if (Array.isArray(parsed)) setMemories(parsed);
        }
      } catch {
        /* ignore cache errors */
      }
    }
  }, [memories.length]);

  useEffect(() => {
    if (!paired) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      void loadSettings(paired.cafeSlug);
      void loadFeed(paired.cafeSlug);
    };
    run();
    const feedTimer = setInterval(run, FEED_POLL_MS);
    const settingsTimer = setInterval(() => void loadSettings(paired.cafeSlug), SETTINGS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(feedTimer);
      clearInterval(settingsTimer);
    };
  }, [paired, loadFeed, loadSettings]);

  /* ------------------------------ slideshow ------------------------------- */

  useEffect(() => {
    if (!isPlaying || isBlackout || memories.length <= 1) return;
    const timer = setInterval(
      () => setCurrentIndex((previous) => (previous + 1) % memories.length),
      slideIntervalMs
    );
    return () => clearInterval(timer);
  }, [isPlaying, isBlackout, memories.length, slideIntervalMs]);

  /* ---------------------------- remote controls --------------------------- */

  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    } else {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (event.code === 'Space') {
        event.preventDefault();
        setIsPlaying((previous) => !previous);
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key.toLowerCase() === 'r' && paired) {
        event.preventDefault();
        void loadFeed(paired.cafeSlug);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        setCurrentIndex((previous) => (memories.length ? (previous + 1) % memories.length : 0));
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        setCurrentIndex((previous) =>
          memories.length ? (previous - 1 + memories.length) % memories.length : 0
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [memories.length, paired, loadFeed, toggleFullscreen]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  const currentMemory = useMemo(
    () => memories[activeIndex] ?? null,
    [memories, activeIndex]
  );

  /* -------------------------------- render -------------------------------- */

  if (!booted) {
    return <div className="min-h-screen bg-[#141313]" />;
  }

  if (!paired) {
    return (
      <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col items-center justify-between p-6 sm:p-12 select-none font-sans relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#3D2314]/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-5xl flex items-center justify-between z-10 border-b border-white/10 pb-5">
          <CoBrandingLogos cafeName="stampy." size="lg" theme="dark" showTagline />
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#3D2314]/50 border border-[#DFAB56]/40 text-xs font-mono font-bold text-[#FAF5EB]">
            <Radio className="w-3.5 h-3.5 text-[#DFAB56] animate-pulse" />
            <span className="uppercase tracking-wider">SMART TV • جاهز للإقران</span>
          </div>
        </div>

        <form
          onSubmit={submitCode}
          className="max-w-xl w-full p-8 sm:p-12 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl text-center space-y-6 z-10"
        >
          <div className="w-16 h-16 rounded-xl bg-[#3D2314]/40 text-[#DFAB56] flex items-center justify-center mx-auto border border-[#DFAB56]/30">
            <Tv className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#DFAB56] font-bold block">
              SMART TV LIVE SIGNAGE
            </span>
            <h1
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
              className="text-2xl sm:text-3xl font-bold text-[#FAF5EB] tracking-tight"
            >
              إقران شاشة الصالة
            </h1>
            <p className="text-xs sm:text-sm text-[#A19E9B] max-w-md mx-auto leading-relaxed">
              اطلب من المسؤول رمز الاقتران المكوّن من 6 أرقام من لوحة التحكم، ثم أدخله هنا لربط
              الشاشة بفرعك.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#A19E9B] flex items-center gap-1.5 justify-center">
              <KeyRound className="w-3.5 h-3.5" /> رمز الاقتران
            </label>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              placeholder="000000"
              className="w-full max-w-xs mx-auto block px-4 py-3 rounded-xl bg-[#0B0A0A] border-2 border-[#DFAB56]/40 text-center font-mono text-3xl tracking-[0.4em] text-[#FAF5EB] focus:border-[#DFAB56] focus:outline-none"
            />
          </div>

          {pairError && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-rose-300">
              <AlertCircle className="w-4 h-4" />
              <span>{pairError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPairing || code.length !== 6}
            className="w-full max-w-xs mx-auto py-3 rounded-xl bg-[#DFAB56] hover:bg-[#C99645] text-[#12100E] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isPairing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{isPairing ? 'جاري الإقران...' : 'تأكيد وربط الشاشة'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-[#A19E9B]/60 font-mono z-10">
          Memories Digital Signage • جاهز للاقتران
        </div>
      </div>
    );
  }

  if (isBlackout) {
    return (
      <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col items-center justify-between p-8 select-none font-sans relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#3D2314]/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="w-full max-w-5xl flex items-center justify-between z-10 border-b border-white/10 pb-5">
          <CoBrandingLogos
            cafeName={paired.organizationName}
            cafeLogoUrl={paired.logoUrl}
            size="lg"
            theme="dark"
            showTagline
          />
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#3D2314]/60 border border-[#DFAB56]/40 text-[#FAF5EB] text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#DFAB56] animate-ping" />
            <span className="uppercase tracking-wider">استراحة مؤقتة • STANDBY</span>
          </div>
        </div>
        <div className="text-center space-y-5 max-w-md z-10">
          <div className="w-24 h-24 rounded-2xl bg-[#141212] border border-white/10 text-[#DFAB56] flex items-center justify-center mx-auto shadow-2xl animate-pulse">
            <Sparkles className="w-12 h-12 text-[#DFAB56]" />
          </div>
          <h2
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            className="text-3xl font-bold text-[#FAF5EB] tracking-tight"
          >
            {paired.organizationName}
          </h2>
          <p className="text-sm text-[#A19E9B] leading-relaxed">
            شاشة العرض في وضع الاستراحة المؤقتة.
            <br />
            التقط لقطتك اليوم واطبع شريط ذكرياتك عبر مسح كود الطاولة بالهاتف!
          </p>
        </div>
        <div className="text-center text-xs text-[#A19E9B]/60 font-mono z-10">Standby Mode</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-sans relative">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#DFAB56] to-[#3D2314] text-[#FAF5EB] font-bold shadow-2xl border border-white/20">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span className="text-sm sm:text-base tracking-wide">{toast}</span>
          </div>
        </div>
      )}

      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#3D2314]/15 rounded-full blur-[140px] pointer-events-none" />

      <header className="relative z-20 flex items-center justify-between border-b border-white/10 pb-5 max-w-6xl mx-auto w-full">
        <CoBrandingLogos
          cafeName={paired.organizationName}
          cafeLogoUrl={paired.logoUrl}
          size="lg"
          theme="dark"
          showTagline
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141212] border border-white/10 text-xs font-mono">
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-[#DFAB56]" />
            )}
            <span className="text-[#FAF5EB] font-bold">
              {isOnline ? 'LIVE' : 'OFFLINE CACHE'}
            </span>
          </div>
          <button
            onClick={unpair}
            className="px-3 py-1.5 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] border border-white/10 text-[#FAF5EB] text-xs font-bold"
            title="إلغاء اقتران الشاشة"
          >
            إلغاء الاقتران
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] border border-white/10 text-[#FAF5EB]"
            title="ملء الشاشة"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 my-6 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 max-w-6xl mx-auto w-full">
        {currentMemory ? (
          <>
            <div className="relative max-w-md w-full aspect-[3/4] max-h-[70vh] rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] border border-white/15 bg-[#141212] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={currentMemory.id}
                src={currentMemory.photoUrl}
                alt={currentMemory.customerName}
                className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-700"
              />
              <div className="absolute bottom-0 inset-x-0 p-6 text-right space-y-1 bg-gradient-to-t from-[#0E0D0D] via-[#0E0D0D]/75 to-transparent text-[#FAF5EB]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#A19E9B]">
                    {timeLabel(currentMemory.createdAt)}
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-[#3D2314]/70 border border-[#DFAB56]/40">
                    {paired.branchName ?? paired.organizationName}
                  </span>
                </div>
                <h3
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                  className="text-xl font-bold drop-shadow-md"
                >
                  {currentMemory.customerName}
                </h3>
                {currentMemory.caption && (
                  <p className="text-sm text-[#D9D9D9] font-medium">&quot;{currentMemory.caption}&quot;</p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-start text-center lg:text-right space-y-6 max-w-sm">
              <div className="space-y-2">
                <span className="px-3.5 py-1 rounded-md bg-[#3D2314]/50 text-[#FAF5EB] font-mono text-xs font-bold border border-[#DFAB56]/40 inline-block uppercase tracking-wider">
                  لحظات وذكريات الصالة
                </span>
                <h2
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                  className="text-2xl sm:text-3xl font-bold text-[#FAF5EB] leading-tight"
                >
                  شارك ذكرياتك لتظهر هنا على شاشة العرض الحية
                </h2>
                <p className="text-sm text-[#A19E9B] leading-relaxed font-medium">
                  امسح الرمز بكاميرا هاتفك، التقط صورك في استوديو الذكريات، واختم كارت ولائك
                  للحصول على هديتك.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl flex flex-col items-center gap-2.5">
                <div className="p-3 bg-white rounded-xl">
                  <RealOutsourcedQr
                    value={`${origin}/c/${paired.cafeSlug}?source=live_wall`}
                    size={144}
                    alt="Live Wall QR"
                    className="w-36 h-36 object-contain"
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-[#A19E9B] tracking-widest uppercase">
                  SCAN TO JOIN THE WALL
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4 max-w-md p-8 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl">
            <Sparkles className="w-12 h-12 text-[#DFAB56] mx-auto animate-pulse" />
            <h3
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
              className="text-xl font-bold text-[#FAF5EB]"
            >
              {feedError ? 'تعذر تحميل الذكريات' : 'بانتظار اللقطة الأولى اليوم'}
            </h3>
            <p className="text-xs text-[#A19E9B] leading-relaxed">
              {feedError
                ? 'سيتم إعادة المحاولة تلقائيًا. تحقق من اتصال الشاشة بالإنترنت.'
                : 'امسح الرمز عند طاولتك أو الكاونتر لتكون صورتك أول ذكرى تضيء شاشة الصالة اليوم!'}
            </p>
            <div className="p-3 bg-white rounded-xl w-32 h-32 mx-auto flex items-center justify-center">
              <RealOutsourcedQr
                value={`${origin}/c/${paired.cafeSlug}?source=live_wall`}
                size={112}
                alt="Live Wall QR"
              />
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-20 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-[#A19E9B] font-mono max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{lastSync ? `آخر تحديث: ${lastSync}` : 'جاري المزامنة...'}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying((previous) => !previous)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] border border-white/10 text-[#FAF5EB] text-[11px] font-bold"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}</span>
          </button>
          <button
            onClick={() => void loadFeed(paired.cafeSlug)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] border border-white/10 text-[#FAF5EB] text-[11px] font-bold"
          >
            <RotateCw className="w-3 h-3" />
            <span>تحديث</span>
          </button>
          <span className="hidden sm:inline text-[#A19E9B]/60">
            {memories.length > 0 ? `${activeIndex + 1} / ${memories.length}` : 'لا ذكريات'}
          </span>
        </div>
      </footer>
    </div>
  );
}
