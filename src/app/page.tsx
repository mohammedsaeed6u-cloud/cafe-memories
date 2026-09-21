'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Coffee,
  Sparkles,
  QrCode,
  Tv,
  Gift,
  Share2,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  TrendingUp,
  Camera,
  Play,
  Flame,
  ChevronDown,
} from 'lucide-react';

export default function HomePage() {
  // Scenario ROI Calculator State
  const [dailyVisitors, setDailyVisitors] = useState(150);
  const [averageTicket, setAverageTicket] = useState(45); // SAR / EGP
  const [estimatedReturnLift, setEstimatedReturnLift] = useState(25); // 25% lift in repeat visits

  // Estimated Scenario Calculation
  const additionalMonthlyVisits = Math.round(dailyVisitors * (estimatedReturnLift / 100) * 12);
  const estimatedAddedRevenue = additionalMonthlyVisits * averageTicket;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 selection:bg-amber-500/20 selection:text-amber-950 font-cairo antialiased relative overflow-x-hidden">
      {/* Subtle background grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(#18181B 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-3.5 border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-950 text-white flex items-center justify-center font-black shadow-md">
              <Coffee className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-black text-lg sm:text-xl tracking-tight text-stone-950 leading-tight">
                Memories <span className="text-amber-600 font-serif">✦</span> موميريز
              </span>
              <span className="text-[10px] text-stone-500 tracking-wider uppercase font-bold">
                Café Memories & Live Community Layer
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-xs font-bold text-stone-600">
            <a href="#loop" className="hover:text-stone-950 transition-colors">
              حلقة نمو الكافيه
            </a>
            <a href="#wall" className="hover:text-stone-950 transition-colors">
              شاشة الصالة الحية
            </a>
            <a href="#roi" className="hover:text-stone-950 transition-colors">
              حاسبة العائد
            </a>
            <a href="#pricing" className="hover:text-stone-950 transition-colors">
              الباقات
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/c/espresso-lab"
              className="px-4 py-2 rounded-full text-xs font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <span>تجربة العميل</span>
              <span className="text-amber-600">✦</span>
            </Link>

            <Link
              href="/dashboard"
              className="py-2.5 px-5 rounded-full bg-stone-950 hover:bg-stone-900 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <span>لوحة التاجر</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 rotate-180" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-14 sm:pt-20 pb-20 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-stone-200/90 bg-white/90 text-stone-800 text-xs font-bold mb-6 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
          <span>منظومة الذكريات، الشاشات الحية وبطاقات الولاء الرقمية للكافيهات</span>
          <span className="text-amber-600 font-serif">✦</span>
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-stone-950 tracking-tight leading-[1.08]">
            حوّل زياراتهم العابرة.<br />
            <span className="bg-gradient-to-r from-stone-950 via-amber-700 to-amber-500 bg-clip-text text-transparent italic font-serif font-normal">
              إلى ذكريات دائمة وعملاء منتظمين.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium">
            منظومة رقمية تمنح زوار كافيهك تجربة توثيق لحظاتهم بمسحة QR واحدة بدون أي تطبيق، مع شاشة حية تبث ذكرياتهم في الصالة، وبطاقة ولاء ذكية تضمن عودتهم والشراء المتكرر.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <Link
            href="/c/espresso-lab"
            className="w-full sm:w-auto text-sm py-4 px-8 rounded-full bg-stone-950 hover:bg-stone-900 text-white font-bold shadow-lg transition flex items-center justify-center gap-2 active:scale-95"
          >
            <span>ابدأ تجربة الزائر الحية 📸</span>
            <ArrowRight className="w-4 h-4 text-amber-400 rotate-180" />
          </Link>

          <Link
            href="/wall/screen-1"
            className="w-full sm:w-auto text-sm py-4 px-7 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-bold shadow-sm transition flex items-center justify-center gap-2"
          >
            <Tv className="w-4 h-4 text-amber-600" />
            <span>عرض شاشة الكافيه (Live Wall)</span>
          </Link>
        </div>

        {/* Hero Interactive Preview Card */}
        <div className="mt-16 max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-3xl border border-stone-200 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-right">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-mono">
              01
            </div>
            <h3 className="font-bold text-sm text-stone-950">مسح الـ QR والتقاط الذكرى</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              الزبون يمسح كود الطاولة بكاميرا هاتفه؛ بدون تحميل تطبيق أو تسجيل معقد، يلتقط صورة لقهوته ولحظته.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold font-mono">
              02
            </div>
            <h3 className="font-bold text-sm text-amber-950">ظهور فوري على شاشة الكافيه</h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              بموافقة الزائر واعتماد الباريستا، تظهر لحظته على شاشة الصالة الكبيرة ليراها الحضور ويتفاعلوا معها.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold font-mono">
              03
            </div>
            <h3 className="font-bold text-sm text-stone-950">قصة ذكريات ومكافأة مضمونة</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              تتجمع لحظاته في بطاقة ذكريات خاصة (Your Café Story) لتفتح له هديته التلقائية عند إكمال الزيارات.
            </p>
          </div>
        </div>
      </section>

      {/* The Growth Loop Section */}
      <section id="loop" className="py-20 px-6 max-w-6xl mx-auto border-t border-stone-200/60">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
            THE REAL CUSTOMER RETENTION LOOP
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-stone-950 mt-2">
            حلقة نمو حقيقية لا تعتمد على الخصومات العشوائية.
          </h2>
          <p className="text-sm sm:text-base text-stone-600 mt-3">
            بدلاً من برامج الولاء المهملة، نبني ارتباطاً عاطفياً يجعل الزائر يشعر بأن المكان جزء من ذكرياته الشخصية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-900 flex items-center justify-center text-lg font-black mb-4">
                📱
              </span>
              <h3 className="font-black text-base text-stone-950 mb-2">دخول صفري الاحتكاك</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                لا نطلب رقم هاتف ولا كلمة مرور قبل تقديم القيمة. هوية غير مرئية تحفظ الزيارات من أول نقرة.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-mono text-amber-700 font-bold">
              ZERO-FRICTION ENTRY
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg font-black mb-4">
                ☕
              </span>
              <h3 className="font-black text-base text-stone-950 mb-2">توثيق اللحظة لا الأختام</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                المشاعر هي المحرك: "أنا أجمع لحظاتي وذكرياتي مع أصدقائي في هذا المكان"، وليس مجرد كارت ورقي يضيع في الجيب.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-mono text-amber-700 font-bold">
              MOMENTS OVER STAMPS
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-lg font-black mb-4">
                📺
              </span>
              <h3 className="font-black text-base text-stone-950 mb-2">محرك الجذب الطبيعي (Live Wall)</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                الزبون في الصالة يرى صورة عميل آخر على الشاشة ← يتشجع ويمسح الـ QR ← يوثق لحظته ← يراها زبون آخر.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-mono text-amber-700 font-bold">
              IN-STORE VIRAL LOOP
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-black mb-4">
                🎁
              </span>
              <h3 className="font-black text-base text-stone-950 mb-2">مكافآت محسوبة سيرفر-سايد</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                حماية كاملة لأرباح الكافيه. يتم التحقق من استحقاق الهدية والصرف بأكواد ذكية لضمان عدم التلاعب.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-mono text-amber-700 font-bold">
              TRANSACTIONAL INTEGRITY
            </div>
          </div>
        </div>
      </section>

      {/* Live Wall Showcase Section */}
      <section id="wall" className="py-20 px-6 max-w-6xl mx-auto border-t border-stone-200/60">
        <div className="p-8 sm:p-12 rounded-3xl bg-stone-950 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
              SMART TV LIVE WALL ✦ شاشة الصالة الحية
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              حوّل أي شاشة تلفزيون في كافيهك إلى معرض حي للحظات الزوار.
            </h2>
            <p className="text-sm text-stone-400 leading-relaxed">
              اقتران فوري عبر كود سري مؤقت من لوحة التاجر بدون إدخال أي كلمات سر على التلفزيون. تدعم العمل أثناء انقطاع الإنترنت (Offline Resilience) مع نظام عدالة يمنع تكرار صور نفس الزائر.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/wall/screen-1"
                className="py-3 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition"
              >
                معاينة الشاشة الحية الآن ✦
              </Link>
              <Link
                href="/dashboard"
                className="py-3 px-6 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white font-bold text-xs transition"
              >
                إدارة واقتران الشاشات
              </Link>
            </div>
          </div>

          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* ROI Scenario Estimator */}
      <section id="roi" className="py-20 px-6 max-w-5xl mx-auto border-t border-stone-200/60">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
            SCENARIO ESTIMATE ✦ نموذج تقديري تقريبي
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-stone-950 mt-2">
            احسب الأثر المالي المتوقع لزيادة عودة الزوار.
          </h2>
          <p className="text-xs text-stone-500 mt-2">
            *هذه أرقام استرشادية مبنية على تحفيز الشراء المتكرر بنسب واقعية ولا تعتبر ضماناً ثابتاً للأرباح.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-stone-200 shadow-md grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 mb-2">
                <span>متوسط الزوار يومياً</span>
                <span className="font-mono text-amber-700">{dailyVisitors} زائر</span>
              </div>
              <input
                type="range"
                min="50"
                max="600"
                step="25"
                value={dailyVisitors}
                onChange={(e) => setDailyVisitors(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 mb-2">
                <span>متوسط الفاتورة (SAR / EGP)</span>
                <span className="font-mono text-amber-700">{averageTicket}</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                step="5"
                value={averageTicket}
                onChange={(e) => setAverageTicket(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-stone-700 mb-2">
                <span>نسبة التحسن المتوقعة في الزيارات المتكررة</span>
                <span className="font-mono text-amber-700">+{estimatedReturnLift}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={estimatedReturnLift}
                onChange={(e) => setEstimatedReturnLift(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-stone-950 text-white space-y-4 text-center">
            <span className="text-xs font-mono text-stone-400 block uppercase">
              الزيارات الإضافية التقديرية شهرياً
            </span>
            <div className="text-4xl sm:text-5xl font-black font-mono text-amber-400">
              +{additionalMonthlyVisits}
            </div>
            <p className="text-xs text-stone-300">زيارة متكررة يولدها كارت الذكريات والشاشة الحية</p>

            <div className="pt-4 border-t border-stone-800">
              <span className="text-[11px] text-stone-400 block mb-1">
                القيمة الاقتصادية الإضافية التقديرية شهرياً
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                ~ {estimatedAddedRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section based on Branch & Screen Value */}
      <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto border-t border-stone-200/60">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-700 font-bold">
            FLEXIBLE PLANS ✦ خطط مرنة تتوسع معك
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-stone-950 mt-2">
            تسعير مبني على قيمة كافيهك الحقيقية.
          </h2>
          <p className="text-sm sm:text-base text-stone-600 mt-3">
            ابدأ بتجربة مجانية، وتوسع بإضافة الشاشات الحية والفروع حسب احتياجك.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-stone-500 uppercase">Starter Roastery</span>
              <h3 className="text-2xl font-black text-stone-950 mt-1 mb-3">كافيه البداية</h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-6">
                مثالي للكافيهات المستقلة التي ترغب في تجربة منظومة توثيق الذكريات والولاء بمسحة الـ QR.
              </p>
              <ul className="space-y-2.5 text-xs text-stone-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>فرع واحد مع نقاط QR غير محدودة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>قصة الذكريات الرقمية للزوار (Your Café Story)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>قواعد ولاء ومكافآت تلقائية</span>
                </li>
              </ul>
            </div>
            <Link
              href="/dashboard"
              className="mt-8 w-full py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs text-center transition block"
            >
              ابدأ الآن مجاناً
            </Link>
          </div>

          <div className="p-7 rounded-3xl bg-stone-950 text-white shadow-xl flex flex-col justify-between relative border border-amber-500/40 scale-105 z-10">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-[10px] font-mono font-black uppercase">
              الأكثر طلباً للصالات
            </span>
            <div>
              <span className="font-mono text-xs font-bold text-amber-400 uppercase">Live Community Pro</span>
              <h3 className="text-2xl font-black text-white mt-1 mb-3">الكافيه التفاعلي</h3>
              <p className="text-xs text-stone-400 leading-relaxed mb-6">
                يشمل منظومة الشاشة الحية (Live Wall) مع اعتماد الباريستا المباشر وتحليلات العودة.
              </p>
              <ul className="space-y-2.5 text-xs text-stone-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>شاشة تلفزيون حية 4K مع اقتران سري مؤقت</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>طابور اعتماد الباريستا بلمسة واحدة (iPad/Mobile)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>عمل الشاشة أوفلاين دون انقطاع (Offline Cache)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>تحليلات دقيقة لمعدل عودة الزوار (Retention CRM)</span>
                </li>
              </ul>
            </div>
            <Link
              href="/dashboard"
              className="mt-8 w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs text-center transition block"
            >
              ترقية الكافيه للشاشة الحية ✦
            </Link>
          </div>

          <div className="p-7 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-stone-500 uppercase">Multi-Branch Empire</span>
              <h3 className="text-2xl font-black text-stone-950 mt-1 mb-3">سلاسل الفروع والروستري</h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-6">
                للشركات وسلاسل الكافيهات التي تحتاج إلى إدارة موحدة للفروع المتعددة والشاشات وصلاحيات الطاقم.
              </p>
              <ul className="space-y-2.5 text-xs text-stone-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>فروع متعددة مع شاشات مستقلة لكل صالة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>دومين مخصص وهوية بصرية كاملة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ربط API مع أنظمة نقاط البيع (POS)</span>
                </li>
              </ul>
            </div>
            <Link
              href="/dashboard"
              className="mt-8 w-full py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs text-center transition block"
            >
              تواصل مع فريق الدعم
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-stone-950 text-white flex items-center justify-center font-bold">
              M
            </div>
            <span className="font-bold text-stone-900">Memories Platform</span>
            <span>✦ جميع الحقوق محفوظة 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/c/espresso-lab" className="hover:text-stone-950 transition">
              تجربة العميل
            </Link>
            <Link href="/wall/screen-1" className="hover:text-stone-950 transition">
              الشاشة الحية
            </Link>
            <Link href="/dashboard" className="hover:text-stone-950 transition">
              لوحة التاجر
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
