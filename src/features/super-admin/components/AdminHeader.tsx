'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ExternalLink } from 'lucide-react';
import { StampyLogo } from '@/components/brand/StampyLogo';
import { SaaSPlatformMetrics } from '@/types/subscription';

interface AdminHeaderProps {
  saasMetrics: SaaSPlatformMetrics;
}

export function AdminHeader({ saasMetrics }: AdminHeaderProps) {
  return (
    <header className="bg-[#141212] text-[#FBF9F5] border-b border-white/10 sticky top-0 z-40 px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="transition hover:opacity-90">
            <StampyLogo variant="horizontal" size="sm" theme="dark" showTagline={false} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight text-white font-serif">
                Stampy SaaS • Super Admin Portal
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40">
                ENTERPRISE CONTROL
              </span>
            </div>
            <p className="text-[11px] text-stone-300">
              بوابة الإدارة المركزية، إدارة باقات الـ SaaS، ومتابعة الإيرادات المتكررة MRR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MRR: {saasMetrics.totalMrr.toLocaleString()} ر.س</span>
          </div>
          <a
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition flex items-center gap-1.5 border border-white/20"
          >
            <span>لوحة التاجر والاشتراك</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
