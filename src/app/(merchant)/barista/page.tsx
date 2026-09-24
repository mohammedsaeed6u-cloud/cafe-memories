'use client';

import React, { useState, useEffect } from 'react';
import {
  Coffee,
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
} from 'lucide-react';
import { CustomerRegistryService, RegisteredCustomer } from '@/lib/services/customer-registry.service';
import { LoyaltyPurseService, CustomerLoyaltyData } from '@/features/loyalty/loyalty-purse.service';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { CooldownService } from '@/lib/services/cooldown.service';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { StaffPinModal } from '@/components/dashboard/StaffPinModal';
import { getActiveStaff, clearActiveStaffSession } from '@/lib/services/staff-auth.service';

export default function BaristaTerminalPage() {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<RegisteredCustomer | null>(null);
  const [loyaltyData, setLoyaltyData] = useState<CustomerLoyaltyData | null>(null);
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
  const giftTitle = settings.freeGiftOffer?.title || 'كوب قهوة مختصة مجاني';

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

  const handleLookup = (phoneQuery: string) => {
    setErrorNotice(null);
    setSuccessNotice(null);
    const clean = phoneQuery.trim().replace(/[^0-9]/g, '');
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
          role: direct.role || 'coffee_lover',
          registeredAt: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          totalVisits: direct.totalVisits || 1,
        };
        setSelectedCustomer(cust);
        const lData = LoyaltyPurseService.getData(clean, cafeSlug, requiredVisits);
        setLoyaltyData(lData);
        try {
          const stored = localStorage.getItem(`memories_redemptions_${cafeSlug}_${clean}`);
          setRedeemedCount(stored ? Number(stored) : 0);
        } catch {
          setRedeemedCount(0);
        }
      } else {
        setSelectedCustomer(null);
        setLoyaltyData(null);
        setErrorNotice('لم يتم العثور على عميل مسجل بهذا الرقم. تأكد من إدخال الرقم بشكل صحيح.');
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
    const res = LoyaltyPurseService.addDirectStamp(selectedCustomer.phone, cafeSlug, requiredVisits);
    const updatedLoyalty = LoyaltyPurseService.getData(selectedCustomer.phone, cafeSlug, requiredVisits);
    setLoyaltyData(updatedLoyalty);
    setSelectedCustomer((prev) => (prev ? { ...prev, totalVisits: (prev.totalVisits || 0) + 1 } : null));

    recordShiftStamp();
    SoundEffectsService.playStampChime();
    setSuccessNotice(`تم ختم زيارة جديدة بنجاح للعميل (${selectedCustomer.name})! الرصيد الحالي: ${updatedLoyalty.stampedCount}/${requiredVisits}`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Redeem Action (Claim Free Drink)
  const handleRedeemGift = () => {
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
        baristaName: staffMember?.name || 'باريستا الصالة',
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
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-cairo selection:bg-amber-100">
      {/* Top Header */}
      <header className="bg-stone-900 text-white border-b border-stone-800 px-4 sm:px-6 py-3.5 sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black shadow-md">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base text-white">
                  محطة الباريستا والكاونتر السريعة
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                  POS TERMINAL
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {settings.branding.name} • ختم الزيارات وتسليم الهدايا الفورية للعملاء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-bold text-xs transition flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">لوحة الإدارة</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Shift Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-bold block">أختام الشفت اليوم</span>
              <span className="text-xl font-black font-mono text-stone-950">+{shiftStampsCount}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-bold block">هدايا مستبدلة</span>
              <span className="text-xl font-black font-mono text-emerald-700">{shiftRedeemedCount}</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-bold block">معيار الهدية المجانية</span>
              <span className="text-sm font-black text-stone-900">كل {requiredVisits} زيارات</span>
            </div>
          </div>
        </div>

        {/* Success or Error Notice */}
        {successNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
        {errorNotice && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 font-bold text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
            <X className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT/MAIN: Customer Lookup & Action Center */}
          <div className="lg:col-span-7 space-y-4">
            {/* Input Form */}
            <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-amber-600" />
                  <span>بحث عن عميل برقم الجوال:</span>
                </span>
                <span className="text-[10px] font-mono text-stone-400">PHONE SEARCH</span>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="01xxxxxxxxx"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 8) {
                      handleLookup(e.target.value);
                    }
                  }}
                  className="w-full text-center text-xl sm:text-2xl font-mono font-black py-3.5 px-4 rounded-2xl bg-stone-50 border border-stone-300 focus:bg-white focus:border-amber-600 focus:outline-none tracking-widest text-stone-900"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearKeypad}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition cursor-pointer"
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
                    className="py-3 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-900 font-mono font-bold text-base transition cursor-pointer"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Details & Actions */}
            {selectedCustomer && loyaltyData && (
              <div className="p-6 rounded-3xl bg-white border-2 border-amber-500 shadow-md space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xl shadow-xs">
                      {selectedCustomer.name.charAt(0) || 'ض'}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-stone-950">{selectedCustomer.name}</h3>
                      <p className="text-xs text-stone-500 font-mono" dir="ltr">{selectedCustomer.phone}</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-black px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                    {loyaltyData.stampedCount} من {requiredVisits} أختام
                  </span>
                </div>

                {/* Progress Visual */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                    <span>تقدم بطاقة الولاء الحالية</span>
                    <span className="font-mono">{loyaltyData.stampedCount} / {requiredVisits} زيارات</span>
                  </div>
                  <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (loyaltyData.stampedCount / requiredVisits) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3 Core Instant Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAddStamp}
                    className="py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Coffee className="w-5 h-5" />
                    <span>ختم زيارة جديدة (+1)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRedeemGift}
                    disabled={!isEligibleForGift}
                    className={`py-3.5 px-4 rounded-2xl font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                      isEligibleForGift
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                        : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                    }`}
                  >
                    <Gift className="w-5 h-5" />
                    <span>تسليم الهدية المجانية</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <button
                    type="button"
                    onClick={handleUnlockCooldown}
                    className="text-stone-500 hover:text-stone-900 font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5 text-amber-600" />
                    <span>فك قفل الـ 24 ساعة للعميل</span>
                  </button>

                  <span className="text-[11px] text-stone-400">
                    هدايا تم استبدالها مسبقاً: {redeemedCount}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Shift Activity & Guidelines */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-sm space-y-3">
              <h4 className="font-black text-sm text-stone-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>إرشادات تشغيل الكاونتر:</span>
              </h4>
              <ul className="text-xs text-stone-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <span>العميل يطلب قهوته ويذكر رقم جواله أو يمسح كود الطاولة.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <span>اضغط <strong>«ختم زيارة جديدة»</strong> لإضافة ختم فوري لكارت العميل في محفظة Apple/Google Wallet.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <span>عند إكمال {requiredVisits} أختام، يتوهج زر <strong>«تسليم الهدية المجانية»</strong> باللون الأخضر للاستبدال الفوري.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs font-bold text-amber-950">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>الباريستا المسؤول:</span>
              </div>
              <span className="font-mono text-amber-900">{staffMember?.name || 'باريستا الصالة'}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}