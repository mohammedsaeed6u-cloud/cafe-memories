'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Smartphone,
  Tv,
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function StampyServicesSection() {
  const [activeFilter, setActiveFilter] = useState<'noir' | 'latte' | 'retro' | 'cyber'>('latte');

  const filters = [
    { id: 'latte', label: '☕ Cafe Latte', filterCss: 'sepia(30%) contrast(105%)' },
    { id: 'noir', label: '🎬 Korean Noir', filterCss: 'grayscale(100%) contrast(120%)' },
    { id: 'retro', label: '🎞️ Retro Film 35mm', filterCss: 'sepia(50%) hue-rotate(-20deg)' },
    { id: 'cyber', label: '🌸 Sakura Y2K', filterCss: 'saturate(140%) hue-rotate(10deg)' },
  ];

  return (
    <section className="py-24 px-4 bg-[#FAF5EB] border-b-[2.5px] border-[#1B1B1E]" id="services">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="kicker">BEYOND BASIC STAMPS • خدماتنا الفائقة الحصرية</span>
          <h2 className="h2-poster center">
            PHOTOBOOTHS, 4K WALLS & <span className="purp">SMART POS.</span>
          </h2>
          <p className="sub-poster center">
            We didn&apos;t just stop at digital stamp cards. We built an entire in-store engagement suite that turns every customer visit into an unforgettable brand experience.
            <br className="hidden sm:inline" />
            استوديو تصوير كوري، شاشة صالة تفاعلية 4K، ومحطة كاشير فائقة السرعة — كلها متصلة ببطاقة المحفظة.
          </p>
        </div>

        {/* 3 Major Feature Showcases */}
        <div className="space-y-16">
          {/* ==================== SERVICE 1: PHOTOBOOTH STRIP STUDIO ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 rounded-3xl border-[2.5px] border-[#1B1B1E] shadow-[8px_8px_0_#682025]">
            {/* Left: Text Explanation */}
            <div className="lg:col-span-6 space-y-5 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F3EA] border-2 border-[#1B1B1E] text-xs font-head font-bold uppercase text-[#682025]">
                <Camera className="w-4 h-4 text-[#f0456a]" />
                <span>PHOTOBOOTH STRIP STUDIO • استوديو شريط الذكريات</span>
              </div>

              <h3 className="font-head text-3xl sm:text-4xl font-black text-[#1B1B1E] uppercase leading-tight">
                حوّل زبائنك إلى سفراء لعلامتك بصور شرائط سينمائية
              </h3>

              <p className="text-sm text-[#4a3a6a] leading-relaxed">
                العميل لا يريد مجرد ختم باهت — يريد ذكرى جميلة يشاركها على إنستغرام وتيك توك. استوديو ستامبي يتيح للعملاء التقاط صورهم مباشرة من متصفح الهاتف بإطارات وفلاتر كورية تحمل شعار متجرك وربطها فورياً برصيد بطاقتهم!
              </p>

              {/* Interactive Filter Switches */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-head font-bold uppercase text-[#8b7aaa] block">
                  جرب الفلاتر الكورية الحية:
                </span>
                <div className="flex flex-wrap gap-2">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFilter(f.id as any)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-head font-bold uppercase border-2 transition cursor-pointer ${
                        activeFilter === f.id
                          ? 'bg-[#1B1B1E] text-white border-[#1B1B1E] shadow-[2px_2px_0_#f0456a]'
                          : 'bg-[#F7F3EA] text-[#1B1B1E] border-[#e2dbf0] hover:bg-[#FAF5EB]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-[#e2dbf0]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#682025] shrink-0" />
                  <span>ملصقات رقمية تفاعلية</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#682025] shrink-0" />
                  <span>تصدير فوري لقصص إنستغرام</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#682025] shrink-0" />
                  <span>ربط تلقائي بختم الكارت</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#682025] shrink-0" />
                  <span>طباعة هدايا وتذكارات</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/c/stampy"
                  className="btn-fat"
                >
                  <span>جرب الاستوديو الحي الآن</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: Photobooth Strip Mockup */}
            <div className="lg:col-span-6 flex justify-center py-4">
              <div className="relative group">
                <div className="w-[200px] sm:w-[220px] rounded-2xl bg-white p-3 border-[2.5px] border-[#1B1B1E] shadow-[8px_8px_0_#1B1B1E] space-y-2.5 transform rotate-1 group-hover:rotate-0 transition duration-300">
                  {/* Studio Header */}
                  <div className="text-center border-b border-black/10 pb-1.5">
                    <span className="font-head text-[10px] uppercase font-black text-[#682025] tracking-wider block">
                      Espresso Lab • 35MM
                    </span>
                    <span className="text-[8px] font-mono text-gray-500">2026.10.18 // SEOUL 4-CUTS</span>
                  </div>

                  {/* 4 Strip Slots */}
                  {[1, 2, 3, 4].map((slotIdx) => (
                    <div
                      key={slotIdx}
                      style={{
                        filter: filters.find((x) => x.id === activeFilter)?.filterCss,
                      }}
                      className="aspect-[4/3] rounded-lg bg-gradient-to-tr from-amber-100 via-rose-100 to-indigo-100 border border-black/15 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden transition-all duration-300"
                    >
                      <span className="text-2xl">
                        {slotIdx === 1 ? '✨' : slotIdx === 2 ? '☕' : slotIdx === 3 ? '📸' : '🎁'}
                      </span>
                      <span className="text-[8px] font-head font-bold uppercase text-gray-700 mt-1">
                        MEMORY #{slotIdx}
                      </span>
                      <div className="absolute top-1 left-1.5 text-[7px] font-mono opacity-40">
                        {`0${slotIdx}`}
                      </div>
                    </div>
                  ))}

                  {/* Strip Barcode & Brand Footer */}
                  <div className="pt-1 text-center space-y-1">
                    <div className="h-6 w-full bg-[repeating-linear-gradient(90deg,#1B1B1E_0,#1B1B1E_2px,#ffffff_2px,#ffffff_4px)] rounded" />
                    <span className="text-[8px] font-mono font-bold text-gray-600">
                      STAMPY • WALLET SYNCED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== SERVICE 2: 4K LIVE WALL SIGNAGE ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 rounded-3xl border-[2.5px] border-[#1B1B1E] shadow-[8px_8px_0_#f0456a]">
            {/* Left: TV Display Mockup */}
            <div className="lg:col-span-6 flex justify-center py-4 order-2 lg:order-1">
              <div className="w-full max-w-[420px] rounded-2xl bg-[#0d071a] p-3 border-[2.5px] border-[#1B1B1E] shadow-[8px_8px_0_#1B1B1E] space-y-2 text-white">
                {/* TV Header Bar */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-head text-xs font-bold text-[#f5c842] uppercase tracking-wider">
                      4K LIVE SIGNAGE • ESPRESSO LAB
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/80">
                    PIN: 849-201
                  </span>
                </div>

                {/* Simulated Live Wall Grid */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-black/40 rounded-xl border border-white/5">
                  {[
                    { title: 'سارة م.', note: 'Flat White ☕', time: 'الآن' },
                    { title: 'عبدالله ش.', note: 'الختم العاشر! 🎁', time: 'من دقيقة' },
                    { title: 'نورة ق.', note: 'V60 إثيوبي ✨', time: 'من 3 دقائق' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="aspect-[3/4] rounded-lg bg-gradient-to-b from-[#451215] to-[#1B1B1E] border border-white/15 p-2 flex flex-col justify-between text-center shadow-xs"
                    >
                      <span className="text-xl">
                        {idx === 1 ? '🎉' : idx === 0 ? '✨' : '💖'}
                      </span>
                      <div>
                        <strong className="text-[10px] font-bold block text-white">{item.title}</strong>
                        <span className="text-[8px] text-[#f5c842] block font-mono">{item.note}</span>
                      </div>
                      <span className="text-[7px] text-white/50">{item.time}</span>
                    </div>
                  ))}
                </div>

                {/* Confetti & Notification Banner */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#f0456a] to-[#682025] text-center text-xs font-head font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#f5c842]" />
                  <span>تهانينا! عبدالله فتح كوب القهوة المجاني 🎁</span>
                </div>
              </div>
            </div>

            {/* Right: Text Explanation */}
            <div className="lg:col-span-6 space-y-5 text-right order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F3EA] border-2 border-[#1B1B1E] text-xs font-head font-bold uppercase text-[#f0456a]">
                <Tv className="w-4 h-4 text-[#682025]" />
                <span>4K LIVE WALL SIGNAGE • شاشة الصالة الذكية</span>
              </div>

              <h3 className="font-head text-3xl sm:text-4xl font-black text-[#1B1B1E] uppercase leading-tight">
                حوّل شاشة التلفزيون في صالتك إلى لوحة تفاعلية حية
              </h3>

              <p className="text-sm text-[#4a3a6a] leading-relaxed">
                لا تترك شاشات مقهاك تعرض فيديوهات صامتة ومملة. افتح رابط شاشة الصالة على أي تلفزيون ذكي عبر كود اقتران بـ 6 أرقام، وشاهد صور العملاء وتبريكات الأختام تتدفق مباشرة مع مؤثرات احتفالية تأسر أنظار كل من في المكان.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-[#e2dbf0]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#f0456a] shrink-0" />
                  <span>اقتران سريع برمز 6 أرقام</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#f0456a] shrink-0" />
                  <span>احتفالات كونفيتي عند الهدية</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#f0456a] shrink-0" />
                  <span>لوحة تحكم لإجازة الصور فورياً</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#f0456a] shrink-0" />
                  <span>متوافق مع أي شاشة Smart TV</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/wall/screen-1"
                  className="btn-fat"
                >
                  <span>معاينة شاشة الصالة الحية</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* ==================== SERVICE 3: COUNTER POS TERMINAL WITH STAFF PIN ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 rounded-3xl border-[2.5px] border-[#1B1B1E] shadow-[8px_8px_0_#f0863a]">
            {/* Left: Text Explanation */}
            <div className="lg:col-span-6 space-y-5 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F3EA] border-2 border-[#1B1B1E] text-xs font-head font-bold uppercase text-[#f0863a]">
                <Zap className="w-4 h-4 text-[#f0456a]" />
                <span>COUNTER POS TERMINAL • محطة الكاشير السريعة</span>
              </div>

              <h3 className="font-head text-3xl sm:text-4xl font-black text-[#1B1B1E] uppercase leading-tight">
                إضافة الختم في ثانيتين — بدون إبطاء طابور الانتظار
              </h3>

              <p className="text-sm text-[#4a3a6a] leading-relaxed">
                في أوقات الذروة، كل ثانية تهمك وتهم عميلك. محطة كاشير ستامبي تتيح لموظفيك البحث برقم الجوال أو مسح الباركود / NFC بنقرة واحدة، وتأكيد العملية برمز PIN سريع مع حماية مشددة تمنع أي تكرار أو تلاعب.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-[#e2dbf0]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#f0863a] shrink-0" />
                  <span>رمز PIN شخصي لكل موظف</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#f0863a] shrink-0" />
                  <span>تحديث فوري لـ Apple Wallet</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#f0863a] shrink-0" />
                  <span>إيصال استرداد رقمي حي</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#f0863a] shrink-0" />
                  <span>يعمل على أي شاشة كاشير POS</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/terminal"
                  className="btn-fat"
                >
                  <span>فتح محطة الكاشير POS</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: Cashier Terminal Mockup */}
            <div className="lg:col-span-6 flex justify-center py-4">
              <div className="w-full max-w-[360px] rounded-2xl bg-[#F7F3EA] p-5 border-[2.5px] border-[#1B1B1E] shadow-[8px_8px_0_#1B1B1E] space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#e2dbf0] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-head text-sm font-bold text-[#1B1B1E] uppercase">
                      CASHIER TERMINAL // LANE 01
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#682025] font-bold bg-[#FAF5EB] px-2 py-0.5 rounded-full">
                    STAFF: AHMED
                  </span>
                </div>

                {/* Simulated Customer Match */}
                <div className="p-3.5 rounded-xl bg-white border-2 border-[#1B1B1E] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8b7aaa] font-bold">العميل الحالي:</span>
                    <strong className="text-[#1B1B1E]">سارة المهيدب (050****891)</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#8b7aaa] font-bold">الرصيد:</span>
                    <span className="font-mono font-bold text-[#682025] text-sm">7 / 10 أختام</span>
                  </div>
                  <div className="h-2 w-full bg-[#FAF5EB] rounded-full overflow-hidden border border-[#1B1B1E]/20">
                    <div className="h-full bg-[#f0456a] rounded-full w-[70%]" />
                  </div>
                </div>

                {/* 2-Second Stamp Button */}
                <button
                  type="button"
                  className="w-full py-4 px-6 rounded-2xl bg-[#682025] text-white font-head font-black text-sm uppercase tracking-wider border-2 border-[#1B1B1E] shadow-[4px_4px_0_#1B1B1E] hover:shadow-[6px_6px_0_#1B1B1E] hover:bg-[#451215] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-5 h-5 text-[#f5c842]" />
                  <span>+ ختم فوري (PIN: ••••)</span>
                </button>

                <div className="text-center">
                  <span className="text-[10px] font-mono text-[#8b7aaa]">
                    ⚡ تزامن مشفر مع Apple Push Notification Service (APNs)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== SERVICE 4: OPTIONAL IN-STORE TABLET KIOSK ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 rounded-3xl border-[2.5px] border-[#1B1B1E] shadow-[8px_8px_0_#10b981]">
            {/* Left: Tablet Kiosk Mockup */}
            <div className="lg:col-span-6 flex justify-center py-4 order-2 lg:order-1">
              <div className="w-full max-w-[380px] rounded-3xl bg-[#1B1B1E] p-4 border-[3px] border-[#1B1B1E] shadow-[8px_8px_0_#1B1B1E] space-y-3 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-head text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      IN-STORE TABLET KIOSK • خيار بديل
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/80">
                    iPad / Tablet Mode
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
                  <span className="text-3xl">📟</span>
                  <h4 className="text-sm font-bold text-[#F7F3EA]">كشك التصوير والولاء الذاتي</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    متاح دائماً على أي تابلت داخل الصالة لمن ليس معهم هاتف أو يفضلون تجربة شاشة العرض الكبيرة.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-emerald-300 bg-emerald-950/60 py-1.5 px-3 rounded-lg border border-emerald-500/30">
                    <span>📱 الموبايل أولاً • والتابلت جاهز كخيار</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Text Explanation */}
            <div className="lg:col-span-6 space-y-5 text-right order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F3EA] border-2 border-[#1B1B1E] text-xs font-head font-bold uppercase text-[#10b981]">
                <Smartphone className="w-4 h-4 text-[#10b981]" />
                <span>MOBILE-FIRST + TABLET KIOSK • خيار الكشك البديل</span>
              </div>

              <h3 className="font-head text-3xl sm:text-4xl font-black text-[#1B1B1E] uppercase leading-tight">
                الموبايل هو الأساس — مع تابلت جاهز كخيار احتياطي
              </h3>

              <p className="text-sm text-[#4a3a6a] leading-relaxed">
                العميل اليوم يفضل استخدام هاتفه الخاص (BYOD) من مقعده بنسبة 100% دون الوقوف في طابور. ولكن ماذا لو فرغت بطارية هاتف العميل؟ صممنا وضع الكشك الذكي (Tablet Kiosk) ليعمل على أي iPad أو جهاز لوحي في الصالة كخيار بديل سلس وفوري.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-[#e2dbf0]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                  <span>يعمل بملء الشاشة على أي iPad</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                  <span>لا يلزم العميل بتطبيق</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                  <span>ربط فوري بشاشة الصالة 4K</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                  <span>إعادة تعيين تلقائي بعد كل زائر</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/kiosk/stampy"
                  className="btn-fat"
                >
                  <span>تجربة وضع الكشك (Tablet Kiosk)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
