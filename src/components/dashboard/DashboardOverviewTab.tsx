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
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#DD0200] via-[#55100D] to-[#141212] text-[#FBF9F5] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 border border-[#DD0200]/30">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-black/40 text-[#FBF9F5] text-[10px] font-bold font-mono tracking-wider border border-white/10 uppercase">
              MERCHANT LAUNCHPAD
            </span>
            <span className="text-xs text-[#FBF9F5]/90 font-bold">
              لوحة انطلاق منظومة نشاطك التجاري
            </span>
          </div>
          <h3
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            className="text-xl sm:text-2xl font-bold text-[#FBF9F5]"
          >
            مرحباً بك في لوحة تحكم {settings.branding?.name || 'نشاطك التجاري'}
          </h3>
          <p className="text-xs text-[#FBF9F5]/80 leading-relaxed max-w-2xl font-medium">
            منظومة نشاطك التجاري جاهزة لاستقبال الزوار بدون أي داتا ديمو أو تجريبية. يمكنك نسخ رابط الاستوديو، طباعة ستاند الطاولات والكاونتر، وفتح شاشة الصالة فوراً.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href={`/c?cafe=${settings.cafeSlug || 'memories'}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-lg bg-[#FBF9F5] text-[#141212] font-bold text-xs hover:bg-white transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#DD0200]" />
            <span>فتح استوديو الزائر</span>
          </a>
          <a
            href={`/barista?cafe=${settings.cafeSlug || 'memories'}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-lg bg-[#141212]/70 hover:bg-[#141212] text-[#FBF9F5] font-bold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Coffee className="w-3.5 h-3.5 text-[#DD0200]" />
            <span>محطة الكاونتر (POS)</span>
          </a>
          <a
            href={`/wall/screen-1?cafe=${settings.cafeSlug || 'memories'}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-lg bg-[#141212]/70 hover:bg-[#141212] text-[#FBF9F5] font-bold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span>شاشة الصالة</span>
          </a>
        </div>
      </div>

      {/* 2. Executive Luxury Editorial Cafe Launch Hero */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex-1 space-y-3.5 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#55100D]/50 text-[#FBF9F5] border border-[#DD0200]/40 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-[#DD0200] animate-pulse"></span>
              نظام الطاولات المباشر نشط • LIVE PRODUCTION
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#1C1B1B] text-[#A19E9B] font-bold border border-white/10">
              slug: {settings.cafeSlug || 'memories'}
            </span>
          </div>

          <div className="space-y-1">
            <h2
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
              className="text-2xl sm:text-3xl font-bold text-[#FBF9F5] tracking-tight"
            >
              {settings.branding?.name || 'Memories Studio'}
            </h2>
            <p className="text-xs sm:text-sm text-[#A19E9B] leading-relaxed max-w-2xl">
              منظومة استوديو الذكريات وبطاقات الولاء الرقمية المربوطة بالطاولات. لا تتطلب تحميل أي تطبيق وتعمل بكاميرا الهاتف مباشرة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#A19E9B] font-medium">
            <span className="px-2.5 py-1 rounded-lg bg-[#1C1B1B] border border-white/10">
              نمط الكارت: <strong className="text-[#FBF9F5] font-bold">{settings.defaultOrientation === 'vertical' ? 'شريط فوتوبوث 2×6' : 'كارت أفقي 4×6'}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#1C1B1B] border border-white/10">
              الزيارات المطلوبة: <strong className="text-[#FBF9F5] font-bold">{settings.defaultShotCount || 5} خانات</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#1C1B1B] border border-white/10">
              المكافأة: <strong className="text-[#DD0200] font-bold">{settings.freeGiftOffer?.title || 'هدية مجانية قيمة عند الاكتمال'}</strong>
            </span>
          </div>

          {/* Direct Link & Fast Copy */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0B0A0A] border border-white/10 text-[#A19E9B] font-mono text-xs flex-1 truncate">
              <span className="text-[#A19E9B]/60 select-none">رابط الزائر:</span>
              <span className="text-[#FBF9F5] font-bold truncate select-all">{customerLiveUrl}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onCopyUrl}
                className="px-3.5 py-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] text-xs font-bold border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#A19E9B]" />}
                <span>{copiedUrl ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>
              <a
                href={`/c?cafe=${settings.cafeSlug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] text-xs font-bold border border-white/10 transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#A19E9B]" />
                <span>فتح الاستوديو</span>
              </a>
            </div>
          </div>

          {/* Main Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={onOpenQuickSetup}
              className="px-4 py-2.5 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs transition flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة ستاند الأكريليك للطاولات</span>
            </button>
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(customerLiveUrl)}&margin=2&format=svg`}
              download={`memories-qr-${settings.cafeSlug}.svg`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#A19E9B]" />
              <span>تحميل الـ QR بجودة طباعة (SVG)</span>
            </a>
            <button
              onClick={onOpenQuickSetup}
              className="px-3.5 py-2.5 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#A19E9B]" />
              <span>تعديل الهوية والخيارات</span>
            </button>
          </div>
        </div>

        {/* Scannable Real QR Card Showcase */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-[#1C1B1B] border border-white/10 shadow-xl shrink-0 text-center w-full sm:w-auto">
          <span className="text-[11px] font-bold text-[#FBF9F5] mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#DD0200]" />
            <span>امسح بكاميرا الهاتف للفتح المباشر</span>
          </span>
          <div className="w-36 h-36 bg-white p-2 rounded-xl border border-white/10 flex items-center justify-center shadow-xs overflow-hidden">
            <RealOutsourcedQr
              value={customerLiveUrl}
              size={132}
              alt={`كود QR منشأة ${settings.branding?.name}`}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[10px] font-mono text-[#A19E9B] font-bold mt-2">
            كود الطاولة ونقطة الزيارة المباشر
          </span>
          <span className="text-[9px] text-[#A19E9B]/60 font-mono mt-0.5">
            300 DPI Vector Ready
          </span>
        </div>
      </div>

      {/* 3. Attention Center (Operational Alerts) */}
      <div className="p-5 rounded-2xl bg-[#55100D]/30 border border-[#DD0200]/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#55100D] text-[#DD0200] border border-[#DD0200]/30 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-[#DD0200]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#FBF9F5]">
              مركز المتابعة الفورية (Attention Center)
            </h3>
            <p className="text-xs text-[#A19E9B] mt-0.5">
              {metrics?.attentionCenter?.pendingMemories
                ? `هناك ${metrics?.attentionCenter?.pendingMemories} ذكريات جديدة بانتظار الاعتماد للظهور على شاشات الصالة`
                : 'جميع الذكريات معتمدة والشاشات تعمل بصورة طبيعية ومستقرة'}
            </p>
          </div>
        </div>

        {Boolean(metrics?.attentionCenter?.pendingMemories) && (
          <button
            onClick={() => onNavigateTab('memories')}
            className="px-4 py-2 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold transition shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer"
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
              <h2
                style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                className="text-xl font-bold text-[#FBF9F5]"
              >
                نشاط المنشأة اليوم (What Happened Today)
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#55100D]/50 text-[#FBF9F5] border border-[#DD0200]/40 font-mono text-[10px] font-bold flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DD0200] animate-pulse"></span>
                مباشر • LIVE ANALYTICS
              </span>
            </div>
            <p className="text-xs text-[#A19E9B] mt-0.5">
              مؤشرات الزيارات الحقيقية ومعدل عودة العملاء واللحظات الموثقة
            </p>
          </div>
          <button
            onClick={onRefreshMetrics}
            className="p-2 rounded-lg border border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] transition cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoadingMetrics ? (
          <MetricsSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
              <span className="text-[11px] font-bold text-[#A19E9B] block mb-1 uppercase tracking-wider">
                إجمالي الزيارات اليوم
              </span>
              <span className="text-3xl font-bold font-mono text-[#FBF9F5] block">
                {metrics?.today?.visits ?? 0}
              </span>
              <span className="text-[10px] text-[#A19E9B]/60 mt-1 block">
                بمسح الـ QR عند الطلب
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
              <span className="text-[11px] font-bold text-[#A19E9B] block mb-1 uppercase tracking-wider">
                عملاء عائدون (Returning)
              </span>
              <span className="text-3xl font-bold font-mono text-emerald-400 block">
                {metrics?.today?.returningCustomers ?? 0}
              </span>
              <span className="text-[10px] text-emerald-500 font-bold mt-1 block">
                زيارة متكررة خلال الأسبوع
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
              <span className="text-[11px] font-bold text-[#A19E9B] block mb-1 uppercase tracking-wider">
                ذكريات جديدة تم توثيقها
              </span>
              <span className="text-3xl font-bold font-mono text-[#DD0200] block">
                {metrics?.today?.newMemories ?? 0}
              </span>
              <span className="text-[10px] text-[#A19E9B]/60 mt-1 block">
                محتوى حقيقي من صنع الزوار
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
              <span className="text-[11px] font-bold text-[#A19E9B] block mb-1 uppercase tracking-wider">
                مكافآت تم صرفها
              </span>
              <span className="text-3xl font-bold font-mono text-[#FBF9F5] block">
                {metrics?.today?.rewardsRedeemed ?? 0}
              </span>
              <span className="text-[10px] text-[#A19E9B]/60 mt-1 block">
                مشروبات مجانية مستحقة
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
              <span className="text-[11px] font-bold text-[#A19E9B] block mb-1 uppercase tracking-wider">
                حالة الشاشات الحية
              </span>
              <span className="text-3xl font-bold font-mono text-[#FBF9F5] block flex items-center gap-2">
                <span>{metrics?.liveWall?.onlineScreens ?? 1}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <span className="text-[10px] text-[#A19E9B]/60 mt-1 block">
                شاشة صالة الجلوس متصلة
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
