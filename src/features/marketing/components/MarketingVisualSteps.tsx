'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Award,
  Tv,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Layers,
  Clock,
  Printer,
} from 'lucide-react';

const FILTER_PRESETS = [
  {
    id: 'noir',
    name: 'Korean Noir',
    nameAr: 'نوار كوري',
    filterClass: 'grayscale contrast-125 brightness-95',
    tag: '35mm Monochrome',
  },
  {
    id: 'retro',
    name: 'Retro Film',
    nameAr: 'فيلم ريترو',
    filterClass: 'sepia-[0.35] contrast-110 saturate-125 hue-rotate-[-10deg]',
    tag: 'Kodak Portra Tone',
  },
  {
    id: 'latte',
    name: 'Warm Latte',
    nameAr: 'كافيه لاتيه',
    filterClass: 'contrast-105 brightness-105 saturate-90',
    tag: 'Soft Editorial Glow',
  },
];

export function MarketingVisualSteps() {
  const [activeFilterId, setActiveFilterId] = useState<'noir' | 'retro' | 'latte'>('noir');
  const [demoStamps, setDemoStamps] = useState<number>(3);
  const [demoPin, setDemoPin] = useState<string>('••••');
  const [pinVerified, setPinVerified] = useState<boolean>(true);

  const activeFilter = FILTER_PRESETS.find((f) => f.id === activeFilterId) || FILTER_PRESETS[0];

  const handleSimulateStamp = () => {
    setDemoStamps((prev) => (prev >= 4 ? 1 : prev + 1));
  };

  return (
    <section id="customer-journey" className="px-4 sm:px-6 py-24 max-w-6xl mx-auto border-t border-white/10 apple-font select-none">
      {/* Section Eyebrow & Headline */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-[#55100D]/50 border border-[#DD0200]/40 text-[11px] font-mono tracking-widest text-[#FBF9F5] uppercase mb-3 backdrop-blur-xl">
          <Layers className="w-3.5 h-3.5 text-[#DD0200]" />
          <span>BENTO ARCHITECTURE • البنية المتكاملة للتجربة</span>
        </div>
        <h2
          className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          هندسة متكاملة لتجربة العميل والولاء في مكان واحد.
        </h2>
        <p className="text-sm sm:text-base text-[#A19E9B] mt-3.5 leading-relaxed">
          من لحظة مسح رمز الطاولة إلى كارت المحفظة وشاشة الصالة الحية، منظومة متصلة ترفع تكرار الزيارات بدون أي تعقيد تقني.
        </p>
      </div>

      {/* 12-Column Asymmetrical Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ============================================================== */}
        {/* BENTO 1: Zero-App Instant Photobooth (8 Cols)                  */}
        {/* ============================================================== */}
        <div className="lg:col-span-8 p-7 sm:p-9 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl flex flex-col justify-between group">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#DD0200]/10 rounded-full blur-[100px] pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold text-[#FBF9F5] px-2.5 py-1 rounded-md bg-[#55100D] border border-[#DD0200]/40">
                MODULE 01
              </span>
              <span className="text-[11px] font-mono text-[#34C759] flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                <span>NO APP NEEDED • WEB NATIVE</span>
              </span>
            </div>

            <h3
              className="text-2xl sm:text-3xl font-semibold text-white mb-2 leading-snug"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              استوديو تصوير فوري بهوية نشاطك التجاري
            </h3>
            <p className="text-xs sm:text-sm text-[#A19E9B] leading-relaxed max-w-xl">
              يمسح الزائر رمز الطاولة بكاميرا هاتفه فيفتح استوديو التصوير المخصص بهوية علامتك فوراً. يدعم فلاتر سينمائية مستوحاة من كبائن سيول، مع ملمس ورق حقيقي وتوثيق تاريخي لكل لقطة.
            </p>

            {/* Interactive Filter Preview Bar */}
            <div className="mt-6 p-4 rounded-xl bg-[#0E0D0D] border border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#DD0200]" />
                  <span>جرّب الفلاتر الحية (Live Interactive Filters):</span>
                </span>
                <span className="text-[10px] font-mono text-[#D9D9D9] bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {activeFilter.tag}
                </span>
              </div>

              {/* Filter Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {FILTER_PRESETS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilterId(f.id as any)}
                    className={
                      'py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex flex-col items-center gap-0.5 ' +
                      (activeFilterId === f.id
                        ? 'bg-[#DD0200] border-[#DD0200] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-300')
                    }
                  >
                    <span>{f.nameAr}</span>
                    <span className="text-[9px] font-mono opacity-80">{f.name}</span>
                  </button>
                ))}
              </div>

              {/* Visual Strip Live Strip Mock with active filter */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
                ].map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/15 bg-black"
                  >
                    <img
                      src={src}
                      alt="Filter Demo"
                      className={'w-full h-full object-cover transition-all duration-500 ' + activeFilter.filterClass}
                    />
                    <div className="absolute top-1 right-1 text-[8px] font-mono bg-black/60 text-white/80 px-1 rounded">
                      #{String(i + 1).padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#A19E9B]">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Printer className="w-3.5 h-3.5 text-[#DD0200]" />
              <span>جاهز للطباعة الفورية بدقة 300 DPI</span>
            </span>
            <Link
              href="/c/memories"
              className="text-xs text-[#DD0200] hover:text-[#FF5E5B] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>تجربة كاميرا الزائر</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BENTO 2: Apple & Google Wallet Pass (4 Cols)                  */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 p-7 sm:p-9 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl flex flex-col justify-between group">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#55100D]/20 rounded-full blur-[80px] pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold text-[#FBF9F5] px-2.5 py-1 rounded-md bg-[#55100D] border border-[#DD0200]/40">
                MODULE 02
              </span>
              <span className="text-[11px] font-mono text-[#D9D9D9] font-bold">
                APPLE WALLET NFC
              </span>
            </div>

            <h3
              className="text-xl sm:text-2xl font-semibold text-white mb-2 leading-snug"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              كارت ولاء رسمي في محفظة الهاتف
            </h3>
            <p className="text-xs text-[#A19E9B] leading-relaxed">
              كارت ذكي يُحفظ مباشرة داخل Apple Wallet و Google Wallet دون بطاقات ورقية مهملة.
            </p>

            {/* Interactive Stamp Card Demonstration */}
            <div className="mt-5 p-4 rounded-xl bg-[#0E0D0D] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-white font-mono">
                <span className="font-bold">MEMORIES VIP PASS</span>
                <span className="text-[#DD0200]">{demoStamps}/4 STAMPS</span>
              </div>

              {/* 4 Stamp Slots */}
              <div className="grid grid-cols-4 gap-2 py-2">
                {[1, 2, 3, 4].map((slot) => {
                  const isFilled = slot <= demoStamps;
                  const isLast = slot === 4;
                  return (
                    <div
                      key={slot}
                      className={
                        'aspect-square rounded-lg flex items-center justify-center transition-all border ' +
                        (isFilled
                          ? 'bg-[#55100D] border-[#DD0200] text-white shadow-md shadow-red-950/40'
                          : 'bg-white/5 border-dashed border-white/20 text-stone-600')
                      }
                    >
                      {isFilled ? (
                        isLast ? (
                          <Sparkles className="w-4 h-4 text-[#DD0200] animate-bounce" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-[#DD0200]" />
                        )
                      ) : (
                        <span className="text-[10px] font-mono text-[#A19E9B]">#{slot}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Click to add stamp simulation */}
              <button
                type="button"
                onClick={handleSimulateStamp}
                className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 text-xs font-semibold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>اضغط لمحاكاة ختم زيارة (+1)</span>
              </button>

              <div className="text-[10px] text-center font-mono text-[#34C759]">
                {demoStamps >= 4 ? '🎉 الهدية جاهزة للاسترداد لدى الكاشير!' : 'تبقى زيارة واحدة لفتح المكافأة!'}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#A19E9B]">
            <span className="text-[11px] font-mono">تنبيهات جغرافية عند الاقتراب</span>
            <span className="text-[#DD0200] font-mono font-bold">✦ SMART NFC</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BENTO 3: Rapid Staff PIN Stamp (4 Cols)                       */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 p-7 sm:p-9 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl flex flex-col justify-between group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#55100D]/15 rounded-full blur-[80px] pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold text-[#FBF9F5] px-2.5 py-1 rounded-md bg-[#55100D] border border-[#DD0200]/40">
                MODULE 03
              </span>
              <span className="text-[11px] font-mono text-[#DD0200] font-bold">
                SPEED: 2.0 SECONDS
              </span>
            </div>

            <h3
              className="text-xl sm:text-2xl font-semibold text-white mb-2 leading-snug"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              اعتماد الكاشير برمز PIN السريع
            </h3>
            <p className="text-xs text-[#A19E9B] leading-relaxed">
              لا يحتاج طاقم العمل لأجهزة POS مخصصة. نافذة إدخال PIN فوري من 4 أرقام تمنح الختم في ثانيتين دون تعطيل طابور الزبائن.
            </p>

            {/* Fast PIN Demo Visual */}
            <div className="mt-5 p-4 rounded-xl bg-[#0E0D0D] border border-white/10 text-center space-y-3">
              <div className="text-[10px] font-mono uppercase text-[#A19E9B]">STAFF VERIFICATION PIN</div>
              <div className="flex items-center justify-center gap-3">
                {[1, 2, 3, 4].map((dot) => (
                  <div
                    key={dot}
                    className="w-3.5 h-3.5 rounded-full bg-[#DD0200] shadow-[0_0_10px_rgba(221,2,0,0.8)]"
                  />
                ))}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>تم الاعتماد بنجاح • Barista #02</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#A19E9B]">
            <span className="text-[11px] font-mono">حماية ضد التكرار والاحتيال</span>
            <span className="text-[#34C759] font-mono font-bold">0% REVENUE LEAK</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BENTO 4: 4K Live Signage Wall (8 Cols)                        */}
        {/* ============================================================== */}
        <div className="lg:col-span-8 p-7 sm:p-9 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl flex flex-col justify-between group">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#DD0200]/12 rounded-full blur-[110px] pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold text-[#FBF9F5] px-2.5 py-1 rounded-md bg-[#55100D] border border-[#DD0200]/40">
                MODULE 04
              </span>
              <span className="text-[11px] font-mono text-[#DD0200] flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#DD0200] animate-ping" />
                <span>LIVE 4K SMART TV STREAM</span>
              </span>
            </div>

            <h3
              className="text-2xl sm:text-3xl font-semibold text-white mb-2 leading-snug"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              شاشة الصالة الذكية: طاقة اجتماعية تحرك المكان
            </h3>
            <p className="text-xs sm:text-sm text-[#A19E9B] leading-relaxed max-w-xl">
              بموافقة الزائر الصريحة واعتماد الموظف، تُبث الذكريات مباشرة على شاشات التلفزيون في الصالة بدقة 4K. مشاهدة الطاولات الأخرى لصور زوار الصالة تشعل رغبة الحضور في تجربة التصوير.
            </p>

            {/* TV Screen Preview */}
            <div className="mt-5 p-4 rounded-xl bg-[#0E0D0D] border border-white/15 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] font-mono">
                <span className="text-white flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-[#DD0200]" />
                  <span>SALON SCREEN #01 • FLAGSHIP</span>
                </span>
                <span className="text-[#34C759]">60 FPS • WEBSOCKET LIVE</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { tag: 'طاولة 04', time: 'منذ دقيقة', src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80' },
                  { tag: 'الكاونتر', time: 'منذ 3 دقائق', src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80' },
                  { tag: 'طاولة 09', time: 'منذ 7 دقائق', src: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80' },
                ].map((item, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-white/10 bg-black group">
                    <img src={item.src} alt="Live Wall" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-1.5 right-1.5 text-right">
                      <span className="text-[9px] font-bold text-white block">{item.tag}</span>
                      <span className="text-[7.5px] font-mono text-[#D9D9D9]">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#A19E9B]">
            <span className="text-[11px] font-mono">متوافق مع Samsung Tizen و LG webOS وأي متصفح</span>
            <Link
              href="/wall/screen-1"
              className="text-xs text-[#DD0200] hover:text-[#FF5E5B] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>معاينة شاشة الصالة بالحجم الكامل</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MarketingVisualSteps;
