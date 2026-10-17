'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  CreditCard,
  Zap,
  TrendingUp,
  Users,
  Award,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Clock,
  Settings,
  Layers,
  Send,
  Sliders,
} from 'lucide-react';

export function MarketingDashboardMockup() {
  const [activeTab, setActiveTab] = useState<'insights' | 'card' | 'promotions'>('insights');
  const [selectedColor, setSelectedColor] = useState<string>('#682025');
  const [selectedIcon, setSelectedIcon] = useState<string>('✦');
  const [stampsGoal, setStampsGoal] = useState<number>(10);
  const [doubleStampsActive, setDoubleStampsActive] = useState<boolean>(true);
  const [winBackActive, setWinBackActive] = useState<boolean>(true);

  // Peak Hours Heatmap Matrix data (Days vs 6 time slots)
  const heatmapData = [
    { time: '8–10 AM', levels: [2, 1, 2, 1, 3, 4, 1] },
    { time: '10–12 PM', levels: [1, 2, 1, 2, 4, 4, 2] },
    { time: '12–2 PM', levels: [3, 2, 3, 2, 3, 3, 2] },
    { time: '2–5 PM', levels: [1, 1, 2, 3, 4, 4, 3] },
    { time: '5–8 PM', levels: [2, 3, 4, 4, 4, 4, 3] },
    { time: '8 PM+', levels: [1, 1, 2, 2, 4, 3, 2] },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getHeatmapColor = (lvl: number) => {
    switch (lvl) {
      case 1:
        return 'bg-[#FAF5EB] border border-[#EADDC4] text-[#682025]';
      case 2:
        return 'bg-[#cbb6ee] border border-[#b89fe6] text-[#451215]';
      case 3:
        return 'bg-[#9364db] border border-[#7b4dc8] text-white';
      case 4:
        return 'bg-[#682025] border border-[#451215] text-white font-bold shadow-xs';
      default:
        return 'bg-white border border-[#e2dbf0] text-transparent';
    }
  };

  const topCustomers = [
    { name: 'سارة المهيدب', visits: 18, stamps: '8/10', tier: 'VIP Gold', last: 'قبل 14 دقيقة' },
    { name: 'عبدالعزيز الشمري', visits: 14, stamps: '5/10', tier: 'Silver', last: 'قبل 42 دقيقة' },
    { name: 'نورة القحطاني', visits: 22, stamps: '9/10', tier: 'VIP Gold', last: 'قبل ساعتين' },
    { name: 'محمد الدوسري', visits: 9, stamps: '3/10', tier: 'Member', last: 'قبل 3 ساعات' },
  ];

  return (
    <section className="dash-section" id="dashboard">
      {/* Header */}
      <div className="dash-head">
        <span className="kicker">EVERY TAP, EVERY REWARD, IN ONE PLACE</span>
        <h2 className="h2-poster center">
          SEE YOUR WHOLE SHOP <span className="purp">IN REAL TIME.</span>
        </h2>
        <p className="sub-poster center">
          Who came in today. Who's two taps from their free reward. Who hasn't visited in a month. All live, all yours.
          <br className="hidden sm:inline" />
          شاهد حركة عملائك لحظياً، صمم كارتك بضغطة زر، وبث عروضك لآلاف المحافظ في ثوانٍ.
        </p>
      </div>

      {/* Interactive Tabs */}
      <div className="dash-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`dash-tab ${activeTab === 'insights' ? 'active' : ''}`}
        >
          Insights • التحليلات الحية
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('card')}
          className={`dash-tab ${activeTab === 'card' ? 'active' : ''}`}
        >
          Stampy Card • مصمم الكارت
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('promotions')}
          className={`dash-tab ${activeTab === 'promotions' ? 'active' : ''}`}
        >
          Promotions • العروض والتنبيهات
        </button>
      </div>

      {/* macOS Window */}
      <div className="dash-window">
        {/* Chrome Bar */}
        <div className="dw-chrome">
          <div className="dw-dots">
            <span className="dw-dot red" />
            <span className="dw-dot yel" />
            <span className="dw-dot grn" />
          </div>
          <div className="dw-url-bar">
            <span>https://dashboard.stampy.sa/stampy</span>
          </div>
          <div className="dw-live-pill">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>LIVE STORE FEED</span>
          </div>
        </div>

        {/* Window Shell */}
        <div className="dw-shell">
          {/* Sidebar */}
          <div className="dw-sb hidden md:flex p-4 justify-between border-r border-[#e2dbf0]">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-8 h-8 rounded-lg bg-[#682025] flex items-center justify-center font-head text-white font-extrabold text-base">
                  S
                </div>
                <div>
                  <h4 className="font-head text-sm font-bold text-[#1B1B1E] uppercase tracking-wide">
                    Stampy Flagship Studio
                  </h4>
                  <span className="text-[10px] text-[#8b7aaa] block font-semibold">الفرع الرئيسي • الرياض</span>
                </div>
              </div>

              <nav className="space-y-1 text-xs font-head uppercase tracking-wider font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('insights')}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition ${
                    activeTab === 'insights'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#4a3a6a] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Insights Overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition ${
                    activeTab === 'card'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#4a3a6a] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card Designer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('promotions')}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition ${
                    activeTab === 'promotions'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#4a3a6a] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Push Campaigns</span>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-[#e2dbf0] text-[11px] text-[#8b7aaa] font-semibold space-y-1">
              <div className="flex items-center justify-between">
                <span>Hardware POS</span>
                <span className="text-emerald-600 font-bold">● Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pass Service</span>
                <span className="text-emerald-600 font-bold">● APNs Active</span>
              </div>
            </div>
          </div>

          {/* Main Column */}
          <div className="dw-maincol">
            {/* Topbar */}
            <div className="dw-tb">
              <div className="flex items-center gap-3">
                <span className="text-xs font-head uppercase tracking-wider text-[#8b7aaa] font-bold">
                  DASHBOARD / {activeTab.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FAF5EB] text-[#682025] font-head text-[11px] font-bold">
                  REAL-TIME SYNC
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
                <Calendar className="w-3.5 h-3.5 text-[#682025]" />
                <span>Today: Saturday, 18 Oct</span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="dw-main bg-white">
              {/* TAB 1: INSIGHTS */}
              {activeTab === 'insights' && (
                <div className="space-y-6">
                  {/* 4 Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E]">
                      <span className="text-[11px] font-head uppercase tracking-wider text-[#8b7aaa] font-bold block">
                        TOTAL TAPS TODAY
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-head font-extrabold text-[#1B1B1E]">1,482</span>
                        <span className="text-xs font-bold text-emerald-600">+18.4%</span>
                      </div>
                      <span className="text-[10px] text-[#4a3a6a] mt-1 block">مقارنة بالأسبوع الماضي</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E]">
                      <span className="text-[11px] font-head uppercase tracking-wider text-[#8b7aaa] font-bold block">
                        ACTIVE WALLET CARDS
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-head font-extrabold text-[#1B1B1E]">6,394</span>
                        <span className="text-xs font-bold text-[#682025]">In Pocket</span>
                      </div>
                      <span className="text-[10px] text-[#4a3a6a] mt-1 block">Apple & Google Wallets</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E]">
                      <span className="text-[11px] font-head uppercase tracking-wider text-[#8b7aaa] font-bold block">
                        RETENTION RATE (30D)
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-head font-extrabold text-[#1B1B1E]">68.4%</span>
                        <span className="text-xs font-bold text-emerald-600">High Tier</span>
                      </div>
                      <span className="text-[10px] text-[#4a3a6a] mt-1 block">معدل عودة الزبائن المتكررة</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E]">
                      <span className="text-[11px] font-head uppercase tracking-wider text-[#8b7aaa] font-bold block">
                        REWARDS UNLOCKED
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-head font-extrabold text-[#f0456a]">142</span>
                        <span className="text-xs font-bold text-[#f5c842]">🎁 91% claimed</span>
                      </div>
                      <span className="text-[10px] text-[#4a3a6a] mt-1 block">استرداد مباشر على الكاونتر</span>
                    </div>
                  </div>

                  {/* 2-Column: 7-Day Tap Chart + Heatmap */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* 7-Day Tap Chart */}
                    <div className="lg:col-span-6 p-5 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] shadow-[4px_4px_0_#682025]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-head text-base font-bold text-[#1B1B1E] uppercase">
                            Taps Over Time (Last 7 Days)
                          </h4>
                          <span className="text-[11px] text-[#8b7aaa] font-semibold">
                            معدل النشاط اليومي لعمليات الختم
                          </span>
                        </div>
                        <span className="text-xs font-head font-bold text-[#682025] bg-[#FAF5EB] px-2.5 py-1 rounded-full">
                          AVERAGE: 1,320 / DAY
                        </span>
                      </div>

                      {/* Bar Visualization */}
                      <div className="h-44 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-[#e2dbf0]">
                        {[
                          { day: 'Sat', val: 90, count: '1,482' },
                          { day: 'Sun', val: 65, count: '1,120' },
                          { day: 'Mon', val: 70, count: '1,210' },
                          { day: 'Tue', val: 80, count: '1,340' },
                          { day: 'Wed', val: 85, count: '1,410' },
                          { day: 'Thu', val: 100, count: '1,650' },
                          { day: 'Fri', val: 95, count: '1,590' },
                        ].map((b, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                            <span className="text-[9px] font-mono font-bold text-[#682025] opacity-0 group-hover:opacity-100 transition-opacity">
                              {b.count}
                            </span>
                            <div
                              style={{ height: `${b.val}%` }}
                              className="w-full bg-[#682025] rounded-t-lg group-hover:bg-[#f0456a] transition-all border border-[#1B1B1E]"
                            />
                            <span className="text-[10px] font-head uppercase font-bold text-[#1B1B1E]">
                              {b.day}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-3 text-[11px] text-[#8b7aaa] font-bold">
                        <span>ذروة الختم: الخميس والجمعة مساءً</span>
                        <span className="text-[#f0456a]">معدل التحويل: 94.2%</span>
                      </div>
                    </div>

                    {/* Peak Hours Heatmap Matrix */}
                    <div className="lg:col-span-6 p-5 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] shadow-[4px_4px_0_#682025]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-head text-base font-bold text-[#1B1B1E] uppercase">
                            Peak Hours Heatmap Matrix
                          </h4>
                          <span className="text-[11px] text-[#8b7aaa] font-semibold">
                            خريطة حرارية لتوزيع الزوار بالساعة
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                          <span className="w-2.5 h-2.5 rounded-xs bg-[#FAF5EB] border border-[#EADDC4]" />
                          <span>هدوء</span>
                          <span className="w-2.5 h-2.5 rounded-xs bg-[#682025] ml-1" />
                          <span>ذروة</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 overflow-x-auto">
                        <div className="grid grid-cols-8 gap-1 text-center text-[10px] font-head uppercase font-bold text-[#8b7aaa] pb-1">
                          <div>Time</div>
                          {days.map((d) => (
                            <div key={d}>{d}</div>
                          ))}
                        </div>

                        {heatmapData.map((row, rIdx) => (
                          <div key={rIdx} className="grid grid-cols-8 gap-1 items-center">
                            <div className="text-[9px] font-mono text-[#4a3a6a] font-bold">{row.time}</div>
                            {row.levels.map((lvl, cIdx) => (
                              <div
                                key={cIdx}
                                className={`h-6 rounded-md flex items-center justify-center text-[9px] transition-transform hover:scale-110 cursor-pointer ${getHeatmapColor(
                                  lvl
                                )}`}
                              >
                                {lvl >= 3 ? '✦' : ''}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 text-[11px] text-[#4a3a6a] font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>أفضل توقيت لبث إشعار مضاعفة الأختام: الخميس 4:30 مساءً</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Customers Leaderboard */}
                  <div className="p-5 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E]">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-head text-base font-bold text-[#1B1B1E] uppercase">
                        Top Customers & Live Activity Leaderboard
                      </h4>
                      <span className="text-xs font-head font-bold text-[#682025]">
                        42 زبون ختموا اليوم
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-[#e2dbf0] text-[#8b7aaa] font-head uppercase">
                            <th className="pb-2 text-right">العميل</th>
                            <th className="pb-2 text-center">الرصيد الحالي</th>
                            <th className="pb-2 text-center">إجمالي الزيارات</th>
                            <th className="pb-2 text-center">المستوى</th>
                            <th className="pb-2 text-left">آخر ختم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2dbf0]">
                          {topCustomers.map((c, i) => (
                            <tr key={i} className="hover:bg-white transition-colors">
                              <td className="py-2.5 font-bold text-[#1B1B1E]">{c.name}</td>
                              <td className="py-2.5 text-center font-mono font-bold text-[#682025]">
                                {c.stamps}
                              </td>
                              <td className="py-2.5 text-center font-bold text-[#1B1B1E]">{c.visits} زيارة</td>
                              <td className="py-2.5 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5EB] text-[#682025] border border-[#EADDC4]">
                                  {c.tier}
                                </span>
                              </td>
                              <td className="py-2.5 text-left text-[#8b7aaa] font-mono text-[11px]">
                                {c.last}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CARD DESIGNER */}
              {activeTab === 'card' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-4">
                  {/* Left: Designer Controls */}
                  <div className="lg:col-span-6 space-y-5">
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-bold text-[#682025] uppercase">
                        LIVE PASS STUDIO
                      </span>
                      <h3 className="text-xl font-black text-[#1B1B1E] font-head uppercase">
                        صمم كارت علامتك في ثوانٍ معدودة
                      </h3>
                      <p className="text-xs text-[#4a3a6a] leading-relaxed">
                        التغييرات تنعكس فورياً في محافظ زبائنك بدون الحاجة لإعادة تحميل الكارت أو إرسال كود جديد.
                      </p>
                    </div>

                    {/* Color Presets */}
                    <div className="space-y-2">
                      <label className="text-xs font-head uppercase font-bold text-[#1B1B1E] block">
                        Card Background Color • لون الكارت
                      </label>
                      <div className="flex items-center gap-3">
                        {[
                          { color: '#682025', name: 'Royal Purple' },
                          { color: '#1B1B1E', name: 'Dark Ink' },
                          { color: '#f0456a', name: 'Punchy Pink' },
                          { color: '#451215', name: 'Deep Violet' },
                          { color: '#2563eb', name: 'Electric Blue' },
                          { color: '#15803d', name: 'Forest Green' },
                        ].map((c) => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setSelectedColor(c.color)}
                            style={{ backgroundColor: c.color }}
                            className={`w-9 h-9 rounded-full border-2 transition-transform cursor-pointer ${
                              selectedColor === c.color
                                ? 'scale-125 border-[#1B1B1E] shadow-md ring-2 ring-white ring-offset-2'
                                : 'border-black/20 hover:scale-110'
                            }`}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Stamp Icon Presets */}
                    <div className="space-y-2">
                      <label className="text-xs font-head uppercase font-bold text-[#1B1B1E] block">
                        Stamp Icon Symbol • رمز الختم
                      </label>
                      <div className="flex items-center gap-2">
                        {['☕', '✦', '🥐', '✂️', '🍔', '🎁', '⭐', '🍕'].map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setSelectedIcon(icon)}
                            className={`w-10 h-10 rounded-xl font-bold text-base flex items-center justify-center border-2 transition cursor-pointer ${
                              selectedIcon === icon
                                ? 'bg-[#682025] text-white border-[#1B1B1E] shadow-[2px_2px_0_#1B1B1E]'
                                : 'bg-[#F7F3EA] border-[#e2dbf0] hover:bg-[#FAF5EB]'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stamps Goal Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-head uppercase font-bold text-[#1B1B1E] block">
                        Number of Stamps to Free Reward • عدد الأختام للمكافأة
                      </label>
                      <div className="flex items-center gap-3">
                        {[6, 8, 10, 12].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setStampsGoal(num)}
                            className={`px-4 py-2 rounded-xl text-xs font-head font-extrabold uppercase border-2 transition cursor-pointer ${
                              stampsGoal === num
                                ? 'bg-[#1B1B1E] text-white border-[#1B1B1E] shadow-[2px_2px_0_#682025]'
                                : 'bg-[#F7F3EA] text-[#1B1B1E] border-[#e2dbf0] hover:bg-[#FAF5EB]'
                            }`}
                          >
                            {num} Stamps
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF5EB] border border-[#EADDC4] flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#682025] shrink-0" />
                      <span className="text-xs font-bold text-[#451215]">
                        متوافق 100% مع معايير Apple Wallet (PKPass) و Google Wallet REST API.
                      </span>
                    </div>
                  </div>

                  {/* Right: Live Wallet Pass Simulation */}
                  <div className="lg:col-span-6 flex justify-center">
                    <div
                      style={{ backgroundColor: selectedColor }}
                      className="w-full max-w-[340px] rounded-3xl p-5 text-white border-[2.5px] border-[#1B1B1E] shadow-[8px_8px_0_#1B1B1E] space-y-4 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between border-b border-white/20 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-base">
                            {selectedIcon}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-white/70 block uppercase">
                              LOYALTY PASS
                            </span>
                            <h4 className="font-bold text-sm tracking-tight">Stampy Flagship Studio</h4>
                          </div>
                        </div>
                        <span className="text-xs font-bold bg-[#f5c842] text-[#1B1B1E] px-2 py-0.5 rounded-full font-mono">
                          {stampsGoal} STAMPS
                        </span>
                      </div>

                      {/* Interactive Stamp Preview */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold mb-2">
                          <span>رصيد الزبون التجريبي</span>
                          <span className="text-[#f5c842] font-mono">6 من {stampsGoal}</span>
                        </div>

                        <div className="grid grid-cols-5 gap-2 bg-black/30 p-3 rounded-2xl border border-white/10">
                          {Array.from({ length: stampsGoal }).map((_, i) => {
                            const isFilled = i < 6;
                            const isReward = i === stampsGoal - 1;
                            return (
                              <div
                                key={i}
                                className={`aspect-square rounded-full flex items-center justify-center border-2 text-xs font-bold transition ${
                                  isReward
                                    ? 'border-dashed border-[#f5c842] bg-[#f5c842]/20 text-[#f5c842]'
                                    : isFilled
                                    ? 'border-white bg-[#f0456a] text-white shadow-xs'
                                    : 'border-white/20 bg-white/5 text-white/30'
                                }`}
                              >
                                {isReward ? '🎁' : isFilled ? selectedIcon : i + 1}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer Details */}
                      <div className="bg-white rounded-xl p-3 text-center space-y-1">
                        <div className="h-8 w-full bg-[repeating-linear-gradient(90deg,#1B1B1E_0,#1B1B1E_3px,#ffffff_3px,#ffffff_6px,#1B1B1E_6px,#1B1B1E_10px)] rounded" />
                        <span className="text-[9px] font-mono font-bold text-[#1B1B1E] block">
                          PASS-ID: PK9428-2026-SA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PROMOTIONS */}
              {activeTab === 'promotions' && (
                <div className="space-y-6 py-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2dbf0] pb-4">
                    <div>
                      <h3 className="text-lg font-black text-[#1B1B1E] font-head uppercase">
                        Smart Push Campaigns & Geo-Triggers
                      </h3>
                      <p className="text-xs text-[#4a3a6a]">
                        أرسل إشعارات موجهة لشاشات قفل العملاء بدون تكلفة رسائل SMS إطلاقاً.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-full bg-[#682025] text-white font-head font-bold text-xs uppercase tracking-wider border-2 border-[#1B1B1E] shadow-[3px_3px_0_#1B1B1E] hover:shadow-[5px_5px_0_#1B1B1E] transition"
                    >
                      + إنشاء حملة جديدة
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Campaign Card 1 */}
                    <div className="p-5 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] shadow-[4px_4px_0_#1B1B1E] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-[#682025] text-white flex items-center justify-center font-bold text-sm">
                            ⚡
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-[#1B1B1E]">أختام مضاعفة ×2 (Happy Hour)</h4>
                            <span className="text-[10px] text-[#8b7aaa] block">كل ثلاثاء وأربعاء 4-7 م</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDoubleStampsActive(!doubleStampsActive)}
                          className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                            doubleStampsActive ? 'bg-[#682025] justify-end' : 'bg-gray-300 justify-start'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>
                      <p className="text-xs text-[#4a3a6a] leading-relaxed">
                        يضاعف الأختام تلقائياً عند الختم بالكاونتر لزيادة المبيعات في الفترات الهادئة.
                      </p>
                      <div className="pt-2 border-t border-[#e2dbf0] flex justify-between items-center text-[11px] font-bold">
                        <span className="text-emerald-600">تم تنشيط 384 زبون الأسبوع الماضي</span>
                        <span className="text-[#682025]">تعديل</span>
                      </div>
                    </div>

                    {/* Campaign Card 2 */}
                    <div className="p-5 rounded-2xl bg-[#F7F3EA] border-2 border-[#1B1B1E] shadow-[4px_4px_0_#1B1B1E] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-[#f0456a] text-white flex items-center justify-center font-bold text-sm">
                            📍
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-[#1B1B1E]">تنبيه القرب الجغرافي (100m)</h4>
                            <span className="text-[10px] text-[#8b7aaa] block">Geofence Trigger</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setWinBackActive(!winBackActive)}
                          className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                            winBackActive ? 'bg-[#682025] justify-end' : 'bg-gray-300 justify-start'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>
                      <p className="text-xs text-[#4a3a6a] leading-relaxed">
                        يُظهر إشعاراً جذاباً على شاشة القفل فور اقتراب العميل من الفرع: "قهوتك جاهزة، تفضل بالزيارة!".
                      </p>
                      <div className="pt-2 border-t border-[#e2dbf0] flex justify-between items-center text-[11px] font-bold">
                        <span className="text-emerald-600">معدل الدخول: 34.8% عند ظهور الإشعار</span>
                        <span className="text-[#682025]">تعديل</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
