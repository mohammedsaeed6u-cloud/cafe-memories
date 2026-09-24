'use client';

import React from 'react';
import {
  Sparkles,
  Coffee,
  Tv,
  Printer,
  Download,
  Settings,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  QrCode,
  Users,
  Image as ImageIcon,
  Gift,
} from 'lucide-react';
import { BusinessSettings } from '@/types/photobooth';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';
import { MetricsSkeleton } from '@/components/ui/SkeletonLoader';

export interface OverviewMetrics {
  today: {
    visits: number;
    uniqueCustomers: number;
    returningCustomers: number;
    newMemories: number;
    rewardsRedeemed: number;
  };
  attentionCenter: {
    pendingMemories: number;
    offlineScreens: number;
  };
  liveWall: {
    totalScreens: number;
    onlineScreens: number;
  };
}

interface DashboardOverviewTabProps {
  settings: BusinessSettings;
  metrics: OverviewMetrics | null;
  isLoadingMetrics: boolean;
  onRefreshMetrics: () => void;
  customerLiveUrl: string;
  copiedUrl: boolean;
  onCopyUrl: () => void;
  onOpenQuickSetup: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardOverviewTab: React.FC<DashboardOverviewTabProps> = ({
  settings,
  metrics,
  isLoadingMetrics,
  onRefreshMetrics,
  customerLiveUrl,
  copiedUrl,
  onCopyUrl,
  onOpenQuickSetup,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Instant Cafe Launchpad Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-stone-900 text-white shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 border border-amber-500/30">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold font-mono tracking-wider">
              MERCHANT LAUNCHPAD
            </span>
            <span className="text-xs text-amber-200 font-bold">
              لوحة انطلاق منظومة نشاطك التجاري
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            مرحباً بك في لوحة تحكم {settings.branding?.name || 'نشاطك التجاري'}
          </h3>
          <p className="text-xs text-stone-200 leading-relaxed max-w-2xl">
            منظومة نشاطك التجاري جاهزة لاستقبال الزوار بدون أي داتا ديمو أو تجريبية. يمكنك نسخ رابط الاستوديو، طباعة ستاند الطاولات والكاونتر، وفتح شاشة الصالة فوراً.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href={`/c?cafe=${settings.cafeSlug || 'memories'}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white text-stone-950 font-black text-xs hover:bg-amber-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>فتح استوديو الزائر</span>
          </a>
          <a
            href={`/barista?cafe=${settings.cafeSlug || 'memories'}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-300" />
            <span>محطة الكاونتر (POS)</span>
          </a>
          <a
            href={`/wall/screen-1?cafe=${settings.cafeSlug || 'memories'}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5 text-emerald-300" />
            <span>شاشة الصالة</span>
          </a>
        </div>
      </div>

      {/* 2. Executive Luxury Editorial Cafe Launch Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex-1 space-y-3.5 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              نظام الطاولات المباشر نشط • Live Production
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold border border-stone-200">
              slug: {settings.cafeSlug || 'memories'}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight">
              {settings.branding?.name || 'Memories Studio'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
              منظومة استوديو الذكريات وبطاقات الولاء الرقمية المربوطة بالطاولات. لا تتطلب تحميل أي تطبيق وتعمل بكاميرا الهاتف مباشرة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-700 font-medium">
            <span className="px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/80">
              نمط الكارت: <strong className="text-stone-950 font-black">{settings.defaultOrientation === 'vertical' ? 'شريط فوتوبوث 2×6' : 'كارت أفقي 4×6'}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/80">
              الزيارات المطلوبة: <strong className="text-stone-950 font-black">{settings.defaultShotCount || 5} خانات</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/80">
              المكافأة: <strong className="text-amber-800 font-black">{settings.freeGiftOffer?.title || 'هدية مجانية قيمة عند الاكتمال'}</strong>
            </span>
          </div>

          {/* Direct Link & Fast Copy */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 font-mono text-xs flex-1 truncate">
              <span className="text-stone-400 select-none">رابط الزائر:</span>
              <span className="text-stone-900 font-bold truncate select-all">{customerLiveUrl}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onCopyUrl}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
                <span>{copiedUrl ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>
              <a
                href={`/c?cafe=${settings.cafeSlug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-300 transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
                <span>فتح الاستوديو</span>
              </a>
            </div>
          </div>

          {/* Main Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={onOpenQuickSetup}
              className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-black text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>طباعة ستاند الأكريليك للطاولات</span>
            </button>
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(customerLiveUrl)}&margin=2&format=svg`}
              download={`memories-qr-${settings.cafeSlug}.svg`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل الـ QR بجودة طباعة (SVG)</span>
            </a>
            <button
              onClick={onOpenQuickSetup}
              className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-stone-600" />
              <span>تعديل الهوية والخيارات</span>
            </button>
          </div>
        </div>

        {/* Scannable Real QR Card Showcase */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-stone-200/90 shadow-2xs shrink-0 text-center w-full sm:w-auto">
          <span className="text-[11px] font-bold text-stone-900 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>امسح بكاميرا الهاتف للفتح المباشر</span>
          </span>
          <div className="w-36 h-36 bg-white p-2 rounded-2xl border border-stone-200/90 flex items-center justify-center shadow-xs overflow-hidden">
            <RealOutsourcedQr
              value={customerLiveUrl}
              size={132}
              alt={`كود QR منشأة ${settings.branding?.name}`}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[10px] font-mono text-stone-500 font-bold mt-2">
            كود الطاولة ونقطة الزيارة المباشر
          </span>
          <span className="text-[9px] text-stone-400 font-mono mt-0.5">
            300 DPI Vector Ready
          </span>
        </div>
      </div>

      {/* 3. Attention Center (Operational Alerts) */}
      <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h3 className="font-black text-sm text-amber-950">
              مركز المتابعة الفورية (Attention Center)
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              {metrics?.attentionCenter?.pendingMemories
                ? `هناك ${metrics?.attentionCenter?.pendingMemories} ذكريات جديدة بانتظار الاعتماد للظهور على شاشات الصالة`
                : 'جميع الذكريات معتمدة والشاشات تعمل بصورة طبيعية ومستقرة'}
            </p>
          </div>
        </div>

        {Boolean(metrics?.attentionCenter?.pendingMemories) && (
          <button
            onClick={() => onNavigateTab('memories')}
            className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            مراجعة الذكريات الآن ←
          </button>
        )}
      </div>

      {/* 4. What Happened Today? Key Performance Indicators */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-stone-900">
                نشاط المنشأة اليوم (What Happened Today)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                مباشر • Live Analytics
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              مؤشرات الزيارات الحقيقية ومعدل عودة العملاء واللحظات الموثقة
            </p>
          </div>
          <button
            onClick={onRefreshMetrics}
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoadingMetrics ? (
          <MetricsSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm">
              <span className="text-[11px] font-bold text-stone-500 block mb-1">
                إجمالي الزيارات اليوم
              </span>
              <span className="text-3xl font-black font-mono text-stone-950 block">
                {metrics?.today?.visits ?? 0}
              </span>
              <span className="text-[10px] text-stone-400 mt-1 block">
                بمسح الـ QR عند الطلب
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm">
              <span className="text-[11px] font-bold text-stone-500 block mb-1">
                عملاء عائدون (Returning)
              </span>
              <span className="text-3xl font-black font-mono text-emerald-600 block">
                {metrics?.today?.returningCustomers ?? 0}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
                زيارة متكررة خلال الأسبوع
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm">
              <span className="text-[11px] font-bold text-stone-500 block mb-1">
                ذكريات جديدة تم توثيقها
              </span>
              <span className="text-3xl font-black font-mono text-amber-600 block">
                {metrics?.today?.newMemories ?? 0}
              </span>
              <span className="text-[10px] text-stone-400 mt-1 block">
                محتوى حقيقي من صنع الزوار
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm">
              <span className="text-[11px] font-bold text-stone-500 block mb-1">
                مكافآت تم صرفها
              </span>
              <span className="text-3xl font-black font-mono text-purple-600 block">
                {metrics?.today?.rewardsRedeemed ?? 0}
              </span>
              <span className="text-[10px] text-stone-400 mt-1 block">
                مشروبات مجانية مستحقة
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm">
              <span className="text-[11px] font-bold text-stone-500 block mb-1">
                حالة الشاشات الحية
              </span>
              <span className="text-3xl font-black font-mono text-stone-950 block flex items-center gap-2">
                <span>{metrics?.liveWall?.onlineScreens ?? 1}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="text-[10px] text-stone-400 mt-1 block">
                شاشة صالة الجلوس متصلة
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
