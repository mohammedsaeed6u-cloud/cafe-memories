'use client';

import React from 'react';
import Link from 'next/link';
import { Tv, Shield, Wifi, ExternalLink } from 'lucide-react';

export function MarketingWallSection() {
  return (
    <section id="live-wall" className="py-24 px-6 max-w-6xl mx-auto border-t border-white/10 apple-font">
      <div className="p-8 sm:p-12 rounded-[36px] bg-gradient-to-b from-[#1A0706]/40 via-[#0A0404]/60 to-[#000000] text-white shadow-2xl relative overflow-hidden border border-white/15 backdrop-blur-2xl">
        {/* Subtle Ambient Red Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DD0200]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D9D9D9]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/15 text-[11px] font-mono text-[#D9D9D9] font-bold backdrop-blur-md">
              <Tv className="w-3.5 h-3.5 text-[#DD0200]" />
              <span>APPLE TV & SMART SCREEN • LIVE WALL</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              نشاطك التجاري يحصل على جدار ذكريات حي خاص به.
            </h2>

            <p className="text-xs sm:text-sm text-[#D9D9D9]/80 leading-relaxed">
              حوّل أي شاشة تلفزيون ذكية داخل الصالة أو المتجر إلى بورد ذكريات تفاعلي يعرض لحظات رواد المكان المعتمدة بدقة 4K. بمجرد موافقة الزائر الصريحة واعتماد طاقم الخدمة السريع، تنضم لقطته للجدار في تدفق بصري راقٍ دون الكشف عن أي بيانات شخصية خاصة.
            </p>

            <div className="space-y-2.5 pt-2 text-xs text-[#D9D9D9]/90 font-medium">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#34C759] shrink-0" />
                <span>موافقة مسبقة واعتماد إداري: لا تظهر أي صورة دون موافقة الزائر ومراجعة الطاقم.</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#DD0200] shrink-0" />
                <span>وضع ملء الشاشة الكامل (Fullscreen Mode) متوافق مع أي متصفح شاشة ذكية.</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/wall/screen-1"
                className="w-full sm:w-auto text-xs font-bold py-3.5 px-6 rounded-full bg-[#DD0200] hover:bg-[#B50200] text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>معاينة شاشة الصالة الحية (Live Wall)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Wall Mockup Visual: Apple 4K OLED Screen */}
          <div className="p-4 sm:p-5 bg-[#000000] rounded-[28px] border border-white/20 shadow-2xl space-y-3 ring-1 ring-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10 text-[10px] font-mono text-[#D9D9D9]/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                <span className="text-[#DD0200] font-bold">LIVE BROADCAST • 4K OLED</span>
              </div>
              <span>MEMORIES TV // SCREEN-01</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="aspect-[4/3] rounded-2xl bg-white/[0.05] border border-white/10 overflow-hidden relative group">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                  alt="Guest memory"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-2 left-2 text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-xs">
                  #01 • منذ دقيقتين
                </div>
              </div>
              <div className="aspect-[4/3] rounded-2xl bg-white/[0.05] border border-white/10 overflow-hidden relative group">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80"
                  alt="Guest memory"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-2 left-2 text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-xs">
                  #02 • منذ 5 دقائق
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs text-[#D9D9D9]/90">
              <span className="font-medium">بث فوري متواصل مع كل زيارة معتمدة</span>
              <span className="text-[#DD0200] font-mono font-bold">60 FPS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
