'use client';

import React from 'react';
import Link from 'next/link';
import { Tv, Shield, Wifi, ExternalLink } from 'lucide-react';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';

export function MarketingWallSection() {
  return (
    <section id="live-wall" className="py-20 px-6 max-w-6xl mx-auto border-t border-stone-200/80">
      <div className="p-8 sm:p-12 rounded-3xl bg-[#1E1917] text-white shadow-xl relative overflow-hidden border border-[#2E2724]">
        {/* Subtle Ambient Warm Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono text-amber-400 font-bold">
              <Tv className="w-3.5 h-3.5" />
              <span>LIVING MEMORY WALL</span>
            </div>

            <h2
              className="text-3xl sm:text-4xl font-black text-white font-serif leading-tight"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              نشاطك التجاري يحصل على جدار ذكريات حي خاص به.
            </h2>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              حوّل أي شاشة تلفزيون ذكية داخل الصالة أو المتجر إلى بورد ذكريات تفاعلي يعرض لحظات رواد المكان المعتمدة. بمجرد موافقة الزائر الصريحة واعتماد طاقم الخدمة السريع، تنضم لقطته للجدار في تدفق بصري راقٍ دون الكشف عن أي بيانات شخصية خاصة.
            </p>

            <div className="space-y-2.5 pt-2 text-xs text-stone-300 font-medium">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>موافقة مسبقة واعتماد إداري: لا تظهر أي صورة دون موافقة الزائر ومراجعة الطاقم.</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-amber-400 shrink-0" />
                <span>وضع ملء الشاشة الكامل (Fullscreen Mode) متوافق مع أي متصفح شاشة ذكية.</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/wall/screen-1"
                className="w-full sm:w-auto text-xs font-bold py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>معاينة شاشة الصالة الحية (Live Wall)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Wall Mockup Visual: Authentic 4K Smart TV Digital Signage */}
          <div className="p-4 sm:p-5 bg-[#120F0E] rounded-3xl border border-stone-800 shadow-2xl space-y-3 ring-1 ring-white/10">
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-800/80 text-[10px] font-mono text-stone-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-amber-400 font-bold">LIVE BROADCAST • 4K OLED</span>
              </div>
              <span className="text-stone-300 font-bold">MEMORIES STUDIO</span>
            </div>

            <div className="aspect-[16/10] bg-[#1A1614] rounded-2xl border border-stone-800 overflow-hidden relative flex flex-col sm:flex-row items-center p-3 sm:p-4 gap-4">
              {/* Featured Polaroid Memory */}
              <div className="relative w-full sm:w-3/5 h-full rounded-xl overflow-hidden shadow-lg border-2 border-white/90 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                  alt="Customer Live Wall Feature"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-stone-950/90 via-stone-950/60 to-transparent text-white text-right">
                  <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/80 text-stone-950 font-bold">
                      الزيارة #4
                    </span>
                    <span className="text-stone-300">منذ ١٠ دقائق</span>
                  </div>
                  <h4 className="text-xs font-black text-white">سارة عبد الله</h4>
                  <p className="text-[10px] text-stone-200 font-medium">"أحلى فلات وايت وذكريات مع الأصحاب ☕✨"</p>
                </div>
              </div>

              {/* Scannable Live Wall QR & Callout */}
              <div className="w-full sm:w-2/5 flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 bg-white rounded-2xl shadow-md border border-stone-200">
                  <div className="w-20 h-20 flex items-center justify-center overflow-hidden rounded-xl bg-white">
                    <RealOutsourcedQr
                      value="https://memories-c9w.pages.dev/c/memories"
                      size={80}
                      alt="رمز مسح تجربة الزائر الحية"
                    />
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-amber-400 tracking-wider">
                  SCAN TO JOIN WALL
                </span>
                <span className="text-[8px] text-stone-400 leading-tight">
                  التقط صورتك بهاتفك لتظهر فوراً على شاشة الصالة
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>تحديث متزامن فوري • Ultra Smooth</span>
              </span>
              <span>100% بموافقة العميل واعتماد الموظف</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
