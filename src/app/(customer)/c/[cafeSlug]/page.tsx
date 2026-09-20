'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Camera, Coffee, Sparkles, Check, Share2, Award, Heart, Upload, X, Shield, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ cafeSlug: string }>;
}

export default function CustomerCafePage({ params }: PageProps) {
  const { cafeSlug } = use(params);
  const cafeName = cafeSlug ? cafeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Specialty Café';

  // State
  const [visitsCount, setVisitsCount] = useState(3);
  const targetVisits = 5;
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [wallConsent, setWallConsent] = useState(true);
  const [shareConsent, setShareConsent] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [memories, setMemories] = useState([
    {
      id: '1',
      visitNum: 1,
      date: 'Sep 12, 2026',
      caption: 'First pour-over at the bar!',
      img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: '2',
      visitNum: 2,
      date: 'Sep 16, 2026',
      caption: 'Latte art on point today ☕',
      img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: '3',
      visitNum: 3,
      date: 'Today',
      caption: 'Morning brew with friends',
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
      date: 'Just now',
      caption: caption || 'Café moment captured!',
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

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col max-w-md mx-auto shadow-2xl relative border-x border-stone-800 selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="sticky top-0 bg-stone-900/90 backdrop-blur-md border-b border-stone-800/80 z-20 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-stone-400 hover:text-white p-1 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-bold">
            <Coffee className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">{cafeName}</span>
        </div>
        <div className="text-xs bg-amber-500/10 text-amber-400 font-semibold px-2.5 py-1 rounded-full border border-amber-500/20">
          Guest
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 space-y-6 pb-24 overflow-y-auto">
        {/* Cafe Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-900/40 via-stone-900 to-stone-950 border border-stone-800 p-5 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 text-stone-950 font-bold text-xl">
            ☕
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Welcome to {cafeName}</h1>
          <p className="text-xs text-stone-400 mt-1">Capture your moment, join the wall & earn free coffee.</p>

          {/* Loyalty Progress Card */}
          <div className="mt-5 bg-stone-900/90 rounded-xl p-4 border border-stone-700/60 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Your Café Journey
              </span>
              <span className="text-xs font-bold text-amber-400">
                {visitsCount} / {targetVisits} Visits
              </span>
            </div>

            {/* Visual Stamps */}
            <div className="flex items-center justify-between gap-1.5 my-3">
              {Array.from({ length: targetVisits }).map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                    idx < visitsCount
                      ? 'bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/30'
                      : 'bg-stone-800 text-stone-500 border border-stone-700/50'
                  }`}
                >
                  {idx < visitsCount ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-stone-400">
              {visitsCount >= targetVisits ? (
                <span className="text-emerald-400 font-semibold">🎉 Reward unlocked! Show barista to redeem.</span>
              ) : (
                <span>{targetVisits - visitsCount} more visits to unlock your Free Specialty Drink!</span>
              )}
            </p>
          </div>
        </div>

        {/* CTA: Capture Moment */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-500/15 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Camera className="w-5 h-5" />
          <span>Capture Your Café Moment</span>
          <Sparkles className="w-4 h-4 text-stone-900" />
        </button>

        {/* Story Memories Feed */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              Your Café Story ({memories.length})
            </h2>
            <span className="text-[11px] text-stone-400">Saved on this device</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {memories.map((m) => (
              <div
                key={m.id}
                className="group relative rounded-xl overflow-hidden bg-stone-900 border border-stone-800 flex flex-col"
              >
                <div className="aspect-square relative overflow-hidden bg-stone-950">
                  <img
                    src={m.img}
                    alt={m.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-950/80 backdrop-blur-sm text-[10px] font-bold text-amber-400 border border-stone-800">
                    Visit #{m.visitNum}
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs text-stone-200 font-medium line-clamp-1">{m.caption}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{m.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Wall Promo */}
        <div className="rounded-xl p-4 bg-stone-900/60 border border-stone-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-white flex items-center gap-1">
              <span>📺 Café Live Wall is Online</span>
            </h3>
            <p className="text-[11px] text-stone-400">Approved moments are displayed on screens inside the café.</p>
          </div>
          <Link
            href="/wall/screen-101"
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-amber-400 border border-stone-700 whitespace-nowrap"
          >
            Watch Wall
          </Link>
        </div>
      </main>

      {/* Capture & Consent Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-sm p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                {submitted ? 'Moment Published! 🎉' : 'Share Café Memory'}
              </h3>
              <button
                onClick={handleResetModal}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmitMemory} className="space-y-4">
                {/* Image Upload Area */}
                <div>
                  {selectedImage ? (
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-stone-700">
                      <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-stone-950/80 text-white hover:bg-stone-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-2xl border-2 border-dashed border-stone-700 hover:border-amber-500/60 bg-stone-950/50 cursor-pointer p-4 text-center group transition-colors">
                      <div className="w-12 h-12 rounded-full bg-stone-800 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold text-white">Tap to Take or Upload Photo</span>
                      <span className="text-[10px] text-stone-400 mt-1">JPEG, PNG, WebP up to 10MB</span>
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
                  <label className="block text-xs font-medium text-stone-300 mb-1">Caption / Note</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g. Best V60 in town! ☕"
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-white focus:outline-none focus:border-amber-500"
                    maxLength={100}
                  />
                </div>

                {/* Granular Consent Checkboxes */}
                <div className="space-y-2.5 pt-2 border-t border-stone-800 text-xs">
                  <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Privacy & Display Consent
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer text-stone-300">
                    <input
                      type="checkbox"
                      checked={wallConsent}
                      onChange={(e) => setWallConsent(e.target.checked)}
                      className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>
                      <strong className="text-white font-medium">Show on Café Live Wall:</strong> Allow this photo to appear on in-store TV screens after merchant approval.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-stone-300">
                    <input
                      type="checkbox"
                      checked={shareConsent}
                      onChange={(e) => setShareConsent(e.target.checked)}
                      className="mt-0.5 rounded border-stone-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>
                      <strong className="text-white font-medium">Social Sharing:</strong> Enable generating a branded 9:16 Instagram Story card.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!selectedImage}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    selectedImage
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg shadow-amber-500/20'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Save Memory & Earn Visit #{visitsCount + 1}</span>
                </button>
              </form>
            ) : (
              /* Success & Story Card State */
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Your Moment is Saved!</h4>
                  <p className="text-xs text-stone-400 mt-1">
                    {wallConsent
                      ? 'Submitted for the Live Wall. Watch the screens!'
                      : 'Saved to your personal café journey.'}
                  </p>
                </div>

                {/* Branded Story Card Preview */}
                <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-left relative overflow-hidden">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">
                    Instagram Story Card (9:16)
                  </div>
                  <div className="aspect-[9/14] rounded-xl overflow-hidden relative bg-stone-900">
                    <img src={selectedImage!} alt="Story" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white tracking-tight">{cafeName}</span>
                        <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full">
                          Visit #{visitsCount}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-white font-medium">{caption || 'A moment from today ☕'}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">Captured at {cafeName}</p>
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
                          title: `My visit to ${cafeName}`,
                          text: caption || `Visit #${visitsCount} at ${cafeName}!`,
                          url: window.location.href,
                        }).catch(() => {});
                      } else {
                        alert('Story card ready! Long-press to save and share to Instagram Stories.');
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Story
                  </button>
                  <button
                    type="button"
                    onClick={handleResetModal}
                    className="px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs"
                  >
                    Done
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
