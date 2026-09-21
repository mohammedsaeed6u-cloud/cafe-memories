'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Coffee,
  QrCode,
  Maximize2,
  Sparkles,
  Play,
  Pause,
  LayoutGrid,
  Layers,
  Clock,
  Pin,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { BusinessSettings } from '@/types/photobooth';

export type WallDisplayMode = 'board' | 'single' | 'grid';

interface WallMemory {
  id: string;
  customer: string;
  caption: string;
  time: string;
  frames: string[];
  theme: 'white' | 'noir' | 'latte';
  rotationDeg?: number;
}

const FALLBACK_MEMORIES: WallMemory[] = [
  {
    id: 'f1',
    customer: 'سارة منصور',
    caption: 'أفضل كورتادو وأجمل كبينة تصوير ذكريات! ✨☕',
    time: 'منذ دقيقتين',
    frames: [
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    ],
    theme: 'white',
    rotationDeg: -2.5,
  },
  {
    id: 'f2',
    customer: 'أحمد وزياد',
    caption: 'جلسة عمل وقهوة صباحية في Memories 💻🚀',
    time: 'منذ 8 دقائق',
    frames: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    ],
    theme: 'latte',
    rotationDeg: 3,
  },
  {
    id: 'f3',
    customer: 'مايا كمال',
    caption: 'جمعة الأصدقاء وأحلى لقطات فوتوبوث 🖤✨',
    time: 'منذ 15 دقيقة',
    frames: [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    ],
    theme: 'noir',
    rotationDeg: -1.5,
  },
  {
    id: 'f4',
    customer: 'كريم وياسمين',
    caption: 'احتفال بذكرى تخرجنا بالقهوة والكارت المطبوع 🎓🎉',
    time: 'منذ 25 دقيقة',
    frames: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    ],
    theme: 'white',
    rotationDeg: 2,
  },
];

export function WallClient({ screenId }: { screenId: string }) {
  const [settings, setSettings] = useState<BusinessSettings>(() =>
    BusinessSettingsService.getSettings('espresso-lab')
  );
  const [memories, setMemories] = useState<WallMemory[]>(FALLBACK_MEMORIES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleSettingsUpdated = (e: any) => {
      if (e.detail) setSettings(e.detail);
    };
    window.addEventListener('memories-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('memories-settings-updated', handleSettingsUpdated);
  }, []);

  // Merchant display preferences
  const [displayMode, setDisplayMode] = useState<WallDisplayMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('memories_wall_mode') as WallDisplayMode) || 'board';
    }
    return 'board';
  });

  const [intervalSeconds, setIntervalSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('memories_wall_interval');
      return saved ? parseInt(saved) || 10 : 10;
    }
    return 10;
  });

  // Sync memories from Supabase & local cafe feed
  const syncLiveFeed = useCallback(async () => {
    // 1. Read local cafe feed first (guaranteed real-time on static host)
    let localItems: WallMemory[] = [];
    if (typeof window !== 'undefined') {
      try {
        const localData = localStorage.getItem('memories_wall_feed_espresso-lab');
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localItems = parsed.map((m, idx) => ({
              id: m.id || `local-${idx}`,
              customer: m.customer || 'عميل مميز',
              caption: m.caption || 'ذكريات القهوة واللحظات الحلوة ☕✨',
              time: m.time || 'الآن',
              frames: m.frames || [],
              theme: m.theme || 'white',
              rotationDeg: ((idx % 4) - 1.5) * 2,
            }));
          }
        }
      } catch {}
    }

    try {
      const supabase = createClient();
      // Guest Privacy & Wall Display: Only fetch memories where visibility === 'live_wall' AND status === 'approved'
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('status', 'approved')
        .eq('visibility', 'live_wall')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && data.length > 0 && !error) {
        const mapped: WallMemory[] = data.map((m: any, i: number) => ({
          id: m.id || `m-${i}`,
          customer: m.customer_name || 'Guest',
          caption: m.caption || 'Specialty coffee moment ☕',
          time: 'الآن',
          frames: m.photos && m.photos.length > 0 ? m.photos : FALLBACK_MEMORIES[0].frames,
          theme: (m.frame_theme as any) || (i % 2 === 0 ? 'white' : 'latte'),
          rotationDeg: ((i % 4) - 1.5) * 2,
        }));
        setMemories([...localItems, ...mapped]);
        return;
      }
    } catch {}

    if (localItems.length > 0) {
      setMemories([...localItems, ...FALLBACK_MEMORIES]);
    }
  }, []);

  useEffect(() => {
    const initialSyncTimer = setTimeout(() => {
      void syncLiveFeed();
    }, 0);
    const interval = setInterval(syncLiveFeed, 15000); // Poll fallback every 15s

    // 1. Supabase Realtime subscription
    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel(`wall-realtime-${screenId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'memories' },
          () => {
            syncLiveFeed();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription fallback', err);
    }

    // 2. Periodic screen heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/v1/screens/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenId,
            batteryLevel: 100,
          }),
        });
      } catch {}
    };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    const handleLocalUpdate = () => syncLiveFeed();
    window.addEventListener('memories-wall-updated', handleLocalUpdate);
    window.addEventListener('storage', handleLocalUpdate);

    return () => {
      clearTimeout(initialSyncTimer);
      clearInterval(interval);
      clearInterval(heartbeatInterval);
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
      window.removeEventListener('memories-wall-updated', handleLocalUpdate);
      window.removeEventListener('storage', handleLocalUpdate);
    };
  }, [syncLiveFeed, screenId]);

  // Slideshow timer using merchant's chosen interval
  useEffect(() => {
    if (!isPlaying || memories.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % memories.length);
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [isPlaying, memories.length, intervalSeconds]);

  const handleModeChange = (mode: WallDisplayMode) => {
    setDisplayMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('memories_wall_mode', mode);
    }
  };

  const handleIntervalChange = (seconds: number) => {
    setIntervalSeconds(seconds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('memories_wall_interval', String(seconds));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentMemory = memories[currentIndex] || FALLBACK_MEMORIES[0];

  return (
    <div className="relative min-h-screen bg-[#241712] text-stone-100 overflow-x-hidden font-sans select-none">
      {/* Top Header Controls Bar */}
      <header className="relative z-30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-amber-900/40 bg-stone-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md">
            M
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Memories • شاشة الذكريات الحية</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[11px] text-amber-200/60 font-medium">
              شاشة كروت الولاء والذكريات • {screenId}
            </p>
          </div>
        </div>

        {/* Mode Selector & Interval Control for Merchant */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-stone-900/90 rounded-2xl p-1 border border-amber-900/40 text-xs">
            <button
              onClick={() => handleModeChange('board')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                displayMode === 'board'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="عرض الكروت معلقة على لوحة خشبية كلاسيكية"
            >
              <Pin className="w-3.5 h-3.5" />
              <span>لوحة الحائط (Board)</span>
            </button>

            <button
              onClick={() => handleModeChange('single')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                displayMode === 'single'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="عرض شريط فردي كبير"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>كارت فردي</span>
            </button>

            <button
              onClick={() => handleModeChange('grid')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                displayMode === 'grid'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
              title="عرض شبكة كل الكروت"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>شبكة الكروت</span>
            </button>
          </div>

          {/* Slideshow Duration Selector */}
          <div className="flex items-center gap-1 bg-stone-900/90 rounded-2xl px-2.5 py-1 border border-amber-900/40 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-stone-400 font-bold ml-1">المدة:</span>
            {[5, 10, 15, 30].map((sec) => (
              <button
                key={sec}
                onClick={() => handleIntervalChange(sec)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                  intervalSeconds === sec
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {sec}ث
              </button>
            ))}
          </div>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 flex items-center justify-center transition border border-amber-900/40"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 flex items-center justify-center transition border border-amber-900/40"
            title="ملء الشاشة"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* QR trigger */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold flex items-center gap-2 shadow-md transition"
          >
            <QrCode className="w-4 h-4 text-amber-200" />
            <span>امسح وصور 📸</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MODE 1: CORKBOARD / MEMORY BOARD (لوحة الذكريات المعلقة الواقعية) */}
      {/* ========================================================= */}
      {displayMode === 'board' && (
        <main className="relative min-h-[calc(100vh-80px)] p-6 sm:p-10 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#25150E] via-[#1D100A] to-[#120906]">
          {/* Subtle Warm Cork Grid Texture Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: 'radial-gradient(#965E30 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Top Board Frame Header Banner */}
          <div className="relative z-10 text-center mb-4">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-stone-950/90 border border-amber-500/40 backdrop-blur-md shadow-2xl">
              <span className="text-base">📌</span>
              <span className="text-xs sm:text-sm font-black text-amber-200 tracking-wider">
                بورد الذكريات الحي • Photobooth Memory Board
              </span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
          </div>

          {/* Realistic Corkboard Strips Display */}
          <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start py-4">
            {memories.slice(0, 4).map((memory, index) => {
              const isSpotlight = index === currentIndex % Math.min(memories.length, 4);
              const rotation = memory.rotationDeg || (index % 2 === 0 ? -2.5 : 2.5);
              const totalSlots = Math.max(settings.defaultShotCount || 3, 1);
              const isCardComplete = memory.frames.length >= totalSlots;

              return (
                <div
                  key={memory.id}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                  }}
                  className={`relative transition-all duration-700 rounded-3xl p-4 bg-[#FAF8F5] text-stone-900 border-2 paper-texture ${
                    isSpotlight
                      ? 'ring-4 ring-amber-400 border-amber-300 shadow-[0_25px_60px_-15px_rgba(245,158,11,0.45)] scale-105 z-20'
                      : 'border-stone-200/90 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] opacity-90 hover:opacity-100 z-10'
                  }`}
                >
                  {/* Pushpin / Brass Pin Realistic Graphic */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-800 via-amber-500 to-amber-300 shadow-[0_4px_10px_rgba(0,0,0,0.6)] border-2 border-amber-200 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-stone-950" />
                    </div>
                  </div>

                  {/* Strip Header with Visit Progress Tag */}
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-3 mt-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-[11px] shrink-0">
                        {memory.customer.slice(0, 2)}
                      </div>
                      <p className="text-xs font-bold text-stone-900 truncate">
                        {memory.customer}
                      </p>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                      isCardComplete
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {isCardComplete ? '🎉 كارت مكتمل' : `زيارة #${memory.frames.length} من ${totalSlots}`}
                    </span>
                  </div>

                  {/* Strip Photos: Renders all slots (both filled and in-progress loyalty placeholders) */}
                  <div className="space-y-2">
                    {Array.from({ length: totalSlots }).map((_, fIdx) => {
                      const src = memory.frames[fIdx];
                      const slotFormatted = String(fIdx + 1).padStart(2, '0');
                      const isLast = fIdx === totalSlots - 1;

                      return src ? (
                        <div
                          key={fIdx}
                          className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-inner relative"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt="Photo"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1.5 text-[8px] font-mono font-bold bg-black/60 text-white px-1 rounded">
                            #{slotFormatted}
                          </span>
                        </div>
                      ) : (
                        <div
                          key={fIdx}
                          className="aspect-[4/3] rounded-xl bg-stone-100/70 border border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 p-2 text-center select-none"
                        >
                          <span className="text-xs mb-0.5">{isLast ? '🎁' : '🔒'}</span>
                          <span className="text-[9px] font-mono font-bold text-stone-500">#{slotFormatted}</span>
                          <span className="text-[8px] text-stone-400 font-medium">
                            {isLast ? 'هدية الاكتمال' : `الزيارة #${fIdx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Strip Caption & Timestamp */}
                  <div className="mt-3 pt-2 border-t border-dashed border-stone-300 text-center">
                    <p className="text-[11px] font-bold text-stone-700 leading-snug line-clamp-2">
                      &ldquo;{memory.caption}&rdquo;
                    </p>
                    <span className="text-[9px] text-stone-400 font-medium block mt-1">
                      {memory.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Callout Banner */}
          <div className="relative z-10 max-w-xl mx-auto mt-6 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-stone-950/90 border border-amber-900/50 backdrop-blur-md text-amber-200 text-xs font-bold shadow-xl">
              <span className="text-base">📸</span>
              <span>اطلب الآن، امسح الباركود، وصورتك هتنزل هنا في بورد الذكريات وتطبع كارتك فوراً!</span>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* MODE 2: SINGLE STRIP FOCUS (كارت فردي كبير) */}
      {/* ========================================================= */}
      {displayMode === 'single' && (
        <main className="relative z-10 max-w-5xl mx-auto px-6 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
          <div className="w-full max-w-md bg-[#FAF8F5] text-stone-900 rounded-3xl p-6 shadow-2xl border-4 border-amber-600/30 animate-in fade-in duration-500 flex flex-col items-center">
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-4 border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                  {currentMemory.customer.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900 leading-tight">
                    {currentMemory.customer}
                  </p>
                  <p className="text-[10px] text-stone-500">{currentMemory.time}</p>
                </div>
              </div>

              <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                MEMORIES STRIP
              </span>
            </div>

            {/* Photo Strip Frames */}
            <div className="w-full space-y-3">
              {currentMemory.frames.map((frameUrl, idx) => (
                <div
                  key={idx}
                  className="w-full aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-inner"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frameUrl}
                    alt={`Frame ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Caption */}
            <div className="w-full mt-4 pt-3 border-t border-dashed border-stone-300 text-center">
              <p className="text-sm font-bold text-stone-800 leading-relaxed">
                &ldquo;{currentMemory.caption}&rdquo;
              </p>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================= */}
      {/* MODE 3: GRID VIEW (شبكة الكروت) */}
      {/* ========================================================= */}
      {displayMode === 'grid' && (
        <main className="relative z-10 max-w-7xl mx-auto p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="bg-[#FAF8F5] text-stone-900 rounded-3xl p-4 shadow-xl border border-stone-200 flex flex-col"
              >
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-[10px]">
                    {memory.customer.slice(0, 2)}
                  </div>
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {memory.customer}
                  </p>
                </div>

                <div className="space-y-2 flex-1">
                  {memory.frames.map((src, fIdx) => (
                    <div
                      key={fIdx}
                      className="aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt="Photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                <p className="text-[11px] font-bold text-stone-700 mt-3 text-center truncate">
                  {memory.caption}
                </p>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* QR Code Modal for TV */}
      {isQrModalOpen && (
        <div
          onClick={() => setIsQrModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/85 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-amber-900/30 text-stone-900"
          >
            <h3 className="text-xl font-black text-stone-900 mb-1">
              التقط شريط ذكرياتك 📸
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              وجه كاميرا هاتفك نحو الكود لفتح كبينة التصوير واستلام هديتك
            </p>

            <div className="w-56 h-56 mx-auto bg-white rounded-2xl border-2 border-dashed border-amber-300 flex items-center justify-center p-4 mb-6 shadow-inner">
              <QrCode className="w-40 h-40 text-stone-900" />
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-stone-900 text-white font-bold text-xs hover:bg-black transition"
            >
              إغلاق الشاشة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
