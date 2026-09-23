'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CreditCard,
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
  Search,
  Trash2,
  Filter,
  Power,
  FileSpreadsheet,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { StaffPinModal } from '@/components/dashboard/StaffPinModal';
import { getActiveStaff, clearActiveStaffSession } from '@/lib/services/staff-auth.service';
import { createClient } from '@/lib/supabase/client';
import { type StaffMember } from '@/types/staff';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { MerchantQuickSetupModal } from '@/components/dashboard/MerchantQuickSetupModal';
import { BusinessSettings } from '@/types/photobooth';
import { RealOutsourcedQr } from '@/components/ui/RealOutsourcedQr';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { MetricsSkeleton, TableSkeleton } from '@/components/ui/SkeletonLoader';
import dynamic from 'next/dynamic';

// Code Splitting: Lazy load heavy tab components to minimize initial bundle
const FrameStudioTab = dynamic(
  () => import('@/components/dashboard/FrameStudioTab').then(mod => ({ default: mod.FrameStudioTab })),
  { loading: () => <div className="p-12 flex items-center justify-center"><div className="animate-pulse text-stone-400 text-sm font-bold">جاري تحميل الاستوديو...</div></div> }
);
const LoyaltyStudioTab = dynamic(
  () => import('@/components/dashboard/LoyaltyStudioTab').then(mod => ({ default: mod.LoyaltyStudioTab })),
  { loading: () => <div className="p-12 flex items-center justify-center"><div className="animate-pulse text-stone-400 text-sm font-bold">جاري تحميل الولاء...</div></div> }
);
const SubscriptionBillingTab = dynamic(
  () => import('@/components/dashboard/SubscriptionBillingTab').then(mod => ({ default: mod.SubscriptionBillingTab })),
  { loading: () => <div className="p-12 flex items-center justify-center"><div className="animate-pulse text-stone-400 text-sm font-bold">جاري تحميل باقة الاشتراك...</div></div> }
);
const PrintStationTab = dynamic(
  () => import('@/components/dashboard/PrintStationTab').then(mod => ({ default: mod.PrintStationTab })),
  { loading: () => <div className="p-12 flex items-center justify-center"><div className="animate-pulse text-stone-400 text-sm font-bold">جاري تحميل محطة الطباعة...</div></div> }
);
const RetentionAnalyticsTab = dynamic(
  () => import('@/components/dashboard/RetentionAnalyticsTab').then(mod => ({ default: mod.RetentionAnalyticsTab })),
  { loading: () => <div className="p-12 flex items-center justify-center"><div className="animate-pulse text-stone-400 text-sm font-bold">جاري تحميل التحليلات...</div></div> }
);
import { BaristaRedeemModal } from '@/components/dashboard/BaristaRedeemModal';

type DashboardTab =
  | 'overview'
  | 'customers'
  | 'memories'
  | 'wall'
  | 'rewards'
  | 'print'
  | 'qrcodes'
  | 'analytics'
  | 'settings'
  | 'billing';

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
  const [isBaristaRedeemOpen, setIsBaristaRedeemOpen] = useState(false);

  // Business settings state (dynamic tenant)
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    // Read the merchant's own slug from localStorage (set during signup/login)
    let merchantSlug = 'espresso-lab';
    let merchantName = '';
    if (typeof window !== 'undefined') {
      try {
        merchantSlug = localStorage.getItem('memories_active_merchant_slug') || 'espresso-lab';
        merchantName = localStorage.getItem('memories_active_merchant_name') || '';
      } catch {}
    }
    const base = BusinessSettingsService.getSettings(merchantSlug);
    if (merchantName && !base.branding?.name) {
      base.branding = { ...base.branding, name: merchantName };
    }
    return base;
  });

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
  const [screens, setScreens] = useState<ScreenRecord[]>([
    {
      id: 'screen-1',
      name: 'شاشة الصالة الرئيسية',
      status: 'online',
      orientation: 'landscape',
      lastHeartbeatAt: new Date().toISOString(),
    },
  ]);
  const [printQueue, setPrintQueue] = useState<any[]>([]);

  // 1. Memories Moderation & Control States
  const [memoriesFilter, setMemoriesFilter] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');
  const [memoriesSearchQuery, setMemoriesSearchQuery] = useState('');
  const [autoApproveWall, setAutoApproveWall] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`memories_auto_approve_${settings.cafeSlug || 'espresso-lab'}`) === 'true';
    }
    return false;
  });
  const [previewMemory, setPreviewMemory] = useState<MemoryItem | null>(null);
  const [batchActionMsg, setBatchActionMsg] = useState<string | null>(null);

  // 2. Customers CRM & Manual Stamp States
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'vip' | 'regular'>('all');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [customerToast, setCustomerToast] = useState<string | null>(null);

  // 3. Rewards Controlled Inputs
  const [rewardVisits, setRewardVisits] = useState<number>(() => settings.defaultShotCount || 5);
  const [rewardGiftTitle, setRewardGiftTitle] = useState<string>(() => settings.freeGiftOffer?.title || 'كوب سبيشالتي مجاني من اختيارك');
  const [rewardGiftSubtitle, setRewardGiftSubtitle] = useState<string>(() => settings.freeGiftOffer?.subtitle || 'مكافأة الزائر الوفي');
  const [isSavingRewards, setIsSavingRewards] = useState(false);
  const [saveRewardsSuccess, setSaveRewardsSuccess] = useState(false);

  // 4. Remote TV Wall Control States
  const [isTvBlackout, setIsTvBlackout] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('memories_wall_blackout') === 'true';
    }
    return false;
  });
  const [tvSlideDuration, setTvSlideDuration] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('memories_wall_duration');
      return saved ? Number(saved) : 8000;
    }
    return 8000;
  });
  const [tvSyncNotice, setTvSyncNotice] = useState<string | null>(null);

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

  // Memories Moderation Actions
  const handleToggleAutoApprove = (val: boolean) => {
    setAutoApproveWall(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`memories_auto_approve_${settings.cafeSlug || 'espresso-lab'}`, String(val));
    }
    setBatchActionMsg(val ? 'تم تفعيل البث التلقائي للشاشات فور التقاط الصور.' : 'تم تفعيل نظام المراجعة والاعتماد اليدوي (أمان مضاعف).');
    setTimeout(() => setBatchActionMsg(null), 3500);
  };

  const handleBatchApprovePending = () => {
    setMemories(prev => prev.map(m => m.status === 'pending' ? { ...m, status: 'approved' } : m));
    setBatchActionMsg('تم اعتماد كافة الصور المعلقة للبث على الشاشات بنجاح!');
    setTimeout(() => setBatchActionMsg(null), 3500);
    try {
      const channel = new BroadcastChannel('memories_screens_channel');
      channel.postMessage({ type: 'WALL_COMMAND', command: 'FORCE_REFRESH' });
      channel.close();
    } catch {}
  };

  const handleBatchHideAll = () => {
    setMemories(prev => prev.map(m => ({ ...m, status: 'hidden' })));
    setBatchActionMsg('تم إخفاء جميع الصور المعروضة من شاشات الصالة فوراً.');
    setTimeout(() => setBatchActionMsg(null), 3500);
    try {
      const channel = new BroadcastChannel('memories_screens_channel');
      channel.postMessage({ type: 'WALL_COMMAND', command: 'FORCE_REFRESH' });
      channel.close();
    } catch {}
  };

  const handleDeleteMemory = (memoryId: string) => {
    setMemories(prev => prev.filter(m => m.id !== memoryId));
    setBatchActionMsg('تم حذف الصورة وسجلها نهائياً.');
    setTimeout(() => setBatchActionMsg(null), 2500);
  };

  // Customers CRM Actions
  const handleAddDirectStamp = (c: CustomerRecord) => {
    const rawPhone = c.id.replace('c_', '');
    CustomerRegistryService.addDirectStamp(rawPhone, settings.cafeSlug || 'espresso-lab');
    setCustomers(prev =>
      prev.map(item => {
        if (item.id === c.id) {
          const newVisits = item.totalVisits + 1;
          return {
            ...item,
            totalVisits: newVisits,
            lastSeenAt: new Date().toISOString(),
            rewardsCount: Math.floor(newVisits / (settings.defaultShotCount || 5)),
          };
        }
        return item;
      })
    );
    setCustomerToast(`🎉 تم إضافة ختم يدوي بنجاح للعميل (${c.displayName})! الزيارات: ${c.totalVisits + 1}`);
    setTimeout(() => setCustomerToast(null), 4000);
  };

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustPhone.trim() || !newCustName.trim()) return;
    CustomerRegistryService.registerCustomer(newCustPhone, newCustName, 'coffee_lover', settings.cafeSlug || 'espresso-lab');
    setNewCustPhone('');
    setNewCustName('');
    setIsAddCustomerModalOpen(false);
    fetchCustomers();
    setCustomerToast('تم تسجيل العميل بنجاح في سجل الولاء!');
    setTimeout(() => setCustomerToast(null), 4000);
  };

  const handleExportCsv = () => {
    if (customers.length === 0) return;
    const headers = ['اسم العميل', 'عدد الزيارات', 'عدد الذكريات', 'المكافآت المستحقة', 'آخر ظهور'];
    const rows = customers.map(c => [
      `"${c.displayName}"`,
      c.totalVisits,
      c.memoriesCount,
      c.rewardsCount,
      `"${new Date(c.lastSeenAt).toLocaleDateString('ar-EG')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customers-${settings.cafeSlug || 'espresso-lab'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rewards Save Action
  const handleSaveRewardSettings = () => {
    setIsSavingRewards(true);
    const updated: BusinessSettings = {
      ...settings,
      defaultShotCount: Number(rewardVisits),
      freeGiftOffer: {
        title: rewardGiftTitle,
        subtitle: rewardGiftSubtitle,
        icon: settings.freeGiftOffer?.icon || 'coffee',
      },
    };
    handleSettingsUpdated(updated);
    setIsSavingRewards(false);
    setSaveRewardsSuccess(true);
    setTimeout(() => setSaveRewardsSuccess(false), 3000);
  };

  // TV Wall Remote Commands
  const handleToggleBlackout = () => {
    const next = !isTvBlackout;
    setIsTvBlackout(next);
    try {
      localStorage.setItem('memories_wall_blackout', String(next));
      const channel = new BroadcastChannel('memories_screens_channel');
      channel.postMessage({ type: 'WALL_COMMAND', command: 'BLACKOUT', blackout: next });
      channel.close();
    } catch {}
    try {
      localStorage.setItem('memories_wall_command', JSON.stringify({ command: 'BLACKOUT', blackout: next, timestamp: Date.now() }));
    } catch {}
    setTvSyncNotice(next ? 'تم تفعيل وضع التعتيم (شاشة التوقف) على شاشات الصالة' : 'تم استئناف البث الحي للذكريات على الشاشات');
    setTimeout(() => setTvSyncNotice(null), 3000);
  };

  const handleChangeSlideDuration = (durationMs: number) => {
    setTvSlideDuration(durationMs);
    try {
      localStorage.setItem('memories_wall_duration', String(durationMs));
      const channel = new BroadcastChannel('memories_screens_channel');
      channel.postMessage({ type: 'WALL_COMMAND', command: 'SET_SPEED', durationMs });
      channel.close();
    } catch {}
    try {
      localStorage.setItem('memories_wall_command', JSON.stringify({ command: 'SET_SPEED', durationMs, timestamp: Date.now() }));
    } catch {}
    setTvSyncNotice(`تم ضبط سرعة الانتقال على (${durationMs / 1000} ثوانٍ)`);
    setTimeout(() => setTvSyncNotice(null), 3000);
  };

  const handleForceRefreshTv = () => {
    try {
      const channel = new BroadcastChannel('memories_screens_channel');
      channel.postMessage({ type: 'WALL_COMMAND', command: 'FORCE_REFRESH' });
      channel.close();
    } catch {}
    try {
      localStorage.setItem('memories_wall_command', JSON.stringify({ command: 'FORCE_REFRESH', timestamp: Date.now() }));
    } catch {}
    setTvSyncNotice('تم إرسال أمر التحديث الفوري لكافة شاشات التلفزيون المتصلة');
    setTimeout(() => setTvSyncNotice(null), 3000);
  };

  const handleUnpairScreen = (screenId: string) => {
    try {
      const channel = new BroadcastChannel('memories_screens_channel');
      channel.postMessage({ type: 'WALL_COMMAND', command: 'UNPAIR' });
      channel.close();
    } catch {}
    try {
      localStorage.setItem('memories_wall_command', JSON.stringify({ command: 'UNPAIR', timestamp: Date.now() }));
    } catch {}
    setScreens(prev => prev.filter(s => s.id !== screenId));
    setTvSyncNotice(`تم فصل الشاشة (${screenId}) وإعادة ضبط كود الاقتران.`);
    setTimeout(() => setTvSyncNotice(null), 3000);
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
              onClick={() => setActiveTab('billing')}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-xs font-bold text-amber-900 flex items-center gap-1.5 transition"
              title="إدارة الباقة والاشتراك"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-700" />
              <span>الاشتراك والباقة</span>
            </button>
            <button
              onClick={() => setIsBaristaRedeemOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="التحقق من كود الهدية وصرفها للزائر فوراً"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>صرف هدية للزائر</span>
            </button>
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
            { id: 'billing', label: 'الاشتراك والباقة', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-700/20'
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
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-stone-900">
                      نشاط الكافيه اليوم (What Happened Today)
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
                  onClick={fetchMetrics}
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
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs cursor-pointer shrink-0"
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
            {/* Header & Main Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-stone-950 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                  <span>مركز اعتماد ومراقبة الذكريات (Memories Moderation Suite)</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  التحكم والفلترة المباشرة لكافة الصور الملتقطة قبل أو أثناء بثها على شاشات التلفزيون في الصالة
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchMemories}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold flex items-center gap-1.5 text-stone-700 shadow-2xs transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMemories ? 'animate-spin' : ''}`} />
                  <span>تحديث القائمة</span>
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {batchActionMsg && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs font-bold flex items-center gap-2 shadow-2xs animate-in fade-in duration-200">
                <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{batchActionMsg}</span>
              </div>
            )}

            {/* Action Bar: Filters, Search, Batch Actions & Auto-Approve Toggle */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl">
                  <button
                    onClick={() => setMemoriesFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      memoriesFilter === 'all'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>كافة الذكريات</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-stone-200 text-stone-700 text-[10px] font-mono">
                      {memories.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setMemoriesFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      memoriesFilter === 'pending'
                        ? 'bg-white text-amber-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>بانتظار المراجعة</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                      {memories.filter((m) => m.status === 'pending').length}
                    </span>
                  </button>

                  <button
                    onClick={() => setMemoriesFilter('approved')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      memoriesFilter === 'approved'
                        ? 'bg-white text-emerald-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>معروض على الشاشة</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                      {memories.filter((m) => m.status === 'approved').length}
                    </span>
                  </button>

                  <button
                    onClick={() => setMemoriesFilter('hidden')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      memoriesFilter === 'hidden'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>مخفي</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-stone-200 text-stone-700 text-[10px] font-mono">
                      {memories.filter((m) => m.status === 'hidden' || m.status === 'rejected').length}
                    </span>
                  </button>
                </div>

                {/* Auto-Approval Mode Toggle */}
                <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-200/80 px-4 py-2 rounded-2xl">
                  <div className="text-right">
                    <span className="text-xs font-bold text-stone-900 block">البث المباشر التلقائي</span>
                    <span className="text-[10px] text-stone-500 block">
                      {autoApproveWall ? 'الصور تعرض فوراً على التلفزيون' : 'يتطلب موافقة التاجر يدوياً'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleAutoApprove(!autoApproveWall)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoApproveWall ? 'bg-amber-600' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        autoApproveWall ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Search Bar & Batch Command Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-stone-100">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="بحث باسم الزائر أو التعليق..."
                    value={memoriesSearchQuery}
                    onChange={(e) => setMemoriesSearchQuery(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                  {memoriesSearchQuery && (
                    <button
                      onClick={() => setMemoriesSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleBatchApprovePending}
                    disabled={memories.filter((m) => m.status === 'pending').length === 0}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>اعتماد كافة المعلقات ({memories.filter((m) => m.status === 'pending').length})</span>
                  </button>

                  <button
                    onClick={handleBatchHideAll}
                    disabled={memories.filter((m) => m.status === 'approved').length === 0}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>إخفاء جميع المعروض فوراً</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Memories Grid View */}
            {isLoadingMemories ? (
              <TableSkeleton />
            ) : (() => {
              const filtered = memories.filter((m) => {
                if (memoriesFilter === 'pending' && m.status !== 'pending') return false;
                if (memoriesFilter === 'approved' && m.status !== 'approved') return false;
                if (memoriesFilter === 'hidden' && m.status !== 'hidden' && m.status !== 'rejected') return false;
                if (memoriesSearchQuery.trim()) {
                  const q = memoriesSearchQuery.toLowerCase().trim();
                  const matchName = m.customerName?.toLowerCase().includes(q);
                  const matchCaption = m.caption?.toLowerCase().includes(q);
                  if (!matchName && !matchCaption) return false;
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-2xs">
                    <Coffee className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <h3 className="font-bold text-sm text-stone-800">لا توجد صور تطابق الفلتر المحدد</h3>
                    <p className="text-xs text-stone-500 mt-1">
                      {memoriesSearchQuery
                        ? 'جرّب البحث بكلمات أخرى أو مسح حقل البحث.'
                        : 'عندما يلتقط الزوار صوراً جديدة ستظهر هنا فوراً.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-300 transition duration-200"
                    >
                      <div className="space-y-3">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 group">
                          <img
                            src={m.originalUrl}
                            alt="Customer Memory"
                            className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                          />
                          <span
                            className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shadow-xs ${
                              m.status === 'approved'
                                ? 'bg-emerald-500 text-white'
                                : m.status === 'hidden' || m.status === 'rejected'
                                ? 'bg-stone-700 text-white'
                                : 'bg-amber-500 text-stone-950 animate-pulse'
                            }`}
                          >
                            {m.status === 'approved'
                              ? 'معروض على الشاشة '
                              : m.status === 'hidden' || m.status === 'rejected'
                              ? 'مخفي'
                              : 'بانتظار الموافقة ⏳'}
                          </span>

                          <button
                            onClick={() => setPreviewMemory(m)}
                            className="absolute bottom-2 left-2 px-2.5 py-1.5 rounded-xl bg-stone-950/80 hover:bg-stone-900 text-white text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-sm transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة التلفزيون</span>
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-stone-900 mb-1">
                            <span className="truncate">{m.customerName}</span>
                            <span className="text-[10px] text-stone-400 font-mono shrink-0">
                              {new Date(m.createdAt).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {m.caption ? (
                            <p className="text-xs text-stone-600 line-clamp-2 bg-stone-50 p-2 rounded-xl">
                              “{m.caption}”
                            </p>
                          ) : (
                            <p className="text-[11px] text-stone-400 italic bg-stone-50/60 p-1.5 rounded-xl">
                              بدون تعليق نصي
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="space-y-2 pt-2 border-t border-stone-100">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleModerateMemory(m.id, 'approved')}
                            disabled={m.status === 'approved'}
                            className={`py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              m.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{m.status === 'approved' ? 'معتمد للشاشة' : 'اعتماد'}</span>
                          </button>

                          <button
                            onClick={() => handleModerateMemory(m.id, 'hidden')}
                            disabled={m.status === 'hidden'}
                            className={`py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              m.status === 'hidden'
                                ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-default'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            }`}
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>{m.status === 'hidden' ? 'مخفي حالياً' : 'إخفاء'}</span>
                          </button>
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذه الصورة نهائياً؟')) {
                                handleDeleteMemory(m.id);
                              }
                            }}
                            className="text-[11px] text-stone-400 hover:text-red-600 font-bold flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف نهائي</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: CUSTOMERS & RETENTION CRM */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-stone-950 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <span>سجل العملاء والولاء (Customer Retention CRM)</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  إدارة زوار الكافيه، رصد معدلات التكرار، وإضافة الأختام اليدوية وتصدير البيانات
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تسجيل زائر جديد</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  disabled={customers.length === 0}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-50 text-xs font-bold text-stone-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تصدير CSV</span>
                </button>

                <button
                  onClick={fetchCustomers}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 shadow-2xs transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Toast Notification */}
            {customerToast && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-2 shadow-2xs animate-in fade-in duration-200">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{customerToast}</span>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-stone-100/80 p-1.5 rounded-2xl w-full sm:w-auto">
                <button
                  onClick={() => setCustomerFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    customerFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  كافة العملاء ({customers.length})
                </button>
                <button
                  onClick={() => setCustomerFilter('vip')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    customerFilter === 'vip'
                      ? 'bg-white text-amber-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  عملاء VIP الذهبيين ({customers.filter((c) => c.totalVisits >= 5).length})
                </button>
                <button
                  onClick={() => setCustomerFilter('regular')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    customerFilter === 'regular'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  زوار جدد ({customers.filter((c) => c.totalVisits < 5).length})
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث باسم العميل أو رقمه..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            {isLoadingCustomers ? (
              <TableSkeleton />
            ) : (() => {
              const filtered = customers.filter((c) => {
                if (customerFilter === 'vip' && c.totalVisits < 5) return false;
                if (customerFilter === 'regular' && c.totalVisits >= 5) return false;
                if (customerSearchQuery.trim()) {
                  const q = customerSearchQuery.toLowerCase().trim();
                  const matchName = c.displayName?.toLowerCase().includes(q);
                  const matchId = c.id?.toLowerCase().includes(q);
                  if (!matchName && !matchId) return false;
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-xs">
                    <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                    <h3 className="font-bold text-base text-stone-900">سجل العملاء بانتظار أول زيارة</h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      بمجرد أن يمسح الزوار كود QR الطاولات ويبدأون تجربة التوثيق والولاء، ستظهر أرقامهم وعدد زياراتهم ومكافآتهم هنا تلقائياً.
                    </p>
                    <div className="mt-5 flex items-center justify-center gap-3">
                      <button
                        onClick={() => setIsAddCustomerModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition"
                      >
                        + تسجيل عميل يدوياً
                      </button>
                      <button
                        onClick={() => setIsQuickSetupOpen(true)}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition"
                      >
                        عرض وتحميل كود QR الطاولات ←
                      </button>
                    </div>
                  </div>
                );
              }

              return (
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
                          <th className="p-4 font-bold text-center">إجراء الولاء المباشر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filtered.map((c) => (
                          <tr key={c.id} className="hover:bg-stone-50/60 transition">
                            <td className="p-4 font-bold text-stone-900 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                {c.displayName.slice(0, 2)}
                              </div>
                              <div>
                                <span className="block font-bold">{c.displayName}</span>
                                {c.id.startsWith('c_') && (
                                  <span className="text-[10px] text-stone-400 font-mono block">
                                    {c.id.replace('c_', '')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-stone-800 text-sm">
                                  {c.totalVisits}
                                </span>
                                <span className="text-[11px] text-stone-500">زيارات</span>
                              </div>
                              <div className="w-24 bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, ((c.totalVisits % (settings.defaultShotCount || 5)) / (settings.defaultShotCount || 5)) * 100)}%`,
                                  }}
                                />
                              </div>
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
                                  c.totalVisits >= (settings.defaultShotCount || 5)
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {c.totalVisits >= (settings.defaultShotCount || 5) ? 'عميل ذهبي VIP ' : 'زائر دائم'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleAddDirectStamp(c)}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-stone-950 text-amber-800 border border-amber-300 font-bold text-xs transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+1 ختم يدوي</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: REWARD RULES */}
        {activeTab === 'rewards' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-stone-950 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-600" />
                  <span>إعدادات مكافآت الولاء (Loyalty Reward Rules)</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  تحديد عدد الزيارات المطلوبة لفتح الهدية التلقائية لحث العملاء على العودة وتكرار الزيارة
                </p>
              </div>

              {saveRewardsSuccess && (
                <div className="p-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>تم حفظ وتطبيق الإعدادات بنجاح!</span>
                </div>
              )}
            </div>

            {/* Controlled Reward Settings Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <h3 className="font-bold text-sm text-stone-950">
                    مكافأة إتمام قصة الذكريات (Story Completion Reward)
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    الهدية التي تفتح تلقائياً عند وصول العميل للحد المستهدف من الزيارات الموثقة
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                  مفعلة تلقائياً 
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    عدد الزيارات المطلوبة لفتح الهدية:
                  </label>
                  <select
                    value={rewardVisits}
                    onChange={(e) => setRewardVisits(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                  >
                    <option value="3">3 زيارات (حملة تشجيعية سريعة)</option>
                    <option value="4">4 زيارات (تفاعل عالي)</option>
                    <option value="5">5 زيارات (المعدل القياسي الموصى به للكافيهات)</option>
                    <option value="6">6 زيارات (شريط ذكريات ممتد)</option>
                    <option value="7">7 زيارات (للأماكن الفاخرة والمحامص)</option>
                    <option value="8">8 زيارات (بطاقة ولاء VIP)</option>
                    <option value="10">10 زيارات (بطاقة ولاء كلاسيكية)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    عنوان الهدية (يظهر للعميل في الكارت):
                  </label>
                  <input
                    type="text"
                    value={rewardGiftTitle}
                    onChange={(e) => setRewardGiftTitle(e.target.value)}
                    placeholder="مثال: كوب سبيشالتي مجاني من اختيارك"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    وصف أو تفاصيل إضافية للهدية:
                  </label>
                  <input
                    type="text"
                    value={rewardGiftSubtitle}
                    onChange={(e) => setRewardGiftSubtitle(e.target.value)}
                    placeholder="مثال: صالح في جميع فروعنا عند الطلب من الباريستا"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Customer Live Preview of the Reward Badge */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-lg shadow-sm">
                    🎁
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      معاينة ما يراه العميل على هاتفه بعد ({rewardVisits}) زيارات:
                    </span>
                    <strong className="text-xs text-stone-900 font-black block mt-0.5">
                      {rewardGiftTitle || 'كوب سبيشالتي مجاني'}
                    </strong>
                    <span className="text-[11px] text-stone-500">
                      {rewardGiftSubtitle || 'مكافأة الزائر الوفي'}
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  كود هدية مشفر تلقائياً
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <div className="text-xs text-stone-500">
                  يتم تحديث جميع شاشات العملاء تلقائياً بالقيمة الجديدة فور الحفظ.
                </div>

                <button
                  type="button"
                  onClick={handleSaveRewardSettings}
                  disabled={isSavingRewards}
                  className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingRewards ? 'جاري الحفظ...' : 'حفظ وتطبيق إعدادات المكافأة للعملاء'}</span>
                </button>
              </div>
            </div>

            {/* Loyalty Studio Component for Cards, Milestones, and Textures */}
            <div className="pt-4">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-stone-950 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-amber-600" />
                  <span>غرفة التحكم عن بعد بشاشات الصالة (Live TV Wall Command Center)</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  إدارة بث الذكريات الحية، التحكم في سرعة العرض، وضع الاستراحة والتعتيم، وإدارة الشاشات المقترنة
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleForceRefreshTv}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 flex items-center gap-1.5 shadow-2xs transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>إعادة مزامنة الشاشات فوراً</span>
                </button>

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
            </div>

            {/* Sync Notice Alert */}
            {tvSyncNotice && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold flex items-center gap-2 shadow-2xs animate-in fade-in duration-200">
                <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{tvSyncNotice}</span>
              </div>
            )}

            {/* Remote Command Bar: Blackout Emergency + Speed Control */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Blackout Standby Controller */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Power className={`w-4 h-4 ${isTvBlackout ? 'text-red-500' : 'text-emerald-600'}`} />
                    <span className="font-bold text-sm text-stone-900">وضع التعتيم / شاشة التوقف</span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {isTvBlackout
                      ? 'الشاشات تعرض شاشة الاستراحة المؤقتة'
                      : 'الشاشات تبث ذكريات الزوار المعتمدة'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleBlackout}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5 ${
                    isTvBlackout
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isTvBlackout ? 'استئناف البث الحي' : 'تفعيل الاستراحة'}</span>
                </button>
              </div>

              {/* Slide Duration Speed Controller */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-sm text-stone-900">سرعة انتقال الشرائح</span>
                  </div>
                  <p className="text-xs text-stone-500">مدة عرض كل صورة على التلفزيون</p>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200">
                  {[
                    { label: '5 ث', ms: 5000 },
                    { label: '8 ث (قياسي)', ms: 8000 },
                    { label: '12 ث', ms: 12000 },
                    { label: '15 ث', ms: 15000 },
                  ].map((spd) => (
                    <button
                      key={spd.ms}
                      onClick={() => handleChangeSlideDuration(spd.ms)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        tvSlideDuration === spd.ms
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {spd.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Screens Management Table & Pairing Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Paired Screens Management List */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4 lg:col-span-1">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h3 className="font-bold text-sm text-stone-950 flex items-center gap-2">
                    <Tv className="w-4 h-4 text-amber-600" />
                    <span>الشاشات المقترنة بالصالة</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {screens.length} متصلة
                  </span>
                </div>

                <div className="space-y-3">
                  {screens.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-bold text-xs text-stone-900">{sc.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-stone-400 font-bold">{sc.id}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                        <span>الوضع: {isTvBlackout ? 'استراحة مؤقتة' : 'بث مباشر'}</span>
                        <button
                          onClick={() => handleUnpairScreen(sc.id)}
                          className="text-stone-400 hover:text-red-600 font-bold transition text-[10px]"
                        >
                          إلغاء الاقتران
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pairing Code Generator: Merchant enters TV Code */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4 lg:col-span-2">
                <h3 className="font-bold text-sm text-stone-950 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-600" />
                  <span>اقتران شاشة تلفزيون ذكية جديدة (Smart TV Pairing)</span>
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
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
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
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 self-start transition cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
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
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
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

        {/* TAB 7: RETENTION & REVENUE ANALYTICS */}
        {activeTab === 'analytics' && (
          <RetentionAnalyticsTab
            cafeSlug={settings.cafeSlug}
            cafeName={settings.branding?.name}
          />
        )}

        {/* TAB 9: SAAS SUBSCRIPTION & BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-stone-950">
                إدارة باقة الـ SaaS والاشتراك (Subscription & Invoices)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                ترقية الباقة، متابعة استهلاك الحصص المباشرة، وتنزيل الفواتير الضريبية المعتمدة (ZATCA)
              </p>
            </div>

            <SubscriptionBillingTab cafeSlug={settings.cafeSlug || 'espresso-lab'} />
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

      {/* 4K TV Preview Modal */}
      {previewMemory && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-stone-900 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden text-stone-100 flex flex-col">
            {/* TV Screen Frame Top */}
            <div className="p-4 px-6 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-stone-400 font-mono font-bold mr-3">
                  معاينة شاشة الصالة الحية (4K Signage Simulator) • {settings.branding?.name || 'Memories'}
                </span>
              </div>
              <button
                onClick={() => setPreviewMemory(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Simulated TV Display Body */}
            <div className="relative aspect-video bg-[#FAF8F5] text-stone-900 p-8 flex items-center justify-center overflow-hidden">
              <div className="absolute top-4 left-6 flex items-center gap-2">
                <CoBrandingLogos
                  cafeName={settings.branding?.name || 'Espresso Lab'}
                  cafeLogoUrl={settings.branding?.logoUrl}
                  size="md"
                  theme="light"
                  showTagline={false}
                />
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 max-w-2xl w-full z-10">
                <div className="relative aspect-[3/4] w-48 sm:w-60 rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-stone-100">
                  <img
                    src={previewMemory.originalUrl}
                    alt="Memory Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-3 text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>ذكرى موثقة اليوم</span>
                  </div>
                  <h3 className="text-2xl font-black text-stone-950">{previewMemory.customerName}</h3>
                  {previewMemory.caption && (
                    <p className="text-sm text-stone-600 bg-white/80 p-3 rounded-xl border border-stone-200 font-bold">
                      “{previewMemory.caption}”
                    </p>
                  )}
                  <p className="text-xs text-stone-400 font-mono">
                    {new Date(previewMemory.createdAt).toLocaleString('ar-EG')}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 px-6 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
              <span className="text-xs text-stone-400">
                الحالة الحالية: <strong className="text-white">{previewMemory.status === 'approved' ? 'معروض للشاشة' : 'معلق'}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleModerateMemory(previewMemory.id, 'approved');
                    setPreviewMemory(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                >
                  اعتماد للشاشة فوراً
                </button>
                <button
                  onClick={() => setPreviewMemory(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-5 text-right font-cairo">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-black text-lg text-stone-950 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <span>تسجيل زائر جديد في سجل الولاء</span>
              </h3>
              <button
                onClick={() => setIsAddCustomerModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  رقم هاتف العميل (لربط النقاط والمكافآت):
                </label>
                <input
                  type="tel"
                  required
                  placeholder="05XXXXXXXX"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold font-mono focus:border-amber-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  اسم العميل أو اللقب:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عبد الله أحمد"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
                >
                  حفظ وتسجيل الزائر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barista Counter Redeem Modal */}
      {isBaristaRedeemOpen && (
        <BaristaRedeemModal
          isOpen={isBaristaRedeemOpen}
          onClose={() => setIsBaristaRedeemOpen(false)}
          settings={settings}
          activeStaff={activeStaff}
          onRedeemSuccess={() => {
            fetchCustomers();
            fetchMetrics();
          }}
        />
      )}

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
