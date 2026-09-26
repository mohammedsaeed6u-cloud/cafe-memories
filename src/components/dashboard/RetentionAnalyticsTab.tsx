'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  Coffee,
  Gift,
  QrCode,
  Clock,
  ArrowUpRight,
  BarChart3,
  Sparkles,
  FileSpreadsheet,
  Tv,
  Wallet,
  Flame,
} from 'lucide-react';

interface RetentionAnalyticsTabProps {
  cafeSlug?: string;
  cafeName?: string;
}

type TimePeriod = 'today' | 'week' | 'month' | 'quarter';

export function RetentionAnalyticsTab({
  cafeSlug = 'memories',
  cafeName = 'Memories Studio',
}: RetentionAnalyticsTabProps) {
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [copiedNotice, setCopiedNotice] = useState(false);

  const handleExport = () => {
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FBF9F5] flex items-center gap-2 font-serif">
            <BarChart3 className="w-5 h-5 text-[#DD0200]" />
            <span>تحليلات العودة والأثر التجاري (Retention & Revenue Analytics)</span>
          </h2>
          <p className="text-xs text-[#A19E9B] mt-0.5 font-sans">
            قياس الأثر الفعلي لمنظومة الذكريات على تكرار الزيارات وزيادة القيمة الدائمة للعملاء (LTV)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#141212] p-1 rounded-xl border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === 'today' ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'text-[#A19E9B] hover:text-[#FBF9F5]'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === 'week' ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'text-[#A19E9B] hover:text-[#FBF9F5]'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === 'month' ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'text-[#A19E9B] hover:text-[#FBF9F5]'
              }`}
            >
              آخر 30 يوماً
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === 'quarter' ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'text-[#A19E9B] hover:text-[#FBF9F5]'
              }`}
            >
              هذا الربع
            </button>
          </div>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] border border-white/10 text-xs font-bold text-[#FBF9F5] flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{copiedNotice ? 'تم إعداد التقرير ✓' : 'تصدير التقرير'}</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A19E9B] font-bold">
            <span>معدل العودة خلال 30 يوم</span>
            <span className="p-1.5 rounded-lg bg-[#55100D] border border-[#DD0200]/30 text-[#DD0200]"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="text-3xl font-bold font-mono text-[#FBF9F5]">42.8%</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% مقارنة بالزوار التقليديين</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A19E9B] font-bold">
            <span>الزيارات الإضافية الناتجة</span>
            <span className="p-1.5 rounded-lg bg-[#55100D] border border-[#DD0200]/30 text-[#DD0200]"><Users className="w-4 h-4" /></span>
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400">+384</div>
          <div className="text-[11px] text-[#A19E9B]">
            زيارة مكررة بدافع إكمال شريط الذكريات
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A19E9B] font-bold">
            <span>العائد المالي الإضافي المقدر</span>
            <span className="p-1.5 rounded-lg bg-[#55100D] border border-[#DD0200]/30 text-[#DD0200]"><Sparkles className="w-4 h-4" /></span>
          </div>
          <div className="text-3xl font-bold font-mono text-[#FBF9F5]">+14,850 ر.س</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#DD0200]">
            <span>ROI عائد الاستثمار: 11.2x ضعف الباقة</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A19E9B] font-bold">
            <span>نسبة إكمال بطاقات الولاء</span>
            <span className="p-1.5 rounded-lg bg-[#55100D] border border-[#DD0200]/30 text-[#DD0200]"><Gift className="w-4 h-4" /></span>
          </div>
          <div className="text-3xl font-bold font-mono text-[#FBF9F5]">68%</div>
          <div className="text-[11px] text-[#A19E9B]">
            68 من كل 100 بطاقة تم إكمالها واستبدال هديتها
          </div>
        </div>
      </div>

      {/* The Core Loop Retention Funnel */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
          <div>
            <h3 className="font-bold text-base text-[#FBF9F5] flex items-center gap-2 font-serif">
              <Flame className="w-5 h-5 text-[#DD0200]" />
              <span>قمع دورة ولاء العملاء (The Core Loop Funnel)</span>
            </h3>
            <p className="text-xs text-[#A19E9B] mt-0.5">
              رحلة العميل الخماسية: مسح الكود ← التقاط الصور ← شاشة الصالة ← المحفظة الرقمية ← المكافأة والعودة
            </p>
          </div>
          <span className="px-3 py-1 rounded-md bg-[#55100D]/70 border border-[#DD0200]/40 text-[#FBF9F5] text-xs font-bold font-mono">
            كفاءة التحويل الإجمالية: 51.8%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { step: '1. مسح الكود', count: '1,420', label: 'مسحة QR طاولات', pct: '100%', icon: QrCode },
            { step: '2. توثيق اللقطة', count: '1,180', label: 'التقاط صور بالكاميرا', pct: '83.1%', icon: Coffee },
            { step: '3. بث التلفزيون', count: '960', label: 'معروض على شاشة الصالة', pct: '81.3%', icon: Tv },
            { step: '4. حفظ المحفظة', count: '840', label: 'كروت في Apple Wallet', pct: '71.2%', icon: Wallet },
            { step: '5. عودة ومكافأة', count: '612', label: 'زيارات تكرار وهدايا', pct: '51.8%', icon: Gift },
          ].map((f, idx) => {
            const IconComponent = f.icon;
            return (
              <div key={idx} className="p-4 rounded-xl bg-[#1C1B1B] border border-white/10 space-y-2 text-right relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#A19E9B] font-mono">{f.step}</span>
                  <div className="w-7 h-7 rounded-lg bg-[#55100D] border border-[#DD0200]/30 text-[#DD0200] flex items-center justify-center">
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-[#FBF9F5]">{f.count}</div>
                <p className="text-[11px] text-[#A19E9B] font-bold leading-tight">{f.label}</p>
                <div className="w-full bg-[#0B0A0A] h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-gradient-to-r from-[#55100D] to-[#DD0200] h-full rounded-full" style={{ width: f.pct }} />
                </div>
                <span className="text-[10px] font-mono text-[#A19E9B]/60 block pt-0.5">نسبة الإنجاز: {f.pct}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cohort Frequency & Top QR Spots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort Return Distribution */}
        <div className="p-6 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h4 className="font-bold text-sm text-[#FBF9F5] flex items-center gap-2 font-serif">
                <Users className="w-4 h-4 text-[#DD0200]" />
                <span>توزيع تكرار زيارات العملاء (Customer Cohort Distribution)</span>
              </h4>
              <p className="text-xs text-[#A19E9B] mt-0.5">تصنيف الزوار بحسب عدد الزيارات المثبتة</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {[
              { label: 'عملاء زاروا مرة واحدة فقط (New Visitors)', pct: 28, count: '398 عميل', color: 'bg-white/20' },
              { label: 'عملاء زاروا 2 إلى 3 مرات (Engaged)', pct: 38, count: '540 عميل', color: 'bg-[#55100D]' },
              { label: 'عملاء زاروا 4 إلى 5 مرات (Loyalists)', pct: 22, count: '312 عميل', color: 'bg-[#DD0200]' },
              { label: 'عملاء ذهبيين VIP (6+ زيارات متكررة)', pct: 12, count: '170 عميل', color: 'bg-gradient-to-r from-[#DD0200] to-rose-400' },
            ].map((cohort, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#FBF9F5]">{cohort.label}</span>
                  <span className="font-mono text-[#A19E9B]">{cohort.count} ({cohort.pct}%)</span>
                </div>
                <div className="w-full bg-[#0B0A0A] h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cohort.color}`} style={{ width: `${cohort.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing QR Locations */}
        <div className="p-6 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h4 className="font-bold text-sm text-[#FBF9F5] flex items-center gap-2 font-serif">
                <QrCode className="w-4 h-4 text-[#DD0200]" />
                <span>أفضل طاولات ونقاط الجذب تفاعلاً (Top QR Tables)</span>
              </h4>
              <p className="text-xs text-[#A19E9B] mt-0.5">قياس الطاولات التي تنتج أعلى معدل التقاط صور وعودة</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { name: 'طاولة #4 — جلسات النافذة الرئيسية', scans: 342, captures: 298, share: '24%' },
              { name: 'طاولة #12 — منطقة العمل والدراسة', scans: 285, captures: 240, share: '20%' },
              { name: 'كاونتر الخدمة والاستقبال — نقطة التفاعل', scans: 210, captures: 182, share: '15%' },
              { name: 'طاولة التراس الخارجي #2', scans: 198, captures: 165, share: '14%' },
            ].map((tbl, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-[#1C1B1B] border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <strong className="block text-[#FBF9F5] font-bold">{tbl.name}</strong>
                  <span className="text-[11px] text-[#A19E9B]">{tbl.scans} مسحة • {tbl.captures} لقطة موثقة</span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#55100D]/70 border border-[#DD0200]/40 font-mono font-bold text-[#FBF9F5]">
                  {tbl.share}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Engagement Heatmap */}
      <div className="p-6 rounded-2xl bg-[#141212] border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h4 className="font-bold text-sm text-[#FBF9F5] flex items-center gap-2 font-serif">
              <Clock className="w-4 h-4 text-[#DD0200]" />
              <span>أوقات الذروة والتفاعل المباشر (Peak Engagement Hours)</span>
            </h4>
            <p className="text-xs text-[#A19E9B] mt-0.5">مقارنة تفاعل الزوار بين فترات اليوم المختلفة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#1C1B1B] border border-white/10 space-y-1">
            <span className="text-xs font-bold text-[#A19E9B] block font-mono">فترة الصباح (7:00 ص - 11:00 ص)</span>
            <strong className="text-base font-bold text-[#FBF9F5] block font-serif">فترة الطلبات والزيارات السريعة</strong>
            <p className="text-xs text-[#A19E9B] leading-relaxed">
              الزيارات سريعة بنسبة 65%، وتفاعل مع بطاقات الولاء بنسبة 25%.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#55100D]/30 border border-[#DD0200]/50 space-y-1 shadow-[0_0_20px_-5px_rgba(221,2,0,0.25)]">
            <span className="text-xs font-bold text-[#DD0200] block font-mono">فترة المساء (4:30 م - 10:30 م) 🌟</span>
            <strong className="text-base font-bold text-[#FBF9F5] block font-serif">قمة الذروة والتفاعل (Peak Rush)</strong>
            <p className="text-xs text-[#FBF9F5]/80 leading-relaxed">
              أعلى معدل التقاط صور (72%) وعرض على شاشات الصالة، وجلسات مطولة.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1C1B1B] border border-white/10 space-y-1">
            <span className="text-xs font-bold text-[#A19E9B] block font-mono">عطلة نهاية الأسبوع (الجمعة والسبت)</span>
            <strong className="text-base font-bold text-[#FBF9F5] block font-serif">ذكريات وتجمعات الأصدقاء</strong>
            <p className="text-xs text-[#A19E9B] leading-relaxed">
              ارتفاع بنسبة 3.4x في طباعة الشرائط الورقية والمشاركة على وسائل التواصل.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
