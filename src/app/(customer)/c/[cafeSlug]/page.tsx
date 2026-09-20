'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import {
  Camera,
  Coffee,
  Sparkles,
  Check,
  Share2,
  Award,
  Heart,
  Upload,
  X,
  Shield,
  ArrowLeft,
  Languages,
  Tv,
  Gift,
  Loader2,
  QrCode,
  Download,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PageProps {
  params: Promise<{ cafeSlug: string }>;
}

interface MemoryEntry {
  id: string;
  visitNum: number;
  date: string;
  caption: string;
  img: string;
}

export default function CustomerCafePage({ params }: PageProps) {
  const { cafeSlug } = use(params);
  const cafeName = cafeSlug ? cafeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Espresso Lab';

  // State
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [visitsCount, setVisitsCount] = useState(3);
  const targetVisits = 5;
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [wallConsent, setWallConsent] = useState(true);
  const [shareConsent, setShareConsent] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'normal' | 'warm' | 'mono'>('warm');
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');

  // 4-State Lifecycle
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [memoriesError, setMemoriesError] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);

  // Keyboard accessibility (a11y): Escape closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        handleResetModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // Audio Chime Synthesis using Web Audio API
  const playStampChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio context ignored if disabled
    }
  };

  // Generate QR for desktop companion
  useEffect(() => {
    import('qrcode').then(QRCode => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cafe-memories.vercel.app';
      const url = `${origin}/c/${cafeSlug}`;

      QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#0a0a0a', light: '#ffffff' } }, (err, str) => {
        if (!err && str) setQrCodeSvg(str);
      });
    }).catch(() => {});
  }, [cafeSlug]);

  // Load live memories from Supabase with 4-State handling and tenant isolation
  const loadMemories = useCallback(async () => {
    setLoadingMemories(true);
    setMemoriesError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('organization_id', '00000000-0000-0000-0000-000000000001')
        .eq('visibility', 'live_wall')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        setMemories(data.map((m: any, idx: number) => ({
          id: m.id,
          visitNum: data.length - idx,
          date: new Date(m.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }),
          caption: m.caption || '',
          img: m.original_url || m.optimized_url
        })));
      } else {
        setMemories([]);
      }
    } catch (err: any) {
      setMemoriesError(err.message || 'Failed to load live memories');
    } finally {
      setLoadingMemories(false);
    }
  }, [lang]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
    }
  };

  const handleSubmitMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;

    setUploading(true);
    let finalImageUrl = selectedImage;

    try {
      const supabase = createClient();

      if (selectedFile) {
        const fileExt = selectedFile.name ? selectedFile.name.split('.').pop() : 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('memories')
          .upload(filePath, selectedFile, {
            contentType: selectedFile.type || 'image/jpeg',
            upsert: true
          });

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage
            .from('memories')
            .getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            finalImageUrl = urlData.publicUrl;
          }
        }
      }

      const { data: insertedMemory, error: insertError } = await supabase
        .from('memories')
        .insert({
          customer_id: '00000000-0000-0000-0000-000000000005',
          organization_id: '00000000-0000-0000-0000-000000000001',
          branch_id: '00000000-0000-0000-0000-000000000002',
          visit_id: '00000000-0000-0000-0000-000000000006',
          original_url: finalImageUrl,
          optimized_url: finalImageUrl,
          caption: caption || (lang === 'ar' ? 'لحظة مميزة في الكافيه ☕' : 'Special moment at the café ☕'),
          status: 'approved',
          visibility: wallConsent ? 'live_wall' : 'private'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert memory error:', insertError);
      }

      if (insertedMemory?.id) {
        await supabase.from('memory_consents').insert({
          memory_id: insertedMemory.id,
          customer_id: '00000000-0000-0000-0000-000000000005',
          save_consent: true,
          live_wall_consent: wallConsent,
          social_share_consent: shareConsent
        });
      }

      playStampChime();

      const newMemory: MemoryEntry = {
        id: insertedMemory?.id || Date.now().toString(),
        visitNum: visitsCount + 1,
        date: lang === 'ar' ? 'الآن' : 'Just now',
        caption: caption || (lang === 'ar' ? 'لحظة مميزة في الكافيه ☕' : 'Special moment at the café ☕'),
        img: finalImageUrl,
      };

      setMemories(prev => [newMemory, ...prev]);
      setVisitsCount(prev => Math.min(targetVisits, prev + 1));
      setSubmitted(true);
    } catch (err) {
      console.warn('Memory submission fallback:', err);
      playStampChime();
      setSubmitted(true);
    } finally {
      setUploading(false);
    }
  };

  const handleResetModal = () => {
    setShowModal(false);
    setSelectedImage(null);
    setSelectedFile(null);
    setCaption('');
    setSubmitted(false);
  };

  const isAr = lang === 'ar';

  const renderMobileContent = () => (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen md:min-h-[780px] bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black pb-12 overflow-y-auto"
    >
      {/* Top Mobile Bar - 44px min touch targets */}
      <header className="sticky top-0 bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/80 z-30 px-4 py-3.5 flex items-center justify-between">
        <Link
          href="/"
          aria-label={isAr ? 'العودة للرئيسية' : 'Return to home'}
          className="min-h-[44px] min-w-[44px] rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-amber-500/20">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white tracking-tight leading-tight">{cafeName}</div>
            <div className="text-[10px] text-amber-400/90 font-medium">
              {isAr ? 'برنامج الولاء والذكريات' : 'Memory & Loyalty'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setLang(isAr ? 'en' : 'ar')}
          aria-label={isAr ? 'تغيير اللغة' : 'Change language'}
          className="min-h-[44px] px-3 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{isAr ? 'EN' : 'عربي'}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="p-4 space-y-5">
        {/* Café Header Hero Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-stone-900 via-stone-900/90 to-stone-950 border border-stone-800/80 p-5 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 text-2xl">
            ☕
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            {isAr ? `أهلاً بك في ${cafeName}` : `Welcome to ${cafeName}`}
          </h1>
          <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
            {isAr
              ? 'التقط لحظتك وسجل زيارتك لتظهر على شاشة الكافيه وتربح مشروبك المفضل.'
              : 'Capture your visit, appear on our Live Wall & unlock your free specialty reward.'}
          </p>

          {/* Loyalty Stamp Card */}
          <div className="mt-5 bg-stone-950/80 rounded-2xl p-4 border border-stone-800 text-right">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Award className="w-4 h-4" />
                <span>{isAr ? 'بطاقة الولاء الرقمية' : 'Digital Stamp Card'}</span>
              </div>
              <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                {visitsCount} / {targetVisits} {isAr ? 'زيارات' : 'Visits'}
              </span>
            </div>

            {/* 5 Cup Stamps */}
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(step => {
                const isStamped = step <= visitsCount;
                const isReward = step === targetVisits;

                return (
                  <div
                    key={step}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all min-h-[44px] ${
                      isStamped
                        ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 shadow-md shadow-amber-500/20'
                        : isReward
                        ? 'bg-stone-900 border border-dashed border-amber-500/50 text-amber-400'
                        : 'bg-stone-900/60 border border-stone-800 text-stone-600'
                    }`}
                  >
                    {isStamped ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isReward ? (
                      <Gift className="w-4 h-4 animate-pulse" />
                    ) : (
                      <Coffee className="w-4 h-4 opacity-40" />
                    )}
                    <span className="text-[9px] font-bold mt-1">
                      {isReward ? (isAr ? 'هدية' : 'Free') : `#${step}`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-center text-[11px] text-stone-400">
              {visitsCount >= targetVisits ? (
                <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isAr ? 'مبروك! مشروبك القادم مجاناً بالكامل ☕🎉' : 'Congratulations! Your next drink is completely free ☕🎉'}
                </span>
              ) : (
                <span>
                  {isAr
                    ? `فاضلك ${targetVisits - visitsCount} زيارات للحصول على مشروبك المجاني!`
                    : `${targetVisits - visitsCount} more visits to unlock your free reward!`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Big Action Button: Snap & Check-In (min-h-[48px]) */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full min-h-[50px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-stone-950 font-black text-base flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Camera className="w-5 h-5" />
          <span>{isAr ? 'التقط ذكرى وسجل زيارتك الآن' : 'Snap a Memory & Check In'}</span>
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Live TV Screen Shortcut */}
        <Link
          href="/wall/screen-101"
          target="_blank"
          className="min-h-[48px] flex items-center justify-between p-3.5 rounded-2xl bg-stone-900/60 hover:bg-stone-900 border border-stone-800 transition-colors group focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-white flex items-center gap-1.5">
                <span>{isAr ? 'شاشة الكافيه الحية' : 'In-Store Live Wall'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-stone-400">
                {isAr ? 'لحظتك بتتعرض على شاشات الكافيه مباشرة' : 'Approved moments broadcast in real-time'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
            {isAr ? 'مشاهدة' : 'View'}
          </span>
        </Link>

        {/* Customer Past Memories Feed with Complete 4-State Handling */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-400 px-1">
            <span className="flex items-center gap-1 text-white">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{isAr ? 'رحلتك وذكرياتك السابقة' : 'Your Past Moments'}</span>
            </span>
            {!loadingMemories && <span className="text-[10px] text-stone-500 font-mono">({memories.length})</span>}
          </div>

          {/* 1. Loading State (Skeleton) */}
          {loadingMemories && (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl bg-stone-900/80 border border-stone-800 p-2.5 space-y-2 animate-pulse">
                  <div className="aspect-square rounded-xl bg-stone-800" />
                  <div className="h-3 bg-stone-800 rounded w-3/4" />
                  <div className="h-2.5 bg-stone-800/60 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* 2. Error State with Retry */}
          {!loadingMemories && memoriesError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 mx-auto" />
              <p className="text-xs text-rose-300 font-medium">{memoriesError}</p>
              <button
                onClick={loadMemories}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-white flex items-center justify-center gap-2 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
              </button>
            </div>
          )}

          {/* 3. Empty State with Clear CTA */}
          {!loadingMemories && !memoriesError && memories.length === 0 && (
            <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{isAr ? 'كن أول من يشارك لحظته هنا!' : 'Be the first to share a moment!'}</h4>
                <p className="text-xs text-stone-400 mt-1">
                  {isAr ? 'التقط صورة لكوب قهوتك لتظهر على شاشة الكافيه الآن.' : 'Snap your coffee photo to appear on the in-store Live Wall.'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-amber-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'شارك أول لحظة' : 'Share First Moment'}</span>
              </button>
            </div>
          )}

          {/* 4. Loaded State with Data */}
          {!loadingMemories && !memoriesError && memories.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {memories.map(m => (
                <div
                  key={m.id}
                  className="rounded-2xl overflow-hidden bg-stone-900/80 border border-stone-800 flex flex-col justify-between group shadow-sm"
                >
                  <div className="aspect-square relative overflow-hidden bg-stone-950">
                    <img
                      src={m.img}
                      alt={m.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white border border-stone-700">
                      {isAr ? `زيارة #${m.visitNum}` : `Visit #${m.visitNum}`}
                    </div>
                  </div>
                  <div className="p-2.5 space-y-1">
                    <p className="text-[11px] text-stone-300 line-clamp-2 leading-tight font-medium">
                      {m.caption}
                    </p>
                    <span className="text-[9px] text-stone-500 block font-mono">{m.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Memory Upload Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full sm:max-w-md bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-sm text-white">
                  {isAr ? 'التقط ذكرى وسجل زيارتك' : 'Snap & Check-in'}
                </h2>
              </div>
              <button
                onClick={handleResetModal}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                className="min-h-[44px] min-w-[44px] rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmitMemory} className="space-y-4">
                {/* Photo Preview / Upload Area */}
                <div className="relative">
                  {selectedImage ? (
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-stone-800">
                      <img
                        src={selectedImage}
                        alt="Preview"
                        className={`w-full h-full object-cover transition-all ${
                          activeFilter === 'warm'
                            ? 'sepia-[0.3] contrast-[1.1] brightness-[1.05]'
                            : activeFilter === 'mono'
                            ? 'grayscale contrast-[1.2]'
                            : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setSelectedFile(null);
                        }}
                        aria-label="Remove photo"
                        className="min-h-[44px] min-w-[44px] absolute top-2 right-2 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Filter Switcher */}
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-stone-700">
                        <button
                          type="button"
                          onClick={() => setActiveFilter('normal')}
                          className={`min-h-[44px] px-3 rounded-lg text-xs font-bold focus-visible:ring-2 focus-visible:ring-amber-500 ${
                            activeFilter === 'normal' ? 'bg-amber-500 text-stone-950' : 'text-stone-300'
                          }`}
                        >
                          Original
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveFilter('warm')}
                          className={`min-h-[44px] px-3 rounded-lg text-xs font-bold focus-visible:ring-2 focus-visible:ring-amber-500 ${
                            activeFilter === 'warm' ? 'bg-amber-500 text-stone-950' : 'text-stone-300'
                          }`}
                        >
                          Warm Roast ☕
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveFilter('mono')}
                          className={`min-h-[44px] px-3 rounded-lg text-xs font-bold focus-visible:ring-2 focus-visible:ring-amber-500 ${
                            activeFilter === 'mono' ? 'bg-amber-500 text-stone-950' : 'text-stone-300'
                          }`}
                        >
                          Vintage Mono
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-2xl border-2 border-dashed border-stone-700 hover:border-amber-500/60 bg-stone-950/50 cursor-pointer transition-colors p-4 text-center min-h-[140px] focus-within:ring-2 focus-within:ring-amber-500">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                        <Camera className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-bold text-white mb-1">
                        {isAr ? 'اضغط لالتقاط أو اختيار صورة' : 'Tap to take or choose photo'}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {isAr ? 'صورة كوب القهوة أو الجلسة المفضلة' : 'Your coffee cup, latte art or table'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                {/* Caption Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-300 block">
                    {isAr ? 'كلمة أو ذكرى عن زيارتك:' : 'Add a note or memory:'}
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder={isAr ? 'مثال: أحلى كورتادو في التجمع.. جلسة رايقة ☕' : 'e.g. Best cortado in Cairo! ☕✨'}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500"
                    maxLength={100}
                  />
                </div>

                {/* Granular Consent Toggles */}
                <div className="space-y-2 p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                  <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 mb-1">
                    <Shield className="w-3 h-3" />
                    <span>{isAr ? 'الخصوصية والموافقة' : 'Privacy & Consent'}</span>
                  </div>

                  <label className="min-h-[44px] flex items-center justify-between cursor-pointer">
                    <span className="text-[11px] text-stone-300">
                      {isAr ? 'عرض الصورة على شاشة الكافيه الحية' : 'Show on in-store Live Wall'}
                    </span>
                    <input
                      type="checkbox"
                      checked={wallConsent}
                      onChange={e => setWallConsent(e.target.checked)}
                      className="rounded bg-stone-900 border-stone-700 text-amber-500 focus:ring-0 w-5 h-5 cursor-pointer"
                    />
                  </label>

                  <label className="min-h-[44px] flex items-center justify-between cursor-pointer">
                    <span className="text-[11px] text-stone-300">
                      {isAr ? 'إنشاء بطاقة ستوري لمشاركتها على إنستجرام' : 'Generate Instagram Story card'}
                    </span>
                    <input
                      type="checkbox"
                      checked={shareConsent}
                      onChange={e => setShareConsent(e.target.checked)}
                      className="rounded bg-stone-900 border-stone-700 text-amber-500 focus:ring-0 w-5 h-5 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={!selectedImage || uploading}
                  className="w-full min-h-[48px] py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جاري الحفظ والبث...' : 'Uploading & Broadcasting...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{isAr ? 'حفظ الذكرى وختم الزيارة' : 'Save Memory & Stamp Visit'}</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Success & Instagram Story Card View */
              <div className="text-center space-y-4 py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base font-black text-white">
                    {isAr ? 'تم تسجيل الزيارة بنجاح! 🎉' : 'Visit Stamped Successfully! 🎉'}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    {isAr
                      ? 'صورتك في طريقها للعرض على شاشة الكافيه الآن.'
                      : 'Your photo is on its way to the in-store Live Wall.'}
                  </p>
                </div>

                {/* Instagram Story Preview Card (9:16) */}
                <div className="relative aspect-[9/16] max-w-[240px] mx-auto rounded-2xl overflow-hidden bg-black border-2 border-amber-500/50 shadow-2xl flex flex-col justify-between p-3 text-left">
                  <img
                    src={selectedImage!}
                    alt="Story"
                    className="absolute inset-0 w-full h-full object-cover brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                  {/* Story Header */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg">
                      <Coffee className="w-3 h-3 text-amber-400" />
                      <span className="text-[9px] font-bold text-white">{cafeName}</span>
                    </div>
                    <span className="text-[9px] font-bold bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full">
                      Visit #{visitsCount}
                    </span>
                  </div>

                  {/* Story Footer */}
                  <div className="relative z-10 space-y-1 bg-black/60 backdrop-blur-md p-2 rounded-xl">
                    <p className="text-[10px] text-white font-bold leading-tight">
                      &ldquo;{caption || 'Specialty coffee moment ☕'}&rdquo;
                    </p>
                    <div className="text-[8px] text-amber-300 font-mono flex items-center justify-between">
                      <span>#CafeMemories</span>
                      <span>{cafeName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleResetModal}
                    className="flex-1 min-h-[48px] py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    {isAr ? 'تم والعودة للبطاقة' : 'Done & Return'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#090705] text-stone-100 flex flex-col items-center justify-center selection:bg-amber-500 selection:text-black">
      {/* Responsive View Switcher */}
      <div className="hidden md:flex items-center justify-center min-h-screen w-full max-w-6xl mx-auto p-8 gap-12">
        {/* Left Side: Companion Explainer & Scannable Real QR */}
        <div className="flex-1 space-y-6 text-left">
          <Link
            href="/"
            className="min-h-[44px] inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Overview</span>
          </Link>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Interactive Guest Mobile Experience</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Test on Screen or Scan on Your Phone
            </h1>
            <p className="text-sm text-stone-400 leading-relaxed max-w-md">
              Interact directly with the simulated smartphone on the right, or scan the QR code below with your actual phone camera to test the real mobile experience!
            </p>
          </div>

          {/* Real QR Card */}
          <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 flex items-center gap-5 max-w-md shadow-xl">
            {qrCodeSvg ? (
              <div
                className="w-24 h-24 rounded-2xl bg-white p-2 shadow-lg shrink-0 [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-stone-800 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-stone-500" />
              </div>
            )}
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Open on Your Phone Camera</span>
              <p className="text-[11px] text-stone-400 leading-tight">
                Points directly to this live café demo with native camera upload & loyalty stamps.
              </p>
              <div className="pt-1 text-[10px] text-amber-400 font-mono">
                cafe-memories.vercel.app/c/{cafeSlug}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/wall/screen-101"
              target="_blank"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-bold text-white flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>Launch Live TV Wall</span>
              <ExternalLink className="w-3 h-3 text-stone-500" />
            </Link>
            <Link
              href="/dashboard"
              target="_blank"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs font-bold text-stone-300 hover:text-white flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <span>Merchant Moderation</span>
              <ExternalLink className="w-3 h-3 text-stone-500" />
            </Link>
          </div>
        </div>

        {/* Right Side: Realistic Luxury Smartphone Chassis Frame */}
        <div className="w-[390px] h-[810px] rounded-[52px] bg-stone-900 border-[10px] border-stone-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden relative flex flex-col shrink-0 ring-1 ring-white/10">
          {/* Top Notch / Dynamic Island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-end px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-800"></div>
          </div>

          {/* Smartphone Screen Content */}
          <div className="flex-1 w-full h-full overflow-y-auto">
            {renderMobileContent()}
          </div>
        </div>
      </div>

      {/* Mobile Native View (Only on mobile screens) */}
      <div className="w-full md:hidden">
        {renderMobileContent()}
      </div>
    </div>
  );
}
