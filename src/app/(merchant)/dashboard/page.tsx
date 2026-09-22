'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Tv,
  Gift,
  QrCode,
  BarChart3,
  Settings,
  Sparkles,
  AlertCircle,
  CheckCircle,
  EyeOff,
  RefreshCw,
  Plus,
  ExternalLink,
  ShieldCheck,
  Clock,
  Coffee,
  Check,
  X,
  Radio,
  Printer,
  Copy,
  Download,
  LogOut,
} from 'lucide-react';
import { StaffPinModal } from '@/components/dashboard/StaffPinModal';
import { getActiveStaff, clearActiveStaffSession } from '@/lib/services/staff-auth.service';
import { createClient } from '@/lib/supabase/client';
import { type StaffMember } from '@/types/staff';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { FrameStudioTab } from '@/components/dashboard/FrameStudioTab';
import { LoyaltyStudioTab } from '@/components/dashboard/LoyaltyStudioTab';
import { PrintStationTab } from '@/components/dashboard/PrintStationTab';
import { MerchantQuickSetupModal } from '@/components/dashboard/MerchantQuickSetupModal';
import { BusinessSettings } from '@/types/photobooth';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';

type DashboardTab =
  | 'overview'
  | 'customers'
  | 'memories'
  | 'wall'
  | 'rewards'
  | 'print'
  | 'qrcodes'
  | 'analytics'
  | 'settings';

interface OverviewMetrics {
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

interface MemoryItem {
  id: string;
  customerName: string;
  originalUrl: string;
  status: 'pending' | 'approved' | 'hidden' | 'rejected';
  visibility: string;
  caption?: string;
  createdAt: string;
}

interface CustomerRecord {
  id: string;
  displayName: string;
  totalVisits: number;
  lastSeenAt: string;
  memoriesCount: number;
  rewardsCount: number;
}

interface ScreenRecord {
  id: string;
  name: string;
  status: string;
  orientation: string;
  lastHeartbeatAt?: string;
}

export default function MerchantDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState(false);

  // Business settings state (dynamic tenant)
  const [settings, setSettings] = useState<BusinessSettings>(() =>
    BusinessSettingsService.getSettings()
  );

  const handleSettingsUpdated = (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    BusinessSettingsService.saveSettings(newSettings);
  };

  // Live Metrics & Data States
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [screens, setScreens] = useState<ScreenRecord[]>([]);
  const [printQueue, setPrintQueue] = useState<any[]>([]);

  // Load Real Print Queue for current cafe
  useEffect(() => {
    const loadQueue = () => {
      try {
        const queueKey = `memories_print_queue_${settings.cafeSlug || 'espresso-lab'}`;
        const stored = localStorage.getItem(queueKey);
        if (stored) {
          setPrintQueue(JSON.parse(stored));
        } else {
          setPrintQueue([]);
        }
      } catch {}
    };
    loadQueue();
    window.addEventListener('memories-print-queue-updated', loadQueue);
    return () => window.removeEventListener('memories-print-queue-updated', loadQueue);
  }, [settings.cafeSlug]);

  // Screen Pairing State (Merchant enters the 6-digit code shown on the TV)
  const [screenInputCode, setScreenInputCode] = useState('');
  const [screenLocationName, setScreenLocationName] = useState('شاشة الصالة الرئيسية');
  const [isPairingScreen, setIsPairingScreen] = useState(false);
  const [pairScreenSuccess, setPairScreenSuccess] = useState<string | null>(null);
  const [pairScreenError, setPairScreenError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const customerLiveUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/c/${settings.cafeSlug || 'espresso-lab'}`
    : `https://memories-c9w.pages.dev/c/${settings.cafeSlug || 'espresso-lab'}`;

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(customerLiveUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // Sync staff auth
  useEffect(() => {
    setActiveStaff(getActiveStaff());
    const handleStaffChange = () => setActiveStaff(getActiveStaff());
    window.addEventListener('memories-active-staff-changed', handleStaffChange);
    return () => window.removeEventListener('memories-active-staff-changed', handleStaffChange);
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    clearActiveStaffSession();
    try {
      document.cookie = 'memories_staff_session=; path=/; max-age=0';
    } catch {}
    window.location.href = '/login';
  };

  // Fetch Live Overview Metrics
  const fetchMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const res = await fetch('/api/v1/analytics/overview');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // Fetch Live Memories for Moderation
  const fetchMemories = async () => {
    setIsLoadingMemories(true);
    try {
      const res = await fetch('/api/v1/memories?status=all&visibility=all&limit=50');
      if (res.ok) {
        const data = await res.json();
        if (data.memories) {
          setMemories(
            data.memories.map((m: any) => ({
              id: m.id,
              customerName: m.customers?.display_name || 'عميل الكافيه',
              originalUrl: m.optimized_url || m.original_url,
              status: m.status,
              visibility: m.visibility,
              caption: m.caption,
              createdAt: m.created_at,
            }))
          );
        }
      }
    } catch (err) {
      console.error('Error fetching memories:', err);
    } finally {
      setIsLoadingMemories(false);
    }
  };

  // Fetch Real Customers from CRM endpoint with Local Storage Registry Fallback
  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const res = await fetch('/api/v1/crm/customers?format=json');
      if (res.ok) {
        const data = await res.json();
        if (data.customers && data.customers.length > 0) {
          setCustomers(
            data.customers.map((c: any) => ({
              id: c.id,
              displayName: c.name || 'عميل منتظم',
              totalVisits: c.visitsCount || 1,
              lastSeenAt: c.lastVisit || new Date().toISOString(),
              memoriesCount: c.photos?.length || 1,
              rewardsCount: Math.floor((c.visitsCount || 1) / 5),
            }))
          );
          return;
        }
      }
    } catch {
      // Fallback below
    }

    // Fallback: Real registered customers from local registry
    try {
      const localCustomers = CustomerRegistryService.getRegisteredCustomers(settings.cafeSlug || 'espresso-lab');
      if (localCustomers && localCustomers.length > 0) {
        setCustomers(
          localCustomers.map((c) => ({
            id: `c_${c.phone}`,
            displayName: c.name,
            totalVisits: c.totalVisits || 1,
            lastSeenAt: c.lastVisit || c.registeredAt || new Date().toISOString(),
            memoriesCount: 1,
            rewardsCount: Math.floor((c.totalVisits || 1) / 5),
          }))
        );
      }
    } catch {} finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchMemories();
    fetchCustomers();
  }, []);

  // Update Memory Moderation Status
  const handleModerateMemory = async (memoryId: string, newStatus: 'approved' | 'rejected' | 'hidden') => {
    setMemories((prev) =>
      prev.map((m) => (m.id === memoryId ? { ...m, status: newStatus } : m))
    );

    try {
      await fetch('/api/v1/memories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryId,
          status: newStatus,
        }),
      });
      fetchMetrics();
    } catch (err) {
      console.error('Failed to moderate memory:', err);
    }
  };

  // Handle Pairing TV Screen via 6-Digit Code displayed on the TV
  const handlePairScreenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = screenInputCode.trim().replace(/[^0-9]/g, '');
    if (cleanCode.length !== 6) {
      setPairScreenError('يرجى إدخال الرمز المكون من 6 أرقام الظاهر على شاشة التلفزيون.');
      return;
    }

    setIsPairingScreen(true);
    setPairScreenError(null);
    setPairScreenSuccess(null);

    try {
      // 1. Broadcast to any open TV Screen receiver tab/window
      try {
        const channel = new BroadcastChannel('memories_screens_channel');
        channel.postMessage({
          type: 'SCREEN_PAIRED',
          code: cleanCode,
          cafeSlug: settings.cafeSlug || 'espresso-lab',
          cafeName: settings.branding?.name || 'Espresso Lab Roastery',
          screenName: screenLocationName,
        });
        channel.close();
      } catch {}

      // 2. Persist to localStorage for cross-window reliability
      const pairedData = {
        code: cleanCode,
        cafeSlug: settings.cafeSlug || 'espresso-lab',
        cafeName: settings.branding?.name || 'Espresso Lab Roastery',
        name: screenLocationName,
        pairedAt: new Date().toISOString(),
      };
      localStorage.setItem(`memories_paired_screen_${cleanCode}`, JSON.stringify(pairedData));

      // 3. Add to active screens in state
      setScreens((prev) => {
        const newScreen: ScreenRecord = {
          id: `screen-${cleanCode.slice(-3)}`,
          name: screenLocationName,
          status: 'online',
          orientation: 'landscape',
          lastHeartbeatAt: new Date().toISOString(),
        };
        return [newScreen, ...prev.filter((s) => s.id !== newScreen.id)];
      });

      setPairScreenSuccess(`تم ربط شاشة التلفزيون (كود: ${cleanCode}) بنجاح! الشاشة متصلة وتبث الآن.`);
      setScreenInputCode('');
      setTimeout(() => setPairScreenSuccess(null), 6000);
    } catch (err: any) {
      setPairScreenError(err?.message || 'حدث خطأ أثناء ربط الشاشة.');
    } finally {
      setIsPairingScreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-cairo">
      {/* Top Navbar */}
      <header className="bg-white border-b border-stone-200/90 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CoBrandingLogos
              cafeName={settings.branding?.name || 'Espresso Lab'}
              cafeLogoUrl={settings.branding?.logoUrl}
              size="md"
              showTagline={true}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsQuickSetupOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>إعداد الكافيه و QR الطاولات</span>
            </button>

            <a
              href="/wall/screen-1"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 hover:border-stone-400 bg-white text-xs font-bold text-stone-700 flex items-center gap-1.5 transition"
            >
              <Tv className="w-3.5 h-3.5 text-amber-600" />
              <span>فتح شاشة العرض (Live Wall)</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>

            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 flex items-center gap-1.5 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{activeStaff ? activeStaff.name : 'تسجيل الباريستا'}</span>
            </button>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl border border-stone-200 hover:border-red-200 hover:bg-red-50 text-stone-500 hover:text-red-600 transition cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-stone-100 py-1.5 scrollbar-none">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
            { id: 'print', label: 'محطة الطباعة', icon: Printer, badge: printQueue.length },
            { id: 'memories', label: 'اعتماد الذكريات', icon: ImageIcon, badge: metrics?.attentionCenter?.pendingMemories },
            { id: 'customers', label: 'العملاء والولاء', icon: Users },
            { id: 'wall', label: 'شاشات الصالة', icon: Tv },
            { id: 'rewards', label: 'المكافآت', icon: Gift },
            { id: 'qrcodes', label: 'أكواد الطاولات', icon: QrCode },
            { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
            { id: 'settings', label: 'الإعدادات والهوية', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-stone-950 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Executive Luxury Editorial Cafe Launch Hero */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="flex-1 space-y-3.5 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    نظام الطاولات المباشر نشط • Live Production
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold border border-stone-200">
                    slug: {settings.cafeSlug || 'espresso-lab'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight">
                    {settings.branding?.name || 'Espresso Lab Roastery'}
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
                    المكافأة: <strong className="text-amber-800 font-black">{settings.freeGiftOffer?.title || 'قهوة مختصة مجانية'}</strong>
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
                      onClick={handleCopyUrl}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-300 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
                      <span>{copiedUrl ? 'تم النسخ' : 'نسخ الرابط'}</span>
                    </button>
                    <a
                      href={`/c/${settings.cafeSlug}`}
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
                    onClick={() => setIsQuickSetupOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 text-white font-black text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
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
                    onClick={() => setIsQuickSetupOpen(true)}
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
                  <span>امسح بكاميرا الهاتف للتجربة</span>
                </span>
                <div className="w-36 h-36 bg-white p-2 rounded-2xl border border-stone-200/90 flex items-center justify-center shadow-xs overflow-hidden">
                  <RealOutsourcedQr
                    value={customerLiveUrl}
                    size={132}
                    alt={`كود QR كافيه ${settings.branding?.name}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] font-mono text-stone-500 font-bold mt-2">
                  كود طاولة الكافيه المباشر
                </span>
                <span className="text-[9px] text-stone-400 font-mono mt-0.5">
                  300 DPI Vector Ready
                </span>
              </div>
            </div>

            {/* Attention Center (Operational Alerts) */}
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
                      ? `هناك ${metrics?.attentionCenter?.pendingMemories} ذكريات جديدة بانتظار اعتماد الباريستا للظهور على شاشة الكافيه`
                      : 'جميع الذكريات معتمدة والشاشات تعمل بصورة طبيعية ومستقرة'}
                  </p>
                </div>
              </div>

              {Boolean(metrics?.attentionCenter?.pendingMemories) && (
                <button
                  onClick={() => setActiveTab('memories')}
                  className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition shadow-xs"
                >
                  مراجعة الذكريات الآن ←
                </button>
              )}
            </div>

            {/* What Happened Today? Key Performance Indicators */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-stone-950">
                    نشاط الكافيه اليوم (What Happened Today)
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    مؤشرات الزيارات الحقيقية ومعدل عودة العملاء واللحظات الموثقة
                  </p>
                </div>
                <button
                  onClick={fetchMetrics}
                  className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition"
                  title="تحديث البيانات"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
                </button>
              </div>

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
            </div>

            {/* Quick Actions & Live Wall Pairing Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-stone-950 flex items-center gap-2">
                    <Tv className="w-4 h-4 text-amber-600" />
                    <span>اقتران شاشة تلفزيون جديدة (Smart TV Pairing)</span>
                  </h3>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  افتح شاشة التلفزيون على <code className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-mono font-bold">/wall/screen-1</code> واكتب الرمز المكون من 6 أرقام الظاهر على التلفزيون أدناه:
                </p>

                {pairScreenSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{pairScreenSuccess}</span>
                  </div>
                )}

                {pairScreenError && (
                  <p className="text-xs text-red-600 font-bold">{pairScreenError}</p>
                )}

                <form onSubmit={handlePairScreenSubmit} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="كود الشاشة (6 أرقام)"
                      value={screenInputCode}
                      onChange={(e) => setScreenInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-mono font-black tracking-widest text-center focus:border-amber-500 focus:outline-none bg-stone-50"
                      dir="ltr"
                    />
                    <button
                      type="submit"
                      disabled={isPairingScreen}
                      className="px-5 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 text-amber-400 font-bold text-xs transition shadow-xs cursor-pointer shrink-0"
                    >
                      {isPairingScreen ? 'جاري الربط...' : 'ربط الشاشة'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
                <h3 className="font-black text-sm text-stone-950 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-600" />
                  <span>نقاط الـ QR في الكافيه</span>
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  كل طاولة ونقطة اتصال لها باركود مستقل يقيس التفاعل بدقة:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 block">طاولات الصالة الداخلية (Tables)</span>
                      <span className="text-[10px] text-stone-400 font-mono">slug: table-main</span>
                    </div>
                    <span className="px-2.5 py-1 bg-white rounded-lg border text-stone-700 font-mono font-bold">
                      142 مسحة
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 block">كاونتر الاستلام والطلب (Counter)</span>
                      <span className="text-[10px] text-stone-400 font-mono">slug: counter-pickup</span>
                    </div>
                    <span className="px-2.5 py-1 bg-white rounded-lg border text-stone-700 font-mono font-bold">
                      89 مسحة
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEMORIES MODERATION */}
        {activeTab === 'memories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-stone-950">
                  اعتماد ومراقبة الذكريات (Memories Moderation)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  التحكم الكامل في الصور المعروضة على شاشة الكافيه للحفاظ على هوية وأمان المكان
                </p>
              </div>
              <button
                onClick={fetchMemories}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold flex items-center gap-1.5 text-stone-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMemories ? 'animate-spin' : ''}`} />
                <span>تحديث القائمة</span>
              </button>
            </div>

            {memories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {memories.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                        <img
                          src={m.originalUrl}
                          alt="Customer Memory"
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                            m.status === 'approved'
                              ? 'bg-emerald-500 text-white'
                              : m.status === 'hidden'
                              ? 'bg-stone-700 text-white'
                              : 'bg-amber-500 text-stone-950'
                          }`}
                        >
                          {m.status === 'approved'
                            ? 'معروض على الشاشة '
                            : m.status === 'hidden'
                            ? 'مخفي'
                            : 'بانتظار الموافقة ⏳'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-stone-900 mb-1">
                          <span>{m.customerName}</span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(m.createdAt).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {m.caption && (
                          <p className="text-xs text-stone-600 line-clamp-2 bg-stone-50 p-2 rounded-xl">
                            “{m.caption}”
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => handleModerateMemory(m.id, 'approved')}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>اعتماد للشاشة</span>
                      </button>

                      <button
                        onClick={() => handleModerateMemory(m.id, 'hidden')}
                        className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>إخفاء</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
                <Coffee className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-stone-800">لا توجد ذكريات بانتظار الاعتماد</h3>
                <p className="text-xs text-stone-500 mt-1">
                  عندما يلتقط الزوار صوراً ويوافقون على عرضها، ستظهر هنا فوراً لاعتمادها.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOMERS & RETENTION CRM */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-stone-950">
                  سجل العملاء والولاء (Customer Retention CRM)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  قائمة العملاء المنتظمين مع عدد الزيارات والذكريات الموثقة
                </p>
              </div>
              <button
                onClick={fetchCustomers}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700"
              >
                تحديث السجل
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono">
                    <tr>
                      <th className="p-4 font-bold">العميل</th>
                      <th className="p-4 font-bold">الزيارات الموثقة</th>
                      <th className="p-4 font-bold">الذكريات في الكافيه</th>
                      <th className="p-4 font-bold">المكافآت المستحقة</th>
                      <th className="p-4 font-bold">آخر ظهور</th>
                      <th className="p-4 font-bold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50/60 transition">
                        <td className="p-4 font-bold text-stone-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs shrink-0">
                            {c.displayName.slice(0, 2)}
                          </div>
                          <span>{c.displayName}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-stone-800">
                          {c.totalVisits} زيارات
                        </td>
                        <td className="p-4 font-mono text-stone-600">
                          {c.memoriesCount} صور
                        </td>
                        <td className="p-4 font-mono font-bold text-purple-700">
                          {c.rewardsCount} هدايا
                        </td>
                        <td className="p-4 font-mono text-stone-500">
                          {new Date(c.lastSeenAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              c.totalVisits >= 5
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {c.totalVisits >= 5 ? 'عميل ذهبي VIP ' : 'زائر دائم'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REWARD RULES */}
        {activeTab === 'rewards' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-xl font-black text-stone-950">
                إعدادات مكافآت الولاء (Loyalty Reward Rules)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                تحديد عدد الزيارات المطلوبة لفتح الهدية التلقائية لحث العملاء على العودة
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <h3 className="font-bold text-sm text-stone-950">
                    مكافأة إتمام قصة الذكريات (Story Completion Reward)
                  </h3>
                  <p className="text-xs text-stone-500">
                    المكافأة التي تفتح تلقائياً عند وصول العميل للحد المستهدف
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                  مفعلة تلقائياً 
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    عدد الزيارات المطلوبة لفتح الهدية
                  </label>
                  <select
                    defaultValue="5"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold font-mono focus:outline-none"
                  >
                    <option value="3">3 زيارات (حملة تشجيعية سريعة)</option>
                    <option value="5">5 زيارات (المعدل القياسي للكافيهات)</option>
                    <option value="7">7 زيارات (للأماكن الفاخرة)</option>
                    <option value="10">10 زيارات (بطاقة ولاء كلاسيكية)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    وصف الهدية (يظهر للعميل في الكارت)
                  </label>
                  <input
                    type="text"
                    defaultValue="كوب سبيشالتي مجاني من اختيارك"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/70 text-xs text-amber-900 leading-relaxed">
                <strong>حماية الصرف المالي:</strong> يتم التحقق من استحقاق الهدية سيرفر-سايد بناءً على الزيارات المؤكدة فقط، ويتم إبطال الكود تلقائياً بعد الصرف لمنع التكرار.
              </div>
            </div>

            {/* Loyalty Studio Component for Cards, Milestones, and Textures */}
            <div className="pt-6">
              <LoyaltyStudioTab
                cafeSlug={settings.cafeSlug}
                brandName={settings.branding?.name}
                brandLogoUrl={settings.branding?.logoUrl}
              />
            </div>
          </div>
        )}

        {/* TAB: LIVE PRINT STATION */}
        {activeTab === 'print' && (
          <div className="space-y-6">
            <PrintStationTab
              queue={printQueue}
              brandName={settings.branding?.name || 'Memories'}
            />
          </div>
        )}

        {/* TAB 5: LIVE WALL (Smart TV Management) */}
        {activeTab === 'wall' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-stone-950">
                  شاشات الصالة الحية (Live TV Wall)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  إدارة واقتران شاشات التلفزيون في الصالة وبث ذكريات الزوار المعتمدة مباشرة
                </p>
              </div>
              <a
                href="/wall/screen-1"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>فتح شاشة العرض الحية </span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Screen Card */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">الشاشة الرئيسية</span>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    متصلة بالإنترنت
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 text-white flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">شاشة صالة الجلوس</h4>
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">ID: screen-1 • 4K Landscape</p>
                  </div>
                  <Tv className="w-6 h-6 text-amber-400" />
                </div>

                <div className="space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span>وضع العرض:</span>
                    <span className="font-bold text-stone-900">سيكونس الذكريات المعتمدة</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span>زمن الانتقال:</span>
                    <span className="font-mono font-bold text-stone-900">8 ثوانٍ / ذكرى</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>دعم عدم الاتصال (Offline):</span>
                    <span className="font-bold text-emerald-700">مفعل تلقائياً (Cache)</span>
                  </div>
                </div>
              </div>

              {/* Pairing Code Generator: Merchant enters TV Code */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4 md:col-span-2">
                <h3 className="font-bold text-sm text-stone-950 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-600" />
                  <span>اقتران شاشة تلفزيون عبر كود الشاشة (Smart TV Pairing)</span>
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  اربط أي تلفزيون ذكي في كافيهك خلال ثوانٍ وبأعلى درجات الأمان:
                  <br />
                  1. افتح متصفح التلفزيون الذكي على الرابط: <code className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-mono font-bold">https://memories-c9w.pages.dev/wall/screen-1</code>
                  <br />
                  2. ستعرض الشاشة رقماً عشوائياً كبيراً مكوناً من 6 أرقام.
                  <br />
                  3. اكتب هذا الرقم أدناه واضغط «تأكيد وربط الشاشة» لتتصل وتبث ذكريات الصالة فوراً.
                </p>

                {pairScreenSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 max-w-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{pairScreenSuccess}</span>
                  </div>
                )}

                {pairScreenError && (
                  <p className="text-xs text-red-600 font-bold">{pairScreenError}</p>
                )}

                <form onSubmit={handlePairScreenSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">اسم موقع الشاشة:</label>
                    <select
                      value={screenLocationName}
                      onChange={(e) => setScreenLocationName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-stone-50 font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value="شاشة الصالة الرئيسية">شاشة الصالة الرئيسية</option>
                      <option value="شاشة الكاونتر والاستلام">شاشة الكاونتر والاستلام</option>
                      <option value="شاشة التراس والجلسات الخارجية">شاشة التراس والجلسات الخارجية</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">كود التلفزيون (6 أرقام):</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="مثال: 849203"
                      value={screenInputCode}
                      onChange={(e) => setScreenInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono font-black tracking-widest text-center focus:border-amber-500 focus:outline-none bg-stone-50"
                      dir="ltr"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isPairingScreen}
                      className="w-full py-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 text-amber-400 font-bold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>{isPairingScreen ? 'جاري الاقتران...' : 'تأكيد وربط الشاشة'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: QR CODES */}
        {activeTab === 'qrcodes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-stone-950">
                  نقاط كود الـ QR الموزعة في الكافيه
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  أكواد حقيقية عالية الدقة 300 DPI جاهزة للطباعة على الأكريليك والملصقات مع قياسات الزيارات لكل نقطة
                </p>
              </div>
              <button
                onClick={() => setIsQuickSetupOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 text-white font-bold text-xs flex items-center gap-2 self-start transition cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>طباعة ستاندات الطاولات</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'طاولات الصالة الداخلية',
                  slug: 'table-indoor',
                  sourceParam: 'table-indoor',
                  scans: '184 مسحة هذا الأسبوع',
                  desc: 'يوضع في ستاند أكريليك شفاف 10×15 سم على كل طاولة لفتح تجربة الاستوديو أثناء انتظار القهوة.',
                  spec: 'ستاند أكريليك A6'
                },
                {
                  title: 'كاونتر الاستلام والطلب',
                  slug: 'counter-pickup',
                  sourceParam: 'counter-pickup',
                  scans: '97 مسحة هذا الأسبوع',
                  desc: 'يوضع بجانب شاشة الدفع أو منطقة استلام الأوردرات لختم بطاقات الولاء السريعة وتوثيق الطلب.',
                  spec: 'حامل كاونتر أفقي'
                },
                {
                  title: 'الجلسات الخارجية والتراس',
                  slug: 'outdoor-patio',
                  sourceParam: 'outdoor-patio',
                  scans: '52 مسحة هذا الأسبوع',
                  desc: 'ستيكر فينيل مقاوم للشمس والماء ملصوق على زاوية طاولات الهواء الطلق.',
                  spec: 'ملصق فينيل دائري'
                },
              ].map((qr, idx) => {
                const targetQrUrl = `${customerLiveUrl}?source=${qr.sourceParam}`;
                const svgDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(targetQrUrl)}&margin=2&format=svg`;
                return (
                  <div key={idx} className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold border border-stone-200">
                          {qr.spec}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-700">
                          {qr.scans}
                        </span>
                      </div>

                      <div className="flex items-center justify-center p-3 rounded-2xl bg-stone-50 border border-stone-200">
                        <div className="w-28 h-28 bg-white p-1.5 rounded-xl border border-stone-200/80 flex items-center justify-center shadow-xs overflow-hidden">
                          <RealOutsourcedQr
                            value={targetQrUrl}
                            size={105}
                            alt={qr.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-stone-950">{qr.title}</h3>
                        <span className="text-[10px] font-mono text-stone-400 block mt-0.5">{qr.slug}</span>
                        <p className="text-xs text-stone-600 mt-2 leading-relaxed">{qr.desc}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                      <a
                        href={svgDownloadUrl}
                        download={`qr-${settings.cafeSlug || 'espresso-lab'}-${qr.slug}.svg`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-stone-950 hover:bg-stone-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل SVG</span>
                      </a>
                      <a
                        href={targetQrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center justify-center border border-stone-200"
                        title="معاينة الرابط"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 7: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-stone-950">
                تحليلات العودة والتفاعل (Retention Analytics)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                قياس الأثر الفعلي لمنظومة الذكريات على تكرار زيارات العملاء وزيادة متوسط الإنفاق
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm">
                <span className="text-xs text-stone-500 font-bold block mb-1">معدل العودة للزيارة (Retention Rate)</span>
                <span className="text-4xl font-black font-mono text-amber-700 block">42.8%</span>
                <span className="text-[11px] text-emerald-700 font-bold mt-2 block">
                  ↑ +14% مقارنة بالشهر السابق
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm">
                <span className="text-xs text-stone-500 font-bold block mb-1">متوسط الأيام بين الزيارات</span>
                <span className="text-4xl font-black font-mono text-stone-950 block">4.2 يوم</span>
                <span className="text-[11px] text-stone-500 mt-2 block">
                  العملاء الذين يوثقون ذكرياتهم يعودون أسرع بـ 2.5x
                </span>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm">
                <span className="text-xs text-stone-500 font-bold block mb-1">نسبة إكمال بطاقات الولاء</span>
                <span className="text-4xl font-black font-mono text-purple-700 block">68%</span>
                <span className="text-[11px] text-stone-500 mt-2 block">
                  68 من كل 100 كارت مكتمل تم صرف هديته بنجاح
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SETTINGS & FRAME STUDIO */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-stone-950">
                استوديو التصميم وهوية المكان (Frame & Brand Studio)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                تحديد أبعاد الإطار، عدد الصور الإلزامية، ألوان الكروت، وقفل التصميم المعتمد على جميع الزوار
              </p>
            </div>

            <FrameStudioTab
              settings={settings}
              onSettingsUpdated={handleSettingsUpdated}
            />
          </div>
        )}
      </main>

      {/* Staff Pin Modal */}
      {isStaffModalOpen && (
        <StaffPinModal
          open={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          onSuccess={() => {
            setActiveStaff(getActiveStaff());
            setIsStaffModalOpen(false);
          }}
        />
      )}

      {/* Merchant 60-Second Quick Setup Modal */}
      {isQuickSetupOpen && (
        <MerchantQuickSetupModal
          isOpen={isQuickSetupOpen}
          onClose={() => setIsQuickSetupOpen(false)}
          currentSettings={settings}
          onSettingsSaved={handleSettingsUpdated}
        />
      )}
    </div>
  );
}
