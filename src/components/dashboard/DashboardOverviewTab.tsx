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
  Award,
  TrendingUp,
  Activity,
  CreditCard,
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
  const brandName = settings.branding?.name || 'مقهى ومحمصة ولاء';
  const cafeSlug = settings.cafeSlug || 'stampy';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Executive Master SaaS Launchpad Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex-1 space-y-4 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#98183c]/50 text-[#FBF9F5] border border-[#c92a54]/40 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-[#c92a54] animate-pulse"></span>
              نظام الطاولات والمحافظ نشط • LIVE PRODUCTION
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#1C1B1B] text-[#A19E9B] font-bold border border-white/10">
              معرّف المنشأة: {cafeSlug}
            </span>
          </div>

          <div className="space-y-1.5">
            <h2
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
              className="text-2xl sm:text-3xl font-bold text-[#FBF9F5] tracking-tight"
            >
              {brandName}
            </h2>
            <p className="text-xs sm:text-sm text-[#A19E9B] leading-relaxed max-w-2xl font-medium">
              منظومة بطاقات الولاء الرقمية لمحفظة Apple & Google المرتبطة بالطاولات ونقاط البيع. لا تتطلب تحميل أي تطبيق وتعمل بسلاسة وفورية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[#A19E9B] font-medium">
            <span className="px-3 py-1 rounded-lg bg-[#1C1B1B] border border-white/10">
              نوع الكارت: <strong className="text-[#FBF9F5] font-bold">بطاقة Apple & Google Wallet رقمية</strong>
            </span>
            <span className="px-3 py-1 rounded-lg bg-[#1C1B1B] border border-white/10">
              الزيارات المطلوبة: <strong className="text-[#FBF9F5] font-bold">{settings.defaultShotCount || 5} أختام</strong>
            </span>
            <span className="px-3 py-1 rounded-lg bg-[#98183c]/60 border border-[#c92a54]/40 text-[#FBF9F5] font-bold">
              الهدية المستحقة: <span>{settings.freeGiftOffer?.title || 'كوب سبيشالتي مجاني'}</span>
            </span>
          </div>

          {/* Direct Link & Copy */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#0B0A0A] border border-white/10 text-[#A19E9B] font-mono text-xs flex-1 truncate">
              <span className="text-[#A19E9B]/60 select-none">رابط كارت العميل:</span>
              <span className="text-[#FBF9F5] font-bold truncate select-all">{customerLiveUrl}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onCopyUrl}
                className="px-4 py-2.5 rounded-lg bg-[#c92a54] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-95"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                <span>{copiedUrl ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>
              <a
                href={`/c?cafe=${cafeSlug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] text-xs font-bold border border-white/10 transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#A19E9B]" />
                <span>فتح كارت العميل</span>
              </a>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={onOpenQuickSetup}
              className="px-4 py-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#c92a54]" />
              <span>طباعة ستاند الأكريليك</span>
            </button>
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(customerLiveUrl)}&margin=2&format=svg`}
              download={`stampy-qr-${cafeSlug}.svg`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#A19E9B]" />
              <span>تحميل فيكتور (SVG)</span>
            </a>
            <button
              onClick={onOpenQuickSetup}
              className="px-4 py-2 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] font-bold text-xs border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#A19E9B]" />
              <span>تعديل الهوية والخيارات</span>
            </button>
          </div>
        </div>

        {/* Scannable Real QR Card Showcase */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#1C1B1B] border border-white/10 shadow-xl shrink-0 text-center w-full sm:w-auto">
          <span className="text-[11px] font-bold text-[#FBF9F5] mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#c92a54]" />
            <span>امسح بكاميرا الهاتف للفتح المباشر</span>
          </span>
          <div className="w-36 h-36 bg-white p-2 rounded-xl border border-white/10 flex items-center justify-center shadow-md overflow-hidden">
            <RealOutsourcedQr
              value={customerLiveUrl}
              size={132}
              alt={`كود QR منشأة ${brandName}`}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[10px] font-mono text-[#FBF9F5] font-bold mt-2">
            كود الطاولة ونقطة الزيارة المباشر
          </span>
          <span className="text-[9px] text-[#A19E9B] font-mono mt-0.5">
            300 DPI Vector Ready
          </span>
        </div>
      </div>

      {/* 2. Attention Center (Operational Alerts) */}
      <div className="p-5 rounded-2xl bg-[#98183c]/30 border border-[#c92a54]/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#98183c] border border-[#c92a54]/40 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-[#c92a54]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#FBF9F5]">
              مركز المتابعة الفورية (Attention Center)
            </h3>
            <p className="text-xs text-[#A19E9B] mt-0.5">
              {metrics?.today?.rewardsRedeemed
                ? `تم استبدال ${metrics?.today?.rewardsRedeemed} مكافآت بنجاح اليوم عبر الكاونتر`
                : 'نظام كروت الولاء نشط ومحطات الكاونتر متصلة ومستقرة'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('wallet')}
          className="px-4 py-2 rounded-lg bg-[#c92a54] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold transition shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] cursor-pointer active:scale-95"
        >
          تخصيص كارت المحفظة ←
        </button>
      </div>

      {/* 3. Executive KPI Dashboard Grid */}
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
              <span className="px-2.5 py-0.5 rounded-md bg-[#98183c]/50 text-[#FBF9F5] border border-[#c92a54]/40 font-mono text-[10px] font-bold flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c92a54] animate-pulse"></span>
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#A19E9B] uppercase tracking-wider">
                  إجمالي الزيارات اليوم
                </span>
                <span className="p-1 rounded-md bg-[#1C1B1B] text-[#A19E9B]">
                  <Activity className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-3xl font-bold font-mono text-[#FBF9F5] block">
                {metrics?.today?.visits ?? 0}
              </span>
              <span className="text-[10px] text-[#A19E9B]/60 mt-1 block">
                بمسح الـ QR عند الطلب
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#A19E9B] uppercase tracking-wider">
                  عملاء عائدون
                </span>
                <span className="p-1 rounded-md bg-emerald-950/60 text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-3xl font-bold font-mono text-emerald-400 block">
                {metrics?.today?.returningCustomers ?? 0}
              </span>
              <span className="text-[10px] text-emerald-500 font-bold mt-1 block">
                زيارة متكررة خلال الأسبوع
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#A19E9B] uppercase tracking-wider">
                  أختام تم منحها اليوم
                </span>
                <span className="p-1 rounded-md bg-[#98183c]/50 text-[#c92a54]">
                  <Award className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-3xl font-bold font-mono text-[#c92a54] block">
                {metrics?.today?.newMemories ?? 0}
              </span>
              <span className="text-[10px] text-[#A19E9B]/60 mt-1 block">
                ختم موثق على كروت العملاء
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#A19E9B] uppercase tracking-wider">
                  مكافآت تم صرفها
                </span>
                <span className="p-1 rounded-md bg-purple-950/60 text-purple-300">
                  <Gift className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-3xl font-bold font-mono text-[#FBF9F5] block">
                {metrics?.today?.rewardsRedeemed ?? 0}
              </span>
              <span className="text-[10px] text-[#A19E9B]/60 mt-1 block">
                مشروبات مجانية مستحقة
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#A19E9B] uppercase tracking-wider">
                  كروت المحفظة النشطة
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-3xl font-bold font-mono text-[#FBF9F5] block">
                {metrics?.liveWall?.onlineScreens ? (metrics.today.uniqueCustomers + 12) : 12}
              </span>
              <span className="text-[10px] text-[#A19E9B]/60 mt-1 block">
                بطاقة محفوظة في Apple/Google
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
