'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Camera, Tv } from 'lucide-react';
import { StampyLogo, StampyApertureMark } from '@/components/brand/StampyLogo';
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
    <div className="min-h-screen bg-[#FAF5EB] text-[#3D2314] font-sans flex flex-col justify-between p-6 antialiased selection:bg-[#682025] selection:text-white relative">
      {/* Background paper texture dots */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(#3D2314 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 group transition-transform hover:-translate-y-0.5" aria-label="Stampy Home">
          <StampyLogo variant="horizontal" size="sm" showTagline={false} />
        </Link>

        <Link
          href="/"
          className="px-4 py-2 rounded-full border border-[#DFAB56]/40 bg-white/80 hover:bg-white text-xs font-bold text-[#3D2314] transition flex items-center gap-1.5 shadow-2xs"
        >
          <Home className="w-3.5 h-3.5 text-[#682025]" />
          <span>الرئيسية</span>
        </Link>
      </header>

      {/* Center 404 Hero */}
      <main className="max-w-xl mx-auto w-full text-center py-16 space-y-6">
        <div className="relative inline-flex items-center justify-center mb-2">
          <div className="w-24 h-24 rounded-3xl bg-[#FAF5EB] border-2 border-[#DFAB56]/60 flex items-center justify-center shadow-xl">
            <StampyApertureMark size={56} color="#3D2314" strokeColor="#DFAB56" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-[#682025] text-white text-xs font-black font-mono shadow-md">
            404
          </span>
        </div>

        <div className="space-y-3">
          <h1
            style={{ fontFamily: 'var(--font-head), "Plus Jakarta Sans", sans-serif' }}
            className="text-3xl sm:text-5xl font-black text-[#3D2314] tracking-tight"
          >
            هذه اللحظة غير موجودة في الأرشيف
          </h1>
          <p className="text-sm text-[#6E4E38] max-w-md mx-auto leading-relaxed font-medium">
            يبدو أن الرابط الذي تبحث عنه قد تم نقله أو أن مدة الرمز المؤقت قد انتهت. لا تقلق، ذكرياتك وبياناتك محفوظة دائماً.
          </p>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="py-3 px-6 rounded-full bg-[#682025] hover:bg-[#52171B] text-[#FAF5EB] text-xs font-bold shadow-md transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="w-4 h-4 text-[#DFAB56]" />
            <span>العودة للرئيسية</span>
          </Link>

          <Link
            href="/c/stampy"
            prefetch={false}
            className="py-3 px-6 rounded-full bg-white border border-[#DFAB56]/40 text-[#3D2314] text-xs font-bold shadow-2xs transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera className="w-4 h-4 text-[#682025]" />
            <span>تجربة العميل</span>
          </Link>

          <Link
            href="/wall/screen-1"
            prefetch={false}
            className="py-3 px-6 rounded-full bg-white border border-[#DFAB56]/40 text-[#3D2314] text-xs font-bold shadow-2xs transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Tv className="w-4 h-4 text-[#682025]" />
            <span>شاشة الصالة الحية</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 text-xs text-[#6E4E38]/80 border-t border-[#DFAB56]/30 font-mono">
        <span>stampy. • EVERY MOMENT IS A STAMP IN TIME. • 2026</span>
      </footer>
    </div>
  );
}
