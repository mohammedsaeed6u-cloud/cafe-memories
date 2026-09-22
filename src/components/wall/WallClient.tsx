'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Tv,
  QrCode,
  Sparkles,
  Maximize2,
  Clock,
  Wifi,
  WifiOff,
  Coffee,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  Heart,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';

interface WallClientProps {
  screenId: string;
}

interface WallMemoryItem {
  id: string;
  customerName: string;
  avatarUrl?: string;
  photoUrl: string;
  caption?: string;
  visitNumber: number;
  timeFormatted: string;
  createdAt: string;
}

export function WallClient({ screenId }: WallClientProps) {
  // Screen state
  const [isPaired, setIsPaired] = useState<boolean>(true);
  const [pairingInput, setPairingInput] = useState('');
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isPairingSubmitting, setIsPairingSubmitting] = useState(false);

  // Content & Playback State
  const [memories, setMemories] = useState<WallMemoryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('الآن');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [brandName, setBrandName] = useState('Memories');
  const [cafeSlug, setCafeSlug] = useState('espresso-lab');

  useEffect(() => {
    try {
      const s = BusinessSettingsService.getSettings();
      if (s?.branding?.name) setBrandName(s.branding.name);
      if (s?.cafeSlug) setCafeSlug(s.cafeSlug);
    } catch {}
  }, []);

  const CACHE_KEY = `memories_wall_cache_${screenId}`;

  // 1. Offline & Heartbeat Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic Heartbeat
    const heartbeatTimer = setInterval(async () => {
      try {
        await fetch('/api/v1/screens/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenId,
            status: 'online',
          }),
        });
      } catch {}
    }, 45000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(heartbeatTimer);
    };
  }, [screenId]);

  // 2. Fetch Live Approved Memories with Offline Cache Fallback
  const fetchApprovedMemories = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/memories?status=approved&visibility=live_wall&limit=30');
      if (res.ok) {
        const data = await res.json();
        if (data.memories && data.memories.length > 0) {
          const formatted: WallMemoryItem[] = data.memories.map((m: any, idx: number) => ({
            id: m.id,
            customerName: m.customers?.display_name || 'زائر الكافيه',
            avatarUrl: m.customers?.avatar_url,
            photoUrl: m.optimized_url || m.original_url,
            caption: m.caption,
            visitNumber: (idx % 5) + 1,
            timeFormatted: new Date(m.created_at).toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            createdAt: m.created_at,
          }));

          // Fairness sequence: eliminate immediate consecutive repetition from same customer
          const sequenced = [...formatted].sort((a, b) => (a.customerName === b.customerName ? 1 : -1));

          setMemories(sequenced);
          setLastSyncTime(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));

          // Save to local cache for offline resilience
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(sequenced));
          } catch {}
          return;
        }
      }
    } catch (err) {
      console.warn('Network issue fetching live wall memories, resorting to cached content:', err);
    }

    // Offline Cache Recovery: screen must NEVER be blank
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMemories(parsed);
        }
      }
    } catch {}
  }, [CACHE_KEY]);

  // Initial fetch and 20s polling synchronization
  useEffect(() => {
    fetchApprovedMemories();
    const interval = setInterval(fetchApprovedMemories, 20000);
    return () => clearInterval(interval);
  }, [fetchApprovedMemories]);

  // Realtime Supabase Subscription for Instant New Moment Broadcast
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`wall_${screenId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories' },
        () => {
          fetchApprovedMemories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [screenId, fetchApprovedMemories]);

  // Playback timer (transitions every 10 seconds)
  useEffect(() => {
    if (!isPlaying || memories.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % memories.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [isPlaying, memories.length]);

  // Handle Screen Pairing Form
  const handlePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pairingInput.trim().length !== 6) {
      setPairingError('كود الاقتران يجب أن يتكون من 6 أرقام');
      return;
    }

    setIsPairingSubmitting(true);
    setPairingError(null);

    try {
      const res = await fetch('/api/v1/screens/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairingCode: pairingInput.trim(),
          screenName: 'شاشة صالة الكافيه',
          resolution: '3840x2160',
          orientation: 'landscape',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsPaired(true);
        fetchApprovedMemories();
      } else {
        setPairingError(data.error || 'فشل الاقتران. تأكد من صحة الكود وصلاحيته من لوحة التاجر.');
      }
    } catch (err: any) {
      setPairingError('تعذر الاتصال بالخادم');
    } finally {
      setIsPairingSubmitting(false);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentMemory = memories[currentIndex] || memories[0];

  // UNPAIRED STATE: Display Pairing Setup Screen
  if (!isPaired) {
    return (
      <div className="min-h-screen bg-[#0E0C0A] text-white flex flex-col items-center justify-center p-8 select-none font-cairo">
        <div className="max-w-md w-full p-8 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Tv className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black mb-2">إعداد شاشة الكافيه الحية</h1>
            <p className="text-xs text-stone-400 leading-relaxed">
              قم بتوليد كود اقتران من لوحة التاجر (Merchant Dashboard) في قسم الشاشات، ثم أدخل الكود أدناه لربط هذه الشاشة فورياً.
            </p>
          </div>

          <form onSubmit={handlePairSubmit} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={pairingInput}
              onChange={(e) => setPairingInput(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full py-4 text-center text-3xl font-mono font-black tracking-widest bg-stone-950 border border-stone-700 rounded-2xl focus:border-amber-500 focus:outline-none text-amber-400"
            />

            {pairingError && (
              <p className="text-xs text-red-400 font-bold">{pairingError}</p>
            )}

            <button
              type="submit"
              disabled={isPairingSubmitting}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm transition disabled:opacity-50"
            >
              {isPairingSubmitting ? 'جاري الاقتران...' : 'تأكيد اقتران الشاشة ✦'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PAIRED LIVE WALL DISPLAY
  return (
    <div className="min-h-screen bg-[#110D0A] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden relative font-cairo">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between border-b border-stone-800/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xl shadow-lg">
            M
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{brandName}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-xs text-stone-400 font-mono">
              Live Community Board ✦ شاشة الصالة الحية ({cafeSlug})
            </p>
          </div>
        </div>

        {/* Status indicators & subtle controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/80 border border-stone-800 text-xs font-mono">
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="text-stone-400">
              {isOnline ? 'LIVE 4K' : 'OFFLINE CACHE'}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 transition"
            title="ملء الشاشة"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Community Board Stage */}
      <main className="relative z-10 flex-1 my-6 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14">
        {currentMemory ? (
          <>
            {/* Featured Memory Photo Frame */}
            <div className="relative aspect-[3/4] h-[60vh] max-h-[640px] rounded-3xl overflow-hidden bg-stone-900 border-2 border-stone-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-700">
              <img
                src={currentMemory.photoUrl}
                alt="Featured Moment"
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-mono font-black">
                      زيارة #{currentMemory.visitNumber} ✦
                    </span>
                    <span className="text-xs font-mono text-stone-400">
                      {currentMemory.timeFormatted}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {currentMemory.customerName}
                  </h3>

                  {currentMemory.caption && (
                    <p className="text-sm sm:text-base text-stone-200 font-medium leading-relaxed bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                      “{currentMemory.caption}”
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* In-Store Engagement & QR Callout */}
            <div className="max-w-md w-full space-y-6 text-right">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>شارك ذكرياتك اليوم ✦ شارك مجتمع الكافيه</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                لحظتك القادمة هنا.<br />
                <span className="text-amber-400">امسح الباركود، وصورتك هتنزل فوراً.</span>
              </h2>

              <p className="text-sm text-stone-400 leading-relaxed">
                كل صورة تلتقطها وتوافق على عرضها تظهر على هذه الشاشة وتضيف لقطة لقصتك لتحصل على مشروبك المجاني.
              </p>

              {/* Dynamic Table QR Code */}
              <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-400 block font-mono">
                    SCAN WITH CAMERA
                  </span>
                  <p className="text-xs text-stone-300 font-bold">
                    بدون أي تطبيق • افتح كاميرا هاتفك
                  </p>
                  <span className="text-[10px] text-stone-500 font-mono block">
                    memories-c9w.pages.dev/c/{cafeSlug}
                  </span>
                </div>

                <div className="w-24 h-24 rounded-2xl bg-white p-2 flex items-center justify-center shrink-0 shadow-md">
                  <QrCode className="w-full h-full text-stone-950" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-12 space-y-4">
            <Coffee className="w-16 h-16 text-amber-500/60 mx-auto" />
            <h2 className="text-2xl font-black">بورد ذكريات الكافيه الحي</h2>
            <p className="text-stone-400 max-w-sm mx-auto text-sm">
              امسح كود الـ QR على طاولتك لتكون أول من يوثق لحظته على الشاشة اليوم!
            </p>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="relative z-20 flex items-center justify-between text-xs font-mono text-stone-500 border-t border-stone-800/80 pt-4">
        <span>MEMORIES DIGITAL LIVE WALL v2.0</span>
        <span>{memories.length} ذكريات معروضة اليوم ✦ تحديث مستمر</span>
      </footer>
    </div>
  );
}
