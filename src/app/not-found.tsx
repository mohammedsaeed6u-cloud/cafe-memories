'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Home, Camera, Tv, Sparkles, Search } from 'lucide-react';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';
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
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#0E1A16] text-[#3B2F2A] dark:text-[#FAF6EE] font-cairo flex flex-col justify-between p-6 antialiased selection:bg-[#B85C43]/20 selection:text-[#1E3A32]">
      {/* Background paper noise */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#1E3A32 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Navbar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#1E3A32] text-[#FAF6EE] flex items-center justify-center shadow-md">
            <MemoriesArchIcon size={26} color="#FAF6EE" />
          </div>
          <span
            className="font-serif font-black text-xl tracking-tight text-[#1E3A32] dark:text-[#FAF6EE] lowercase"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            memories
          </span>
        </Link>

        <Link
          href="/"
          className="px-4 py-2 rounded-full border border-[#E8DCC6] dark:border-[#2A4F44] text-xs font-bold hover:bg-[#E8DCC6]/40 transition flex items-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5 text-[#B85C43]" />
          <span>الرئيسية</span>
        </Link>
      </header>

      {/* Center 404 Hero */}
      <main className="max-w-xl mx-auto w-full text-center py-16 space-y-6">
        <div className="relative inline-flex items-center justify-center mb-2">
          <div className="w-24 h-24 rounded-3xl bg-[#E8DCC6] dark:bg-[#142721] border-2 border-[#D3C4A7] dark:border-[#2A4F44] flex items-center justify-center shadow-xl">
            <MemoriesArchIcon size={56} color="#1E3A32" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-[#B85C43] text-white text-xs font-black font-mono shadow-md">
            404
          </span>
        </div>

        <div className="space-y-3">
          <h1
            className="text-3xl sm:text-5xl font-black text-[#1E3A32] dark:text-[#FAF6EE] font-serif tracking-tight"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            هذه اللحظة غير موجودة في الأرشيف
          </h1>
          <p className="text-sm text-[#3B2F2A]/75 dark:text-[#FAF6EE]/75 max-w-md mx-auto leading-relaxed">
            يبدو أن الرابط الذي تبحث عنه قد تم نقله أو أن مدة الرمز المؤقت قد انتهت. لا تقلق، ذكرياتك وبياناتك محفوظة دائماً.
          </p>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="py-3 px-6 rounded-full bg-[#1E3A32] hover:bg-[#142721] text-[#FAF6EE] text-xs font-bold shadow-md transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="w-4 h-4 text-[#B85C43]" />
            <span>العودة للرئيسية</span>
          </Link>

          <Link
            href="/c/memories"
            prefetch={false}
            className="py-3 px-6 rounded-full bg-white dark:bg-[#142721] border border-[#E8DCC6] dark:border-[#2A4F44] text-[#1E3A32] dark:text-[#FAF6EE] text-xs font-bold shadow-xs transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera className="w-4 h-4 text-[#B85C43]" />
            <span>تجربة العميل </span>
          </Link>

          <Link
            href="/wall/screen-1"
            prefetch={false}
            className="py-3 px-6 rounded-full bg-white dark:bg-[#142721] border border-[#E8DCC6] dark:border-[#2A4F44] text-[#1E3A32] dark:text-[#FAF6EE] text-xs font-bold shadow-xs transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Tv className="w-4 h-4 text-[#8A9A7B]" />
            <span>شاشة الصالة الحية</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 text-xs text-[#3B2F2A]/60 dark:text-[#FAF6EE]/60 border-t border-[#E8DCC6] dark:border-[#2A4F44]">
        <span>memories • CAFÉ MOMENTS. LASTING LOYALTY. • 2026</span>
      </footer>
    </div>
  );
}
