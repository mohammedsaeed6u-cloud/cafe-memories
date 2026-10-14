'use client';

import { useState, useEffect, useRef } from 'react';
import { CustomerRegistryService, RegisteredCustomer } from '@/lib/services/customer-registry.service';
import { LoyaltyPurseService, CustomerLoyaltyData } from '@/features/loyalty/loyalty-purse.service';
import { VoucherService, IssuedVoucher } from '@/lib/services/voucher.service';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { getIndustryProfile } from '@/lib/constants/photobooth-presets';
import { CooldownService } from '@/lib/services/cooldown.service';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { getActiveStaff } from '@/lib/services/staff-auth.service';
import { PrintService } from '@/lib/services/print.service';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { TappyAccountingEngine } from '@/lib/services/tappy-accounting-engine.service';
import { reportIgnoredError } from '@/lib/services/diagnostics';
import { EventOrchestratorService } from '@/lib/services/event-orchestrator.service';

export function useTerminalCashier() {
  const [cafeSlug, setCafeSlug] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlCafe = urlParams.get('cafe');
        if (urlCafe) return urlCafe;
        const stored = localStorage.getItem('memories_active_merchant_slug');
        if (stored) return stored;
      } catch (e) { reportIgnoredError('merchant/terminal#1', e); }
    }
    return 'memories';
  });

  const [settings, setSettings] = useState(() => {
    let slug = 'memories';
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        slug = urlParams.get('cafe') || localStorage.getItem('memories_active_merchant_slug') || 'memories';
      } catch (e) { reportIgnoredError('merchant/terminal#2', e); }
    }
    return BusinessSettingsService.getSettings(slug);
  });

  const industry = getIndustryProfile(settings.businessType);

  const [terminalTab, setTerminalTab] = useState<'queue' | 'stamps'>('stamps');
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

  // Scanner, Multi-Stamp & 1-Tap Auto-Reset States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [autoStampEnabled, setAutoStampEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('memories_terminal_auto_stamp');
        if (stored !== null) return stored === 'true';
      } catch (e) { reportIgnoredError('merchant/terminal#auto_stamp', e); }
    }
    return true; // Default ON for ultra-fast cashier throughput
  });
  const [stampsToAdd, setStampsToAdd] = useState<number>(1);
  const [autoResetTimer, setAutoResetTimer] = useState<number | null>(null);
  const autoResetIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cancelAutoReset = () => {
    if (autoResetIntervalRef.current) {
      clearInterval(autoResetIntervalRef.current);
      autoResetIntervalRef.current = null;
    }
    setAutoResetTimer(null);
  };

  const handleToggleAutoStamp = () => {
    const next = !autoStampEnabled;
    setAutoStampEnabled(next);
    try {
      localStorage.setItem('memories_terminal_auto_stamp', String(next));
    } catch (e) { reportIgnoredError('merchant/terminal#set_auto_stamp', e); }
  };

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
      } catch (e) { reportIgnoredError('merchant/terminal#3', e); }
    };

    loadQueue();
    const interval = setInterval(loadQueue, 3000);
    return () => clearInterval(interval);
  }, [cafeSlug, soundAlertEnabled]);

  // Load staff shift stats
  useEffect(() => {
    try {
      const active = getActiveStaff();
      if (active) {
        setStaffMember(active);
      }
      const today = new Date().toISOString().split('T')[0];
      const stampKey = `memories_shift_stamps_${cafeSlug}_${today}`;
      const redKey = `memories_shift_redemptions_${cafeSlug}_${today}`;
      setShiftStampsCount(Number(localStorage.getItem(stampKey) || '0'));
      setShiftRedeemedCount(Number(localStorage.getItem(redKey) || '0'));
    } catch (e) { reportIgnoredError('merchant/terminal#4', e); }
  }, [cafeSlug]);

  const recordShiftStamp = (count: number = 1) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stampKey = `memories_shift_stamps_${cafeSlug}_${today}`;
      const next = shiftStampsCount + count;
      setShiftStampsCount(next);
      localStorage.setItem(stampKey, String(next));
    } catch (e) { reportIgnoredError('merchant/terminal#record_stamp', e); }
  };

  const recordShiftRedemption = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const redKey = `memories_shift_redemptions_${cafeSlug}_${today}`;
      const next = shiftRedeemedCount + 1;
      setShiftRedeemedCount(next);
      localStorage.setItem(redKey, String(next));
    } catch (e) { reportIgnoredError('merchant/terminal#record_redemption', e); }
  };

  const handlePrintItem = (item: any, format: 'standard-2x6' | 'postcard-4x6' | 'square-4x4') => {
    PrintService.printStripImage(item.photoStripUrl, {
      format: format === 'postcard-4x6' ? 'dual-4x6' : 'standard-2x6',
      title: `${item.name || 'عميل المتجر'} - ${settings.branding.name}`,
    });
  };

  const handleDismissPrint = (id: string) => {
    try {
      const queueKey = `memories_print_queue_${cafeSlug}`;
      const next = printQueue.filter((p) => p.id !== id);
      setPrintQueue(next);
      localStorage.setItem(queueKey, JSON.stringify(next));
    } catch (e) { reportIgnoredError('merchant/terminal#dismiss_print', e); }
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
    cancelAutoReset();
    setSearchQuery('');
    setSelectedCustomer(null);
    setLoyaltyData(null);
    setErrorNotice(null);
    setSuccessNotice(null);
  };

  const handleAddStamp = async (count: number = stampsToAdd, triggerAutoReset: boolean = false) => {
    if (!selectedCustomer) return;
    const addCount = Math.max(1, count);
    // LoyaltyPurseService.addDirectStamp updates local purse and syncs exactly once to Supabase via CustomerRegistryService
    LoyaltyPurseService.addDirectStamp(selectedCustomer.phone, cafeSlug, requiredVisits, giftTitle, addCount);
    try {
      TappyAccountingEngine.processTap({
        customerPhone: selectedCustomer.phone,
        customerName: selectedCustomer.name,
        branchId: cafeSlug,
        brandId: 'stampy',
        isVerified: true,
        forceBypassCooldown: true,
      });
    } catch (e) { reportIgnoredError('terminal/accounting_tap', e); }
    const updatedLoyalty = LoyaltyPurseService.getData(selectedCustomer.phone, cafeSlug, requiredVisits);
    setLoyaltyData(updatedLoyalty);
    setSelectedCustomer((prev) => (prev ? { ...prev, totalVisits: (prev.totalVisits || 0) + addCount } : null));

    recordShiftStamp(addCount);
    SoundEffectsService.playStampChime();

    try {
      const isComplete = updatedLoyalty.stampedCount >= requiredVisits;
      const stampLabel = addCount > 1 ? `${addCount} أختام جديدة` : 'ختم زيارة جديدة';
      DigitalWalletService.updateCustomerCardComprehensive({
        cafeSlug,
        customerPhone: selectedCustomer.phone,
        customerName: selectedCustomer.name,
        stampedCount: updatedLoyalty.stampedCount,
        maxSlots: requiredVisits,
        giftTitle,
        logoUrl: settings.branding?.logoUrl,
        cafeName: settings.branding?.name || 'متجر الولاء',
        cardBackgroundUrl: settings.walletPassConfig?.cardBackgroundUrl,
        stampIcon: settings.stampConfig?.customEmoji || '☕',
        colorHex: settings.walletPassConfig?.colorHex || '#1C1C1E',
        pushMessage: isComplete
          ? `🎉 مبروك يا ${selectedCustomer.name}! اكتملت بطاقة الولاء الخاصة بك واستحققت: ${giftTitle}! 🎁`
          : `☕ تمت إضافة ${stampLabel} لكارت الولاء في ${settings.branding?.name || 'المتجر'}! رصيدك: ${updatedLoyalty.stampedCount}/${requiredVisits}`,
      }).catch((e) => console.warn('Terminal wallet push failed:', e));
    } catch (e) {
      reportIgnoredError('merchant/terminal#wallet_push', e);
    }

    // Authoritative Real-Time Broadcast: alerts customer card and live wall
    EventOrchestratorService.dispatch(
      'STAMP_AWARDED',
      {
        customerPhone: selectedCustomer.phone,
        customerName: selectedCustomer.name,
        cafeSlug,
        newStampCount: updatedLoyalty.stampedCount,
        maxSlots: requiredVisits,
        isCardComplete: updatedLoyalty.stampedCount >= requiredVisits,
        rewardTitle: giftTitle,
        staffPin: staffMember?.id,
        timestamp: new Date().toISOString(),
        source: 'pos_tap',
      },
      cafeSlug
    );

    const stampNotice = addCount > 1 ? `تم ختم ${addCount} أختام بنجاح` : 'تم ختم زيارة جديدة بنجاح';
    setSuccessNotice(`${stampNotice} للعميل (${selectedCustomer.name})! الرصيد: ${updatedLoyalty.stampedCount}/${requiredVisits} • تم بث الإشعار للمحفظة 📱✨`);

    if (triggerAutoReset) {
      cancelAutoReset();
      setAutoResetTimer(2.5);
      const startTime = Date.now();
      autoResetIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, 2.5 - elapsed);
        setAutoResetTimer(Math.round(remaining * 10) / 10);
        if (remaining <= 0) {
          if (autoResetIntervalRef.current) {
            clearInterval(autoResetIntervalRef.current);
            autoResetIntervalRef.current = null;
          }
          setAutoResetTimer(null);
          handleClearKeypad();
        }
      }, 100);
    } else {
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  const handleScannedCode = async (scannedRaw: string) => {
    setIsScannerOpen(false);
    setSearchQuery(scannedRaw);
    await executeLookupAndStamp(scannedRaw, autoStampEnabled);
  };

  const executeLookupAndStamp = async (query: string, autoStamp: boolean) => {
    cancelAutoReset();
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

    const clean = trimmed.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 6) {
      setSelectedCustomer(null);
      setLoyaltyData(null);
      return;
    }

    let customerToUse: RegisteredCustomer | null = null;
    const asyncResult = await CustomerRegistryService.lookupCustomerAsync(clean, cafeSlug);

    if (asyncResult.exists && asyncResult.name) {
      customerToUse = {
        phone: clean,
        name: asyncResult.name,
        role: asyncResult.role || 'vip_guest',
        registeredAt: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        totalVisits: asyncResult.totalVisits || 1,
      };
    } else {
      customerToUse = CustomerRegistryService.registerCustomer(
        clean,
        `عميل ${clean.slice(-4)}`,
        'coffee_lover',
        cafeSlug
      );
    }

    setSelectedCustomer(customerToUse);
    const lData = LoyaltyPurseService.getData(customerToUse.phone, cafeSlug, requiredVisits);
    setLoyaltyData(lData);
    const vList = VoucherService.getCustomerVouchers(customerToUse.phone, cafeSlug);
    setCustomerVouchers(vList);
    const activeOne = vList.find((v) => v.status === 'ACTIVE');
    if (activeOne) setActiveVoucher(activeOne);

    try {
      const stored = localStorage.getItem(`memories_redemptions_${cafeSlug}_${customerToUse.phone}`);
      setRedeemedCount(stored ? Number(stored) : 0);
    } catch (e) {
      reportIgnoredError('merchant/terminal#redemptions_lookup', e);
      setRedeemedCount(0);
    }

    if (autoStamp && customerToUse) {
      const addCount = stampsToAdd;
      // LoyaltyPurseService.addDirectStamp updates local purse and syncs exactly once to Supabase via CustomerRegistryService
      LoyaltyPurseService.addDirectStamp(customerToUse.phone, cafeSlug, requiredVisits, giftTitle, addCount);
      try {
        TappyAccountingEngine.processTap({
          customerPhone: customerToUse.phone,
          customerName: customerToUse.name,
          branchId: cafeSlug,
          brandId: 'stampy',
          isVerified: true,
          forceBypassCooldown: true,
        });
      } catch (e) { reportIgnoredError('terminal/auto_accounting_tap', e); }
      const updatedLoyalty = LoyaltyPurseService.getData(customerToUse.phone, cafeSlug, requiredVisits);
      setLoyaltyData(updatedLoyalty);
      setSelectedCustomer((prev) => (prev ? { ...prev, totalVisits: (prev.totalVisits || 0) + addCount } : null));

      recordShiftStamp(addCount);
      SoundEffectsService.playStampChime();

      try {
        const isComplete = updatedLoyalty.stampedCount >= requiredVisits;
        const stampLabel = addCount > 1 ? `${addCount} أختام جديدة` : 'ختم زيارة جديدة';
        DigitalWalletService.updateCustomerCardComprehensive({
          cafeSlug,
          customerPhone: customerToUse.phone,
          customerName: customerToUse.name,
          stampedCount: updatedLoyalty.stampedCount,
          maxSlots: requiredVisits,
          giftTitle,
          logoUrl: settings.branding?.logoUrl,
          cafeName: settings.branding?.name || 'متجر الولاء',
          cardBackgroundUrl: settings.walletPassConfig?.cardBackgroundUrl,
          stampIcon: settings.stampConfig?.customEmoji || '☕',
          colorHex: settings.walletPassConfig?.colorHex || '#1C1C1E',
          pushMessage: isComplete
            ? `🎉 مبروك يا ${customerToUse.name}! اكتملت بطاقة الولاء الخاصة بك واستحققت: ${giftTitle}! 🎁`
            : `☕ تمت إضافة ${stampLabel} لكارت الولاء في ${settings.branding?.name || 'المتجر'}! رصيدك: ${updatedLoyalty.stampedCount}/${requiredVisits}`,
        }).catch((e) => console.warn('Terminal wallet push failed:', e));
      } catch (e) {
        reportIgnoredError('merchant/terminal#auto_wallet_push', e);
      }

      const stampNotice = addCount > 1 ? `تم ختم ${addCount} أختام فورياً ⚡` : 'تم الختم التلقائي الفوري ⚡';
      setSuccessNotice(`${stampNotice} للعميل (${customerToUse.name})! الرصيد: ${updatedLoyalty.stampedCount}/${requiredVisits} • تم بث الإشعار للمحفظة 📱✨`);

      cancelAutoReset();
      setAutoResetTimer(2.5);
      const startTime = Date.now();
      autoResetIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, 2.5 - elapsed);
        setAutoResetTimer(Math.round(remaining * 10) / 10);
        if (remaining <= 0) {
          if (autoResetIntervalRef.current) {
            clearInterval(autoResetIntervalRef.current);
            autoResetIntervalRef.current = null;
          }
          setAutoResetTimer(null);
          handleClearKeypad();
        }
      }, 100);
    }
  };

  const handleRedeemVoucherDirect = async (voucherCode: string) => {
    const res = VoucherService.redeemVoucher(voucherCode, cafeSlug, staffMember?.name || `${industry.staffLabel} المناوب`);
    if (res.success && res.voucher) {
      setActiveVoucher(res.voucher);
      if (selectedCustomer) {
        setCustomerVouchers(VoucherService.getCustomerVouchers(selectedCustomer.phone, cafeSlug));
      }
      recordShiftRedemption();
      try {
        TappyAccountingEngine.redeemReward('stampy', res.voucher.customerPhone);
      } catch (e) { reportIgnoredError('terminal/accounting_redeem', e); }
      SoundEffectsService.playRewardCelebration();

      try {
        DigitalWalletService.updateCustomerCardComprehensive({
          cafeSlug,
          customerPhone: res.voucher.customerPhone,
          customerName: res.voucher.customerName,
          stampedCount: 0,
          maxSlots: requiredVisits,
          giftTitle: res.voucher.giftTitle,
          logoUrl: settings.branding?.logoUrl,
          cafeName: settings.branding?.name || 'متجر الولاء',
          cardBackgroundUrl: settings.walletPassConfig?.cardBackgroundUrl,
          stampIcon: settings.stampConfig?.customEmoji || '☕',
          colorHex: settings.walletPassConfig?.colorHex || '#1C1C1E',
          pushMessage: `🎁 بالهناء والشفاء يا ${res.voucher.customerName}! تم استلام مكافأتك "${res.voucher.giftTitle}" بنجاح في ${settings.branding?.name || 'المتجر'}.`,
        }).catch((e) => console.warn('Voucher redeem wallet push failed:', e));
      } catch (e) {
        reportIgnoredError('merchant/terminal#voucher_wallet_push', e);
      }

      EventOrchestratorService.dispatch(
        'REWARD_CLAIMED',
        {
          customerPhone: res.voucher.customerPhone,
          customerName: res.voucher.customerName,
          cafeSlug,
          rewardTitle: res.voucher.giftTitle,
          voucherCode: res.voucher.code,
          timestamp: new Date().toISOString(),
        },
        cafeSlug
      );

      setSuccessNotice(`تم استبدال الهدية بنجاح! تم اعتماد الكود (${res.voucher.code}) وتسليم "${res.voucher.giftTitle}" للعميل (${res.voucher.customerName}).`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } else {
      setErrorNotice(res.error || 'فشل استبدال الهدية.');
    }
  };

  const handleRedeemGift = async () => {
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
      // Persist redemption to Supabase Cloud
      const randKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 8) : Date.now().toString(36);
      const idempotencyKey = `red_${Date.now()}_${randKey}`;

      // Reset local loyalty purse stamps upon redemption
      LoyaltyPurseService.setStampedCount(selectedCustomer.phone, cafeSlug, 0);
      const resetLoyalty = LoyaltyPurseService.getData(selectedCustomer.phone, cafeSlug, requiredVisits);
      setLoyaltyData(resetLoyalty);

      // Persist redemption to Supabase Cloud
      fetch('/api/v1/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: (selectedCustomer as any).id || selectedCustomer.phone,
          customerPhone: selectedCustomer.phone,
          customerName: selectedCustomer.name,
          cafeSlug,
          idempotencyKey,
        }),
      }).catch((err) => {
        console.warn('Redemption cloud sync notice:', err);
      });

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

      try {
        DigitalWalletService.updateCustomerCardComprehensive({
          cafeSlug,
          customerPhone: selectedCustomer.phone,
          customerName: selectedCustomer.name,
          stampedCount: 0,
          maxSlots: requiredVisits,
          giftTitle,
          logoUrl: settings.branding?.logoUrl,
          cafeName: settings.branding?.name || 'متجر الولاء',
          cardBackgroundUrl: settings.walletPassConfig?.cardBackgroundUrl,
          stampIcon: settings.stampConfig?.customEmoji || '☕',
          colorHex: settings.walletPassConfig?.colorHex || '#1C1C1E',
          pushMessage: `🎁 بالهناء والشفاء يا ${selectedCustomer.name}! تم استلام هدية "${giftTitle}" بنجاح في ${settings.branding?.name || 'المتجر'}.`,
        }).catch((e) => console.warn('Redemption wallet push failed:', e));
      } catch (e) {
        reportIgnoredError('merchant/terminal#redeem_wallet_push', e);
      }

      setSuccessNotice(`تم استبدال الهدية بنجاح! تم تسليم "${giftTitle}" للعميل (${selectedCustomer.name}).`);
      setTimeout(() => setSuccessNotice(null), 4500);
    } catch (err) {
      reportIgnoredError('merchant/terminal#redeem_gift', err);
      setErrorNotice('حدث خطأ أثناء تسجيل الاستبدال.');
    }
  };

  const handleUnlockCooldown = () => {
    if (!selectedCustomer) return;
    CooldownService.unlockForCustomer(selectedCustomer.phone, cafeSlug);
    setSuccessNotice(`تم فك قفل الـ 24 ساعة للعميل (${selectedCustomer.name}) بنجاح! يمكنه التسجيل فوراً.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const totalVisits = selectedCustomer?.totalVisits || loyaltyData?.stampedCount || 0;
  const totalEligible = Math.floor(totalVisits / requiredVisits);
  const availableToClaim = Math.max(0, totalEligible - redeemedCount);
  const isEligibleForGift = availableToClaim > 0;

  return {
    cafeSlug,
    settings,
    industry,
    terminalTab,
    setTerminalTab,
    printQueue,
    soundAlertEnabled,
    setSoundAlertEnabled,
    searchQuery,
    setSearchQuery,
    selectedCustomer,
    loyaltyData,
    activeVoucher,
    customerVouchers,
    redeemedCount,
    successNotice,
    setSuccessNotice,
    errorNotice,
    setErrorNotice,
    shiftStampsCount,
    shiftRedeemedCount,
    isPinModalOpen,
    setIsPinModalOpen,
    staffMember,
    setStaffMember,
    isScannerOpen,
    setIsScannerOpen,
    autoStampEnabled,
    handleToggleAutoStamp,
    stampsToAdd,
    setStampsToAdd,
    autoResetTimer,
    cancelAutoReset,
    requiredVisits,
    giftTitle,
    handlePrintItem,
    handleDismissPrint,
    handleLookup,
    handleKeyPress,
    handleClearKeypad,
    handleAddStamp,
    handleScannedCode,
    handleRedeemVoucherDirect,
    handleRedeemGift,
    handleUnlockCooldown,
    isEligibleForGift,
  };
}
