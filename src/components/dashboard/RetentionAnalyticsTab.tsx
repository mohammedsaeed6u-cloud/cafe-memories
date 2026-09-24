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
    <div className="space-y-6 font-cairo">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-950 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <span>تحليلات العودة والأثر التجاري (Retention & Revenue Analytics)</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            قياس الأثر الفعلي لمنظومة الذكريات على تكرار الزيارات وزيادة القيمة الدائمة للعملاء (LTV)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-stone-100 p-1 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                period === 'today' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                period === 'week' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                period === 'month' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              آخر 30 يوماً
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                period === 'quarter' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              هذا الربع
            </button>
          </div>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{copiedNotice ? 'تم إعداد التقرير ✓' : 'تصدير التقرير'}</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
            <span>معدل العودة خلال 30 يوم</span>
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-700"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="text-3xl font-black font-mono text-stone-950">42.8%</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% مقارنة بالزوار التقليديين</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
            <span>الزيارات الإضافية الناتجة</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700"><Users className="w-4 h-4" /></span>
          </div>
          <div className="text-3xl font-black font-mono text-emerald-700">+384</div>
          <div className="text-[11px] text-stone-500">
            زيارة مكررة بدافع إكمال شريط الذكريات
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
            <span>العائد المالي الإضافي المقدر</span>
            <span className="p-1.5 rounded-xl bg-purple-50 text-purple-700"><Sparkles className="w-4 h-4" /></span>
          </div>
          <div className="text-3xl font-black font-mono text-stone-950">+14,850 ر.س</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-purple-700">
            <span>ROI عائد الاستثمار: 11.2x ضعف الباقة</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
            <span>نسبة إكمال بطاقات الولاء</span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-700"><Gift className="w-4 h-4" /></span>
          </div>
          <div className="text-3xl font-black font-mono text-blue-800">68%</div>
          <div className="text-[11px] text-stone-500">
            68 من كل 100 بطاقة تم إكمالها واستبدال هديتها
          </div>
        </div>
      </div>

      {/* The Core Loop Retention Funnel */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
          <div>
            <h3 className="font-black text-base text-stone-950 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600" />
              <span>قمع دورة ولاء الكافيه (The Core Loop Funnel)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              رحلة العميل الخماسية: مسح الكود ← التقاط الصور ← شاشة الصالة ← المحفظة الرقمية ← المكافأة والعودة
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
            كفاءة التحويل الإجمالية: 51.8%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { step: '1. مسح الكود', count: '1,420', label: 'مسحة QR طاولات', pct: '100%', icon: QrCode, color: 'text-stone-900 bg-stone-100' },
            { step: '2. توثيق اللقطة', count: '1,180', label: 'التقاط صور بالكاميرا', pct: '83.1%', icon: Coffee, color: 'text-amber-700 bg-amber-50' },
            { step: '3. بث التلفزيون', count: '960', label: 'معروض على شاشة الصالة', pct: '81.3%', icon: Tv, color: 'text-blue-700 bg-blue-50' },
            { step: '4. حفظ المحفظة', count: '840', label: 'كروت في Apple Wallet', pct: '71.2%', icon: Wallet, color: 'text-purple-700 bg-purple-50' },
            { step: '5. عودة ومكافأة', count: '612', label: 'زيارات تكرار وهدايا', pct: '51.8%', icon: Gift, color: 'text-emerald-700 bg-emerald-50' },
          ].map((f, idx) => {
            const IconComponent = f.icon;
            return (
              <div key={idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2 text-right relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-500 font-mono">{f.step}</span>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${f.color}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-black font-mono text-stone-950">{f.count}</div>
                <p className="text-[11px] text-stone-500 font-bold leading-tight">{f.label}</p>
                <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden mt-2">
                  <div className="bg-amber-600 h-full rounded-full" style={{ width: f.pct }} />
                </div>
                <span className="text-[10px] font-mono text-stone-400 block pt-0.5">نسبة الإنجاز: {f.pct}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cohort Frequency & Top QR Spots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort Return Distribution */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h4 className="font-bold text-sm text-stone-950 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>توزيع تكرار زيارات العملاء (Customer Cohort Distribution)</span>
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">تصنيف الزوار بحسب عدد الزيارات المثبتة</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {[
              { label: 'عملاء زاروا مرة واحدة فقط (New Visitors)', pct: 28, count: '398 عميل', color: 'bg-stone-300' },
              { label: 'عملاء زاروا 2 إلى 3 مرات (Engaged)', pct: 38, count: '540 عميل', color: 'bg-amber-500' },
              { label: 'عملاء زاروا 4 إلى 5 مرات (Loyalists)', pct: 22, count: '312 عميل', color: 'bg-emerald-500' },
              { label: 'عملاء ذهبيين VIP (6+ زيارات متكررة)', pct: 12, count: '170 عميل', color: 'bg-purple-600' },
            ].map((cohort, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-800">{cohort.label}</span>
                  <span className="font-mono text-stone-500">{cohort.count} ({cohort.pct}%)</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cohort.color}`} style={{ width: `${cohort.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing QR Locations */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h4 className="font-bold text-sm text-stone-950 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>أفضل طاولات ونقاط الجذب تفاعلاً (Top QR Tables)</span>
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">قياس الطاولات التي تنتج أعلى معدل التقاط صور وعودة</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { name: 'طاولة #4 — جلسات النافذة الرئيسية', scans: 342, captures: 298, share: '24%' },
              { name: 'طاولة #12 — منطقة العمل والدراسة', scans: 285, captures: 240, share: '20%' },
              { name: 'كاونتر الباريستا — نقطة استلام الطلبات', scans: 210, captures: 182, share: '15%' },
              { name: 'طاولة التراس الخارجي #2', scans: 198, captures: 165, share: '14%' },
            ].map((tbl, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <strong className="block text-stone-900 font-bold">{tbl.name}</strong>
                  <span className="text-[11px] text-stone-500">{tbl.scans} مسحة • {tbl.captures} لقطة موثقة</span>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-white border border-stone-200 font-mono font-bold text-amber-800">
                  {tbl.share}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Engagement Heatmap */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h4 className="font-bold text-sm text-stone-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>أوقات الذروة والتفاعل في الكافيه (Peak Engagement Hours)</span>
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">مقارنة تفاعل الزوار بين فترات اليوم المختلفة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-xs font-bold text-stone-500 block">فترة الصباح (7:00 ص - 11:00 ص)</span>
            <strong className="text-lg font-black text-stone-900 block">قهوة الصباح السريعة</strong>
            <p className="text-xs text-stone-500 leading-relaxed">
              الزيارات سريعة (Takeaway) بنسبة 65%، تفاعل مع الكروت بنسبة 25%.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="text-xs font-bold text-amber-800 block">فترة المساء (4:30 م - 10:30 م) 🌟</span>
            <strong className="text-lg font-black text-amber-950 block">قمة الذروة والتفاعل (Peak Rush)</strong>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              أعلى معدل التقاط صور (72%) وعرض على شاشات الصالة، وجلسات مطولة.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-xs font-bold text-stone-500 block">عطلة نهاية الأسبوع (الجمعة والسبت)</span>
            <strong className="text-lg font-black text-stone-900 block">ذكريات وتجمعات الأصدقاء</strong>
            <p className="text-xs text-stone-500 leading-relaxed">
              ارتفاع بنسبة 3.4x في طباعة الشرائط الورقية والمشاركة على وسائل التواصل.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
