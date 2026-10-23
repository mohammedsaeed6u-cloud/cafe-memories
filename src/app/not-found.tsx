'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Home, Camera, Tv, Sparkles, Search } from 'lucide-react';
import { StampyLogo } from '@/components/brand/StampyLogo';
import { CustomerClient } from '@/components/customer/CustomerClient';
import { WallClient } from '@/components/wall/WallClient';

export default function NotFoundPage() {
  const [dynamicRoute, setDynamicRoute] = useState<{
    type: 'customer' | 'wall' | '404';
    param: string;
  }>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/c/')) {
        const rawSlug = pathname.replace('/c/', '').split('/')[0].split('?')[0];
        if (rawSlug) {
          return { type: 'customer', param: decodeURIComponent(rawSlug) };
        }
      }
      if (pathname.startsWith('/wall/')) {
        const rawScreen = pathname.replace('/wall/', '').split('/')[0].split('?')[0];
        if (rawScreen) {
          return { type: 'wall', param: decodeURIComponent(rawScreen) };
        }
      }
    }
    return { type: '404', param: '' };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/c/')) {
        const rawSlug = pathname.replace('/c/', '').split('/')[0].split('?')[0];
        if (rawSlug && rawSlug !== dynamicRoute.param) {
          setDynamicRoute({ type: 'customer', param: decodeURIComponent(rawSlug) });
          return;
        }
      }
      if (pathname.startsWith('/wall/')) {
        const rawScreen = pathname.replace('/wall/', '').split('/')[0].split('?')[0];
        if (rawScreen && rawScreen !== dynamicRoute.param) {
          setDynamicRoute({ type: 'wall', param: decodeURIComponent(rawScreen) });
          return;
        }
      }
    }
  }, [dynamicRoute.param]);

  if (dynamicRoute.type === 'customer' && dynamicRoute.param) {
    return <CustomerClient cafeSlug={dynamicRoute.param} />;
  }

  if (dynamicRoute.type === 'wall' && dynamicRoute.param) {
    return <WallClient screenId={dynamicRoute.param} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF5EB] text-[#3D2314] font-cairo flex flex-col justify-between p-6 antialiased selection:bg-[#DFAB56] selection:text-[#3D2314]">
      {/* Background paper noise */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#3D2314 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <StampyLogo size="md" showTagline={false} />
        </Link>

        <Link
          href="/"
          className="px-4 py-2 rounded-full border border-[#EADDC4] bg-white text-xs font-bold text-[#3D2314] hover:bg-[#FAF5EB] transition flex items-center gap-1.5 shadow-xs"
        >
          <Home className="w-3.5 h-3.5 text-[#DFAB56]" />
          <span>الرئيسية</span>
        </Link>
      </header>

      {/* Center 404 Hero */}
      <main className="max-w-xl mx-auto w-full text-center py-16 space-y-6">
        <div className="relative inline-flex items-center justify-center mb-2">
          <div className="w-24 h-24 rounded-3xl bg-white border-2 border-[#EADDC4] flex items-center justify-center shadow-lg">
            <StampyLogo size="md" showTagline={false} />
          </div>
          <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-[#AC3E25] text-white text-xs font-black font-mono shadow-md">
            404
          </span>
        </div>

        <div className="space-y-3">
          <h1
            className="text-3xl sm:text-5xl font-black text-[#3D2314] font-serif tracking-tight"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            هذه اللحظة غير موجودة في الأرشيف
          </h1>
          <p className="text-sm text-[#63574D] max-w-md mx-auto leading-relaxed">
            يبدو أن الرابط الذي تبحث عنه قد تم نقله أو أن مدة الرمز المؤقت قد انتهت. لا تقلق، ذكرياتك وبياناتك محفوظة دائماً.
          </p>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="py-3 px-6 rounded-full bg-[#DFAB56] hover:bg-[#C99645] text-[#3D2314] text-xs font-bold shadow-md transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="w-4 h-4 text-[#3D2314]" />
            <span>العودة للرئيسية</span>
          </Link>

          <Link
            href="/c/stampy"
            prefetch={false}
            className="py-3 px-6 rounded-full bg-white border border-[#EADDC4] text-[#3D2314] text-xs font-bold shadow-xs transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] hover:bg-[#FAF5EB]"
          >
            <Camera className="w-4 h-4 text-[#DFAB56]" />
            <span>استوديو الزائر</span>
          </Link>

          <Link
            href="/wall/screen-1"
            prefetch={false}
            className="py-3 px-6 rounded-full bg-white border border-[#EADDC4] text-[#3D2314] text-xs font-bold shadow-xs transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] hover:bg-[#FAF5EB]"
          >
            <Tv className="w-4 h-4 text-[#DFAB56]" />
            <span>شاشة الصالة الحية</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 text-xs text-[#7D6E63] border-t border-[#EADDC4]">
        <span>STAMPY (استامبي) • CHERISHED MOMENTS. LASTING LOYALTY. • 2026</span>
      </footer>
    </div>
  );
}
