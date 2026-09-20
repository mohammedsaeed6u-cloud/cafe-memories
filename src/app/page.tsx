'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Coffee,
  Camera,
  Tv,
  Gift,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Smartphone,
  Users,
  QrCode,
  TrendingUp,
  Share2,
  Check,
  ChevronDown,
  Star,
  ExternalLink,
  Flame
} from 'lucide-react';

export default function HomePage() {
  const [dailyCups, setDailyCups] = useState(250);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // ROI Calculations
  const repeatGain = Math.round(dailyCups * 0.22);
  const monthlyExtraRevenue = Math.round(repeatGain * 30 * 3.5); // ~$3.50 per specialty cup
  const monthlyMemories = Math.round(dailyCups * 30 * 0.35);

  const faqs = [
    {
      q: 'Do customers need to download an app from the App Store or Google Play?',
      a: 'Zero app downloads. Customers simply point their native phone camera at any table or counter QR code. The high-speed PWA launches instantly in Safari or Chrome in under 2 seconds.'
    },
    {
      q: 'How does the Live Wall screen connect to our in-store TV?',
      a: 'Any TV with a built-in web browser (Samsung Tizen, LG webOS, Google TV, Apple TV, Fire TV, or HDMI stick) opens our full-screen URL (/wall/[screenId]). It syncs approved memories and CTA slides in real time without extra hardware.'
    },
    {
      q: 'Can customers post inappropriate photos on our café screen?',
      a: 'Never. Every photo submitted goes through our merchant moderation queue with optional AI pre-filtering. You have 1-tap Approve/Hide controls from any smartphone or tablet.'
    },
    {
      q: 'How does anti-fraud protect against repeat scan abuse?',
      a: 'Each table QR code utilizes cryptographic cooldowns (default 30 minutes) and device fingerprinting. Patrons cannot spam scans to fraudulently earn loyalty stamps in a single visit.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-amber-500 selection:text-black font-sans relative overflow-x-hidden">
      {/* Warm Ambient Radial Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-amber-600/15 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FAF8F5]/80 border-b border-stone-200/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-stone-900">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight text-lg font-black text-stone-900">Memories • موميريز</span>
              <span className="text-[10px] text-amber-700 tracking-wider uppercase font-bold">Specialty Photobooth Layer</span>
            </div>
          </div>

          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/c/espresso-lab"
              className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 transition-colors"
            >
              Guest Demo
            </Link>
            <Link
              href="/wall/screen-101"
              className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 transition-colors hidden sm:inline-block"
            >
              TV Wall
            </Link>
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 transition-colors hidden md:inline-block"
            >
              Merchant Panel
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-24 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 text-xs font-bold mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>The Digital Memory & Loyalty Layer for Cafés</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-stone-900 max-w-5xl mx-auto leading-[1.1]">
          Turn everyday coffee runs into{' '}
          <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            shared memories
          </span>{' '}
          & loyal regulars.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed font-normal">
          Not boring paper punch cards. Guests scan their table QR, snap their specialty coffee moment, see it broadcast across your in-store TV Live Wall, and earn rewards on every visit.
        </p>

        {/* Live CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
          <Link
            href="/c/espresso-lab"
            className="w-full sm:w-auto flex-1 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-stone-950 font-black text-base flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Smartphone className="w-5 h-5 text-stone-950" />
            <span>Try Mobile Customer Flow</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/wall/screen-101"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-base flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] shadow-lg"
          >
            <Tv className="w-5 h-5 text-amber-600" />
            <span>Launch TV Live Wall</span>
          </Link>
        </div>

        {/* Live In-Action Dual Showcase */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* Mobile Showcase Card (Left) */}
          <div className="lg:col-span-5 rounded-3xl bg-gradient-to-b from-stone-900/90 to-stone-950 border border-stone-200 p-6 text-left shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                Customer Mobile Screen
              </span>
              <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded text-stone-300 font-mono">No App Required</span>
            </div>

            {/* Mini Simulated Phone Card */}
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4 space-y-4 shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs">☕</div>
                <div>
                  <div className="font-bold text-xs text-stone-900">Espresso Lab • Main Branch</div>
                  <div className="text-[10px] text-amber-600 font-medium">3 / 5 Visits • 2 until Free Drink</div>
                </div>
              </div>

              {/* 5 Cup Stamps */}
              <div className="flex items-center justify-between gap-1.5 bg-white/80 p-2.5 rounded-xl border border-stone-200">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`flex-1 aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-bold ${
                      i <= 3
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : i === 5
                        ? 'bg-stone-100 text-amber-500 border border-amber-500/40'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {i <= 3 ? '✓' : i === 5 ? '🎁' : `#${i}`}
                  </div>
                ))}
              </div>

              {/* Uploaded Moment Preview */}
              <div className="rounded-xl overflow-hidden aspect-video relative bg-white">
                <img
                  src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"
                  alt="Customer Cortado"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-black/80 backdrop-blur-md text-[11px] text-white">
                  &ldquo;Best cortado in Cairo! Celebrating visit #3 ☕✨&rdquo;
                </div>
              </div>
            </div>

            <Link
              href="/c/espresso-lab"
              className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              <span>Test Interactive Check-in Flow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* TV Live Wall Showcase (Right) */}
          <div className="lg:col-span-7 rounded-3xl bg-gradient-to-b from-stone-900/90 to-stone-950 border border-stone-200 p-6 text-left shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-4 h-4" />
                In-Store 4K TV Live Wall
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Realtime Broadcast
              </span>
            </div>

            {/* Mini TV Screen */}
            <div className="rounded-2xl bg-black border border-stone-200 aspect-video relative overflow-hidden flex items-center justify-between p-4 shadow-inner">
              <img
                src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
                alt="Live Wall Photo"
                className="w-3/5 h-full object-cover rounded-xl"
              />
              <div className="w-2/5 pl-4 flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Today&apos;s Regular</span>
                  <div className="font-extrabold text-sm text-white leading-tight">
                    &ldquo;Weekend work session with single origin V60 🥐&rdquo;
                  </div>
                  <div className="text-[11px] text-stone-400">Sarah Mansour • Visit #5</div>
                </div>

                <div className="bg-white/90 p-2 rounded-lg border border-stone-200 text-[10px] text-amber-600 font-bold flex items-center justify-between">
                  <span>Scan to Join</span>
                  <div className="bg-stone-900 p-1 rounded"><QrCode className="w-3 h-3 text-white" /></div>
                </div>
              </div>
            </div>

            <Link
              href="/wall/screen-101"
              className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              <span>View Fullscreen Live TV Screen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Steps Visual Timeline */}
      <section className="px-6 py-20 bg-white/30 border-t border-stone-200/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-700 mb-2 block">
              The Frictionless Loop
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              From Table QR to In-Store Celebrity in 15 Seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-white/80 border border-stone-200 hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg border border-amber-200">
                  1
                </div>
                <h3 className="font-bold text-lg text-stone-900">Table QR Scan</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Patron sits at their table, points their camera at the branded acrylic stand. Zero download required.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200 text-[11px] text-amber-600 font-semibold">
                Instant Safari & Chrome launch
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/80 border border-stone-200 hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg border border-amber-200">
                  2
                </div>
                <h3 className="font-bold text-lg text-stone-900">Capture & Filter</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Guest snaps their latte art or coffee table scene. 1-tap warm roaster filters ensure aesthetic perfection.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200 text-[11px] text-amber-600 font-semibold">
                Granular consent toggles
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/80 border border-stone-200 hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg border border-amber-200">
                  3
                </div>
                <h3 className="font-bold text-lg text-stone-900">In-Store Live TV</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Moments broadcast in real-time on your café TV screens. Patrons smile, point, and take photos of the screen.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200 text-[11px] text-amber-600 font-semibold">
                Merchant moderation control
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/80 border border-stone-200 hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg border border-amber-200">
                  4
                </div>
                <h3 className="font-bold text-lg text-stone-900">Loyalty & Story Share</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Visits accumulate toward free drinks. Patrons share branded 9:16 Instagram Story Cards, bringing new friends.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200 text-[11px] text-amber-600 font-semibold">
                Viral word-of-mouth loop
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive ROI & Revenue Calculator */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-200 shadow-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-bold mb-4">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Café Revenue Impact Estimator</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            See how much repeat revenue you gain with Memories • موميريز
          </h2>
          <p className="text-sm text-stone-300 mt-2 max-w-lg mx-auto">
            Adjust your café&apos;s daily volume to estimate monthly repeat visits and organic social moments.
          </p>

          <div className="mt-8 space-y-4 max-w-md mx-auto">
            <div className="flex justify-between text-sm font-bold text-white">
              <span>Daily Cups Served</span>
              <span className="text-amber-400 font-mono text-base">{dailyCups} cups/day</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={dailyCups}
              onChange={e => setDailyCups(Number(e.target.value))}
              className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="p-5 rounded-2xl bg-stone-800/80 border border-stone-700">
              <div className="text-xs text-stone-300 font-medium">Extra Monthly Visits</div>
              <div className="text-3xl font-black text-white mt-1">+{repeatGain * 30}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">+22% regular retention</div>
            </div>

            <div className="p-5 rounded-2xl bg-stone-800/80 border border-stone-700">
              <div className="text-xs text-stone-300 font-medium">Est. Added Monthly Revenue</div>
              <div className="text-3xl font-black text-amber-400 mt-1">${monthlyExtraRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-stone-400 mt-0.5">Based on $3.50 avg cup</div>
            </div>

            <div className="p-5 rounded-2xl bg-stone-800/80 border border-stone-700">
              <div className="text-xs text-stone-300 font-medium">Organic Memories Shared</div>
              <div className="text-3xl font-black text-white mt-1">{monthlyMemories.toLocaleString()}</div>
              <div className="text-[11px] text-amber-400 mt-0.5">Photos on Wall & Stories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 py-20 bg-white/30 border-t border-stone-200/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-700 mb-2 block">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              Invest in Regulars, Not Paper Punch Cards
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Plan 1 */}
            <div className="p-8 rounded-3xl bg-white/80 border border-stone-200 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-stone-900">Starter Roaster</h3>
                <p className="text-xs text-stone-600">Perfect for boutique single-location coffee bars.</p>
                <div className="text-3xl font-black text-stone-900">
                  $39 <span className="text-xs font-normal text-stone-600">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-stone-700 pt-4 border-t border-stone-200">
                  <li className="flex items-center gap-2">✓ 1 Connected Live TV Screen</li>
                  <li className="flex items-center gap-2">✓ Up to 1,000 monthly memories</li>
                  <li className="flex items-center gap-2">✓ Configurable 5-stamp loyalty perk</li>
                  <li className="flex items-center gap-2">✓ Merchant Mobile Moderation</li>
                </ul>
              </div>
              <Link
                href="/login"
                className="mt-8 w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs text-center transition-colors block"
              >
                Start Free 14-Day Trial
              </Link>
            </div>

            {/* Plan 2 - Featured */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border-2 border-amber-500 shadow-2xl shadow-amber-500/10 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-white">Growth Barista</h3>
                <p className="text-xs text-stone-300">For high-traffic specialty cafés and community spaces.</p>
                <div className="text-3xl font-black text-white">
                  $89 <span className="text-xs font-normal text-stone-400">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-stone-300 pt-4 border-t border-stone-700">
                  <li className="flex items-center gap-2 font-semibold text-amber-300">✓ Up to 3 TV Live Screens</li>
                  <li className="flex items-center gap-2">✓ Unlimited guest memories</li>
                  <li className="flex items-center gap-2">✓ Branded Instagram Story Card generator</li>
                  <li className="flex items-center gap-2">✓ Anti-fraud device fingerprinting</li>
                  <li className="flex items-center gap-2">✓ Realtime CRM & Regulars leaderboards</li>
                </ul>
              </div>
              <Link
                href="/login"
                className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs text-center transition-all shadow-lg shadow-amber-500/20 block"
              >
                Start Free 14-Day Trial
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="p-8 rounded-3xl bg-white/80 border border-stone-200 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-stone-900">Multi-Branch Empire</h3>
                <p className="text-xs text-stone-600">For regional coffee chains & roasteries.</p>
                <div className="text-3xl font-black text-stone-900">
                  $199 <span className="text-xs font-normal text-stone-600">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-stone-700 pt-4 border-t border-stone-200">
                  <li className="flex items-center gap-2">✓ Unlimited TV Screens & Branches</li>
                  <li className="flex items-center gap-2">✓ Centralized Org Management</li>
                  <li className="flex items-center gap-2">✓ Custom Domain & White-labeling</li>
                  <li className="flex items-center gap-2">✓ Dedicated Account Manager</li>
                </ul>
              </div>
              <Link
                href="/login"
                className="mt-8 w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs text-center transition-colors block"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-stone-900 tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/80 border border-stone-200 overflow-hidden transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-stone-800"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    activeFaq === i ? 'rotate-180 text-amber-600' : 'text-stone-500'
                  }`}
                />
              </button>
              {activeFaq === i && (
                <div className="px-5 pb-5 text-xs text-stone-600 leading-relaxed border-t border-stone-200/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="px-6 py-20 text-center border-t border-stone-200/80 bg-gradient-to-b from-transparent to-stone-100/50">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight">
            Ready to give your café a digital heartbeat?
          </h2>
          <p className="text-stone-600 text-base">
            Join forward-thinking roasters turning daily caffeine runs into loyal brand ambassadors.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/c/espresso-lab"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              Try Interactive Guest Demo
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-900 font-bold text-sm transition-all"
            >
              Enter Merchant Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-stone-200 text-center text-xs text-stone-500">
        <p>© 2026 Memories • موميريز. The Digital Memory & Loyalty Layer for Modern Specialty Cafés.</p>
      </footer>
    </div>
  );
}
