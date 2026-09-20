'use client';

import React, { useState, use } from 'react';
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
  Gift
} from 'lucide-react';

interface PageProps {
  params: Promise<{ cafeSlug: string }>;
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
  const [caption, setCaption] = useState('');
  const [wallConsent, setWallConsent] = useState(true);
  const [shareConsent, setShareConsent] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'normal' | 'warm' | 'mono'>('warm');

  const [memories, setMemories] = useState([
    {
      id: '1',
      visitNum: 1,
      date: '12 سبتمبر',
      caption: 'أول تجربة للـ V60 هنا.. القهوة ممتازة ☕',
      img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: '2',
      visitNum: 2,
      date: '16 سبتمبر',
      caption: 'جلسة شغل هادية ومشروب كولد برو رائع',
      img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: '3',
      visitNum: 3,
      date: 'اليوم',
      caption: 'صباح الخير من مكاني المفضل ✨',
      img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    }
  ]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
    }
  };

  const handleSubmitMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;

    const newMemory = {
      id: Date.now().toString(),
      visitNum: visitsCount + 1,
      date: lang === 'ar' ? 'الآن' : 'Just now',
      caption: caption || (lang === 'ar' ? 'لحظة جديدة في الكافيه ☕' : 'New moment at the café ☕'),
      img: selectedImage,
    };

    setMemories([newMemory, ...memories]);
    setVisitsCount(prev => Math.min(targetVisits, prev + 1));
    setSubmitted(true);
  };

  const handleResetModal = () => {
    setShowModal(false);
    setSelectedImage(null);
    setCaption('');
    setSubmitted(false);
  };

  const isAr = lang === 'ar';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black pb-12"
    >
      {/* Top Mobile Bar */}
      <header className="sticky top-0 bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/80 z-30 px-4 py-3.5 flex items-center justify-between">
        <Link
          href="/"
          className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
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
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:text-white transition-colors"
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
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                {isAr ? 'بطاقة الولاء الرقمية' : 'Digital Loyalty Pass'}
              </span>
              <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {visitsCount} / {targetVisits} {isAr ? 'زيارات' : 'Visits'}
              </span>
            </div>

            {/* 5 Cup Stamps */}
            <div className="grid grid-cols-5 gap-2 my-2">
              {Array.from({ length: targetVisits }).map((_, idx) => {
                const isStamped = idx < visitsCount;
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                      isStamped
                        ? 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-400 text-stone-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                        : 'bg-stone-900 border-stone-800 text-stone-600'
                    }`}
                  >
                    {isStamped ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : idx === targetVisits - 1 ? (
                      <Gift className="w-4 h-4 text-amber-500/60" />
                    ) : (
                      <Coffee className="w-4 h-4 text-stone-700" />
                    )}
                    <span className="text-[9px] font-bold">
                      {idx === targetVisits - 1 ? (isAr ? 'هدية' : 'Gift') : `#${idx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
              {visitsCount >= targetVisits ? (
                <span className="text-emerald-400 font-bold">
                  {isAr ? '🎉 مبروك! افتح العرض وقدمه للباريستا للاستلام.' : '🎉 Reward unlocked! Present to barista.'}
                </span>
              ) : (
                <span>
                  {isAr
                    ? `فاضلك ${targetVisits - visitsCount} زيارات للحصول على مشروبك المجاني!`
                    : `${targetVisits - visitsCount} more visits to unlock your free coffee!`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary Action Button: Capture Moment */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 transition-all active:scale-[0.98]"
        >
          <Camera className="w-5 h-5" />
          <span>{isAr ? 'التقط ذكرى وسجل زيارتك الآن' : 'Snap a Memory & Check In'}</span>
          <Sparkles className="w-4 h-4 text-stone-950" />
        </button>

        {/* Live Wall Link Banner */}
        <div className="rounded-2xl p-4 bg-stone-900/60 border border-stone-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-white flex items-center gap-2">
                <span>{isAr ? 'شاشة الكافيه الحية' : 'Live Café Screen'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-stone-400">
                {isAr ? 'لحظتك بتتعرض على شاشات الكافيه مباشرة' : 'Photos broadcast directly inside the café'}
              </p>
            </div>
          </div>
          <Link
            href="/wall/screen-101"
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-amber-400 border border-stone-700 shrink-0 transition-colors"
          >
            {isAr ? 'مشاهدة' : 'View'}
          </Link>
        </div>

        {/* Saved Memories Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>{isAr ? 'رحلتك وذكرياتك السابقة' : 'Your Past Moments'}</span>
              <span className="text-xs text-stone-500 font-normal">({memories.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {memories.map(m => (
              <div
                key={m.id}
                className="group relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-800/80 flex flex-col"
              >
                <div className="aspect-square relative overflow-hidden bg-stone-950">
                  <img
                    src={m.img}
                    alt={m.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-950/80 backdrop-blur-md text-[10px] font-extrabold text-amber-400 border border-stone-800">
                    {isAr ? `زيارة #${m.visitNum}` : `Visit #${m.visitNum}`}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-stone-200 font-medium line-clamp-1">{m.caption}</p>
                  <p className="text-[10px] text-stone-400 mt-1">{m.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Upload & Memory Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-sm p-5 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>{submitted ? (isAr ? 'تم تسجيل اللحظة! 🎉' : 'Moment Saved! 🎉') : (isAr ? 'شارك لحظتك في الكافيه' : 'Share Café Memory')}</span>
              </h3>
              <button
                onClick={handleResetModal}
                className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmitMemory} className="space-y-4">
                {/* Upload Area */}
                <div>
                  {selectedImage ? (
                    <div className="space-y-2">
                      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-stone-700 bg-black">
                        <img
                          src={selectedImage}
                          alt="Preview"
                          className={`w-full h-full object-cover ${
                            activeFilter === 'warm'
                              ? 'sepia-[0.25] contrast-[1.05]'
                              : activeFilter === 'mono'
                              ? 'grayscale contrast-[1.1]'
                              : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedImage(null)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Photo Filters */}
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveFilter('normal')}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            activeFilter === 'normal'
                              ? 'bg-amber-500 text-stone-950 border-amber-400'
                              : 'bg-stone-800 text-stone-400 border-stone-700'
                          }`}
                        >
                          Original
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveFilter('warm')}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            activeFilter === 'warm'
                              ? 'bg-amber-500 text-stone-950 border-amber-400'
                              : 'bg-stone-800 text-stone-400 border-stone-700'
                          }`}
                        >
                          Warm Roast
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveFilter('mono')}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            activeFilter === 'mono'
                              ? 'bg-amber-500 text-stone-950 border-amber-400'
                              : 'bg-stone-800 text-stone-400 border-stone-700'
                          }`}
                        >
                          Vintage Mono
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-2xl border-2 border-dashed border-stone-700 hover:border-amber-500/60 bg-stone-950/60 cursor-pointer p-5 text-center group transition-colors">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-bold text-white">
                        {isAr ? 'اضغط لفتح الكاميرا أو اختيار صورة' : 'Tap to take or choose photo'}
                      </span>
                      <span className="text-[10px] text-stone-500 mt-1">JPEG, PNG, WebP</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Caption Input */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    {isAr ? 'أضف تعليقاً على اللحظة' : 'Add a caption'}
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={isAr ? 'مثلاً: أحلى فنجان فلات وايت اليوم ☕' : 'e.g. Best flat white today! ☕'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    maxLength={100}
                  />
                </div>

                {/* Granular Consent Controls */}
                <div className="space-y-2 pt-2 border-t border-stone-800 text-xs">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'خيارات العرض والخصوصية' : 'Privacy & Display'}</span>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer text-stone-300">
                    <input
                      type="checkbox"
                      checked={wallConsent}
                      onChange={(e) => setWallConsent(e.target.checked)}
                      className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] leading-snug">
                      <strong className="text-white font-semibold">
                        {isAr ? 'العرض على شاشة الكافيه: ' : 'Show on Café Wall: '}
                      </strong>
                      {isAr
                        ? 'موافقة على عرض هذه الصورة على شاشات التلفزيون بعد مراجعة الكافيه.'
                        : 'Allow displaying on TV screen after barista approval.'}
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-stone-300">
                    <input
                      type="checkbox"
                      checked={shareConsent}
                      onChange={(e) => setShareConsent(e.target.checked)}
                      className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] leading-snug">
                      <strong className="text-white font-semibold">
                        {isAr ? 'بطاقة ستوري إنستغرام: ' : 'Instagram Story Card: '}
                      </strong>
                      {isAr ? 'توليد بطاقة مصممة بمقاس 9:16 للمشاركة.' : 'Generate branded 9:16 card.'}
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!selectedImage}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    selectedImage
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg shadow-amber-500/20'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isAr
                      ? `حفظ اللحظة واحتساب الزيارة #${visitsCount + 1}`
                      : `Save Moment & Earn Visit #${visitsCount + 1}`}
                  </span>
                </button>
              </form>
            ) : (
              /* Success & Story Card State */
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base">
                    {isAr ? 'تم حفظ لحظتك بنجاح!' : 'Your Moment is Saved!'}
                  </h4>
                  <p className="text-xs text-stone-400 mt-1">
                    {wallConsent
                      ? isAr
                        ? 'تم إرسالها لمراجعة الباريستا وستظهر على الشاشة قريباً!'
                        : 'Sent to barista review and will appear on screens soon!'
                      : isAr
                      ? 'تم حفظها في سجلك الشخصي.'
                      : 'Saved to your personal story.'}
                  </p>
                </div>

                {/* Branded Story Card Preview */}
                <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-left relative overflow-hidden">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1.5 text-center">
                    {isAr ? 'معاينة بطاقة ستوري إنستغرام (9:16)' : 'Instagram Story Card Preview'}
                  </div>
                  <div className="aspect-[9/13] rounded-xl overflow-hidden relative bg-stone-900 border border-stone-800">
                    <img src={selectedImage!} alt="Story" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 p-3.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white tracking-tight">{cafeName}</span>
                        <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full">
                          {isAr ? `زيارة #${visitsCount}` : `Visit #${visitsCount}`}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white font-bold">{caption || 'لحظة في الكافيه ☕'}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">Espresso Lab • New Cairo</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `${cafeName} Moment`,
                          text: caption || `Visit #${visitsCount} at ${cafeName}!`,
                          url: window.location.href,
                        }).catch(() => {});
                      } else {
                        alert(isAr ? 'جاهزة للمشاركة! احفظ البطاقة وانشرها على الستوري.' : 'Ready to share! Save card for story.');
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isAr ? 'مشاركة الستوري' : 'Share Story'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetModal}
                    className="px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs"
                  >
                    {isAr ? 'تم' : 'Done'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
