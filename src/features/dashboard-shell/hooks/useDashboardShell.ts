'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StaffMember } from '@/types/staff';
import { BusinessSettings } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { getActiveStaff, clearActiveStaffSession } from '@/lib/services/staff-auth.service';
import { DashboardTab } from '@/components/dashboard/DashboardNavBar';
import { OverviewMetrics } from '@/components/dashboard/DashboardOverviewTab';
import { MemoryItem } from '@/components/dashboard/DashboardMemoriesTab';
import { CustomerRecord } from '@/components/dashboard/DashboardCustomersTab';
import { ScreenRecord } from '@/components/dashboard/DashboardWallTab';
import { reportIgnoredError } from '@/lib/services/diagnostics';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { DashboardShellState } from '../types';

export function useDashboardShell(): DashboardShellState {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState(false);
  const [isBaristaRedeemOpen, setIsBaristaRedeemOpen] = useState(false);

  // Business settings state (dynamic tenant)
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    let merchantSlug = 'stampy';
    let merchantName = '';
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        merchantSlug =
          urlParams.get('cafe') ||
          localStorage.getItem('stampy_active_merchant_slug') ||
          localStorage.getItem('memories_active_merchant_slug') ||
          'stampy';
        merchantName =
          localStorage.getItem('stampy_active_merchant_name') ||
          localStorage.getItem('memories_active_merchant_name') ||
          '';
      } catch (e) {
        reportIgnoredError('dashboard-shell/useDashboardShell#1', e);
      }
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
      return (
        localStorage.getItem(`memories_auto_approve_${settings.cafeSlug || 'memories'}`) === 'true'
      );
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
      } catch (e) {
        reportIgnoredError('dashboard-shell/useDashboardShell#2', e);
      }
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
    } catch (e) {
      reportIgnoredError('dashboard-shell/useDashboardShell#3', e);
    }
    clearActiveStaffSession();
    // Revoke the signed staff cookie server-side (httpOnly).
    try {
      await fetch('/api/v1/staff-session', { method: 'DELETE' });
    } catch (e) {
      reportIgnoredError('dashboard-shell/useDashboardShell#4', e);
    }
    window.location.href = '/login';
  };

  // Fetch Live Overview Metrics
  const fetchMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const slug = settings.cafeSlug || 'memories';
      // 1. Try server API
      try {
        const res = await fetch(`/api/v1/analytics/overview?cafeSlug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.metrics) {
            setMetrics(data.metrics);
            setIsLoadingMetrics(false);
            return;
          }
        }
      } catch (err) {
        reportIgnoredError('dashboard-shell/fetchMetricsApi', err);
      }

      // 2. Fallback to local calculation
      const localCustomers = CustomerRegistryService.getRegisteredCustomers(slug);
      const totalVisits = localCustomers.reduce((acc, c) => acc + (c.totalVisits || 1), 0);
      const returning = localCustomers.filter((c) => (c.totalVisits || 1) > 1).length;
      let localPhotosCount = 0;
      try {
        const photosRaw = localStorage.getItem(`memories_wall_photos_${slug}`);
        if (photosRaw) localPhotosCount = JSON.parse(photosRaw).length;
      } catch (e) {
        reportIgnoredError('dashboard-shell/useDashboardShell#5', e);
      }

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
      // 1. Try server API for all memories
      try {
        const res = await fetch(`/api/v1/memories?status=all&limit=50`);
        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.memories) && data.memories.length > 0) {
            setMemories(
              data.memories.map((m: any) => ({
                id: m.id,
                customerName: m.customers?.display_name || 'ضيف مميز',
                originalUrl: m.original_url || m.optimized_url || '',
                status: m.status || 'approved',
                visibility: m.visibility || 'public',
                caption: m.caption || '',
                createdAt: m.created_at || new Date().toISOString(),
              }))
            );
            setIsLoadingMemories(false);
            return;
          }
        }
      } catch (err) {
        reportIgnoredError('dashboard-shell/fetchMemoriesApi', err);
      }

      // 2. Fallback to local storage
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
    } catch (e) {
      reportIgnoredError('dashboard-shell/useDashboardShell#6', e);
    } finally {
      setIsLoadingMemories(false);
    }
  };

  // Fetch Customers CRM from Supabase Cloud
  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      // 1. Try server API
      try {
        const res = await fetch('/api/v1/crm/customers');
        if (res.ok) {
          const cloudCusts = await res.json();
          if (Array.isArray(cloudCusts) && cloudCusts.length > 0) {
            setCustomers(
              cloudCusts.map((c: any) => ({
                id: `c_${c.phone || c.id}`,
                displayName: c.name || 'عميل مميز',
                phone: c.phone || '',
                role: c.role || 'coffee_lover',
                registeredAt: c.firstSeenAt || new Date().toISOString(),
                totalVisits: c.visitCount || 1,
                lastSeenAt: c.lastSeenAt || new Date().toISOString(),
                memoriesCount: c.memoryCount || 0,
                rewardsCount: Math.floor((c.visitCount || 1) / (settings.defaultShotCount || 5)),
              }))
            );
            setIsLoadingCustomers(false);
            return;
          }
        }
      } catch (err) {
        reportIgnoredError('dashboard-shell/fetchCustomersApi', err);
      }

      // 2. Fallback to CustomerRegistryService
      const cloudCustomers = await CustomerRegistryService.syncAllRegisteredCustomersFromCloud(
        settings.cafeSlug || 'memories'
      );
      setCustomers(
        cloudCustomers.map((c) => ({
          id: `c_${c.phone}`,
          displayName: c.name,
          phone: c.phone,
          role: c.role || 'coffee_lover',
          registeredAt: c.registeredAt,
          totalVisits: c.totalVisits || 1,
          lastSeenAt: c.lastVisit || c.registeredAt || new Date().toISOString(),
          memoriesCount: 1,
          rewardsCount: Math.floor((c.totalVisits || 1) / (settings.defaultShotCount || 5)),
        }))
      );
    } catch (e) {
      reportIgnoredError('dashboard-shell/useDashboardShell#7', e);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchMemories();
    fetchCustomers();

    const handleB2bActivity = (event: any) => {
      const data = event?.detail || event;
      if (!data) return;
      // Refresh live overview metrics, memories, and customers
      fetchMetrics();
      fetchCustomers();
      fetchMemories();
      try {
        SoundEffectsService.playStampChime();
      } catch (e) {
        reportIgnoredError('dashboard-shell/b2b_sound', e);
      }
      const custName = data.customerName || 'عميل جديد';
      const stamps = data.stampedCount || 1;
      const max = data.maxSlots || 5;
      setBatchActionMsg(`🔔 نشاط لحظي من الفوتوبوث: ${custName} وثق لقطة وحصل على ختم (${stamps}/${max})`);
      setTimeout(() => setBatchActionMsg(null), 5000);
    };

    window.addEventListener('stampy-b2b-activity', handleB2bActivity);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('stampy_b2b_channel');
      bc.onmessage = (msgEvent) => {
        handleB2bActivity(msgEvent.data);
      };
    } catch (e) {
      reportIgnoredError('dashboard-shell/b2b_bc_init', e);
    }

    return () => {
      window.removeEventListener('stampy-b2b-activity', handleB2bActivity);
      if (bc) {
        bc.close();
      }
    };
  }, [settings.cafeSlug]);

  const persistMemories = (updated: MemoryItem[]) => {
    setMemories(updated);
    if (typeof window !== 'undefined') {
      const slug = settings.cafeSlug || 'memories';
      try {
        localStorage.setItem(`memories_wall_photos_${slug}`, JSON.stringify(updated));
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

        const channel = new BroadcastChannel('memories_screens_channel');
        channel.postMessage({ type: 'WALL_COMMAND', command: 'FORCE_REFRESH' });
        channel.close();
      } catch (e) {
        reportIgnoredError('dashboard-shell/useDashboardShell#8', e);
      }
    }
  };

  const handleModerateMemory = async (
    memoryId: string,
    newStatus: 'approved' | 'rejected' | 'hidden'
  ) => {
    const updated = memories.map((m) => (m.id === memoryId ? { ...m, status: newStatus } : m));
    persistMemories(updated);

    // Also persist status change to Supabase Cloud
    try {
      await fetch('/api/v1/memories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, status: newStatus }),
      });
    } catch (e) {
      reportIgnoredError('dashboard-shell/handleModerateMemoryApi', e);
    }
  };

  const handleToggleAutoApprove = (val: boolean) => {
    setAutoApproveWall(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`memories_auto_approve_${settings.cafeSlug || 'memories'}`, String(val));
    }
    setBatchActionMsg(
      val
        ? 'تم تفعيل البث التلقائي للشاشات فور التقاط الصور.'
        : 'تم تفعيل نظام المراجعة والاعتماد اليدوي.'
    );
    setTimeout(() => setBatchActionMsg(null), 3500);
  };

  const handleBatchApprovePending = async () => {
    const pendingIds = memories.filter((m) => m.status === 'pending').map((m) => m.id);
    const updated = memories.map((m) => (m.status === 'pending' ? { ...m, status: 'approved' as const } : m));
    persistMemories(updated);
    setBatchActionMsg('تم اعتماد كافة الصور المعلقة للبث على الشاشات بنجاح!');
    setTimeout(() => setBatchActionMsg(null), 3500);

    try {
      await Promise.allSettled(
        pendingIds.map((id) =>
          fetch('/api/v1/memories', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memoryId: id, status: 'approved' }),
          })
        )
      );
    } catch (e) {
      reportIgnoredError('dashboard-shell/handleBatchApprovePendingApi', e);
    }
  };

  const handleBatchHideAll = async () => {
    const approvedIds = memories.filter((m) => m.status === 'approved').map((m) => m.id);
    const updated = memories.map((m) => (m.status === 'approved' ? { ...m, status: 'hidden' as const } : m));
    persistMemories(updated);
    setBatchActionMsg('تم إخفاء جميع الصور المعروضة من شاشات الصالة فوراً.');
    setTimeout(() => setBatchActionMsg(null), 3500);

    try {
      await Promise.allSettled(
        approvedIds.map((id) =>
          fetch('/api/v1/memories', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memoryId: id, status: 'hidden' }),
          })
        )
      );
    } catch (e) {
      reportIgnoredError('dashboard-shell/handleBatchHideAllApi', e);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    const updated = memories.filter((m) => m.id !== memoryId);
    persistMemories(updated);
    setBatchActionMsg('تم حذف الصورة وسجلها نهائياً.');
    setTimeout(() => setBatchActionMsg(null), 2500);

    try {
      await fetch(`/api/v1/memories?memoryId=${encodeURIComponent(memoryId)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      reportIgnoredError('dashboard-shell/handleDeleteMemoryApi', e);
    }
  };

  const handleAddDirectStamp = async (c: CustomerRecord) => {
    const rawPhone = c.phone || c.id.replace('c_', '');
    const updated = CustomerRegistryService.addDirectStamp(
      rawPhone,
      settings.cafeSlug || 'memories'
    );
    fetchCustomers();
    fetchMetrics();

    // Persist stamp to Supabase PostgreSQL cloud
    try {
      await fetch('/api/v1/loyalty/stamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: rawPhone,
          cafeSlug: settings.cafeSlug || 'memories',
          count: 1,
          customerName: c.displayName,
        }),
      });
    } catch (e) {
      reportIgnoredError('dashboard-shell/handleAddDirectStampApi', e);
    }

    try {
      const nextVisits = updated ? updated.totalVisits : c.totalVisits + 1;
      const reqVisits = settings.defaultShotCount || 5;
      const giftTitle = settings.freeGiftOffer?.title || 'مكافأة خاصة';
      DigitalWalletService.updateCustomerCardComprehensive({
        cafeSlug: settings.cafeSlug || 'memories',
        customerPhone: rawPhone,
        customerName: c.displayName,
        stampedCount: nextVisits,
        maxSlots: reqVisits,
        giftTitle,
        logoUrl: settings.branding?.logoUrl,
        cafeName: settings.branding?.name || 'متجر الولاء',
        cardBackgroundUrl: settings.walletPassConfig?.cardBackgroundUrl,
        stampIcon: settings.stampConfig?.customEmoji || '☕',
        colorHex: settings.walletPassConfig?.colorHex || '#1C1C1E',
        pushMessage:
          nextVisits >= reqVisits
            ? `🎉 مبروك يا ${c.displayName}! اكتمل كارت الولاء الخاص بك واستحققت: ${giftTitle}! 🎁`
            : `☕ تمت إضافة ختم زيارة جديدة لكارت الولاء الخاص بك في ${settings.branding?.name || 'المتجر'}! رصيدك الآن: ${nextVisits}/${reqVisits}`,
      }).catch((e) => console.warn('Dashboard quick stamp pass push error:', e));
    } catch (e) {
      reportIgnoredError('dashboard/quick_stamp_wallet_push', e);
    }
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

  const handleToggleBlackout = () => {
    const next = !isTvBlackout;
    setIsTvBlackout(next);
    try {
      localStorage.setItem('memories_wall_blackout', String(next));
      const channel = new BroadcastChannel('memories_screens_channel');
      channel.postMessage({ type: 'WALL_COMMAND', command: 'BLACKOUT', blackout: next });
      channel.close();
    } catch (e) {
      reportIgnoredError('dashboard-shell/useDashboardShell#9', e);
    }
    setTvSyncNotice(
      next ? 'تم تفعيل وضع التعتيم على شاشات الصالة' : 'تم استئناف البث الحي للذكريات'
    );
    setTimeout(() => setTvSyncNotice(null), 3000);
  };

  const handleChangeSlideDuration = (durationMs: number) => {
    setTvSlideDuration(durationMs);
    try {
      localStorage.setItem('memories_wall_duration', String(durationMs));
      const channel = new BroadcastChannel('memories_screens_channel');
      channel.postMessage({ type: 'WALL_COMMAND', command: 'SET_SPEED', durationMs });
      channel.close();
    } catch (e) {
      reportIgnoredError('dashboard-shell/useDashboardShell#10', e);
    }
    setTvSyncNotice(`تم ضبط سرعة الانتقال على (${durationMs / 1000} ثوانٍ)`);
    setTimeout(() => setTvSyncNotice(null), 3000);
  };

  const handleForceRefreshTv = () => {
    try {
      const channel = new BroadcastChannel('memories_screens_channel');
      channel.postMessage({ type: 'WALL_COMMAND', command: 'FORCE_REFRESH' });
      channel.close();
    } catch (e) {
      reportIgnoredError('dashboard-shell/useDashboardShell#11', e);
    }
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

  return {
    activeTab,
    setActiveTab,
    activeStaff,
    setActiveStaff,
    isStaffModalOpen,
    setIsStaffModalOpen,
    isQuickSetupOpen,
    setIsQuickSetupOpen,
    isBaristaRedeemOpen,
    setIsBaristaRedeemOpen,
    settings,
    handleSettingsUpdated,
    metrics,
    isLoadingMetrics,
    fetchMetrics,
    memories,
    isLoadingMemories,
    fetchMemories,
    customers,
    isLoadingCustomers,
    fetchCustomers,
    screens,
    printQueue,
    batchActionMsg,
    copiedUrl,
    handleCopyUrl,
    isTvBlackout,
    tvSlideDuration,
    tvSyncNotice,
    isPairingScreen,
    pairScreenSuccess,
    pairScreenError,
    isSavingRewards,
    saveRewardsSuccess,
    autoApproveWall,
    customerLiveUrl,
    handleSignOut,
    handleModerateMemory,
    handleToggleAutoApprove,
    handleBatchApprovePending,
    handleBatchHideAll,
    handleDeleteMemory,
    handleAddDirectStamp,
    handleExportCsv,
    handleToggleBlackout,
    handleChangeSlideDuration,
    handleForceRefreshTv,
    handleUnpairScreen,
    handlePairScreenSubmit,
    handleSaveRewards,
  };
}
