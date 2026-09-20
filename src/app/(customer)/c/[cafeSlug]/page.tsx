'use client';

import React, { useState, useEffect, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Camera,
  Sparkles,
  Download,
  Share2,
  Tv,
  CheckCircle2,
  RefreshCw,
  X,
  Palette,
  Layers,
  Heart,
  Coffee,
  Languages
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PageProps {
  params: Promise<{ cafeSlug: string }>;
}

interface MemoryEntry {
  id: string;
  date: string;
  caption: string;
  img: string;
}

export default function CustomerPhotoBoothPage({ params }: PageProps) {
  const { cafeSlug } = use(params);
  const cafeName = cafeSlug ? cafeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Espresso Lab';

  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [borderTheme, setBorderTheme] = useState<'white' | 'noir' | 'latte' | 'matcha'>('white');
  const [filterStyle, setFilterStyle] = useState<'warm' | 'mono' | 'tokyo' | 'vintage'>('warm');

  const [frames, setFrames] = useState<string[]>([
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  ]);

  const [activeFrameIndex, setActiveFrameIndex] = useState<number | null>(null);
  const [customCaption, setCustomCaption] = useState('Aesthetic morning roast & good talks ✨');
  const [wallConsent, setWallConsent] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRecentMemories = useCallback(async () => {
    try {
      setLoadingMemories(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      if (data && data.length > 0) {
        setMemories(
          data.map(m => ({
            id: m.id,
            date: new Date(m.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
              month: 'short',
              day: 'numeric',
            }),
            caption: m.caption || 'Specialty Coffee Memory',
            img: m.optimized_url || m.original_url,
          }))
        );
      }
    } catch {
      setMemories([
        {
          id: '1',
          date: 'Sep 20',
          caption: 'Best flat white in town ☕',
          img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: '2',
          date: 'Sep 19',
          caption: 'Golden hour study corner 📖',
          img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
        },
      ]);
    } finally {
      setLoadingMemories(false);
    }
  }, [lang]);

  useEffect(() => {
    loadRecentMemories();
  }, [loadRecentMemories]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (activeFrameIndex !== null) {
        const nextFrames = [...frames];
        nextFrames[activeFrameIndex] = result;
        setFrames(nextFrames);
        setActiveFrameIndex(null);
      } else {
        setFrames([result, result, result]);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerUploadForFrame = (index: number) => {
    setActiveFrameIndex(index);
    fileInputRef.current?.click();
  };

  const handleBroadcastToWall = async () => {
    setUploading(true);
    try {
      const supabase = createClient();
      const primaryPhoto = frames[0];

      const { error } = await supabase.from('memories').insert({
        organization_id: '00000000-0000-0000-0000-000000000001',
        branch_id: '00000000-0000-0000-0000-000000000002',
        customer_id: '00000000-0000-0000-0000-000000000005',
        original_url: primaryPhoto,
        optimized_url: primaryPhoto,
        thumbnail_url: primaryPhoto,
        caption: customCaption,
        status: 'approved',
        visibility: wallConsent ? 'live_wall' : 'private',
      });

      if (error) {
        console.warn('Database insert fallback:', error.message);
      }

      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 6000);
      loadRecentMemories();
    } catch (err: any) {
      alert('Error broadcasting: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadStrip = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 2000;

    const bgColors: Record<string, string> = {
      white: '#FAF8F5',
      noir: '#1A1817',
      latte: '#EBE3D5',
      matcha: '#E2E8DE',
    };
    const textColors: Record<string, string> = {
      white: '#231B18',
      noir: '#F5EBE6',
      latte: '#3D2F28',
      matcha: '#2B382A',
    };

    ctx.fillStyle = bgColors[borderTheme] || '#FAF8F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = textColors[borderTheme] || '#231B18';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText(cafeName.toUpperCase(), 400, 100);

    ctx.font = '18px monospace';
    ctx.fillText('• PHOTO BOOTH STRIP •', 400, 135);

    let loadedCount = 0;
    frames.forEach((src, idx) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => {
        const frameY = 170 + idx * 520;
        const frameWidth = 700;
        const frameHeight = 490;
        const frameX = 50;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(frameX, frameY, frameWidth, frameHeight, 16);
        ctx.clip();

        if (filterStyle === 'mono') {
          ctx.filter = 'grayscale(100%) contrast(1.1)';
        } else if (filterStyle === 'vintage') {
          ctx.filter = 'sepia(40%) contrast(1.05) brightness(0.95)';
        } else if (filterStyle === 'tokyo') {
          ctx.filter = 'saturate(1.2) brightness(1.05)';
        }

        ctx.drawImage(img, frameX, frameY, frameWidth, frameHeight);
        ctx.restore();

        loadedCount++;
        if (loadedCount === frames.length) {
          ctx.fillStyle = textColors[borderTheme] || '#231B18';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText(customCaption, 400, 1800);

          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
          ctx.font = '18px monospace';
          ctx.fillText(`${dateStr} • SPECIALTY ROASTERY • SHOT #${Math.floor(1000 + Math.random() * 9000)}`, 400, 1850);

          const link = document.createElement('a');
          link.download = `${cafeSlug}-photobooth-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      };
    });
  };

  const filterClasses: Record<string, string> = {
    warm: 'sepia-[0.25] saturate-[1.2] contrast-[1.05]',
    mono: 'grayscale contrast-[1.25]',
    tokyo: 'brightness-[1.06] saturate-[1.3] contrast-[1.05]',
    vintage: 'sepia-[0.45] brightness-[0.95] contrast-[1.1]',
  };

  const borderClasses: Record<string, { bg: string; text: string; subText: string; frameBg: string }> = {
    white: {
      bg: 'bg-[#FAF8F5]',
      text: 'text-stone-900',
      subText: 'text-stone-600',
      frameBg: 'bg-stone-200/80',
    },
    noir: {
      bg: 'bg-[#181615]',
      text: 'text-stone-100',
      subText: 'text-stone-400',
      frameBg: 'bg-stone-800',
    },
    latte: {
      bg: 'bg-[#EFE8DC]',
      text: 'text-amber-950',
      subText: 'text-amber-900/70',
      frameBg: 'bg-amber-200/50',
    },
    matcha: {
      bg: 'bg-[#E6ECE3]',
      text: 'text-emerald-950',
      subText: 'text-emerald-900/70',
      frameBg: 'bg-emerald-200/50',
    },
  };

  const currentTheme = borderClasses[borderTheme];

  return (
    <div
      className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-stone-950 pb-24"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-stone-950/80 border-b border-stone-800/80 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-600/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-stone-100">{cafeName}</h1>
              <p className="text-[11px] text-amber-400/90 font-medium">
                {lang === 'ar' ? 'كابينة تصوير الذكريات • Photo Booth' : 'Live Memory Photo Booth'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/wall/screen-101"
              target="_blank"
              className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-semibold text-stone-300 flex items-center gap-1.5 transition-colors"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'شاشة الكافيه' : 'Live Wall'}</span>
            </Link>
            <button
              onClick={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
              className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-white text-xs"
              aria-label="Toggle language"
            >
              <Languages className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {broadcastSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <div>
              <p className="font-bold">{lang === 'ar' ? 'تم العرض على شاشة الكافيه!' : 'Broadcasting Live to Café Wall!'}</p>
              <p className="text-xs text-emerald-400/80">
                {lang === 'ar' ? 'صورتك معروضة الآن في صالة الكافيه للجميع' : 'Your strip is now rotating on in-venue screens'}
              </p>
            </div>
          </div>
        )}

        <div className="text-center space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {lang === 'ar' ? 'التقط شريط صور الفوتو بوث الخاص بك' : 'Snap Your Specialty Photo Strip'}
          </span>
          <h2 className="text-xl font-black tracking-tight text-stone-100">
            {lang === 'ar' ? 'ذكريات قهوتك في شريط كلاسيكي' : 'Authentic Café Photobooth'}
          </h2>
          <p className="text-xs text-stone-400">
            {lang === 'ar' ? 'اضغط على أي إطار لتغيير الصورة أو التقاط لقطة جديدة' : 'Tap any frame to capture or replace a photo'}
          </p>
        </div>

        {/* Studio Controls */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800/80 space-y-3 shadow-lg">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2 text-stone-400">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                {lang === 'ar' ? 'لون إطار الشريط' : 'Strip Border Color'}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-mono">{borderTheme}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'white', label: lang === 'ar' ? 'أبيض كلاسيك' : 'Ivory White', bg: 'bg-[#FAF8F5] text-stone-900' },
                { key: 'noir', label: lang === 'ar' ? 'أسود فيلم' : 'Film Noir', bg: 'bg-[#181615] text-stone-100' },
                { key: 'latte', label: lang === 'ar' ? 'لاتيه دافئ' : 'Warm Latte', bg: 'bg-[#EFE8DC] text-amber-950' },
                { key: 'matcha', label: lang === 'ar' ? 'ماتشا ناعم' : 'Soft Matcha', bg: 'bg-[#E6ECE3] text-emerald-950' },
              ].map(theme => (
                <button
                  key={theme.key}
                  onClick={() => setBorderTheme(theme.key as any)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                    borderTheme === theme.key
                      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-950 border-amber-400'
                      : 'border-stone-800 hover:border-stone-700 opacity-80'
                  } ${theme.bg}`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800/60">
            <div className="flex items-center justify-between text-xs font-semibold mb-2 text-stone-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                {lang === 'ar' ? 'فلتر الصورة الفينتاج' : 'Vintage Grain Filter'}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-mono">{filterStyle}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'warm', label: lang === 'ar' ? 'محمص' : 'Warm 35mm' },
                { key: 'mono', label: lang === 'ar' ? 'أبيض/أسود' : 'B&W Film' },
                { key: 'tokyo', label: lang === 'ar' ? 'طوكيو' : 'Tokyo Glow' },
                { key: 'vintage', label: lang === 'ar' ? 'أنتيك' : 'Vintage' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterStyle(f.key as any)}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    filterStyle === f.key
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-bold'
                      : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PHOTO BOOTH STRIP */}
        <div className="flex justify-center">
          <div
            className={`w-[320px] rounded-3xl p-5 shadow-2xl transition-all duration-300 ${currentTheme.bg} ${currentTheme.text}`}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="text-center pb-4 pt-1 border-b border-current/10 mb-4 space-y-0.5">
              <div className="flex items-center justify-center gap-1.5 text-xs tracking-widest font-black uppercase font-serif">
                <Coffee className="w-3.5 h-3.5 opacity-80" />
                <span>{cafeName}</span>
                <Coffee className="w-3.5 h-3.5 opacity-80" />
              </div>
              <p className="text-[10px] tracking-[0.2em] uppercase font-mono opacity-60">
                PHOTO BOOTH • MEMORY STRIP
              </p>
            </div>

            <div className="space-y-3.5">
              {frames.map((src, index) => (
                <div
                  key={index}
                  onClick={() => triggerUploadForFrame(index)}
                  className={`group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer shadow-inner transition-transform active:scale-[0.98] border border-black/10 ${currentTheme.frameBg}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Photobooth shot ${index + 1}`}
                    className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${filterClasses[filterStyle]}`}
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-white tracking-wider">
                    0{index + 1}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                    <Camera className="w-6 h-6 text-amber-300 animate-bounce" />
                    <span className="text-[11px] font-bold">
                      {lang === 'ar' ? 'اضغط لتغيير الصورة' : 'Tap to change'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-current/10 text-center space-y-2">
              <input
                type="text"
                value={customCaption}
                onChange={e => setCustomCaption(e.target.value)}
                placeholder={lang === 'ar' ? 'اكتب تعليقاً على الشريط...' : 'Add a caption to your strip...'}
                className="w-full text-center bg-transparent border-b border-current/20 pb-1 text-xs font-semibold tracking-tight focus:outline-none focus:border-amber-500 placeholder:opacity-40"
              />

              <div className="flex items-center justify-between text-[9px] font-mono tracking-wider opacity-60 pt-1">
                <span>{new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</span>
                <span>RIYADH • ROASTERY</span>
                <span>#BOOTH-{Math.floor(100 + Math.random() * 900)}</span>
              </div>

              <div className="pt-2 flex justify-center opacity-40">
                <div className="h-6 flex items-end gap-[2px]">
                  {[4, 2, 6, 1, 3, 5, 2, 4, 6, 2, 1, 4, 3, 6, 2, 5, 1, 3, 6, 2, 4, 1, 5, 3].map((h, i) => (
                    <div
                      key={i}
                      className="w-[2px] bg-current"
                      style={{ height: `${h * 3.5}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80 text-xs text-stone-300">
            <input
              type="checkbox"
              id="wallConsent"
              checked={wallConsent}
              onChange={e => setWallConsent(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500 bg-stone-800 border-stone-700"
            />
            <label htmlFor="wallConsent" className="cursor-pointer">
              {lang === 'ar'
                ? 'عرض شريط الصور مباشرة على شاشة التلفزيون في الكافيه (Live Wall)'
                : 'Project strip onto in-venue Café TV Screen (Live Wall)'}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadStrip}
              className="py-3.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 font-bold text-xs text-stone-100 flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{lang === 'ar' ? 'حفظ شريط الصور' : 'Download Strip'}</span>
            </button>

            <button
              onClick={handleBroadcastToWall}
              disabled={uploading}
              className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {uploading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Tv className="w-4 h-4" />
              )}
              <span>{lang === 'ar' ? 'إرسال لشاشة الكافيه' : 'Broadcast to TV'}</span>
            </button>
          </div>
        </div>

        {/* Live Guest Memories Roll */}
        <div className="pt-8 border-t border-stone-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <h3 className="font-bold text-sm text-stone-200">
                {lang === 'ar' ? 'شريط ذكريات رواد الكافيه اليوم' : "Today's Guest Memory Strips"}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              {memories.length} {lang === 'ar' ? 'ذكريات' : 'Memories'}
            </span>
          </div>

          {loadingMemories ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map(n => (
                <div key={n} className="aspect-[3/4] rounded-2xl bg-stone-900 animate-pulse border border-stone-800" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {memories.map(item => (
                <div
                  key={item.id}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-900 border border-stone-800/80 shadow-md transition-all hover:scale-[1.02]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.img}
                    alt={item.caption}
                    className="w-full h-full object-cover sepia-[0.15] contrast-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end text-white">
                    <p className="text-xs font-bold line-clamp-1">{item.caption}</p>
                    <p className="text-[10px] text-amber-300/80 font-mono mt-0.5">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
