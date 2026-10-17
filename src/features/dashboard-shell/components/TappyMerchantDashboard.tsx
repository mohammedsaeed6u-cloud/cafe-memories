'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  CreditCard,
  Stamp,
  Gift,
  Zap,
  Megaphone,
  Building2,
  Store,
  Users2,
  Settings as SettingsIcon,
  LifeBuoy,
  Bell,
  Check,
  Sparkles,
  MapPin,
  Camera,
  Tv,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Plus,
  Trash2,
  Copy,
  Download,
  Smartphone,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  Radio,
  Globe,
} from 'lucide-react';
import { TappyAccountingEngine, DashboardMetrics } from '@/lib/services/tappy-accounting-engine.service';
import { BusinessSettings } from '@/types/photobooth';
import { TableStandeeStudio } from '@/features/standees/components/TableStandeeStudio';
import { TimelineAuditService, TimelineEntry } from '@/lib/services/timeline-audit.service';
import { WebhookDispatcherService } from '@/lib/services/webhook-dispatcher.service';

export type TappyDashboardSubView =
  | 'insights'
  | 'card-designer'
  | 'programs'
  | 'rewards'
  | 'promotions'
  | 'standees'
  | 'branches'
  | 'profile'
  | 'team'
  | 'settings'
  | 'billing'
  | 'support';

interface TappyMerchantDashboardProps {
  settings: BusinessSettings;
  onOpenPhotoboothStudio?: () => void;
  onOpenLiveWall?: () => void;
  onOpenCashierTerminal?: () => void;
}

interface RewardLadderTier {
  id: string;
  stampsRequired: number;
  title: string;
  description: string;
  icon: string;
  estimatedCogs: number;
}

interface ScheduledPromotion {
  id: string;
  title: string;
  multiplier: number;
  days: string[];
  timeWindow: string;
  active: boolean;
  branchScope: string;
}

interface BranchItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  nfcStandId: string;
  isOnline: boolean;
  taps: number;
  customers: number;
  isFlagship?: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: 'Owner' | 'Manager' | 'Cashier' | 'Barista';
  branch: string;
  pin: string;
}


const viewLabels: Record<TappyDashboardSubView, string> = {
  insights: 'المؤشرات والتحليلات',
  'card-designer': 'مصمم الكروت الرقمية',
  programs: 'قواعد وبرامج الولاء',
  rewards: 'سلّم المكافآت',
  standees: 'ستاندات الطاولات و NFC',
  promotions: 'الحملات الترويجية (2x, 3x)',
  branches: 'الفروع ونقاط الخدمة',
  profile: 'ملف وهوية المنشأة',
  team: 'طاقم العمل ونقاط البيع',
  settings: 'الأمان وإعدادات الحماية',
  billing: 'الباقة وحصص المحفظة',
  support: 'الدعم والمساعدة المباشرة',
};

export function TappyMerchantDashboard({
  settings,
  onOpenPhotoboothStudio,
  onOpenLiveWall,
  onOpenCashierTerminal,
}: TappyMerchantDashboardProps) {
  // Navigation State
  const [activeView, setActiveView] = useState<TappyDashboardSubView>('insights');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Card Designer State
  const [brandColor, setBrandColor] = useState(settings?.walletPassConfig?.colorHex || '#682025');
  const [stampIcon, setStampIcon] = useState(settings?.stampConfig?.customEmoji || '☕');
  const [maxSlots, setMaxSlots] = useState(settings?.loyaltyMaxVisits || 8);
  const [rewardTitle, setRewardTitle] = useState(settings?.freeGiftOffer?.title || 'Free Specialty Coffee');
  const [cardFlip, setCardFlip] = useState<'front' | 'back'>('front');
  const [previewPlatform, setPreviewPlatform] = useState<'apple' | 'google'>('apple');

  // Programs & Rules State
  const [earningMode, setEarningMode] = useState<'visit' | 'item' | 'spend'>('visit');
  const [headStartBonus, setHeadStartBonus] = useState<number>(1);
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(30);
  const [maxDailyStamps, setMaxDailyStamps] = useState<number>(3);
  const [antiFraudNonceRequired, setAntiFraudNonceRequired] = useState<boolean>(true);
  const [cardExpiryDays, setCardExpiryDays] = useState<number>(180);

  // Rewards Ladder State
  const [rewardTiers, setRewardTiers] = useState<RewardLadderTier[]>([
    {
      id: 'tier-1',
      stampsRequired: 4,
      title: 'Free Bakery Item or Cookie',
      description: 'Choice of freshly baked croissant or cookie',
      icon: '🥐',
      estimatedCogs: 18,
    },
    {
      id: 'tier-2',
      stampsRequired: 8,
      title: 'Free Specialty Coffee & 4-Cuts Photobooth Strip',
      description: 'Any signature hot or iced drink + souvenir photo strip',
      icon: '🎁',
      estimatedCogs: 38,
    },
  ]);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardStamps, setNewRewardStamps] = useState(6);
  const [newRewardIcon, setNewRewardIcon] = useState('🧁');

  // Promotions State
  const [promotions, setPromotions] = useState<ScheduledPromotion[]>([
    {
      id: 'promo-1',
      title: 'Double Stamp Tuesdays',
      multiplier: 2,
      days: ['Tue'],
      timeWindow: 'All Day',
      active: true,
      branchScope: 'All Branches',
    },
    {
      id: 'promo-2',
      title: 'Afternoon Rush Happy Hour (3x)',
      multiplier: 3,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      timeWindow: '2:00 PM - 5:00 PM',
      active: true,
      branchScope: 'All Branches',
    },
  ]);

  // Branches Fleet State
  const [branches, setBranches] = useState<BranchItem[]>([
    {
      id: 'br-1',
      name: 'Flagship Roastery',
      address: 'Prince Muhammad Bin Abdulaziz St (Tahlia), Riyadh',
      lat: 24.7015,
      lng: 46.6854,
      nfcStandId: 'NFC-RUH-01',
      isOnline: true,
      taps: 1240,
      customers: 610,
      isFlagship: true,
    },
    {
      id: 'br-2',
      name: 'Riyadh Park Mall',
      address: 'Northern Ring Rd, Al Aqiq, Riyadh',
      lat: 24.7743,
      lng: 46.6301,
      nfcStandId: 'NFC-RUH-02',
      isOnline: true,
      taps: 890,
      customers: 430,
    },
    {
      id: 'br-3',
      name: 'Diplomatic Quarter',
      address: 'Al-Fazari Square, DQ, Riyadh',
      lat: 24.6872,
      lng: 46.6221,
      nfcStandId: 'NFC-RUH-03',
      isOnline: true,
      taps: 640,
      customers: 290,
    },
  ]);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');

  // Team State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: 'tm-1', name: 'Omar Al-Farooq', role: 'Owner', branch: 'All Branches', pin: '9901' },
    { id: 'tm-2', name: 'Sarah Hassan', role: 'Manager', branch: 'Flagship Roastery', pin: '4412' },
    { id: 'tm-3', name: 'Karim Adel', role: 'Barista', branch: 'Tahlia St', pin: '2810' },
    { id: 'tm-4', name: 'Nour Salem', role: 'Cashier', branch: 'Riyadh Park', pin: '1105' },
  ]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamRole, setNewTeamRole] = useState<'Manager' | 'Cashier' | 'Barista'>('Barista');
  const [newTeamPin, setNewTeamPin] = useState('1234');

  // Shopify-Style Webhooks & Timeline State
  const [webhookUrl, setWebhookUrl] = useState('https://api.foodics.com/v1/webhook');
  const [webhookSecret] = useState('shpss_sec_99482938472918');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEntry[]>(() => {
    // Seed initial timeline events if empty
    if (TimelineAuditService.getStoreTimeline('stampy').length === 0) {
      TimelineAuditService.recordEvent({
        brandId: 'stampy',
        actorType: 'system',
        action: 'system.bootstrap',
        titleEn: 'Tappy & Shopify Engine initialized with Leaky Bucket & Idempotency',
        titleAr: 'تم تفعيل دروع الحماية المتقدمة ومفتاح عدم التكرار',
      });
      TimelineAuditService.recordEvent({
        brandId: 'stampy',
        actorType: 'system',
        action: 'system.ready',
        titleEn: 'Production Security Ledger & PassKit Service active',
        titleAr: 'سجل العمليات الآمن وخدمات PassKit السحابية جاهزة بنسبة 100%',
        metadata: { environment: 'production' },
      });
    }
    return TimelineAuditService.getStoreTimeline('stampy', 10);
  });

  // Profile State
  const [storeName, setStoreName] = useState(settings?.branding?.name || 'ستامبي');
  const [storeCategory, setStoreCategory] = useState('مقهى مختص ومحمصة');
  const [instagramHandle, setInstagramHandle] = useState(settings?.branding?.instagramHandle || '@stampy_sa');
  const [supportPhone, setSupportPhone] = useState('+966 50 123 4567');

  // Trigger brief feedback notification toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time calculation from Tappy Accounting Engine
  const metrics: DashboardMetrics = TappyAccountingEngine.computeDashboardMetrics('stampy', timeRange);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 animate-in fade-in duration-300 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-[#1B1B1E] text-white border-2 border-emerald-400 rounded-2xl shadow-[0_4px_16px_rgba(61,35,20,0.06)] flex items-center gap-2.5 animate-in slide-in-from-top-3 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quick Launchpad to POS, Photobooth Studio, and 4K Wall Moat */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1B1B1E]">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>Stampy Business OS Connected</span>
          <span className="text-[#8E879E]">· Brand Ledger: {storeName}</span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenCashierTerminal && (
            <button
              onClick={onOpenCashierTerminal}
              className="px-3 py-1.5 bg-[#682025] text-white text-xs font-bold rounded-lg border border-[#DFAB56]/40 shadow-xs hover:translate-y-[-1px] transition-transform flex items-center gap-1.5 cursor-pointer"
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>Cashier POS Terminal</span>
            </button>
          )}
          {onOpenPhotoboothStudio && (
            <button
              onClick={onOpenPhotoboothStudio}
              className="px-3 py-1.5 bg-[#F0456A] text-white text-xs font-bold rounded-lg border border-[#DFAB56]/40 shadow-xs hover:translate-y-[-1px] transition-transform flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>4-Cuts Studio</span>
            </button>
          )}
          {onOpenLiveWall && (
            <button
              onClick={onOpenLiveWall}
              className="px-3 py-1.5 bg-[#1B1B1E] text-white text-xs font-bold rounded-lg border border-[#DFAB56]/40 shadow-xs hover:translate-y-[-1px] transition-transform flex items-center gap-1.5 cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>4K Live Wall</span>
            </button>
          )}
        </div>
      </div>

      {/* Tappy Authentic Desktop Browser Window Chrome */}
      <div className="border border-[#DFAB56]/40 rounded-3xl bg-white shadow-[0_12px_36px_-6px_rgba(61,35,20,0.08),0_2px_8px_-1px_rgba(61,35,20,0.04)] overflow-hidden">
        {/* Window Chrome Header */}
        <div className="bg-[#FAF5EB] border-b border-[#DFAB56]/30 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[#1E3D30]">خوادم ستامبي السحابية متصلة</span>
            <span className="text-[#8E879E]/40">|</span>
            <span className="text-xs font-semibold text-[#8E879E]">Live Cloud Engine</span>
          </div>
          <div className="bg-white border border-[#DFAB56]/40 px-4 py-1 rounded-full text-xs font-bold text-[#1E3D30] shadow-xs flex items-center gap-2">
            <span className="text-[#8B3A2B] font-serif">لوحة المنشأة</span>
            <span className="text-[#DFAB56]">/</span>
            <span>{viewLabels[activeView] || activeView}</span>
            <span className="sr-only">dashboard.stampy.app dashboard.runtappy.com</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E3D30]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1E3D30]/10 text-[#1E3D30] border border-[#1E3D30]/20 text-[11px]">
              محدّث لحظياً
            </span>
          </div>
        </div>

        {/* Dashboard Shell with Left Sidebar & Main View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[700px]">
          {/* LEFT SIDEBAR */}
          <aside className="lg:col-span-3 bg-[#FAF5EB] border-b-2 lg:border-b-0 lg:border-r border-[#DFAB56]/30 p-4 flex flex-col justify-between select-none">
            <div>
              {/* Brand Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E6E1DC]">
                <div className="flex items-center gap-2">
                  <span className="font-black text-2xl text-[#1B1B1E]" style={{ fontFamily: 'var(--font-head), Plus Jakarta Sans, sans-serif' }}>Stampy</span>
                  <span className="text-[#F0456A] text-lg leading-none">✦</span>
                </div>
                <span className="text-[11px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#FAF5EB] text-[#682025] border border-[#682025]/30">
                  Business OS
                </span>
              </div>

              {/* Navigation Items */}
              <nav className="mt-4 space-y-1">
                {/* Insights (Top-level) */}
                <button
                  onClick={() => setActiveView('insights')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'insights'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>Insights & Analytics</span>
                </button>

                {/* Loyalty Group */}
                <div className="pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#8E879E]">
                  Loyalty Engine
                </div>

                <button
                  onClick={() => setActiveView('card-designer')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'card-designer'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>مصمم كروت ستامبي</span>
                  <span className="sr-only">Tappy Card Designer</span>
                </button>

                <button
                  onClick={() => setActiveView('programs')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'programs'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <Stamp className="w-4 h-4 shrink-0" />
                  <span>Programs & Rules</span>
                </button>

                <button
                  onClick={() => setActiveView('rewards')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'rewards'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <Gift className="w-4 h-4 shrink-0" />
                  <span>Rewards Ladder</span>
                </button>

                <button
                  onClick={() => setActiveView('standees')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'standees'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <Radio className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Table Standees & NFC</span>
                </button>
                <button
                  onClick={() => setActiveView('promotions')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'promotions'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>Promotions (2x, 3x)</span>
                </button>

                {/* Business Group */}
                <div className="pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#8E879E]">
                  Store & Operations
                </div>

                <button
                  onClick={() => setActiveView('branches')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'branches'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Branches & Fleet ({branches.length})</span>
                </button>

                <button
                  onClick={() => setActiveView('profile')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'profile'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <Store className="w-4 h-4 shrink-0" />
                  <span>Store Profile</span>
                </button>

                <button
                  onClick={() => setActiveView('team')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'team'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <Users2 className="w-4 h-4 shrink-0" />
                  <span>Team & Cashiers ({teamMembers.length})</span>
                </button>

                <button
                  onClick={() => setActiveView('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'settings'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <SettingsIcon className="w-4 h-4 shrink-0" />
                  <span>Settings & Fraud</span>
                </button>

                <button
                  onClick={() => setActiveView('billing')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'billing'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Plans & Billing</span>
                </button>

                <button
                  onClick={() => setActiveView('support')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'support'
                      ? 'bg-[#682025] text-white shadow-xs'
                      : 'text-[#1B1B1E] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <LifeBuoy className="w-4 h-4 shrink-0" />
                  <span>Concierge Help</span>
                </button>
              </nav>
            </div>

            {/* Sidebar User Footer */}
            <div className="pt-4 mt-6 border-t border-[#E6E1DC] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#682025] text-white font-bold flex items-center justify-center text-xs border border-[#1B1B1E] shadow-2xs">
                {storeName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#1B1B1E] truncate">{storeName}</div>
                <div className="text-[10px] text-[#8E879E] font-medium">Owner · Pro Chain Tier</div>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="lg:col-span-9 p-4 sm:p-6 bg-[#FCFBF8] flex flex-col justify-between">
            {/* 1. INSIGHTS VIEW */}
            {activeView === 'insights' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6E1DC] pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase tracking-wide">
                      Insights & Intelligence
                    </h1>
                    <p className="text-xs text-[#8E879E]">
                      Live telemetry across all pooled branches and native Apple/Google Wallet cards
                    </p>
                  </div>
                  {/* Time Segment Selector */}
                  <div className="flex items-center gap-1 bg-[#FAF5EB] p-1 border border-[#DFAB56]/40 rounded-xl shadow-xs">
                    {(['today', 'week', 'month'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className={`px-3 py-1 text-xs font-bold capitalize rounded-lg transition-all cursor-pointer ${
                          timeRange === r ? 'bg-[#682025] text-white shadow-2xs' : 'text-[#1B1B1E] hover:bg-stone-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4 Primary KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)]">
                    <div className="text-xs font-bold text-[#8E879E] flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Stamp className="w-3.5 h-3.5 text-[#682025]" />
                        <span>Total Taps</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        +18%
                      </span>
                    </div>
                    <div className="text-3xl font-black text-[#682025] font-['Plus_Jakarta_Sans',sans-serif]">
                      {metrics.totalTaps.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)]">
                    <div className="text-xs font-bold text-[#8E879E] flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Users2 className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>New Customers</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        +12%
                      </span>
                    </div>
                    <div className="text-3xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif]">
                      {metrics.newCustomers.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)]">
                    <div className="text-xs font-bold text-[#8E879E] flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#F0456A]" />
                        <span>Return Rate</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-[#682025] bg-[#FAF5EB] px-1.5 py-0.5 rounded">
                        Top 5%
                      </span>
                    </div>
                    <div className="text-3xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif]">
                      {metrics.returnRatePercent}%
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)]">
                    <div className="text-xs font-bold text-[#8E879E] flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>Rewards Redeemed</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                        Valued
                      </span>
                    </div>
                    <div className="text-3xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif]">
                      {metrics.rewardsRedeemed.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Secondary Financial & Wallet Distribution KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-2xl shadow-xs">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E879E]">
                      Estimated Incremental Revenue
                    </div>
                    <div className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] mt-0.5">
                      SAR 18,450
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                      +SAR 68.50 avg uplift per repeat patron
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-2xl shadow-xs">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E879E]">
                      Active Wallet Passes Breakdown
                    </div>
                    <div dir="ltr" className="text-sm font-bold text-[#1B1B1E] mt-1 space-y-1">
                      <div className="flex justify-between">
                        <span>Apple Wallet:</span>
                        <strong className="text-[#682025]">68% (1,040 passes)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Google Wallet:</span>
                        <strong className="text-[#10B981]">24% (360 passes)</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-2xl shadow-xs">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E879E]">
                      Average Cycle to Reward
                    </div>
                    <div className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] mt-0.5">
                      14.2 Days
                    </div>
                    <div className="text-[10px] text-[#682025] font-bold mt-0.5">
                      2.4 visits / week per active passholder
                    </div>
                  </div>
                </div>

                {/* 2 Grid: Taps Over Time & Peak Hours Heatmap */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Taps Over Time Bar Chart */}
                  <div className="p-4 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                        Taps Over Time
                      </h2>
                      <p className="text-[11px] text-[#8E879E]">Customer taps per day · last 7 days</p>
                    </div>
                    <div className="mt-6 flex items-end justify-between gap-2 h-36 pt-4 border-b border-[#E6E1DC]">
                      {metrics.tapsOverTime.map((item) => (
                        <div key={item.day} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold text-[#1B1B1E] font-mono">{item.count}</span>
                          <div
                            style={{ height: `${Math.max(12, (item.count / 264) * 100)}px` }}
                            className={`w-full rounded-t-md border border-[#1B1B1E] transition-all ${
                              item.isHigh ? 'bg-[#682025]' : item.isLow ? 'bg-[#E6E1DC]' : 'bg-[#FAF5EB]'
                            }`}
                          />
                          <span className="text-[10px] font-bold text-[#8E879E] uppercase">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Peak Hours Heatmap Matrix */}
                  <div className="p-4 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)]">
                    <div>
                      <h2 className="text-base font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                        Peak Hours Matrix
                      </h2>
                      <p className="text-[11px] text-[#8E879E]">Busiest counter times across the week</p>
                    </div>

                    <div className="mt-4 text-[10px]">
                      {/* Heatmap Column Headers */}
                      <div className="grid grid-cols-8 gap-1 mb-1 font-bold text-[#8E879E] text-center">
                        <div />
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                        <div>Sun</div>
                      </div>
                      {/* Heatmap Rows */}
                      {[
                        { label: '8–10am', idx: 0 },
                        { label: '10–12pm', idx: 1 },
                        { label: '12–2pm', idx: 2 },
                        { label: '2–5pm', idx: 3 },
                        { label: '5–8pm', idx: 4 },
                        { label: '8pm+', idx: 5 },
                      ].map((row) => (
                        <div key={row.label} className="grid grid-cols-8 gap-1 mb-1 items-center">
                          <div className="text-[9px] font-bold text-[#8E879E] truncate">{row.label}</div>
                          {metrics.peakHours.map((dayBands, dIdx) => {
                            const level = dayBands[row.idx];
                            const bg =
                              level === 5
                                ? 'bg-[#682025]'
                                : level === 4
                                ? 'bg-[#7E4BC4]'
                                : level === 3
                                ? 'bg-[#A882E0]'
                                : level === 2
                                ? 'bg-[#D6C4F3]'
                                : 'bg-[#F1EDFA]';
                            return (
                              <div
                                key={dIdx}
                                className={`h-5 rounded-xs border border-[#1B1B1E]/20 ${bg} hover:ring-2 hover:ring-[#1B1B1E] transition-all cursor-pointer`}
                                title={`Level ${level} traffic: High volume window`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lower Row: Branches Insights & Top Customers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Branches Insights */}
                  <div className="p-4 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)]">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                          Branches League Table
                        </h2>
                        <p className="text-[11px] text-[#8E879E]">Performance across physical locations</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#682025]">{branches.length} Active</span>
                    </div>
                    <div className="space-y-2">
                      {branches.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#FAF5EB] border border-[#DFAB56]/40"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#FAF5EB] border border-[#682025]/30 flex items-center justify-center text-sm">
                              📍
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                                {b.name}
                              </div>
                              <div className="text-[10px] text-[#8E879E] truncate max-w-[180px]">{b.address}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <div className="text-sm font-black text-[#682025] font-['Plus_Jakarta_Sans',sans-serif]">
                                {b.taps}
                              </div>
                              <div className="text-[9px] uppercase font-bold text-[#8E879E]">Taps</div>
                            </div>
                            <div>
                              <div className="text-sm font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif]">
                                {b.customers}
                              </div>
                              <div className="text-[9px] uppercase font-bold text-[#8E879E]">Cust</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Customers Leaderboard */}
                  <div className="p-4 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)]">
                    <div className="mb-3">
                      <h2 className="text-base font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                        Top Loyal Patrons
                      </h2>
                      <p className="text-[11px] text-[#8E879E]">By total verified stamps accrued</p>
                    </div>
                    <div className="space-y-2">
                      {metrics.topCustomers.map((c) => (
                        <div
                          key={c.phone}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF5EB] border border-[#DFAB56]/40"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center border border-[#1B1B1E] ${
                                c.badgeTier === 'gold'
                                  ? 'bg-[#FBBF24] text-[#1B1B1E]'
                                  : c.badgeTier === 'silver'
                                  ? 'bg-[#E5E7EB] text-[#1B1B1E]'
                                  : c.badgeTier === 'bronze'
                                  ? 'bg-[#D97706] text-white'
                                  : 'bg-white text-[#1B1B1E]'
                              }`}
                            >
                              {c.rank}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#1B1B1E]">{c.name}</div>
                              <div className="text-[10px] text-[#8E879E] font-mono">{c.phone}</div>
                            </div>
                          </div>
                          <div className="text-xs font-black text-[#682025] font-['Plus_Jakarta_Sans',sans-serif]">
                            {c.stamps} ✦ Stamps
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. TAPPY CARD DESIGNER VIEW */}
            {activeView === 'card-designer' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E6E1DC] pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                      Stampy Card Designer (WYSIWYG)
                      <span className="sr-only">Tappy Card Designer</span>
                    </h1>
                    <p className="text-xs text-[#8E879E]">
                      Live customization. Changes synchronize across all issued Apple & Google Wallet passes.
                    </p>
                  </div>
                  <button
                    onClick={() => showToast('Card design saved & pushed to all active wallet passes!')}
                    className="px-4 py-2 bg-[#682025] text-white font-extrabold text-xs rounded-xl border border-[#DFAB56]/40 shadow-xs hover:bg-[#482380] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save & Broadcast Design</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Controls */}
                  <div className="space-y-5 bg-white p-5 border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)]">
                    <div>
                      <label className="block text-xs font-bold text-[#1B1B1E] mb-1.5">
                        Brand Accent & Pass Color
                      </label>
                      <div className="flex items-center gap-2">
                        {['#682025', '#1B1B1E', '#F0456A', '#3E2723', '#065F46', '#1E3A8A'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setBrandColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-9 h-9 rounded-full border border-[#DFAB56]/40 transition-transform cursor-pointer ${
                              brandColor === c ? 'scale-110 shadow-xs ring-2 ring-stone-400' : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1B1B1E] mb-1.5">
                        Stamp Mark Icon
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {['☕', '⭐', '💖', '🔥', '🥐', '✂️', '📸', '🎁'].map((icon) => (
                          <button
                            key={icon}
                            onClick={() => setStampIcon(icon)}
                            className={`w-10 h-10 rounded-xl border border-[#DFAB56]/40 flex items-center justify-center text-lg bg-[#FAF5EB] transition-transform cursor-pointer ${
                              stampIcon === icon ? 'bg-[#FAF5EB] scale-105 shadow-xs' : ''
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1B1B1E] mb-1.5">
                        Slots to Reward Milestone
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 8, 10, 12].map((cnt) => (
                          <button
                            key={cnt}
                            onClick={() => setMaxSlots(cnt)}
                            className={`py-2 rounded-xl border border-[#DFAB56]/40 text-xs font-bold transition-all cursor-pointer ${
                              maxSlots === cnt ? 'bg-[#682025] text-white shadow-xs' : 'bg-[#FAF5EB]'
                            }`}
                          >
                            {cnt} Stamps
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1B1B1E] mb-1.5">
                        Target Reward Milestone Title
                      </label>
                      <input
                        type="text"
                        value={rewardTitle}
                        onChange={(e) => setRewardTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-xl text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Dual Live Preview (Apple / Google Wallet) */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => setPreviewPlatform('apple')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border border-[#DFAB56]/40 transition-all cursor-pointer ${
                          previewPlatform === 'apple' ? 'bg-[#1B1B1E] text-white' : 'bg-[#FAF5EB]'
                        }`}
                      >
                         Apple Wallet
                      </button>
                      <button
                        onClick={() => setPreviewPlatform('google')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border border-[#DFAB56]/40 transition-all cursor-pointer ${
                          previewPlatform === 'google' ? 'bg-[#1B1B1E] text-white' : 'bg-[#FAF5EB]'
                        }`}
                      >
                        Google Wallet
                      </button>
                      <button
                        onClick={() => setCardFlip(cardFlip === 'front' ? 'back' : 'front')}
                        className="px-3 py-1 text-xs font-bold rounded-lg border border-[#DFAB56]/40 bg-white hover:bg-stone-100 cursor-pointer"
                      >
                        Flip ↻
                      </button>
                    </div>

                    {cardFlip === 'front' ? (
                      <div
                        style={{ backgroundColor: brandColor }}
                        className="w-[300px] rounded-3xl p-5 text-white border border-[#DFAB56]/40 shadow-[0_12px_36px_-6px_rgba(61,35,20,0.08),0_2px_8px_-1px_rgba(61,35,20,0.04)] space-y-4 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between border-b border-white/20 pb-3">
                          <div>
                            <div className="text-lg font-black font-['Plus_Jakarta_Sans',sans-serif] uppercase tracking-wide">
                              {storeName}
                            </div>
                            <div className="text-[10px] text-white/80">Digital Loyalty Pass</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-white/80 uppercase">Balance</div>
                            <div className="text-xl font-black font-mono">5/{maxSlots}</div>
                          </div>
                        </div>

                        {/* Stamp Grid */}
                        <div className="grid grid-cols-4 gap-2 py-2">
                          {Array.from({ length: maxSlots }).map((_, i) => (
                            <div
                              key={i}
                              className={`aspect-square rounded-2xl border border-white/40 flex items-center justify-center text-sm font-bold ${
                                i < 5 ? 'bg-white text-[#1B1B1E]' : 'bg-black/20 text-white/40'
                              }`}
                            >
                              {i < 5 ? stampIcon : i + 1}
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-white/20 pt-3 flex items-center justify-between">
                          <div>
                            <div className="text-[9px] uppercase tracking-wider text-white/80">Milestone Perk</div>
                            <div className="text-xs font-bold truncate max-w-[190px]">{rewardTitle}</div>
                          </div>
                          <div className="w-10 h-10 bg-white p-1 rounded-lg border border-[#1B1B1E] flex items-center justify-center">
                            <QrCode className="w-7 h-7 text-[#1B1B1E]" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Back Face of Pass
                      <div className="w-[300px] rounded-3xl p-5 bg-[#1C1C1E] text-white border border-[#DFAB56]/40 shadow-[0_12px_36px_-6px_rgba(61,35,20,0.08),0_2px_8px_-1px_rgba(61,35,20,0.04)] space-y-3 text-xs">
                        <div className="font-bold text-stone-300 pb-2 border-b border-stone-700">
                          Pass Information & Rules
                        </div>
                        <div className="text-[11px] space-y-1.5 text-stone-300">
                          <div>• Earn 1 stamp per verified visit across all branches.</div>
                          <div>• Redeem at the counter by showing your live receipt.</div>
                          <div>• Valid across all {branches.length} locations.</div>
                        </div>
                        <div className="pt-2 border-t border-stone-700 text-[10px] text-stone-400">
                          Lockscreen Geofencing: Enabled for all nearby branches.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. PROGRAMS & RULES VIEW */}
            {activeView === 'programs' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E6E1DC] pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                      Programs & Earning Rules
                    </h1>
                    <p className="text-xs text-[#8E879E]">
                      Configure stamp earning triggers, anti-fraud velocity limits, and customer head-start bonuses
                    </p>
                  </div>
                  <button
                    onClick={() => showToast('Program rules updated successfully!')}
                    className="px-4 py-2 bg-[#682025] text-white font-extrabold text-xs rounded-xl border border-[#DFAB56]/40 shadow-xs hover:bg-[#482380] cursor-pointer"
                  >
                    Save Rules
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earning Mode */}
                  <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-4">
                    <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                      Stamp Earning Trigger
                    </h3>
                    <div className="space-y-2">
                      {[
                        { id: 'visit', title: 'Per Visit (Default)', desc: '1 stamp per customer visit / counter order' },
                        { id: 'item', title: 'Per Cup or Item', desc: '1 stamp per drink ordered (e.g. 3 coffees = 3 stamps)' },
                        { id: 'spend', title: 'Spend Threshold', desc: '1 stamp for every SAR 40 spent on the order' },
                      ].map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setEarningMode(m.id as any)}
                          className={`p-3 rounded-xl border border-[#DFAB56]/40 cursor-pointer transition-all ${
                            earningMode === m.id ? 'bg-[#FAF5EB] shadow-xs' : 'bg-[#FAF5EB]'
                          }`}
                        >
                          <div className="text-xs font-bold text-[#1B1B1E]">{m.title}</div>
                          <div className="text-[11px] text-[#8E879E]">{m.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* First-Visit Head Start (Endowed Progress) */}
                  <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                        First-Visit Head Start Bonus
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        +82% Retention Boost
                      </span>
                    </div>
                    <p className="text-xs text-[#8E879E]">
                      Automatically gifts bonus stamps on customer's first tap. Nunes & Drèze research shows endowed progress boosts card completion by 82%.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((b) => (
                        <button
                          key={b}
                          onClick={() => setHeadStartBonus(b)}
                          className={`py-2 rounded-xl border border-[#DFAB56]/40 text-xs font-bold cursor-pointer transition-all ${
                            headStartBonus === b ? 'bg-[#682025] text-white shadow-xs' : 'bg-[#FAF5EB]'
                          }`}
                        >
                          {b === 0 ? 'Disabled' : `+${b} Free Stamp${b > 1 ? 's' : ''}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Anti-Fraud Velocity Engine */}
                  <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-4">
                    <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                      Anti-Abuse Velocity Guard
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-[#1B1B1E] mb-1">
                        Minimum Cooldown Between Taps
                      </label>
                      <select
                        value={cooldownMinutes}
                        onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes (Recommended)</option>
                        <option value={60}>60 Minutes</option>
                        <option value={240}>4 Hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1B1B1E] mb-1">
                        Max Stamps Credited Per Day
                      </label>
                      <select
                        value={maxDailyStamps}
                        onChange={(e) => setMaxDailyStamps(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                      >
                        <option value={1}>Max 1 Stamp / Day</option>
                        <option value={2}>Max 2 Stamps / Day</option>
                        <option value={3}>Max 3 Stamps / Day (Standard)</option>
                        <option value={5}>Max 5 Stamps / Day</option>
                      </select>
                    </div>
                  </div>

                  {/* Expiry Policy */}
                  <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-4">
                    <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                      Pass Inactivity Expiry
                    </h3>
                    <p className="text-xs text-[#8E879E]">
                      Encourage frequent return visits by setting an expiry for dormant cards.
                    </p>
                    <select
                      value={cardExpiryDays}
                      onChange={(e) => setCardExpiryDays(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                    >
                      <option value={0}>Never Expire (High Trust)</option>
                      <option value={90}>90 Days Dormancy</option>
                      <option value={180}>180 Days (Standard 6 Months)</option>
                      <option value={365}>1 Year</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 4. REWARDS LADDER VIEW */}
            {activeView === 'rewards' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E6E1DC] pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                      Tiered Rewards Ladder
                    </h1>
                    <p className="text-xs text-[#8E879E]">
                      Multi-milestone perks unlock progressively to maximize customer retention frequency
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#682025] bg-[#FAF5EB] px-3 py-1.5 rounded-xl border border-[#682025]/30">
                    {rewardTiers.length} Active Milestones
                  </span>
                </div>

                {/* Existing Tiers */}
                <div className="space-y-3">
                  {rewardTiers.map((tier, idx) => (
                    <div
                      key={tier.id}
                      className="p-4 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FAF5EB] border border-[#DFAB56]/40 flex items-center justify-center text-2xl shadow-xs">
                          {tier.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              Tier #{idx + 1} · {tier.stampsRequired} Stamps
                            </span>
                            <span className="text-[11px] text-[#8E879E]">Est. COGS: SAR {tier.estimatedCogs}</span>
                          </div>
                          <div className="text-sm font-bold text-[#1B1B1E] mt-0.5">{tier.title}</div>
                          <div className="text-xs text-[#8E879E]">{tier.description}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setRewardTiers(rewardTiers.filter((t) => t.id !== tier.id));
                          showToast('Milestone reward removed');
                        }}
                        className="p-2 text-stone-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Milestone Tier Form */}
                <div className="p-5 bg-[#FAF5EB] border-2 border-dashed border-[#1B1B1E] rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                    + Add New Reward Milestone Tier
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-[#8E879E] mb-1">Perk Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Free Dessert or 20% Off"
                        value={newRewardTitle}
                        onChange={(e) => setNewRewardTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#8E879E] mb-1">Required Stamps</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={newRewardStamps}
                        onChange={(e) => setNewRewardStamps(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#8E879E] mb-1">Emoji Icon</label>
                      <input
                        type="text"
                        value={newRewardIcon}
                        onChange={(e) => setNewRewardIcon(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#DFAB56]/40 rounded-xl text-xs font-bold text-center"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!newRewardTitle) return;
                      setRewardTiers([
                        ...rewardTiers,
                        {
                          id: `tier-${Date.now()}`,
                          title: newRewardTitle,
                          stampsRequired: newRewardStamps,
                          description: 'Custom loyalty milestone unlock',
                          icon: newRewardIcon || '🎁',
                          estimatedCogs: 22,
                        },
                      ]);
                      setNewRewardTitle('');
                      showToast('New milestone tier added!');
                    }}
                    className="px-4 py-2 bg-[#682025] text-white font-extrabold text-xs rounded-xl border border-[#DFAB56]/40 shadow-xs hover:bg-[#482380] cursor-pointer"
                  >
                    Add Milestone Tier
                  </button>
                </div>
              </div>
            )}

            {/* 5. PROMOTIONS (2x, 3x MULTIPLIERS) */}
            {activeView === 'promotions' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E6E1DC] pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                      Promotions & Happy Hours
                    </h1>
                    <p className="text-xs text-[#8E879E]">
                      Run 2x or 3x stamp multipliers during slow afternoon shifts. Passholders receive automated lockscreen alerts.
                    </p>
                  </div>
                  <button
                    onClick={() => showToast('Push notification broadcast to 1,420 passholders scheduled!')}
                    className="px-4 py-2 bg-[#10B981] text-white font-extrabold text-xs rounded-xl border border-[#DFAB56]/40 shadow-xs hover:bg-[#059669] cursor-pointer flex items-center gap-1.5"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Broadcast Lockscreen Push</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {promotions.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#FAF5EB] border border-[#DFAB56]/40 flex items-center justify-center font-black font-['Plus_Jakarta_Sans',sans-serif] text-xl text-[#682025] shadow-xs">
                          ×{p.multiplier}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#1B1B1E]">{p.title}</h3>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                              {p.timeWindow}
                            </span>
                          </div>
                          <div className="text-xs text-[#8E879E] mt-0.5">
                            Active Days: {p.days.join(', ')} · Scope: {p.branchScope}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setPromotions(
                              promotions.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x))
                            );
                            showToast(`Promotion ${p.active ? 'paused' : 'activated'}`);
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border border-[#DFAB56]/40 cursor-pointer transition-all ${
                            p.active ? 'bg-emerald-100 text-emerald-900 shadow-2xs' : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {p.active ? 'Active' : 'Paused'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. BRANCHES & FLEET MANAGEMENT */}
            {activeView === 'branches' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E6E1DC] pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                      Branches & NFC Fleet
                    </h1>
                    <p className="text-xs text-[#8E879E]">
                      Multi-location pooling. Configure GPS coordinates for Apple Wallet lockscreen geofencing.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#682025] bg-[#FAF5EB] px-3 py-1.5 rounded-xl border border-[#682025]/30">
                    {branches.length} Active Locations
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {branches.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">📍</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-mono font-bold text-emerald-700">Online</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-bold text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                          {b.name}
                        </div>
                        <div className="text-xs text-[#8E879E] mt-0.5">{b.address}</div>
                        <div className="text-[10px] font-mono text-[#682025] mt-1">
                          GPS: {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E6E1DC] flex justify-between text-xs font-bold text-[#1B1B1E]">
                        <span>Taps: {b.taps}</span>
                        <span>Patrons: {b.customers}</span>
                      </div>
                      <button
                        onClick={() => setActiveView('standees')}
                        className="w-full mt-2 py-1.5 px-3 bg-[#FAF5EB] hover:bg-[#FAF5EB] text-[#682025] font-bold text-[11px] rounded-xl border border-[#682025]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5 text-amber-500" />
                        <span>Print Table Standees & NFC</span>
                      </button>

                    </div>
                  ))}
                </div>

                {/* Add Branch Inline Form */}
                <div className="p-5 bg-[#FAF5EB] border-2 border-dashed border-[#1B1B1E] rounded-2xl space-y-3">
                  <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                    + Register New Branch Location
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Branch Name (e.g. Red Sea Mall, Jeddah)"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={newBranchAddress}
                      onChange={(e) => setNewBranchAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!newBranchName) return;
                      setBranches([
                        ...branches,
                        {
                          id: `br-${Date.now()}`,
                          name: newBranchName,
                          address: newBranchAddress || 'Riyadh, Saudi Arabia',
                          lat: 24.7136,
                          lng: 46.6753,
                          nfcStandId: `NFC-NEW-${branches.length + 1}`,
                          isOnline: true,
                          taps: 0,
                          customers: 0,
                        },
                      ]);
                      setNewBranchName('');
                      setNewBranchAddress('');
                      showToast('New branch added and registered for lockscreen geofencing!');
                    }}
                    className="px-4 py-2 bg-[#682025] text-white font-extrabold text-xs rounded-xl border border-[#DFAB56]/40 shadow-xs hover:bg-[#482380] cursor-pointer"
                  >
                    Add Location
                  </button>
                </div>
              </div>
            )}

            {/* 7. STORE PROFILE VIEW */}
            {activeView === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E6E1DC] pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                      Store Brand Identity
                    </h1>
                    <p className="text-xs text-[#8E879E]">
                      Manage public brand profile, Instagram handle, and passholder contacts
                    </p>
                  </div>
                  <button
                    onClick={() => showToast('Store profile saved!')}
                    className="px-4 py-2 bg-[#682025] text-white font-extrabold text-xs rounded-xl border border-[#DFAB56]/40 shadow-xs hover:bg-[#482380] cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>

                <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-[#1B1B1E] mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B1B1E] mb-1">Industry Category</label>
                    <input
                      type="text"
                      value={storeCategory}
                      onChange={(e) => setStoreCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B1B1E] mb-1">Instagram Handle</label>
                    <input
                      type="text"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B1B1E] mb-1">Support Phone</label>
                    <input
                      type="text"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 8. TEAM & RBAC VIEW */}
            {activeView === 'team' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E6E1DC] pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                      Team & Cashiers (RBAC)
                    </h1>
                    <p className="text-xs text-[#8E879E]">
                      Role-based access control and 4-digit cashier stamping PINs
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#682025] bg-[#FAF5EB] px-3 py-1.5 rounded-xl border border-[#682025]/30">
                    {teamMembers.length} Members
                  </span>
                </div>

                <div className="space-y-3">
                  {teamMembers.map((tm) => (
                    <div
                      key={tm.id}
                      className="p-4 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF5EB] border border-[#DFAB56]/40 flex items-center justify-center font-bold text-[#682025] text-xs shadow-2xs">
                          {tm.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1B1B1E]">{tm.name}</span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                              {tm.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8E879E] mt-0.5">Assigned: {tm.branch}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-[#8E879E]">POS PIN</div>
                          <div className="text-xs font-mono font-black text-[#1B1B1E]">••••</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Team Member Inline Form */}
                <div className="p-5 bg-[#FAF5EB] border-2 border-dashed border-[#1B1B1E] rounded-2xl space-y-3">
                  <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                    + Add New Team Member
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Staff Member Name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                    />
                    <select
                      value={newTeamRole}
                      onChange={(e) => setNewTeamRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#DFAB56]/40 rounded-xl text-xs font-bold"
                    >
                      <option value="Manager">Manager</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Barista">Barista</option>
                    </select>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="4-digit PIN"
                      value={newTeamPin}
                      onChange={(e) => setNewTeamPin(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DFAB56]/40 rounded-xl text-xs font-bold font-mono text-center"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!newTeamName) return;
                      setTeamMembers([
                        ...teamMembers,
                        {
                          id: `tm-${Date.now()}`,
                          name: newTeamName,
                          role: newTeamRole,
                          branch: 'Flagship Roastery',
                          pin: newTeamPin || '1234',
                        },
                      ]);
                      setNewTeamName('');
                      showToast('Team member added with POS PIN access!');
                    }}
                    className="px-4 py-2 bg-[#682025] text-white font-extrabold text-xs rounded-xl border border-[#DFAB56]/40 shadow-xs hover:bg-[#482380] cursor-pointer"
                  >
                    Add Team Member
                  </button>
                </div>
              </div>
            )}

            {/* 9. SETTINGS, WEBHOOKS & SHOPIFY ARCHITECTURE VIEW */}
            {activeView === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E6E1DC] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-bold uppercase mb-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      <span>Shopify & Tappy Enterprise Architecture Suite Active</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                      Settings, Webhooks & Forensic Audit
                    </h1>
                    <p className="text-xs text-[#8E879E]">
                      Leaky Bucket rate limiting, Idempotency keys, HMAC-SHA256 signed webhooks, and append-only activity timeline.
                    </p>
                  </div>
                  <button
                    onClick={() => showToast('Enterprise settings saved!')}
                    className="px-4 py-2 bg-[#682025] text-white font-extrabold text-xs rounded-xl border border-[#DFAB56]/40 shadow-xs hover:bg-[#482380] cursor-pointer"
                  >
                    Save Enterprise Settings
                  </button>
                </div>

                {/* 3 Core Architecture Metric Badges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-2xl shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-[#8E879E]">Idempotency Protection</div>
                    <div className="text-sm font-black text-[#1B1B1E] mt-0.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>X-Idempotency-Key Active</span>
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1">Zero duplicate stamps on network retries or double scanner fire</div>
                  </div>

                  <div className="p-3.5 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-2xl shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-[#8E879E]">Leaky Bucket Rate Limiter</div>
                    <div className="text-sm font-black text-[#1B1B1E] mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#682025]" />
                      <span>40 Capacity · 2 req/sec leak</span>
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1">Shopify standard headers X-Stampy-Call-Limit & Retry-After</div>
                  </div>

                  <div className="p-3.5 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-2xl shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-[#8E879E]">Outbound Webhook Security</div>
                    <div className="text-sm font-black text-[#1B1B1E] mt-0.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>HMAC-SHA256 Signatures</span>
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1">Outbox pattern with 3 exponential backoff retries</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Anti-Fraud Nonce */}
                  <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-3">
                    <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                      Cryptographic NFC Tag Signature
                    </h3>
                    <p className="text-xs text-[#8E879E]">
                      Each physical tap must supply an HMAC-signed rotating timestamp token to eliminate bookmark fraud.
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-bold text-[#1B1B1E]">Enforce Anti-Replay Tokens</span>
                      <button
                        onClick={() => setAntiFraudNonceRequired(!antiFraudNonceRequired)}
                        className={`px-3 py-1 text-xs font-bold rounded-full border border-[#1B1B1E] cursor-pointer ${
                          antiFraudNonceRequired ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200'
                        }`}
                      >
                        {antiFraudNonceRequired ? 'Enforced' : 'Off'}
                      </button>
                    </div>
                  </div>

                  {/* External POS Webhooks with Signed Test Dispatcher */}
                  <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-3">
                    <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                      POS Webhook Outbox (Foodics / Square / Odoo)
                    </h3>
                    <p className="text-xs text-[#8E879E]">
                      Real-time events dispatched with HMAC-SHA256 headers for external cashiers and ERPs.
                    </p>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full text-xs font-mono p-2 bg-[#FAF5EB] border border-[#1B1B1E] rounded-lg"
                      placeholder="https://api.yourpos.com/webhook"
                    />
                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 pt-1">
                      <span>Secret: {webhookSecret.slice(0, 8)}...</span>
                      <button
                        onClick={async () => {
                          await WebhookDispatcherService.dispatchEvent('stampy', 'loyalty.stamp_awarded', {
                            event: 'test_ping',
                            source: 'shopify_bridge_dashboard',
                            timestamp: new Date().toISOString(),
                          });
                          TimelineAuditService.recordEvent({
                            brandId: 'stampy',
                            actorType: 'staff',
                            action: 'webhook.test_dispatched',
                            titleEn: 'Dispatched signed test webhook to POS endpoint',
                            titleAr: 'تم إرسال إشعار ويبهوك تجريبي موقّع لـ POS',
                          });
                          setTimelineEvents(TimelineAuditService.getStoreTimeline('stampy', 10));
                          showToast('Signed HMAC-SHA256 Webhook dispatched to outbox!');
                        }}
                        className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs rounded-lg border border-[#1B1B1E] cursor-pointer shadow-xs"
                      >
                        Send Signed Ping
                      </button>
                    </div>
                  </div>
                </div>

                {/* Multi-Tenant Subdomain & Custom Domains Engine */}
                <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E6E1DC]">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#682025]" />
                      <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                        Multi-Tenant Subdomain & Custom Branding (إدارة النطاقات والـ Subdomains)
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-bold">
                      Edge Routing Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Platform Subdomain */}
                    <div className="p-4 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1B1B1E]">الرابط الفرعي المباشر (Subdomain):</span>
                        <span className="text-[10px] font-mono text-[#682025] font-bold">Vercel/Dub Pattern</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`https://${settings?.cafeSlug || 'stampy'}.stampy.sa`}
                          className="w-full text-xs font-mono p-2 bg-white border border-[#1B1B1E] rounded-lg text-[#1B1B1E]"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                              navigator.clipboard.writeText(`https://${settings?.cafeSlug || 'stampy'}.stampy.sa`);
                            }
                          }}
                          className="px-3 py-2 bg-[#682025] hover:bg-[#482380] text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                        >
                          نسخ
                        </button>
                      </div>
                      <p className="text-[10px] text-[#8E879E]">
                        يعمل تلقائياً بدون إعداد DNS، ويوجه العميل مباشرة إلى كارت الولاء واستوديو الصور لمنشأتك.
                      </p>
                    </div>

                    {/* Universal Web Path */}
                    <div className="p-4 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1B1B1E]">الرابط المباشر العام (Cloudflare Edge):</span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">Live Global CDN</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`https://memories-c9w.pages.dev/c/${settings?.cafeSlug || 'stampy'}`}
                          className="w-full text-xs font-mono p-2 bg-white border border-[#1B1B1E] rounded-lg text-[#1B1B1E]"
                          dir="ltr"
                        />
                        <a
                          href={`/c/${settings?.cafeSlug || 'stampy'}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-[#1B1B1E] hover:bg-[#2C1352] text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <span>فتح</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-[10px] text-[#8E879E]">
                        رابط إنتاج عام متاح عالمياً ومحمي عبر شبكة Cloudflare السريعة.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shopify-Style Forensic Activity Timeline */}
                <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E6E1DC]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#682025]" />
                      <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                        Store & Customer Activity Timeline (Shopify-Style Forensic Audit)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#8E879E]">Append-only stream</span>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {timelineEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3 bg-[#FAF5EB] border border-[#1B1B1E]/20 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              evt.actorType === 'staff'
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : evt.actorType === 'customer'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-stone-200 text-stone-800 border border-stone-300'
                            }`}
                          >
                            {evt.actorType}
                          </span>
                          <div>
                            <div className="font-bold text-[#1B1B1E]">{evt.titleEn}</div>
                            <div className="text-[11px] text-[#8E879E]">{evt.titleAr}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#8E879E] shrink-0">
                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 10. BILLING / TIER VIEW */}
            {activeView === 'billing' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E6E1DC] pb-4">
                  <h1 className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                    Plans & Billing (SaaS Economics)
                  </h1>
                  <p className="text-xs text-[#8E879E]">
                    Standard is free with a one-time hardware setup fee; Pro is one flat monthly fee for your entire chain.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Active Plan Card */}
                  <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_4px_16px_rgba(61,35,20,0.06)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                          Pro Chain Plan · Active
                        </div>
                        <div className="text-xs text-[#8E879E]">Flat chain fee · All features unlocked</div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold">
                        Active
                      </span>
                    </div>

                    <ul className="text-xs text-[#1B1B1E] space-y-2 pt-2">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Unlimited branches & customer passes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Stamp multiplier promotions (×2, ×3)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Lockscreen push notifications near branch</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Full historical analytics & CSV export</span>
                      </li>
                    </ul>

                    <div className="pt-3 border-t border-[#E6E1DC] flex justify-between items-center text-xs">
                      <span className="font-bold text-[#8E879E]">Billing Cycle: Monthly</span>
                      <span className="text-base font-black text-[#682025] font-['Plus_Jakarta_Sans',sans-serif]">
                        $49 / month
                      </span>
                    </div>
                  </div>

                  {/* Usage Meters */}
                  <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_4px_16px_rgba(61,35,20,0.06)] space-y-4">
                    <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                      Current Usage Meters
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-[#1B1B1E] mb-1">
                          <span>Active Wallet Passes</span>
                          <span className="font-mono">1,420 / 5,000 (28%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-100 border border-[#1B1B1E] rounded-full overflow-hidden">
                          <div className="h-full bg-[#682025] rounded-full" style={{ width: '28%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-[#1B1B1E] mb-1">
                          <span>Monthly Counter Taps</span>
                          <span className="font-mono">4,890 / Unlimited</span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-100 border border-[#1B1B1E] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-[#1B1B1E] mb-1">
                          <span>APNs Lockscreen Broadcasts</span>
                          <span className="font-mono">18 / 30 This Month</span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-100 border border-[#1B1B1E] rounded-full overflow-hidden">
                          <div className="h-full bg-[#F0456A] rounded-full" style={{ width: '60%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 11. SUPPORT / CONCIERGE VIEW */}
            {activeView === 'support' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-[#E6E1DC] pb-4">
                  <h1 className="text-2xl font-black text-[#1B1B1E] font-['Plus_Jakarta_Sans',sans-serif] uppercase">
                    Concierge Support & Hardware
                  </h1>
                  <p className="text-xs text-[#8E879E]">
                    Direct help, hardware replacements, and onboarding guides
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-3">
                    <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                      Order NFC Counter Stands
                    </h3>
                    <p className="text-xs text-[#8E879E]">
                      Need additional wooden or matte acrylic NFC tap stands for new drive-thru or counter lanes?
                    </p>
                    <button
                      onClick={() => showToast('Hardware stand dispatch request submitted!')}
                      className="px-4 py-2 bg-[#682025] text-white font-extrabold text-xs rounded-xl border border-[#DFAB56]/40 shadow-xs hover:bg-[#482380] cursor-pointer"
                    >
                      Request Additional Hardware Stand
                    </button>
                  </div>

                  <div className="p-5 bg-white border border-[#DFAB56]/40 rounded-2xl shadow-[0_2px_8px_rgba(61,35,20,0.04)] space-y-3">
                    <h3 className="text-sm font-black text-[#1B1B1E] uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                      Live Concierge Chat
                    </h3>
                    <p className="text-xs text-[#8E879E]">
                      Our loyalty engineering team is on call to configure custom Apple Wallet certificates or multi-brand setups.
                    </p>
                    <button
                      onClick={() => showToast('Opening live support channel...')}
                      className="px-4 py-2 bg-emerald-600 text-white font-extrabold text-xs rounded-xl border border-[#DFAB56]/40 shadow-xs hover:bg-emerald-700 cursor-pointer"
                    >
                      Open Live WhatsApp Chat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
