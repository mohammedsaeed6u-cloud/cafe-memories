'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { StaffMember } from '@/types/staff';
import { BusinessSettings } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { getActiveStaff, clearActiveStaffSession } from '@/lib/services/staff-auth.service';

// Modular Dashboard Feature Components
import { DashboardNavBar, DashboardTab } from '@/components/dashboard/DashboardNavBar';
import { DashboardOverviewTab, OverviewMetrics } from '@/components/dashboard/DashboardOverviewTab';
import { DashboardMemoriesTab, MemoryItem } from '@/components/dashboard/DashboardMemoriesTab';
import { DashboardCustomersTab, CustomerRecord } from '@/components/dashboard/DashboardCustomersTab';
import { DashboardWallTab, ScreenRecord } from '@/components/dashboard/DashboardWallTab';
import { DashboardRewardsTab } from '@/components/dashboard/DashboardRewardsTab';
import { DashboardQrTab } from '@/components/dashboard/DashboardQrTab';
import { DashboardSettingsTab } from '@/components/dashboard/DashboardSettingsTab';

// Lazy Loaded Heavy Tabs
const PrintStationTab = dynamic(
  () => import('@/components/dashboard/PrintStationTab').then((m) => ({ default: m.PrintStationTab })),
  { loading: () => <div className="p-12 text-center text-stone-400 font-bold text-xs">جاري تحميل محطة الطباعة...</div> }
);
const FrameStudioTab = dynamic(
  () => import('@/components/dashboard/FrameStudioTab').then((m) => ({ default: m.FrameStudioTab })),
  { loading: () => <div className="p-12 text-center text-stone-400 font-bold text-xs">جاري تحميل استوديو الإطارات...</div> }
);
const RetentionAnalyticsTab = dynamic(
  () => import('@/components/dashboard/RetentionAnalyticsTab').then((m) => ({ default: m.RetentionAnalyticsTab })),
  { loading: () => <div className="p-12 text-center text-stone-400 font-bold text-xs">جاري تحميل التحليلات...</div> }
);
const SubscriptionBillingTab = dynamic(
  () => import('@/components/dashboard/SubscriptionBillingTab').then((m) => ({ default: m.SubscriptionBillingTab })),
  { loading: () => <div className="p-12 text-center text-stone-400 font-bold text-xs">جاري تحميل الباقة والاشتراك...</div> }
);

// Modals
import { StaffPinModal } from '@/components/dashboard/StaffPinModal';
import { MerchantQuickSetupModal } from '@/components/dashboard/MerchantQuickSetupModal';
import { BaristaRedeemModal } from '@/components/dashboard/BaristaRedeemModal';

export default function MerchantDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState(false);
  const [isBaristaRedeemOpen, setIsBaristaRedeemOpen] = useState(false);

  // Business settings state (dynamic tenant)
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    let merchantSlug = 'memories';
    let merchantName = '';
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        merchantSlug = urlParams.get('cafe') || localStorage.getItem('memories_active_merchant_slug') || 'memories';
        merchantName = localStorage.getItem('memories_active_merchant_name') || '';
      } catch {}
    }
    const base = BusinessSettingsService.getSettings(merchantSlug);
    if (merchantName && (!base.branding?.name || base.branding.name === 'Memories Studio')) {
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

  // Action feedback states
  const [batchActionMsg, setBatchActionMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
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
  const [isPairingScreen, setIsPairingScreen] = useState(false);
  const [pairScreenSuccess, setPairScreenSuccess] = useState<string | null>(null);
  const [pairScreenError, setPairScreenError] = useState<string | null>(null);
  const [isSavingRewards, setIsSavingRewards] = useState(false);
  const [saveRewardsSuccess, setSaveRewardsSuccess] = useState(false);
  const [autoApproveWall, setAutoApproveWall] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`memories_auto_approve_${settings.cafeSlug || 'memories'}`) === 'true';
    }
    return false;
  });

  const customerLiveUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/c?cafe=${settings.cafeSlug || 'memories'}`
      : `https://memories-c9w.pages.dev/c?cafe=${settings.cafeSlug || 'memories'}`;

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(customerLiveUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // Print Queue Synced per Cafe
  useEffect(() => {
    const loadQueue = () => {
      try {
        const queueKey = `memories_print_queue_${settings.cafeSlug || 'memories'}`;
        const stored = localStorage.getItem(queueKey);
        setPrintQueue(stored ? JSON.parse(stored) : []);
      } catch {}
    };
    loadQueue();
    window.addEventListener('memories-print-queue-updated', loadQueue);
    return () => window.removeEventListener('memories-print-queue-updated', loadQueue);
  }, [settings.cafeSlug]);

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
      const slug = settings.cafeSlug || 'memories';
      const localCustomers = CustomerRegistryService.getRegisteredCustomers(slug);
      const totalVisits = localCustomers.reduce((acc, c) => acc + (c.totalVisits || 1), 0);
      const returning = localCustomers.filter((c) => (c.totalVisits || 1) > 1).length;
      let localPhotosCount = 0;
      try {
        const photosRaw = localStorage.getItem(`memories_wall_photos_${slug}`);
        if (photosRaw) localPhotosCount = JSON.parse(photosRaw).length;
      } catch {}

      setMetrics({
        today: {
          visits: totalVisits,
          uniqueCustomers: localCustomers.length,
          returningCustomers: returning,
          newMemories: localPhotosCount,
          rewardsRedeemed: Math.floor(totalVisits / (settings.defaultShotCount || 5)),
        },
        attentionCenter: {
          pendingMemories: memories.filter((m) => m.status === 'pending').length,
          offlineScreens: 0,
        },
        liveWall: {
          totalScreens: screens.length,
          onlineScreens: screens.filter((s) => s.status === 'online').length,
        },
      });
    } catch (e) {
      console.error('Error calculating metrics:', e);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // Fetch Memories
  const fetchMemories = async () => {
    setIsLoadingMemories(true);
    try {
      const slug = settings.cafeSlug || 'memories';
      const wallKey = `memories_wall_photos_${slug}`;
      const feedKey = `memories_wall_feed_${slug}`;
      let localPhotos = JSON.parse(localStorage.getItem(wallKey) || '[]');
      if (localPhotos.length === 0) {
        localPhotos = JSON.parse(localStorage.getItem(feedKey) || '[]');
      }
      if (localPhotos.length > 0) {
        setMemories(
          localPhotos.map((p: any, idx: number) => ({
            id: p.id || `m_${idx}`,
            customerName: p.customerName || 'ضيف مميز',
            originalUrl: p.url || p.photoUrl || (typeof p === 'string' ? p : ''),
            status: p.status || 'approved',
            visibility: p.visibility || 'public',
            caption: p.caption || '',
            createdAt: p.createdAt || new Date().toISOString(),
          }))
        );
      } else {
        setMemories([]);
      }
    } catch {} finally {
      setIsLoadingMemories(false);
    }
  };

  // Fetch Customers CRM
  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const localCustomers = CustomerRegistryService.getRegisteredCustomers(settings.cafeSlug || 'memories');
      setCustomers(
        localCustomers.map((c) => ({
          id: `c_${c.phone}`,
          displayName: c.name,
          totalVisits: c.totalVisits || 1,
          lastSeenAt: c.lastVisit || c.registeredAt || new Date().toISOString(),
          memoriesCount: 1,
          rewardsCount: Math.floor((c.totalVisits || 1) / (settings.defaultShotCount || 5)),
        }))
      );
    } catch {} finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchMemories();
    fetchCustomers();
  }, [settings.cafeSlug]);

  // Helper to persist memories state and sync with connected TV screens
  const persistMemories = (updated: MemoryItem[]) => {
    setMemories(updated);
    if (typeof window !== 'undefined') {
      const slug = settings.cafeSlug || 'memories';
      try {
        localStorage.setItem(`memories_wall_photos_${slug}`, JSON.stringify(updated));
        // Sync live wall feed with approved items only
        const approvedOnly = updated
          .filter((m) => m.status === 'approved')
          .map((m) => ({
            id: m.id,
            customerName: m.customerName,
            photoUrl: m.originalUrl,
            caption: m.caption,
            timeFormatted: 'الآن',
            visitNumber: 1,
            createdAt: m.createdAt,
            visibility: m.visibility,
            status: m.status,
          }));
        localStorage.setItem(`memories_wall_feed_${slug}`, JSON.stringify(approvedOnly));
        localStorage.setItem('memories_wall_cache_screen-1', JSON.stringify(approvedOnly));

        // Broadcast force refresh to connected TV screens
        const channel = new BroadcastChannel('memories_screens_channel');
        channel.postMessage({ type: 'WALL_COMMAND', command: 'FORCE_REFRESH' });
        channel.close();
      } catch {}
    }
  };

  // Moderation handlers
  const handleModerateMemory = (memoryId: string, newStatus: 'approved' | 'rejected' | 'hidden') => {
    const updated = memories.map((m) => (m.id === memoryId ? { ...m, status: newStatus } : m));
    persistMemories(updated);
  };

  const handleToggleAutoApprove = (val: boolean) => {
    setAutoApproveWall(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`memories_auto_approve_${settings.cafeSlug || 'memories'}`, String(val));
    }
    setBatchActionMsg(val ? 'تم تفعيل البث التلقائي للشاشات فور التقاط الصور.' : 'تم تفعيل نظام المراجعة والاعتماد اليدوي.');
    setTimeout(() => setBatchActionMsg(null), 3500);
  };

  const handleBatchApprovePending = () => {
    const updated = memories.map((m) => ({ ...m, status: 'approved' as const }));
    persistMemories(updated);
    setBatchActionMsg('تم اعتماد كافة الصور المعلقة للبث على الشاشات بنجاح!');
    setTimeout(() => setBatchActionMsg(null), 3500);
  };

  const handleBatchHideAll = () => {
    const updated = memories.map((m) => ({ ...m, status: 'hidden' as const }));
    persistMemories(updated);
    setBatchActionMsg('تم إخفاء جميع الصور المعروضة من شاشات الصالة فوراً.');
    setTimeout(() => setBatchActionMsg(null), 3500);
  };

  const handleDeleteMemory = (memoryId: string) => {
    const updated = memories.filter((m) => m.id !== memoryId);
    persistMemories(updated);
    setBatchActionMsg('تم حذف الصورة وسجلها نهائياً.');
    setTimeout(() => setBatchActionMsg(null), 2500);
  };

  // Customers CRM handlers
  const handleAddDirectStamp = (c: CustomerRecord) => {
    const rawPhone = c.id.replace('c_', '');
    CustomerRegistryService.addDirectStamp(rawPhone, settings.cafeSlug || 'memories');
    fetchCustomers();
    fetchMetrics();
  };

  const handleExportCsv = () => {
    if (customers.length === 0) return;
    const headers = ['اسم العميل', 'رقم الهاتف', 'عدد الزيارات', 'المكافآت المستحقة', 'آخر ظهور'];
    const rows = customers.map((c) => [
      `"${c.displayName}"`,
      `"${c.id.replace('c_', '')}"`,
      c.totalVisits,
      c.rewardsCount,
      `"${new Date(c.lastSeenAt).toLocaleDateString('ar-EG')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${settings.cafeSlug || 'memories'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // TV Wall Remote Handlers
  const handleToggleBlackout = () => {
    const next = !isTvBlackout;
    setIsTvBlackout(next);
    try {
      localStorage.setItem('memories_wall_blackout', String(next));
      const channel = new BroadcastChannel('memories_screens_channel');
      channel.postMessage({ type: 'WALL_COMMAND', command: 'BLACKOUT', blackout: next });
      channel.close();
    } catch {}
    setTvSyncNotice(next ? 'تم تفعيل وضع التعتيم على شاشات الصالة' : 'تم استئناف البث الحي للذكريات');
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
    setTvSyncNotice(`تم ضبط سرعة الانتقال على (${durationMs / 1000} ثوانٍ)`);
    setTimeout(() => setTvSyncNotice(null), 3000);
  };

  const handleForceRefreshTv = () => {
    try {
      const channel = new BroadcastChannel('memories_screens_channel');
      channel.postMessage({ type: 'WALL_COMMAND', command: 'FORCE_REFRESH' });
      channel.close();
    } catch {}
    setTvSyncNotice('تم إرسال أمر التحديث الفوري لكافة شاشات التلفزيون المتصلة');
    setTimeout(() => setTvSyncNotice(null), 3000);
  };

  const handleUnpairScreen = (screenId: string) => {
    setScreens((prev) => prev.filter((s) => s.id !== screenId));
    setTvSyncNotice(`تم فصل الشاشة (${screenId}) بنجاح.`);
    setTimeout(() => setTvSyncNotice(null), 3000);
  };

  const handlePairScreenSubmit = async (cleanCode: string, locationName: string) => {
    if (cleanCode.length !== 6) {
      setPairScreenError('يرجى إدخال الرمز المكون من 6 أرقام الظاهر على شاشة التلفزيون.');
      return;
    }
    setIsPairingScreen(true);
    setPairScreenError(null);
    try {
      const newScreen: ScreenRecord = {
        id: `screen-${cleanCode.slice(-3)}`,
        name: locationName,
        status: 'online',
        orientation: 'landscape',
        lastHeartbeatAt: new Date().toISOString(),
      };
      setScreens((prev) => [newScreen, ...prev.filter((s) => s.id !== newScreen.id)]);
      setPairScreenSuccess(`تم ربط شاشة (${locationName}) بنجاح!`);
      setTimeout(() => setPairScreenSuccess(null), 5000);
    } catch {
      setPairScreenError('تعذر ربط الشاشة.');
    } finally {
      setIsPairingScreen(false);
    }
  };

  // Rewards Save Handler
  const handleSaveRewards = (visits: number, title: string, subtitle: string) => {
    setIsSavingRewards(true);
    const updated: BusinessSettings = {
      ...settings,
      defaultShotCount: visits,
      freeGiftOffer: {
        title,
        subtitle,
        icon: settings.freeGiftOffer?.icon || 'coffee',
      },
    };
    handleSettingsUpdated(updated);
    setIsSavingRewards(false);
    setSaveRewardsSuccess(true);
    setTimeout(() => setSaveRewardsSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-cairo">
      {/* Top Navbar Component */}
      <DashboardNavBar
        settings={settings}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeStaff={activeStaff}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onOpenQuickSetup={() => setIsQuickSetupOpen(true)}
        onOpenBaristaRedeem={() => setIsBaristaRedeemOpen(true)}
        onSignOut={handleSignOut}
        printQueueCount={printQueue.length}
        pendingMemoriesCount={memories.filter((m) => m.status === 'pending').length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'overview' && (
          <DashboardOverviewTab
            settings={settings}
            metrics={metrics}
            isLoadingMetrics={isLoadingMetrics}
            onRefreshMetrics={fetchMetrics}
            customerLiveUrl={customerLiveUrl}
            copiedUrl={copiedUrl}
            onCopyUrl={handleCopyUrl}
            onOpenQuickSetup={() => setIsQuickSetupOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'print' && (
          <PrintStationTab
            queue={printQueue}
            brandName={settings.branding?.name}
          />
        )}

        {activeTab === 'memories' && (
          <DashboardMemoriesTab
            memories={memories}
            isLoadingMemories={isLoadingMemories}
            autoApproveWall={autoApproveWall}
            onToggleAutoApprove={handleToggleAutoApprove}
            onModerateMemory={handleModerateMemory}
            onDeleteMemory={handleDeleteMemory}
            onBatchApprove={handleBatchApprovePending}
            onBatchHideAll={handleBatchHideAll}
            onRefresh={fetchMemories}
            batchActionMsg={batchActionMsg}
          />
        )}

        {activeTab === 'customers' && (
          <DashboardCustomersTab
            customers={customers}
            isLoadingCustomers={isLoadingCustomers}
            onAddDirectStamp={handleAddDirectStamp}
            onExportCsv={handleExportCsv}
            onRefresh={fetchCustomers}
            cafeSlug={settings.cafeSlug}
            requiredVisits={settings.defaultShotCount || 5}
          />
        )}

        {activeTab === 'wall' && (
          <DashboardWallTab
            screens={screens}
            isTvBlackout={isTvBlackout}
            tvSlideDuration={tvSlideDuration}
            onToggleBlackout={handleToggleBlackout}
            onChangeSlideDuration={handleChangeSlideDuration}
            onForceRefresh={handleForceRefreshTv}
            onUnpairScreen={handleUnpairScreen}
            onPairScreenSubmit={handlePairScreenSubmit}
            isPairingScreen={isPairingScreen}
            pairScreenSuccess={pairScreenSuccess}
            pairScreenError={pairScreenError}
            tvSyncNotice={tvSyncNotice}
            cafeSlug={settings.cafeSlug}
          />
        )}

        {activeTab === 'rewards' && (
          <DashboardRewardsTab
            settings={settings}
            onSaveRewards={handleSaveRewards}
            isSavingRewards={isSavingRewards}
            saveRewardsSuccess={saveRewardsSuccess}
          />
        )}

        {activeTab === 'qrcodes' && (
          <DashboardQrTab
            settings={settings}
            customerLiveUrl={customerLiveUrl}
            onOpenQuickSetup={() => setIsQuickSetupOpen(true)}
          />
        )}

        {activeTab === 'frames' && (
          <FrameStudioTab
            settings={settings}
            onSettingsUpdated={handleSettingsUpdated}
          />
        )}

        {activeTab === 'analytics' && (
          <RetentionAnalyticsTab
            cafeSlug={settings.cafeSlug}
            cafeName={settings.branding?.name}
          />
        )}

        {activeTab === 'settings' && (
          <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
            <h3 className="font-black text-base text-stone-900">إعدادات الهوية والعلامة التجارية</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              اضغط على الزر أدناه لفتح لوحة تخصيص الهوية والشعار ونمط التصوير وأبعاد الكروت.
            </p>
            <button
              onClick={() => setIsQuickSetupOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
            >
              فتح لوحة تخصيص الهوية والـ QR
            </button>
          </div>
        )}

        {activeTab === 'billing' && (
          <SubscriptionBillingTab
            cafeSlug={settings.cafeSlug || 'memories'}
          />
        )}
      </main>

      {/* Global Modals */}
      <StaffPinModal
        open={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSuccess={(member) => {
          setActiveStaff(member);
          setIsStaffModalOpen(false);
        }}
      />

      <MerchantQuickSetupModal
        isOpen={isQuickSetupOpen}
        onClose={() => setIsQuickSetupOpen(false)}
        currentSettings={settings}
        onSettingsSaved={handleSettingsUpdated}
      />

      <BaristaRedeemModal
        isOpen={isBaristaRedeemOpen}
        onClose={() => setIsBaristaRedeemOpen(false)}
        settings={settings}
        activeStaff={activeStaff}
      />
    </div>
  );
}
