'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { Coffee, QrCode, Maximize2, Sparkles, Heart, Clock, ArrowLeft, Play, Pause, AlertCircle, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PageProps {
  params: Promise<{ screenId: string }>;
}

interface WallMemory {
  id: string;
  customer: string;
  visitNum: number;
  caption: string;
  time: string;
  image: string;
}

const FALLBACK_MEMORIES: WallMemory[] = [
  {
    id: 'f1',
    customer: 'Sarah Mansour',
    visitNum: 5,
    caption: 'Best cortado in the city! Celebrating 5 visits today ☕✨',
    time: '2 mins ago',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1400&q=85',
  },
  {
    id: 'f2',
    customer: 'Omar Khaled',
    visitNum: 3,
    caption: 'Weekend work session with single origin V60 & pastry 🥐',
    time: '12 mins ago',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=85',
  },
  {
    id: 'f3',
    customer: 'Nour El-Din',
    visitNum: 4,
    caption: 'Espresso Lab morning light. My daily ritual ☕',
    time: '24 mins ago',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=85',
  }
];

export default function LiveWallPage({ params }: PageProps) {
  const { screenId } = use(params);
  const [memories, setMemories] = useState<WallMemory[]>(FALLBACK_MEMORIES);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [isCtaSlide, setIsCtaSlide] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Digital Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Live Memories from Supabase with 4-State Lifecycle
  const fetchApprovedMemories = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('organization_id', '00000000-0000-0000-0000-000000000001')
        .eq('status', 'approved')
        .eq('visibility', 'live_wall')
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        const mapped: WallMemory[] = data.map((m: any, idx: number) => {
          const date = new Date(m.created_at);
          const diffMin = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
          const timeAgo = diffMin < 60 ? `${diffMin}m ago` : `${Math.round(diffMin / 60)}h ago`;

          return {
            id: m.id,
            customer: m.customer_id === '00000000-0000-0000-0000-000000000005' ? 'Sarah Mansour' : 'Guest Regular',
            visitNum: Math.max(1, 5 - (idx % 5)),
            caption: m.caption || 'Specialty Coffee Moment ☕',
            time: timeAgo,
            image: m.original_url || m.optimized_url || FALLBACK_MEMORIES[idx % FALLBACK_MEMORIES.length].image
          };
        });

        setMemories(mapped);
      } else {
        setMemories(FALLBACK_MEMORIES);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Live Wall connection degraded. Showing local playlist.');
      setMemories(FALLBACK_MEMORIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovedMemories();

    const supabase = createClient();
    const channel = supabase
      .channel('live-wall-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories' },
        (payload: any) => {
          if (payload.new && payload.new.status === 'approved' && payload.new.visibility === 'live_wall') {
            const newMem: WallMemory = {
              id: payload.new.id,
              customer: 'Guest Regular',
              visitNum: 1,
              caption: payload.new.caption || 'Just shared a moment ☕',
              time: 'Just now',
              image: payload.new.original_url || payload.new.optimized_url || FALLBACK_MEMORIES[0].image
            };

            setToastMessage('🎉 New guest moment just approved for display!');
            setTimeout(() => setToastMessage(null), 5000);

            setMemories(prev => [newMem, ...prev.filter(m => m.id !== newMem.id)]);
            setIsCtaSlide(false);
            setCurrentIndex(0);
          } else if (payload.new && payload.new.status === 'hidden') {
            setMemories(prev => prev.filter(m => m.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchApprovedMemories]);

  // Keyboard navigation: Space = pause, Arrows = navigate, F = fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused(p => !p);
      } else if (e.code === 'ArrowRight') {
        setCurrentIndex(i => (i + 1) % memories.length);
        setIsCtaSlide(false);
      } else if (e.code === 'ArrowLeft') {
        setCurrentIndex(i => (i - 1 + memories.length) % memories.length);
        setIsCtaSlide(false);
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [memories.length]);

  // Slide Rotation Timer (every 7 seconds when not paused)
  useEffect(() => {
    if (memories.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setIsCtaSlide(prev => {
        if (!prev) {
          return true;
        } else {
          setCurrentIndex(idx => (idx + 1) % memories.length);
          return false;
        }
      });
    }, 7000);

    return () => clearInterval(timer);
  }, [memories.length, isPaused]);

  // Dynamic QR Code Generation
  useEffect(() => {
    import('qrcode').then(QRCode => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cafe-memories.vercel.app';
      const url = `${origin}/c/espresso-lab?wall=${screenId}`;

      QRCode.toString(
        url,
        {
          type: 'svg',
          margin: 1,
          color: { dark: '#0a0a0a', light: '#ffffff' }
        },
        (err, string) => {
          if (!err && string) {
            setQrSvg(string);
          }
        }
      );
    }).catch(() => {});
  }, [screenId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const currentMemory = memories[currentIndex] || FALLBACK_MEMORIES[0];

  return (
    <div className="relative w-screen h-screen bg-stone-950 text-white overflow-hidden flex flex-col font-sans select-none">
      {/* Realtime Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-sm shadow-2xl flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-5 h-5 text-stone-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Overlay */}
      <header className="absolute top-0 inset-x-0 z-30 px-8 py-5 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        <div className="flex items-center gap-3.5">
          <Link
            href="/"
            aria-label="Return home"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-lg tracking-tight text-white flex items-center gap-2">
              <span>Espresso Lab</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono">Screen #{screenId} • Main Hall Display</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs font-mono text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentTime || '00:00:00'}</span>
          </div>

          <button
            onClick={() => setIsPaused(p => !p)}
            aria-label={isPaused ? 'Play slide rotation' : 'Pause slide rotation'}
            className="min-h-[44px] px-3.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 text-xs font-semibold text-stone-300 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5 text-stone-400" />}
            <span>{isPaused ? 'Paused' : 'Auto'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 text-stone-300 hover:text-white transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-amber-500"
            title="Toggle Fullscreen (F)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Display Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {loading ? (
          /* Loading State: Luxury Skeleton Ambiance */
          <div className="relative z-10 max-w-5xl w-full h-[82vh] mx-auto p-4 flex flex-col md:flex-row items-center gap-8 rounded-3xl bg-stone-900/40 border border-stone-800/60 backdrop-blur-2xl animate-pulse">
            <div className="w-full md:w-3/5 h-full rounded-2xl bg-stone-800/50" />
            <div className="w-full md:w-2/5 p-4 space-y-4">
              <div className="h-4 bg-stone-800 rounded w-1/3" />
              <div className="h-8 bg-stone-800 rounded w-3/4" />
              <div className="h-6 bg-stone-800/60 rounded w-1/2" />
            </div>
          </div>
        ) : !isCtaSlide ? (
          /* Loaded Memory Slide */
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Background blurred ambiance */}
            <div
              className="absolute inset-0 bg-cover bg-center blur-3xl opacity-35 scale-110 transition-all duration-1000"
              style={{ backgroundImage: `url(${currentMemory.image})` }}
            />

            {/* Central Media Card */}
            <div className="relative z-10 max-w-5xl w-full h-[82vh] mx-auto p-4 flex flex-col md:flex-row items-center gap-8 rounded-3xl bg-stone-900/80 border border-stone-800/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
              {/* Photo Area */}
              <div className="w-full md:w-3/5 h-full relative rounded-2xl overflow-hidden shadow-inner bg-black">
                <img
                  src={currentMemory.image}
                  alt={currentMemory.caption}
                  className="w-full h-full object-cover transition-transform duration-[7000ms] ease-linear scale-105"
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-stone-700/60 text-xs font-bold text-amber-400 flex items-center gap-1.5 shadow-lg">
                  <Coffee className="w-3.5 h-3.5" />
                  Visit #{currentMemory.visitNum}
                </div>
              </div>

              {/* Memory Story Metadata */}
              <div className="w-full md:w-2/5 p-4 flex flex-col justify-between h-full text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
                    <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    Guest Moment
                  </div>

                  <blockquote className="text-2xl sm:text-3xl font-black text-white leading-snug tracking-tight">
                    &ldquo;{currentMemory.caption}&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3 pt-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-extrabold text-stone-950 text-base shadow-md">
                      {currentMemory.customer.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-base text-white">{currentMemory.customer}</div>
                      <div className="text-xs text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {currentMemory.time}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corner CTA with dynamic QR */}
                <div className="mt-6 pt-5 border-t border-stone-800 flex items-center justify-between gap-4 bg-stone-950/70 p-4 rounded-2xl border border-stone-800/80">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                      Share Your Moment
                    </span>
                    <span className="text-[11px] text-stone-300 block leading-tight">
                      Scan with your phone to appear right here & get rewards.
                    </span>
                  </div>
                  {qrSvg && (
                    <div
                      className="w-18 h-18 rounded-xl bg-white p-1.5 shadow-lg shrink-0 [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Who's Next? CTA Slide */
          <div className="relative z-10 max-w-3xl mx-auto p-10 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-sm font-bold shadow-lg shadow-amber-500/10">
              <Sparkles className="w-4 h-4" />
              <span>Who&apos;s Next On Screen?</span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Scan to put your photo on this TV screen.
            </h2>

            <p className="text-lg text-stone-400 max-w-xl mx-auto leading-relaxed">
              Open your camera, scan the QR code below, snap your coffee moment, and watch it broadcast live!
            </p>

            {/* Large Center QR Code */}
            <div className="inline-block p-4 rounded-3xl bg-white shadow-2xl shadow-amber-500/25 border-4 border-amber-400/20">
              {qrSvg ? (
                <div
                  className="w-48 h-48 sm:w-56 sm:h-56 [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-black">
                  <QrCode className="w-24 h-24" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm font-bold text-amber-400">
              <Coffee className="w-4 h-4" />
              <span>Espresso Lab • Table & Counter QR</span>
            </div>
          </div>
        )}
      </div>

      {/* Slide Indicators */}
      <footer className="absolute bottom-4 inset-x-0 z-30 flex items-center justify-center gap-2">
        {memories.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              !isCtaSlide && i === currentIndex ? 'w-8 bg-amber-400' : 'w-2 bg-stone-700'
            }`}
          />
        ))}
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${
            isCtaSlide ? 'w-8 bg-amber-400' : 'w-2 bg-stone-700'
          }`}
        />
      </footer>
    </div>
  );
}
