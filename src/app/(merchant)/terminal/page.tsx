'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  CheckCircle,
  Gift,
  Search,
  Unlock,
  ShieldCheck,
  RefreshCw,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Clock,
  LayoutDashboard,
  Check,
  X,
  Phone,
  Printer,
  Bell,
  BellOff,
  Scissors,
} from 'lucide-react';
import { CustomerRegistryService, RegisteredCustomer } from '@/lib/services/customer-registry.service';
import { LoyaltyPurseService, CustomerLoyaltyData } from '@/features/loyalty/loyalty-purse.service';
import { VoucherService, IssuedVoucher } from '@/lib/services/voucher.service';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { getIndustryProfile } from '@/lib/constants/photobooth-presets';
import { CooldownService } from '@/lib/services/cooldown.service';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { StaffPinModal } from '@/components/dashboard/StaffPinModal';
import { getActiveStaff, clearActiveStaffSession } from '@/lib/services/staff-auth.service';
import { PrintService } from '@/lib/services/print.service';

export default function StaffTerminalPage() {
  const [cafeSlug, setCafeSlug] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlCafe = urlParams.get('cafe');
        if (urlCafe) return urlCafe;
        const stored = localStorage.getItem('memories_active_merchant_slug');
        if (stored) return stored;
      } catch {}
    }
    return 'memories';
  });

  const [settings, setSettings] = useState(() => {
    let slug = 'memories';
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        slug = urlParams.get('cafe') || localStorage.getItem('memories_active_merchant_slug') || 'memories';
      } catch {}
    }
    return BusinessSettingsService.getSettings(slug);
  });

  const industry = getIndustryProfile(settings.businessType);

  const [terminalTab, setTerminalTab] = useState<'queue' | 'stamps'>('queue');
  const [printQueue, setPrintQueue] = useState<any[]>([]);
  const [soundAlertEnabled, setSoundAlertEnabled] = useState(true);
  const prevQueueLengthRef = useRef(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<RegisteredCustomer | null>(null);
  const [loyaltyData, setLoyaltyData] = useState<CustomerLoyaltyData | null>(null);
  const [activeVoucher, setActiveVoucher] = useState<IssuedVoucher | null>(null);
  const [customerVouchers, setCustomerVouchers] = useState<IssuedVoucher[]>([]);
  const [redeemedCount, setRedeemedCount] = useState(0);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Shift telemetry state
  const [shiftStampsCount, setShiftStampsCount] = useState(0);
  const [shiftRedeemedCount, setShiftRedeemedCount] = useState(0);

  // Staff authentication state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [staffMember, setStaffMember] = useState<{ id: string; name: string } | null>(null);

  const requiredVisits = settings.loyaltyMaxVisits || 5;
  const giftTitle = settings.freeGiftOffer?.title || industry.defaultGiftTitle;

  // Load Print Queue & Listen for new prints
  useEffect(() => {
    const loadQueue = () => {
      try {
        const queueKey = `memories_print_queue_${cafeSlug}`;
        const stored = localStorage.getItem(queueKey);
        if (stored) {
          const list = JSON.parse(stored);
          setPrintQueue(list);
          if (soundAlertEnabled && list.length > prevQueueLengthRef.current) {
            SoundEffectsService.playTerminalDing();
          }
          prevQueueLengthRef.current = list.length;
        } else {
          setPrintQueue([]);
          prevQueueLengthRef.current = 0;
        }
      } catch {}
    };

    loadQueue();
    window.addEventListener('memories-print-queue-updated', loadQueue);
    window.addEventListener('storage', loadQueue);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('memories_print_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_PRINT_JOB') {
          loadQueue();
          if (soundAlertEnabled) {
            SoundEffectsService.playTerminalDing();
          }
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('memories-print-queue-updated', loadQueue);
      window.removeEventListener('storage', loadQueue);
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
    };
  }, [cafeSlug, soundAlertEnabled]);

  useEffect(() => {
    const s = BusinessSettingsService.getSettings(cafeSlug);
    setSettings(s);

    const active = getActiveStaff();
    if (active) {
      setStaffMember(active);
    }

    // Load shift stats
    try {
      const today = new Date().toISOString().split('T')[0];
      const shiftStamps = localStorage.getItem(`memories_shift_stamps_${cafeSlug}_${today}`);
      const shiftRedeemed = localStorage.getItem(`memories_shift_redeemed_${cafeSlug}_${today}`);
      if (shiftStamps) setShiftStampsCount(Number(shiftStamps));
      if (shiftRedeemed) setShiftRedeemedCount(Number(shiftRedeemed));
    } catch {}
  }, [cafeSlug]);

  const recordShiftStamp = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const next = shiftStampsCount + 1;
      setShiftStampsCount(next);
      localStorage.setItem(`memories_shift_stamps_${cafeSlug}_${today}`, String(next));
    } catch {}
  };

  const recordShiftRedemption = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const next = shiftRedeemedCount + 1;
      setShiftRedeemedCount(next);
      localStorage.setItem(`memories_shift_redeemed_${cafeSlug}_${today}`, String(next));
    } catch {}
  };

  // Instant Print Action
  const handlePrintItem = (item: any, format: 'standard-2x6' | 'dual-4x6' | 'thermal-80mm' = 'standard-2x6') => {
    if (item.photoStripUrl) {
      PrintService.printStripImage(item.photoStripUrl, {
        format,
        highContrast: format.startsWith('thermal'),
        showCutLine: true,
      });
      setSuccessNotice(`تم إرسال شريط (${item.name}) إلى الطابعة بنجاح!`);
      setTimeout(() => setSuccessNotice(null), 3000);
    }
  };

  const handleDismissPrint = (id: string) => {
    const updated = printQueue.filter((p) => p.id !== id);
    setPrintQueue(updated);
    try {
      localStorage.setItem(`memories_print_queue_${cafeSlug}`, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('memories-print-queue-updated'));
    } catch {}
    setSuccessNotice('تم تأكيد تسليم الشريط للعميل.');
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleLookup = (query: string) => {
    setErrorNotice(null);
    setSuccessNotice(null);
    setActiveVoucher(null);
    setCustomerVouchers([]);

    const trimmed = query.trim();
    if (!trimmed) {
      setSelectedCustomer(null);
      setLoyaltyData(null);
      return;
    }

    // 1. Check if user typed or scanned a Voucher Code (e.g. GIFT-1234 or 4 digits)
    const voucherLookup = VoucherService.lookupVoucher(trimmed, cafeSlug);
    if (voucherLookup.found && voucherLookup.voucher) {
      const v = voucherLookup.voucher;
      setActiveVoucher(v);
      const cust: RegisteredCustomer = {
        phone: v.customerPhone,
        name: v.customerName,
        role: 'vip_guest',
        registeredAt: v.issuedAt,
        lastVisit: v.issuedAt,
        totalVisits: requiredVisits,
      };
      setSelectedCustomer(cust);
      const lData = LoyaltyPurseService.getData(v.customerPhone, cafeSlug, requiredVisits);
      setLoyaltyData(lData);
      setCustomerVouchers(VoucherService.getCustomerVouchers(v.customerPhone, cafeSlug));
      return;
    }

    // 2. Lookup by phone number
    const clean = trimmed.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 6) {
      setSelectedCustomer(null);
      setLoyaltyData(null);
      return;
    }

    const customers = CustomerRegistryService.getRegisteredCustomers(cafeSlug);
    const found = customers.find((c) => c.phone.includes(clean) || clean.includes(c.phone));

    if (found) {
      setSelectedCustomer(found);
      const lData = LoyaltyPurseService.getData(found.phone, cafeSlug, requiredVisits);
      setLoyaltyData(lData);
      const vList = VoucherService.getCustomerVouchers(found.phone, cafeSlug);
      setCustomerVouchers(vList);
      const activeOne = vList.find((v) => v.status === 'ACTIVE');
      if (activeOne) setActiveVoucher(activeOne);
      try {
        const stored = localStorage.getItem(`memories_redemptions_${cafeSlug}_${found.phone}`);
        setRedeemedCount(stored ? Number(stored) : 0);
      } catch {
        setRedeemedCount(0);
      }
    } else {
      const direct = CustomerRegistryService.lookupCustomer(clean, cafeSlug);
      if (direct.exists && direct.name) {
        const cust: RegisteredCustomer = {
          phone: clean,
          name: direct.name,
          role: direct.role || 'vip_guest',
          registeredAt: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          totalVisits: direct.totalVisits || 1,
        };
        setSelectedCustomer(cust);
        const lData = LoyaltyPurseService.getData(clean, cafeSlug, requiredVisits);
        setLoyaltyData(lData);
        const vList = VoucherService.getCustomerVouchers(clean, cafeSlug);
        setCustomerVouchers(vList);
        const activeOne = vList.find((v) => v.status === 'ACTIVE');
        if (activeOne) setActiveVoucher(activeOne);
        try {
          const stored = localStorage.getItem(`memories_redemptions_${cafeSlug}_${clean}`);
          setRedeemedCount(stored ? Number(stored) : 0);
        } catch {
          setRedeemedCount(0);
        }
      } else {
        setSelectedCustomer(null);
        setLoyaltyData(null);
        setErrorNotice('لم يتم العثور على عميل أو رمز هدية مطابق. تأكد من الرقم أو كود الهدية.');
      }
    }
  };

  const handleKeyPress = (num: string) => {
    const updated = searchQuery + num;
    setSearchQuery(updated);
    if (updated.length >= 8) {
      handleLookup(updated);
    }
  };

  const handleClearKeypad = () => {
    setSearchQuery('');
    setSelectedCustomer(null);
    setLoyaltyData(null);
    setErrorNotice(null);
    setSuccessNotice(null);
  };

  // Stamp Action (+1 Stamp)
  const handleAddStamp = () => {
    if (!selectedCustomer) return;
    LoyaltyPurseService.addDirectStamp(selectedCustomer.phone, cafeSlug, requiredVisits);
    const updatedLoyalty = LoyaltyPurseService.getData(selectedCustomer.phone, cafeSlug, requiredVisits);
    setLoyaltyData(updatedLoyalty);
    setSelectedCustomer((prev) => (prev ? { ...prev, totalVisits: (prev.totalVisits || 0) + 1 } : null));

    recordShiftStamp();
    SoundEffectsService.playStampChime();
    setSuccessNotice(`تم ختم زيارة جديدة بنجاح للعميل (${selectedCustomer.name})! الرصيد الحالي: ${updatedLoyalty.stampedCount}/${requiredVisits}`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Instant Voucher Redemption
  const handleRedeemVoucherDirect = (voucherCode: string) => {
    const res = VoucherService.redeemVoucher(voucherCode, cafeSlug, staffMember?.name || `${industry.staffLabel} المناوب`);
    if (res.success && res.voucher) {
      setActiveVoucher(res.voucher);
      if (selectedCustomer) {
        setCustomerVouchers(VoucherService.getCustomerVouchers(selectedCustomer.phone, cafeSlug));
      }
      recordShiftRedemption();
      SoundEffectsService.playRewardCelebration();
      setSuccessNotice(`تم استبدال الهدية بنجاح! تم اعتماد الكود (${res.voucher.code}) وتسليم "${res.voucher.giftTitle}" للعميل (${res.voucher.customerName}).`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } else {
      setErrorNotice(res.error || 'فشل استبدال الهدية.');
    }
  };

  // Redeem Action (Claim Free Gift)
  const handleRedeemGift = () => {
    if (activeVoucher && activeVoucher.status === 'ACTIVE') {
      handleRedeemVoucherDirect(activeVoucher.code);
      return;
    }
    if (!selectedCustomer || !loyaltyData) return;
    try {
      const nextRedeemed = redeemedCount + 1;
      setRedeemedCount(nextRedeemed);
      localStorage.setItem(`memories_redemptions_${cafeSlug}_${selectedCustomer.phone}`, String(nextRedeemed));

      const logKey = `memories_redemption_audit_${cafeSlug}`;
      const existing = JSON.parse(localStorage.getItem(logKey) || '[]');
      const newAudit = {
        id: `red_${Date.now()}`,
        phone: selectedCustomer.phone,
        customerName: selectedCustomer.name,
        rewardTitle: giftTitle,
        redeemedAt: new Date().toISOString(),
        baristaName: staffMember?.name || `${industry.staffLabel} المعتمد`,
      };
      localStorage.setItem(logKey, JSON.stringify([newAudit, ...existing].slice(0, 50)));

      recordShiftRedemption();
      SoundEffectsService.playRewardCelebration();
      setSuccessNotice(`تم استبدال الهدية بنجاح! تم تسليم "${giftTitle}" للعميل (${selectedCustomer.name}).`);
      setTimeout(() => setSuccessNotice(null), 4500);
    } catch {
      setErrorNotice('حدث خطأ أثناء تسجيل الاستبدال.');
    }
  };

  // Unlock Cooldown
  const handleUnlockCooldown = () => {
    if (!selectedCustomer) return;
    CooldownService.unlockForCustomer(selectedCustomer.phone, cafeSlug);
    setSuccessNotice(`تم فك قفل الـ 24 ساعة للعميل (${selectedCustomer.name}) بنجاح! يمكنه التقاط الصور فوراً.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const totalVisits = selectedCustomer?.totalVisits || loyaltyData?.stampedCount || 0;
  const totalEligible = Math.floor(totalVisits / requiredVisits);
  const availableToClaim = Math.max(0, totalEligible - redeemedCount);
  const isEligibleForGift = availableToClaim > 0;

  return (
    <div className="min-h-screen bg-[#141313] text-[#e6e1e1] flex flex-col font-sans selection:bg-[#DD0200] selection:text-white relative overflow-hidden">
      {/* Ambient Archival Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#55100D]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#DD0200]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="bg-[#141212]/95 backdrop-blur-md text-white border-b border-white/10 px-4 sm:px-6 py-3.5 sticky top-0 z-40 shadow-xl relative z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center font-black shadow-lg shadow-red-950/40 border border-white/10">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-[#FBF9F5]">
                  محطة الخدمة السريعة • {industry.staffLabel}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-[#55100D]/60 text-[#FBF9F5] text-[10px] font-mono font-bold border border-[#DD0200]/40 tracking-wider">
                  STAFF POS TERMINAL
                </span>
              </div>
              <p className="text-[11px] text-[#A19E9B]">
                {settings.branding.name} • طباعة الصور الفورية وختم زيارات الولاء للعملاء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/dashboard?cafe=${cafeSlug}`}
              className="px-3.5 py-1.5 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] border border-white/10 text-[#FBF9F5] font-bold text-xs transition flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#DD0200]" />
              <span className="hidden sm:inline">لوحة الإدارة</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-5 relative z-10">
        {/* Primary Segmented Tabs: Print Queue vs Loyalty Stamps */}
        <div className="grid grid-cols-2 p-1 bg-[#1C1B1B] rounded-xl border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => setTerminalTab('queue')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              terminalTab === 'queue'
                ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] font-bold'
                : 'text-[#A19E9B] hover:text-[#FBF9F5]'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>طابور طباعة الأشرطة</span>
            {printQueue.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#55100D] border border-[#DD0200]/40 text-[#FBF9F5] text-[10px] font-mono font-black animate-pulse">
                {printQueue.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTerminalTab('stamps')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              terminalTab === 'stamps'
                ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] font-bold'
                : 'text-[#A19E9B] hover:text-[#FBF9F5]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>كاونتر الأختام والمكافآت</span>
          </button>
        </div>

        {/* Shift Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#141212] border border-white/10 shadow-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1C1B1B] text-[#DD0200] border border-white/10 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#A19E9B] font-bold block uppercase tracking-wider">أشرطة بانتظار الطباعة</span>
              <span className="text-xl font-bold font-mono text-[#FBF9F5]">{printQueue.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#141212] border border-white/10 shadow-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#A19E9B] font-bold block uppercase tracking-wider">هدايا مستبدلة اليوم</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{shiftRedeemedCount}</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-[#141212] border border-white/10 shadow-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#55100D]/50 text-[#FBF9F5] border border-[#DD0200]/40 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#A19E9B] font-bold block uppercase tracking-wider">أختام الشفت الحالية</span>
              <span className="text-xl font-bold font-mono text-[#FBF9F5]">+{shiftStampsCount}</span>
            </div>
          </div>
        </div>

        {/* Success or Error Notice */}
        {successNotice && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
        {errorNotice && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 font-bold text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <X className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* TAB 1: REAL-TIME PRINT QUEUE */}
        {terminalTab === 'queue' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#FBF9F5] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#DD0200]" />
                <span>طابور الأشرطة الجاهزة للطباعة من الزوار</span>
              </h3>

              <button
                type="button"
                onClick={() => setSoundAlertEnabled(!soundAlertEnabled)}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#1C1B1B] hover:bg-[#211F1F] text-xs font-bold text-[#FBF9F5] flex items-center gap-1.5 transition cursor-pointer"
              >
                {soundAlertEnabled ? <Bell className="w-3.5 h-3.5 text-[#DD0200]" /> : <BellOff className="w-3.5 h-3.5 text-[#A19E9B]" />}
                <span>{soundAlertEnabled ? 'جرس التنبيه مفعل' : 'جرس التنبيه مكتوم'}</span>
              </button>
            </div>

            {printQueue.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#141212] border border-white/10 text-center shadow-lg space-y-2">
                <Printer className="w-10 h-10 text-[#A19E9B]/40 mx-auto" />
                <h4 className="font-bold text-sm text-[#FBF9F5]">لا توجد طلبات طباعة معلقة حالياً</h4>
                <p className="text-xs text-[#A19E9B] max-w-md mx-auto leading-relaxed">
                  عندما يكمل الزوار التقاط شريط الصور ويطلبون طباعته من هواتفهم، سيظهر هنا فوراً مع صوت تنبيه لطاقم العمل.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {printQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-[#141212] border border-white/10 hover:border-[#DD0200]/30 shadow-lg flex items-center justify-between gap-4 transition"
                  >
                    <div className="w-16 h-24 rounded-lg overflow-hidden border border-white/10 bg-[#0B0A0A] shrink-0 shadow-inner">
                      {item.photoStripUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.photoStripUrl}
                          alt="Strip"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#A19E9B] text-[10px]">
                          2x6
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#FBF9F5] text-sm truncate">
                        {item.name || 'عميل مميز'}
                      </h4>
                      <p className="text-[11px] text-[#A19E9B] font-mono mt-0.5">
                        {item.phone || 'طلب فوري'}
                      </p>
                      <span className="text-[10px] text-[#FBF9F5] font-bold bg-[#55100D]/50 px-2 py-0.5 rounded-md border border-[#DD0200]/40 inline-block mt-2 font-mono uppercase tracking-wider">
                        {item.format || 'standard-2x6'}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePrintItem(item, 'standard-2x6')}
                        className="px-3.5 py-2 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold flex items-center gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة 2×6</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDismissPrint(item.id)}
                        className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-emerald-950/40 hover:border-emerald-500/40 text-[#A19E9B] hover:text-emerald-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تم التسليم</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LOYALTY STAMPS & REWARDS KEYPAD */}
        {terminalTab === 'stamps' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* LEFT/MAIN: Customer Lookup & Action Center */}
            <div className="lg:col-span-7 space-y-4">
              {/* Input Form */}
              <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FBF9F5] flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-[#DD0200]" />
                    <span>بحث برقم الجوال أو رمز الهدية (GIFT-XXXX):</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A19E9B]">PHONE SEARCH</span>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder="رقم الهاتف أو كود الهدية GIFT-XXXX"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length >= 8) {
                        handleLookup(e.target.value);
                      }
                    }}
                    className="w-full text-center text-xl sm:text-2xl font-mono font-bold py-3.5 px-4 rounded-xl bg-[#0B0A0A] border border-white/10 focus:bg-[#0E0D0D] focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30 focus:outline-none tracking-widest text-[#FBF9F5] placeholder:text-[#A19E9B]/40"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearKeypad}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1C1B1B] hover:bg-[#211F1F] text-[#A19E9B] hover:text-[#FBF9F5] flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick On-Screen Number Keypad for Tablets/Phones */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '010', '0', '011'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleKeyPress(val)}
                      className="py-3 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] active:scale-95 text-[#FBF9F5] font-mono font-bold text-base border border-white/10 transition cursor-pointer"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Details & Actions */}
              {selectedCustomer && loyaltyData && (
                <div className="p-6 rounded-2xl bg-[#141212] border border-[#DD0200]/30 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#DD0200] to-[#55100D] text-white flex items-center justify-center font-bold text-xl shadow-lg border border-white/10">
                        {selectedCustomer.name.charAt(0) || 'ع'}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#FBF9F5]">{selectedCustomer.name}</h3>
                        <p className="text-xs text-[#A19E9B] font-mono" dir="ltr">{selectedCustomer.phone}</p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-[#55100D]/50 text-[#FBF9F5] border border-[#DD0200]/40">
                      {loyaltyData.stampedCount} من {requiredVisits} أختام
                    </span>
                  </div>

                  {/* Active Voucher Banner (If customer has an issued voucher or looked up by code) */}
                  {activeVoucher && (
                    <div className={`p-4 rounded-xl border transition-all ${
                      activeVoucher.status === 'ACTIVE'
                        ? 'bg-gradient-to-r from-emerald-950/40 to-[#141212] border-emerald-500/40 shadow-sm'
                        : 'bg-[#1C1B1B] border-white/10'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            activeVoucher.status === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-[#211F1F] text-[#A19E9B]'
                          }`}>
                            <Gift className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-[#FBF9F5] tracking-wider">
                                {activeVoucher.code}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                activeVoucher.status === 'ACTIVE'
                                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-[#211F1F] text-[#A19E9B]'
                              }`}>
                                {activeVoucher.status === 'ACTIVE' ? 'جاهز للاستبدال 🎁' : 'تم استبداله مسبقاً'}
                              </span>
                            </div>
                            <p className="text-xs text-[#D9D9D9] font-bold mt-0.5">{activeVoucher.giftTitle}</p>
                          </div>
                        </div>

                        {activeVoucher.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleRedeemVoucherDirect(activeVoucher.code)}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                          >
                            صرف الهدية بالكود
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Visual */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#A19E9B]">
                      <span>تقدم بطاقة الولاء الحالية</span>
                      <span className="font-mono text-[#FBF9F5]">{loyaltyData.stampedCount} / {requiredVisits} زيارات</span>
                    </div>
                    <div className="w-full bg-[#0B0A0A] h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div
                        className="bg-gradient-to-r from-[#55100D] to-[#DD0200] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (loyaltyData.stampedCount / requiredVisits) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 Core Instant Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleAddStamp}
                      className="py-3.5 px-4 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Award className="w-5 h-5" />
                      <span>ختم زيارة جديدة (+1)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRedeemGift}
                      disabled={!isEligibleForGift}
                      className={`py-3.5 px-4 rounded-lg font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                        isEligibleForGift
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                          : 'bg-[#1C1B1B] text-[#A19E9B]/40 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      <Gift className="w-5 h-5" />
                      <span>تسليم الهدية ({giftTitle})</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={handleUnlockCooldown}
                      className="text-[#A19E9B] hover:text-[#FBF9F5] font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5 text-[#DD0200]" />
                      <span>فك قفل الـ 24 ساعة للعميل</span>
                    </button>

                    <span className="text-[11px] text-[#A19E9B]/60">
                      هدايا تم استبدالها مسبقاً: {redeemedCount}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Shift Activity & Guidelines */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-lg space-y-3">
                <h4 className="font-bold text-sm text-[#FBF9F5] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#DD0200]" />
                  <span>إرشادات تشغيل الكاونتر:</span>
                </h4>
                <ul className="text-xs text-[#A19E9B] space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#55100D]/50 text-[#FBF9F5] border border-[#DD0200]/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                    <span>العميل يحصل على خدمته ويذكر رقم جواله أو يمسح كود الفرع.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#55100D]/50 text-[#FBF9F5] border border-[#DD0200]/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                    <span>اضغط <strong>«ختم زيارة جديدة»</strong> لإضافة ختم فوري لكارت العميل في محفظة Apple/Google Wallet.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                    <span>عند إكمال {requiredVisits} أختام، يتوهج زر <strong>«تسليم الهدية»</strong> باللون الأخضر للاستبدال الفوري.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#1C1B1B] border border-white/10 flex items-center justify-between text-xs font-bold text-[#FBF9F5]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{industry.staffLabel} المسؤول:</span>
                </div>
                <span className="font-mono text-[#FBF9F5]">{staffMember?.name || `${industry.staffLabel} المعتمد`}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
