import Link from 'next/link';
import { Coffee, Camera, Tv, Gift, ShieldCheck, Sparkles, ArrowRight, Smartphone, Users, QrCode } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-black">
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-stone-950/80 border-b border-stone-800/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20">
              <Coffee className="w-5 h-5" />
            </div>
            <span>Café Memories</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/c/espresso-lab"
              className="text-sm font-medium text-stone-400 hover:text-white transition-colors hidden sm:inline-block"
            >
              Customer Demo
            </Link>
            <Link
              href="/wall/screen-101"
              className="text-sm font-medium text-stone-400 hover:text-white transition-colors hidden sm:inline-block"
            >
              Live Wall
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/25"
            >
              Merchant Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-28 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Digital Memory & Loyalty Layer for Cafés</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
          Turn every coffee visit into a{' '}
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
            shared memory
          </span>{' '}
          & loyal regular.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed">
          Not just digital stamps. Customers scan a table QR, capture their café moment, see it appear on your in-store Live Wall, and earn rewards on every return.
        </p>

        {/* Live CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/c/espresso-lab"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <Smartphone className="w-5 h-5" />
            <span>Try Mobile Customer Flow</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/wall/screen-101"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Tv className="w-5 h-5 text-amber-400" />
            <span>View Live TV Wall</span>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-stone-900/50 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white font-medium text-base flex items-center justify-center gap-2 transition-all"
          >
            <Users className="w-5 h-5" />
            <span>Merchant Dashboard</span>
          </Link>
        </div>

        {/* Loop Diagram */}
        <div className="mt-16 p-6 rounded-2xl bg-stone-900/40 border border-stone-800/80 backdrop-blur-sm max-w-3xl mx-auto">
          <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-4">
            The Growth Loop
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium text-stone-300">
            <span className="px-3 py-1.5 rounded-lg bg-stone-800/90 text-white border border-stone-700">QR Scan</span>
            <span className="text-amber-500">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-stone-800/90 text-white border border-stone-700">Capture Moment</span>
            <span className="text-amber-500">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-stone-800/90 text-white border border-stone-700">Live Wall Broadcast</span>
            <span className="text-amber-500">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-stone-800/90 text-white border border-stone-700">Story Card Share</span>
            <span className="text-amber-500">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-stone-800/90 text-amber-300 border border-amber-500/30">Free Reward</span>
          </div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="px-6 py-20 bg-stone-900/30 border-t border-stone-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Everything your café needs to build a community of regulars
            </h2>
            <p className="mt-4 text-stone-400">
              Designed specifically for coffee shops, specialty roasters, and local spaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-amber-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg text-white mb-2">Visual Memories</h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  Guests capture authentic café photos. Every visit becomes part of their personal coffee journey.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-800/60 text-xs text-stone-400">
                Zero app download required
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-amber-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
                  <Tv className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg text-white mb-2">Café Live Wall</h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  Turn any TV into a cinematic social display. Approved guest moments broadcast in real time across the room.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-800/60 text-xs text-stone-400">
                Full-screen Smart TV ready
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-amber-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg text-white mb-2">Smart Loyalty</h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  Configurable rewards like "5 visits = Free Special Drink". Anti-fraud cooldowns prevent scan abuse.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-800/60 text-xs text-stone-400">
                Immutable reward ledger
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-amber-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg text-white mb-2">Privacy & Consent</h3>
                <p className="text-sm text-stone-400 leading-relaxed">
                  First-class legal consent controls. Merchant approval queue ensures only safe, brand-safe photos hit the screen.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-800/60 text-xs text-stone-400">
                Granular opt-in & instant takedown
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-stone-900 text-center text-xs text-stone-400">
        <p>© 2026 Café Memories. Built for modern cafés & specialty roasters.</p>
      </footer>
    </div>
  );
}
