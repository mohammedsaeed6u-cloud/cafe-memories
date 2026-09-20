'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    customer: 'سارة منصور',
    caption: 'أفضل كورتادو وأجمل كبينة تصوير ذكريات! ✨☕',
    time: 'منذ دقيقتين',
    frames: [
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80'
    ],
    theme: 'white'
  },
  {
    id: 'f2',
    customer: 'أحمد وزياد',
    caption: 'جلسة عمل وقهوة صباحية في Memories 💻🚀',
    time: 'منذ 8 دقائق',
    frames: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80'
    ],
    theme: 'latte'
  },
  {
    id: 'f3',
    customer: 'مايا كمال',
    caption: 'جمعة الأصدقاء وأحلى لقطات فوتوبوث 🖤✨',
    time: 'منذ 15 دقيقة',
    frames: [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80'
    ],
    theme: 'noir'
  }
];

export function WallClient({ screenId }: { screenId: string }) {
  const [memories, setMemories] = useState<WallMemory[]>(FALLBACK_MEMORIES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync memories from Supabase
  const syncLiveFeed = useCallback(async () => {
    setIsSyncing(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && data.length > 0 && !error) {
        const mapped: WallMemory[] = data.map((m: any, i: number) => ({
          id: m.id || `m-${i}`,
          customer: m.customer_name || 'Guest',
          caption: m.caption || 'Specialty coffee moment ☕',
          time: 'الآن',
          frames: m.photos && m.photos.length > 0 ? m.photos : FALLBACK_MEMORIES[0].frames,
          theme: (m.frame_theme as any) || (i % 2 === 0 ? 'white' : 'latte')
        }));
        setMemories(mapped);
      }
      setLastSyncTime(new Date());
    } catch {
      // Keep fallbacks
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncLiveFeed();
    const interval = setInterval(syncLiveFeed, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [syncLiveFeed]);

  // Slideshow timer
  useEffect(() => {
    if (!isPlaying || memories.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % memories.length);
    }, 8000); // 8 seconds per memory strip

    return () => clearInterval(timer);
  }, [isPlaying, memories.length]);

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
    <div className="relative min-h-screen bg-[#FAF8F5] text-stone-900 overflow-hidden font-sans select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-200/40 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-[130px]" />
      </div>

      {/* Screen Top Header Bar */}
      <header className="relative z-20 px-8 py-5 flex items-center justify-between border-b border-stone-200/80 bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
            M
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-stone-900 flex items-center gap-2">
              <span>Memories • موميريز</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              شاشة العرض الحية التفاعلية • {screenId}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition"
            title="ملء الشاشة"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>امسح والتقط لحظتك 📸</span>
          </button>
        </div>
      </header>

      {/* Main Wall Visual Focus */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        {/* Memory Paper Strip Presentation */}
        <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-stone-200/80 animate-in fade-in duration-500 flex flex-col items-center">
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                {currentMemory.customer.slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900 leading-tight">
                  {currentMemory.customer}
                </p>
                <p className="text-[10px] text-stone-400">{currentMemory.time}</p>
              </div>
            </div>

            <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
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
          <div className="w-full mt-4 pt-3 border-t border-dashed border-stone-200 text-center">
            <p className="text-sm font-bold text-stone-800 leading-relaxed">
              &ldquo;{currentMemory.caption}&rdquo;
            </p>
          </div>
        </div>

        {/* Floating Call to Action */}
        <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-md rounded-full border border-stone-200 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
          <span className="text-xs font-bold text-stone-800">
            امسح الباركود على طاولتك أو من الكاشير لتظهر صورتك هنا فوراً!
          </span>
        </div>
      </main>

      {/* QR Code Modal for TV */}
      {isQrModalOpen && (
        <div
          onClick={() => setIsQrModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-stone-200"
          >
            <h3 className="text-xl font-black text-stone-900 mb-1">
              التقط شريط ذكرياتك 📸
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              وجه كاميرا هاتفك نحو الكود لفتح كبينة التصوير واستلام هديتك
            </p>

            <div className="w-56 h-56 mx-auto bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300 flex items-center justify-center p-4 mb-6 shadow-inner">
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
