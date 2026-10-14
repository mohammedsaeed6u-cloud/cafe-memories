'use client';

import React from 'react';
import { Palette, Bell, Zap, Tv, BarChart3, ShieldCheck, MapPin, Gift, Clock, Sparkles } from 'lucide-react';

export function MarketingRetentionLoop() {
  const notifications = [
    {
      type: '📍 بالقرب من الفرع (Geofencing)',
      time: 'الآن',
      title: '✦ بالقرب من Espresso Lab · فرع التحلية',
      body: 'مكافأتك جاهزة الآن! المس قارئ الكاونتر لاستلام قهوتك المجانية.',
      highlight: true,
    },
    {
      type: '🎁 المكافأة جاهزة (Reward Ready)',
      time: 'اليوم',
      title: 'Apple Wallet · Espresso Lab',
      body: 'تم فتح كوب القهوة المجاني! تفضل بزيارتنا واستمتع بهديتك المستحقة.',
      highlight: false,
    },
    {
      type: '⏰ عودة العميل الغائب (Win-Back)',
      time: 'من أسبوعين',
      title: 'Apple Wallet · Espresso Lab',
      body: 'كارتك بانتظارك — باقٍ ختَمين فقط على هديتك المجانية القادمة.',
      highlight: false,
    },
    {
      type: '⚡ عرض مضاعفة الأختام (Promotion)',
      time: 'قبل ساعتين',
      title: 'Apple Wallet · Espresso Lab',
      body: 'أختام مضاعفة ×2 اليوم لجميع المشروبات حتى الساعة 6 مساءً!',
      highlight: false,
    },
  ];

  const pillars = [
    {
      code: 'NATIVE WALLET',
      title: 'كارت علامتك في محفظة الهاتف الرسمية',
      benefit: 'الزبون ينسى الورق — لكنه لا يفرط في هاتفه أبداً.',
      points: [
        'يعمل مباشرة في Apple Wallet و Google Wallet',
        'بدون تحميل أي تطبيق وبدون إنشاء كلمات مرور',
        'متاح في جيب عميلك 24/7 بشعارك وألوانك',
      ],
      icon: Palette,
      accent: '#682025',
    },
    {
      code: 'APNs PUSH',
      title: 'إشعارات شاشة القفل التلقائية (Geofencing)',
      benefit: 'كلما اقترب العميل بـ 100 متر — يضيء هاتفه باسم متجرك.',
      points: [
        'تنبيه جغرافي يدعو العميل للطلب عند المرور بالشارع',
        'تحديث رصيد الأختام فورياً على شاشة القفل',
        'بث عروض حية لجميع حاملي الكارت بنقرة واحدة',
      ],
      icon: Bell,
      accent: '#f0456a',
    },
    {
      code: 'OPERATIONAL EXCELLENCE',
      title: 'ختم الكاونتر السريع وإيصال الاسترداد الحي',
      benefit: 'سرعة البرق في ساعات الذروة — بدون أجهزة جديدة.',
      points: [
        'إضافة الختم في ثانيتين بلمسة واحدة على شاشة الكاشير أو NFC',
        'إيصال استرداد رقمي حي ومتحرك يمنع أي تزوير أو إعادة استخدام',
        'يعمل على أي متصفح، كمبيوتر كاشير، أو تابلت موجود لديك',
      ],
      icon: Zap,
      accent: '#f0863a',
    },
    {
      code: '4K LIVE WALL',
      title: 'شاشة الصالة التفاعلية المباشرة',
      benefit: 'تحويل صور العملاء إلى دعاية حية داخل المقهى.',
      points: [
        'عرض صور الذكريات فترات الانتظار بدقة 4K',
        'ربط فوري بين تجربة الفوتوبوث وكارت الولاء في المحفظة',
        'تحكم كامل في إيقاف أو تنقية المحتوى فورياً',
      ],
      icon: Tv,
      accent: '#682025',
    },
    {
      code: 'ROI ANALYTICS',
      title: 'لوحة قياس العائد والعملاء العائدين',
      benefit: 'قرارات مبنية على أرقام دقيقة — لا على الحدس.',
      points: [
        'حساب القيمة الدائمة للعميل (LTV) وتكرار الزيارات',
        'معرفة أكثر المشروبات والجوائز تحفيزاً للعملاء',
        'تقارير تفصيلية لأداء موظفي الكاونتر في الختم',
      ],
      icon: BarChart3,
      accent: '#22c55e',
    },
    {
      code: 'CLOUD ARCHITECTURE',
      title: 'بنية سحابية موثوقة وفائقة السرعة',
      benefit: 'جاهزية 99.9% — تضمن عدم تعطل عمليات متجرك.',
      points: [
        'حماية ضد التلاعب: توثيق دقيق لكل عملية ختم واسترداد',
        'أدوار وصول محددة للموظفين ومديري الفروع',
        'استجابة فائقة السرعة على شبكة Cloudflare العالمية',
      ],
      icon: ShieldCheck,
      accent: '#451215',
    },
  ];

  return (
    <section className="comeback-section" id="operations">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* ==================== PART 1: LOCKSCREEN NOTIFICATIONS (TAPPY BENCHMARK) ==================== */}
        <div className="cb-grid items-center">
          {/* Right Text Pitch */}
          <div className="space-y-6 text-right order-2 md:order-1">
            <span className="kicker">THEIR WALLET DOES THE REMINDING</span>
            <h2 className="h2-poster">
              BRING THEM BACK <span className="purp">AUTOMATICALLY.</span>
            </h2>
            <p className="sub-poster">
              Most loyalty apps get deleted. Paper cards get washed. With Stampy, your pass sits in Apple & Google Wallet, gently tapping them on the shoulder when they walk by.
              <br className="hidden sm:inline" />
              تذكير ذكي وغير مزعج، يظهر تلقائياً عندما يقترب الزبون أو تكتمل أختامه.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E] flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#f0456a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                  ✦
                </span>
                <div>
                  <strong className="text-sm font-bold text-[#1B1B1E] block">المكافأة جاهزة (Reward Ready):</strong>
                  <span className="text-xs text-[#4a3a6a]">
                    إشعار فوري عند اكتمال الأختام يشجع العميل على زيارة فرعك لاستلام هديته المجانية.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E] flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#682025] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                  📍
                </span>
                <div>
                  <strong className="text-sm font-bold text-[#1B1B1E] block">بالقرب من متجرك (Geofencing 100m):</strong>
                  <span className="text-xs text-[#4a3a6a]">
                    يضيء كارت متجرك على شاشة القفل تلقائياً بمجرد مروره في نفس الشارع.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E] flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#f0863a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                  ⏰
                </span>
                <div>
                  <strong className="text-sm font-bold text-[#1B1B1E] block">تنبيه العميل الغائب (Win-Back):</strong>
                  <span className="text-xs text-[#4a3a6a]">
                    إذا انقطع العميل أسبوعين، يُرسل له تنبيه لطيف يذكره برصيده المتبقي للهدية.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Left: iPhone Lockscreen Stack Mockup */}
          <div className="ls-phone-wrap order-1 md:order-2">
            <div className="ls-phone">
              <div className="ls-screen">
                {/* Dynamic Island */}
                <div className="ls-island flex items-center justify-between px-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-mono text-white/50">9:41</span>
                  <div className="w-2 h-1 border border-white/50 rounded-xs" />
                </div>

                <div className="ls-date font-head uppercase tracking-wider">
                  MONDAY, OCTOBER 18
                </div>

                <div className="ls-time">
                  09:41
                </div>

                {/* Stacked Lockscreen Banners */}
                <div className="ls-stack">
                  {notifications.map((n, i) => (
                    <div
                      key={i}
                      className={`ls-banner ${n.highlight ? 'highlight' : ''}`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-white/60 font-mono mb-0.5">
                        <span className="font-bold text-white">{n.type}</span>
                        <span>{n.time}</span>
                      </div>
                      <p className="text-[11px] font-bold text-white leading-snug">
                        {n.title}
                      </p>
                      <p className="text-[10px] text-white/80 leading-tight">
                        {n.body}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-3">
                  <span className="text-[9px] font-mono text-white/50">
                    ✦ NATIVE APPLE & GOOGLE WALLET PUSH
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== PART 2: 6 CORE SAAS PILLARS ==================== */}
        <div>
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="kicker">OPERATIONAL EXCELLENCE • الفائدة قبل الميزة</span>
            <h2 className="h2-poster center">
              SIX REASONS YOUR CUSTOMERS <span className="purp">NEVER LEAVE.</span>
            </h2>
            <p className="sub-poster center">
              الزبون الذي يصوّر — زبون يعود. والذكرى تدوم والولاء يتبعها.
            </p>
          </div>

          {/* 6 Neo-brutalist Pillars Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white border-2.5 border-[#1B1B1E] shadow-[5px_5px_0_#1B1B1E] hover:shadow-[7px_7px_0_#682025] transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        style={{ backgroundColor: `${p.accent}15`, borderColor: p.accent }}
                        className="w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-transform group-hover:scale-110"
                      >
                        <Icon style={{ color: p.accent }} className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#1B1B1E] px-2.5 py-1 rounded-full bg-[#FAF5EB] border border-[#e2dbf0]">
                        {p.code}
                      </span>
                    </div>

                    <h3 className="font-head text-xl font-black text-[#1B1B1E] mb-1.5 uppercase leading-snug">
                      {p.title}
                    </h3>
                    <p style={{ color: p.accent }} className="text-xs font-bold mb-4">
                      {p.benefit}
                    </p>

                    <ul className="text-xs text-[#4a3a6a] space-y-2 border-t-2 border-[#e2dbf0] pt-4">
                      {p.points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#682025] font-extrabold shrink-0">✓</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
