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
} from 'lucide-react';
import { StaffPinModal } from '@/components/dashboard/StaffPinModal';
import { getActiveStaff } from '@/lib/services/staff-auth.service';
import { type StaffMember } from '@/types/staff';

type DashboardTab =
  | 'overview'
  | 'customers'
  | 'memories'
  | 'wall'
  | 'rewards'
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

  // Live Metrics & Data States
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [screens, setScreens] = useState<ScreenRecord[]>([]);

  // Screen Pairing Code Generation State
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [codeExpiry, setCodeExpiry] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Sync staff auth
  useEffect(() => {
    setActiveStaff(getActiveStaff());
    const handleStaffChange = () => setActiveStaff(getActiveStaff());
    window.addEventListener('memories-active-staff-changed', handleStaffChange);
    return () => window.removeEventListener('memories-active-staff-changed', handleStaffChange);
  }, []);

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

  // Fetch Real Customers from CRM endpoint
  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const res = await fetch('/api/v1/crm/customers?format=json');
      if (res.ok) {
        const data = await res.json();
        if (data.customers) {
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
        }
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
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

  // Generate 6-Digit Screen Pairing Code
  const handleGeneratePairingCode = async () => {
    setIsGeneratingCode(true);
    try {
      const res = await fetch('/api/v1/screens/pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: '00000000-0000-0000-0000-000000000001',
          branchId: '00000000-0000-0000-0000-000000000002',
          screenName: 'شاشة صالة الجلوس',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPairingCode(data.code);
        setCodeExpiry(data.expiresAt);
      }
    } catch (err) {
      console.error('Failed to generate pairing code:', err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-cairo">
      {/* Top Navbar */}
      <header className="bg-white border-b border-stone-200/90 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-stone-950 text-white flex items-center justify-center font-black text-sm shadow-md">
              M
            </div>
            <div>
              <h1 className="font-extrabold text-base text-stone-950 flex items-center gap-2">
                <span>Espresso Lab Roastery</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  فرع التجمع الأول
                </span>
              </h1>
              <p className="text-[11px] text-stone-500 font-medium">
                منظومة الولاء، الذكريات، والشاشات الحية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-stone-100 py-1.5 scrollbar-none">
          {[
            { id: 'overview', label: 'نظرة عامة (Overview)', icon: LayoutDashboard },
            { id: 'memories', label: 'اعتماد الذكريات (Memories)', icon: ImageIcon, badge: metrics?.attentionCenter?.pendingMemories },
            { id: 'customers', label: 'العملاء والولاء (Customers)', icon: Users },
            { id: 'wall', label: 'الشاشات الحية (Live Wall)', icon: Tv },
            { id: 'rewards', label: 'قواعد المكافآت (Rewards)', icon: Gift },
            { id: 'qrcodes', label: 'نقاط الـ QR (QR Codes)', icon: QrCode },
            { id: 'analytics', label: 'تحليلات العودة (Analytics)', icon: BarChart3 },
            { id: 'settings', label: 'الإعدادات والهوية (Settings)', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
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
                    {metrics?.attentionCenter.pendingMemories
                      ? `هناك ${metrics.attentionCenter.pendingMemories} ذكريات جديدة بانتظار اعتماد الباريستا للظهور على شاشة الكافيه`
                      : 'جميع الذكريات معتمدة والشاشات تعمل بصورة طبيعية ومستقرة'}
                  </p>
                </div>
              </div>

              {Boolean(metrics?.attentionCenter.pendingMemories) && (
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
                    {metrics?.today.visits || 0}
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
                    {metrics?.today.returningCustomers || 0}
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
                    {metrics?.today.newMemories || 0}
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
                    {metrics?.today.rewardsRedeemed || 0}
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
                    <span>{metrics?.liveWall.onlineScreens || 1}</span>
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
                  اربط شاشة التلفزيون في كافيهك دون الحاجة لتسجيل الدخول. افتح متصفح الشاشة على{' '}
                  <code className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-mono">
                    /wall/pair
                  </code>{' '}
                  وأدخل الكود المؤقت أدناه.
                </p>

                {pairingCode ? (
                  <div className="p-4 rounded-2xl bg-stone-950 text-white text-center space-y-1">
                    <span className="text-[10px] text-stone-400 font-mono">كود الاقتران السري (صالح 10 دقائق):</span>
                    <div className="text-3xl font-black font-mono tracking-widest text-amber-400">
                      {pairingCode}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGeneratePairingCode}
                    disabled={isGeneratingCode}
                    className="w-full py-3 rounded-2xl bg-stone-950 hover:bg-stone-900 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isGeneratingCode ? 'جاري التوليد...' : 'توليد كود اقتران شاشة ✦'}</span>
                  </button>
                )}
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
                            ? 'معروض على الشاشة ✓'
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
                            {c.totalVisits >= 5 ? 'عميل ذهبي VIP ✦' : 'زائر دائم'}
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
                  مفعلة تلقائياً ✓
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
                    defaultValue="كوب سبيشالتي مجاني من اختيارك ☕"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/70 text-xs text-amber-900 leading-relaxed">
                <strong>حماية الصرف المالي:</strong> يتم التحقق من استحقاق الهدية سيرفر-سايد بناءً على الزيارات المؤكدة فقط، ويتم إبطال الكود تلقائياً بعد الصرف لمنع التكرار.
              </div>
            </div>
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
    </div>
  );
}
