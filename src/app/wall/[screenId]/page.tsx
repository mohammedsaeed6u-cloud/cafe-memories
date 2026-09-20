'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Coffee, QrCode, Maximize2, Sparkles, Heart, Clock, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ screenId: string }>;
}

const SAMPLE_MEMORIES = [
  {
    id: '1',
    customer: 'Sarah M.',
    visitNum: 4,
    caption: 'Best cortado in the city! Love the new roast ☕✨',
    time: '5 mins ago',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '2',
    customer: 'Omar K.',
    visitNum: 3,
    caption: 'Weekend work session with cold brew & pastry 🥐',
    time: '14 mins ago',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '3',
    customer: 'Nour E.',
    visitNum: 5,
    caption: 'Unlocked my free specialty drink today! Celebrating 🎉',
    time: '28 mins ago',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
  }
];

export default function LiveWallPage({ params }: PageProps) {
  const { screenId } = use(params);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [isCtaSlide, setIsCtaSlide] = useState(false);

  // Cycle slides automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setIsCtaSlide(prev => {
        if (!prev) {
          return true; // Show CTA slide every other rotation
        } else {
          setCurrentIndex(idx => (idx + 1) % SAMPLE_MEMORIES.length);
          return false;
        }
      });
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  // Generate QR code svg
  useEffect(() => {
    import('qrcode').then(QRCode => {
      const url = typeof window !== 'undefined'
        ? `${window.location.origin}/c/espresso-lab?wall=${screenId}`
        : `https://cafe-memories.vercel.app/c/espresso-lab?wall=${screenId}`;

      QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#000000', light: '#ffffff' } }, (err, string) => {
        if (!err && string) {
          setQrSvg(string);
        }
      });
    }).catch(() => {});
  }, [screenId]);

  const currentMemory = SAMPLE_MEMORIES[currentIndex];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative w-screen h-screen bg-stone-950 text-white overflow-hidden flex flex-col font-sans select-none">
      {/* Top Bar Overlay */}
      <header className="absolute top-0 inset-x-0 z-30 px-8 py-5 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-stone-400 hover:text-white p-1 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
              <span>Espresso Lab</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs text-stone-400 font-mono">Live Wall • Screen #{screenId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/80 border border-stone-800 text-xs text-stone-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Broadcasting Guest Moments</span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 text-stone-300 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Display Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {!isCtaSlide ? (
          /* Memory Slide */
          <div className="relative w-full h-full flex items-center justify-center animate-fadeIn">
            {/* Background blurred ambiance */}
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-25 scale-110"
              style={{ backgroundImage: `url(${currentMemory.image})` }}
            />

            {/* Central Media Card */}
            <div className="relative z-10 max-w-5xl w-full h-[82vh] mx-auto p-4 flex flex-col md:flex-row items-center gap-8 rounded-3xl bg-stone-900/70 border border-stone-800/80 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Photo Area */}
              <div className="w-full md:w-3/5 h-full relative rounded-2xl overflow-hidden shadow-inner bg-black">
                <img
                  src={currentMemory.image}
                  alt={currentMemory.caption}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-stone-700/60 text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5" />
                  Visit #{currentMemory.visitNum}
                </div>
              </div>

              {/* Memory Story Metadata */}
              <div className="w-full md:w-2/5 p-4 flex flex-col justify-between h-full text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
                    <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    Moment from today
                  </div>

                  <blockquote className="text-2xl sm:text-3xl font-extrabold text-white leading-snug tracking-tight">
                    "{currentMemory.caption}"
                  </blockquote>

                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-stone-950 text-sm">
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
                <div className="mt-6 pt-6 border-t border-stone-800/80 flex items-center justify-between gap-4 bg-stone-950/60 p-4 rounded-2xl border border-stone-800">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Share Your Moment
                    </span>
                    <span className="text-[11px] text-stone-300 block">
                      Scan to appear on this wall & earn rewards.
                    </span>
                  </div>
                  {qrSvg && (
                    <div
                      className="w-16 h-16 rounded-xl bg-white p-1 shadow-md shrink-0 [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Who's Next? CTA Slide */
          <div className="relative z-10 max-w-3xl mx-auto p-10 text-center space-y-8 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Who's Next?</span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Scan to put your moment on this screen.
            </h2>

            <p className="text-lg text-stone-400 max-w-xl mx-auto">
              Open your phone camera, scan the code, snap a photo, and watch your moment appear right here!
            </p>

            {/* Large Center QR Code */}
            <div className="inline-block p-4 rounded-3xl bg-white shadow-2xl shadow-amber-500/20">
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

            <div className="text-sm font-semibold text-stone-300">
              espresso-lab.cafememories.app
            </div>
          </div>
        )}
      </div>

      {/* Slide Indicators */}
      <footer className="absolute bottom-4 inset-x-0 z-30 flex items-center justify-center gap-2">
        {SAMPLE_MEMORIES.map((_, i) => (
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
