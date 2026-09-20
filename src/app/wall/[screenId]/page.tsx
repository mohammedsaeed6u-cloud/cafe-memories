'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import {
  Coffee,
  QrCode,
  Maximize2,
  Sparkles,
  Heart,
  Clock,
  ArrowLeft,
  Play,
  Pause,
  AlertCircle,
  RefreshCw,
  Camera
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PageProps {
  params: Promise<{ screenId: string }>;
}

interface WallMemory {
  id: string;
  customer: string;
  caption: string;
  time: string;
  frames: string[];
  theme: 'white' | 'noir' | 'latte';
}

const FALLBACK_MEMORIES: WallMemory[] = [
  {
    id: 'f1',
    customer: 'Sarah Mansour',
    caption: 'Best cortado in the city! Aesthetic coffee booth ✨☕',
    time: '2 mins ago',
    frames: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=85',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=85',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=85',
    ],
    theme: 'white',
  },
  {
    id: 'f2',
    customer: 'Omar Khaled',
    caption: 'Single origin V60 & sourdough croissant 🥐',
    time: '12 mins ago',
    frames: [
      'https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=800&q=85',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=85',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=85',
    ],
    theme: 'noir',
  },
  {
    id: 'f3',
    customer: 'Nour El-Din',
    caption: 'Memories • موميريز morning light. Our favorite weekend ritual ☕',
    time: '25 mins ago',
    frames: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=85',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=85',
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=85',
    ],
    theme: 'latte',
  }
];

export default function PhotoBoothLiveWall({ params }: PageProps) {
  const { screenId } = use(params);
  const [memories, setMemories] = useState<WallMemory[]>(FALLBACK_MEMORIES);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string>('');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate QR for scanning at table
  useEffect(() => {
    import('qrcode').then(QRCode => {
      const targetUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/c/demo-cafe`
        : 'https://cafe-memories.vercel.app/c/demo-cafe';

      QRCode.toString(
        targetUrl,
        {
          type: 'svg',
          margin: 1,
          color: { dark: '#1c1917', light: '#ffffff' },
        },
        (err, svg) => {
          if (!err && svg) setQrSvg(svg);
        }
      );
    });
  }, []);

  // Fetch real memories from Supabase
  const fetchLiveMemories = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: WallMemory[] = data.map((m: any, idx: number) => {
          const mainImg = m.optimized_url || m.original_url;
          const themes: ('white' | 'noir' | 'latte')[] = ['white', 'noir', 'latte'];
          return {
            id: m.id,
            customer: m.customer_id === '00000000-0000-0000-0000-000000000005' ? 'Sarah Mansour' : `Guest #${100 + idx}`,
            caption: m.caption || 'Specialty Coffee Photo Booth Strip ✨',
            time: 'Just now',
            frames: [mainImg, mainImg, mainImg],
            theme: themes[idx % 3],
          };
        });
        setMemories(mapped);
      }
    } catch {
      // Use fallback memories
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveMemories();

    // Supabase Realtime channel
    const supabase = createClient();
    const channel = supabase
      .channel('public:memories_booth_wall')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'memories' },
        (payload: any) => {
          const newMem = payload.new;
          if (newMem && (newMem.status === 'approved' || newMem.visibility === 'live_wall')) {
            const mainImg = newMem.optimized_url || newMem.original_url;
            setToastMessage('📸 New Guest Photo Booth Strip Just Captured!');
            setMemories(prev => [
              {
                id: newMem.id,
                customer: 'Table Guest',
                caption: newMem.caption || 'Photo Booth Strip ✨',
                time: 'Just now',
                frames: [mainImg, mainImg, mainImg],
                theme: 'white',
              },
              ...prev,
            ]);
            setCurrentIndex(0);
            setTimeout(() => setToastMessage(null), 7000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLiveMemories]);

  // Slideshow auto-rotation (10 seconds)
  useEffect(() => {
    if (isPaused || memories.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % memories.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [isPaused, memories.length]);

  const currentStrip = memories[currentIndex] || memories[0];

  const themeStyles = {
    white: {
      bg: 'bg-[#FAF8F5]',
      text: 'text-stone-900',
      border: 'border-stone-300',
    },
    noir: {
      bg: 'bg-[#181615]',
      text: 'text-stone-100',
      border: 'border-stone-800',
    },
    latte: {
      bg: 'bg-[#EFE8DC]',
      text: 'text-amber-950',
      border: 'border-amber-200',
    },
  }[currentStrip.theme || 'white'];

  return (
    <div className="relative min-h-screen w-full bg-stone-950 text-stone-100 overflow-hidden flex flex-col font-sans select-none">
      {/* Background Ambient Glow */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-25 scale-125 transition-all duration-1000 pointer-events-none"
        style={{ backgroundImage: `url(${currentStrip.frames[0]})` }}
      />

      {/* Top Ambient Bar */}
      <header className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-stone-800/60 backdrop-blur-xl bg-stone-950/70">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-white">Memories • موميريز</span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                LIVE BOOTH
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono">Screen #{screenId} • Main Seating Wall</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900/80 border border-stone-800 text-xs font-mono text-amber-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{currentTime || '12:00:00 PM'}</span>
          </div>

          <button
            onClick={() => setIsPaused(p => !p)}
            className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs font-semibold text-stone-300 hover:text-white flex items-center gap-2"
          >
            {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'Paused' : 'Auto-Rotating'}</span>
          </button>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-amber-500 text-stone-950 font-black text-sm flex items-center gap-3 shadow-2xl animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Live Photo Booth Projection Stage */}
      <div className="flex-1 relative z-10 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* THE MEMORIES PHOTO STRIP (Centerpiece) */}
          <div className="relative group">
            <div
              className={`w-[260px] md:w-[310px] rounded-3xl p-5 shadow-2xl transition-all duration-700 animate-in fade-in zoom-in-95 ${themeStyles.bg} ${themeStyles.text}`}
              style={{
                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              {/* Header */}
              <div className="text-center pb-3 border-b border-current/10 mb-3 space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-xs font-serif font-black tracking-widest uppercase">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>MEMORIES • موميريز</span>
                  <Coffee className="w-3.5 h-3.5" />
                </div>
                <p className="text-[9px] font-mono tracking-widest uppercase opacity-60">
                  PHOTO BOOTH • MEMORY STRIP
                </p>
              </div>

              {/* 3 Stacked Photos */}
              <div className="space-y-3">
                {currentStrip.frames.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-inner border border-black/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Shot ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-[8000ms] ease-linear scale-105"
                    />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono font-bold text-white">
                      0{idx + 1}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-3 mt-3 border-t border-current/10 text-center space-y-1.5">
                <p className="text-xs font-bold line-clamp-1 italic font-serif">
                  &ldquo;{currentStrip.caption}&rdquo;
                </p>
                <div className="flex items-center justify-between text-[9px] font-mono opacity-60">
                  <span>{new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</span>
                  <span>RIYADH • ROASTERY</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Companion: Guest Metadata & Table Scan QR */}
          <div className="max-w-md w-full space-y-8 text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Captured by Café Guest</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {currentStrip.customer}
              </h2>
              <p className="text-lg text-stone-300 font-serif italic">
                &ldquo;{currentStrip.caption}&rdquo;
              </p>
            </div>

            {/* QR Card for guests sitting in the café */}
            <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 backdrop-blur-xl shadow-2xl flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white p-2 shrink-0 shadow-lg flex items-center justify-center">
                {qrSvg ? (
                  <div
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <QrCode className="w-12 h-12 text-stone-900" />
                )}
              </div>
              <div className="space-y-1">
                <div className="text-amber-400 font-black text-xs uppercase tracking-wider">
                  Snap Your Memory
                </div>
                <h3 className="font-bold text-base text-white">Scan to Take a Photo Strip</h3>
                <p className="text-xs text-stone-400">
                  Scan with your phone camera at your table to take your own photo booth strip and project it here live.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
