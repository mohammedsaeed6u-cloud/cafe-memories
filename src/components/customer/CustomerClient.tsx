'use client';

import React, { useState, useEffect } from 'react';
import { BusinessSettings, PhotoboothFrame } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { CooldownService } from '@/lib/services/cooldown.service';
import { PrintService } from '@/lib/services/print.service';
import { CameraViewfinder } from '@/components/photobooth/CameraViewfinder';
import { PhotoboothStripCard } from '@/components/photobooth/PhotoboothStripCard';
import { FrameSelector } from '@/components/photobooth/FrameSelector';
import { PrintGiftModal } from '@/components/photobooth/PrintGiftModal';
import { StripComposerService } from '@/lib/services/strip-composer.service';
import {
  Sparkles,
  Gift,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Clock,
  RefreshCw,
  Coffee,
  Heart,
  X,
} from 'lucide-react';

export function CustomerClient({ cafeSlug }: { cafeSlug: string }) {
  // Business settings state
  const [settings, setSettings] = useState<BusinessSettings>(() =>
    BusinessSettingsService.getSettings(cafeSlug)
  );

  const [selectedFrame, setSelectedFrame] = useState<PhotoboothFrame>(() => {
    return (
      settings.frames.find((f) => f.id === settings.activeFrameId) ||
      settings.frames[0]
    );
  });

  // Cooldown / 24-hour limit state
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLockedByCooldown, setIsLockedByCooldown] = useState(false);
  const [remainingCooldownHours, setRemainingCooldownHours] = useState(24);

  // Photobooth state: Customer's accumulated photos on their card
  const [accumulatedPhotos, setAccumulatedPhotos] = useState<string[]>([]);
  const [todayPhoto, setTodayPhoto] = useState<string | null>(null);
  const [composedStripUrl, setComposedStripUrl] = useState<string | undefined>(undefined);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isPrintGiftModalOpen, setIsPrintGiftModalOpen] = useState(false);
  const [giftCode, setGiftCode] = useState('');

  // Customer profile form state (persisted for returning visits)
  const [customerName, setCustomerName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('memories_customer_name') || '';
    }
    return '';
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('memories_customer_phone') || '';
    }
    return '';
  });
  const [customerProfession, setCustomerProfession] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('memories_customer_role') || '';
    }
    return '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitCount, setVisitCount] = useState(1);
  const [extraShots, setExtraShots] = useState<number>(0);
  const [isBaristaPinModalOpen, setIsBaristaPinModalOpen] = useState<boolean>(false);
  const [baristaPin, setBaristaPin] = useState<string>('');
  const [pinShotsCount, setPinShotsCount] = useState<number>(1);
  const [pinError, setPinError] = useState<string | null>(null);

  // Initialize device ID, check 24-hour cooldown & load saved card
  useEffect(() => {
    let id = localStorage.getItem('memories_device_id');
    if (!id) {
      id = `dev_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('memories_device_id', id);
    }
    setDeviceId(id);

    // Load past photos for this cafe's card from local cache
    try {
      const past = localStorage.getItem(`memories_card_photos_${cafeSlug}`);
      if (past) {
        const parsed = JSON.parse(past);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccumulatedPhotos(parsed);
          setVisitCount(parsed.length + 1);
        }
      }
    } catch {
      // ignore
    }

    const checkLock = () => {
      const targetId = id || '';
      const access = CooldownService.checkAccess(targetId, cafeSlug);
      const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('memories_customer_phone') : null;
      const phoneToCheck = customerPhone.trim() || storedPhone || '';
      const accessPhone = phoneToCheck ? CooldownService.checkAccess(phoneToCheck, cafeSlug) : null;

      const totalExtra = (access.extraShotsAvailable || 0) + (accessPhone?.extraShotsAvailable || 0);
      setExtraShots(totalExtra);

      if (totalExtra > 0) {
        setIsLockedByCooldown(false);
      } else if (!access.allowed || (accessPhone && !accessPhone.allowed)) {
        setIsLockedByCooldown(true);
        setRemainingCooldownHours(Math.max(access.remainingHours || 0, accessPhone?.remainingHours || 0, 1));
      } else {
        setIsLockedByCooldown(false);
      }
    };

    checkLock();

    const handleUnlocked = () => {
      checkLock();
    };

    window.addEventListener('memories-cooldown-unlocked', handleUnlocked);
    window.addEventListener('memories-order-shots-updated', handleUnlocked);
    window.addEventListener('storage', handleUnlocked);

    return () => {
      window.removeEventListener('memories-cooldown-unlocked', handleUnlocked);
      window.removeEventListener('memories-order-shots-updated', handleUnlocked);
      window.removeEventListener('storage', handleUnlocked);
    };
  }, [cafeSlug, customerPhone]);

  const handleVerifyPinAndAddShots = (e: React.FormEvent) => {
    e.preventDefault();
    if (!CooldownService.verifyBaristaPin(baristaPin)) {
      setPinError('رمز الباريستا غير صحيح (الرمز الافتراضي: 1234 أو 7777 أو 2026)');
      return;
    }
    const targetId = customerPhone.trim() || deviceId;
    const newTotal = CooldownService.addOrderShots(targetId, pinShotsCount, 1, cafeSlug);
    setExtraShots(newTotal);
    setIsLockedByCooldown(false);
    setIsBaristaPinModalOpen(false);
    setBaristaPin('');
    setPinError(null);
  };

  const handleTakeNextOrderPhoto = () => {
    setTodayPhoto(null);
    setIsPrintGiftModalOpen(false);
  };

  const handleFrameChange = async (frame: PhotoboothFrame) => {
    setSelectedFrame(frame);
    const currentPhotos = todayPhoto ? [...accumulatedPhotos, todayPhoto] : accumulatedPhotos;
    if (currentPhotos.length > 0) {
      const slots = Math.max(frame.shotCount || 3, 1);
      try {
        const stripUrl = await StripComposerService.composeStrip({
          photos: currentPhotos,
          totalSlots: slots,
          frame,
          branding: settings.branding,
          freeGiftOffer: settings.freeGiftOffer,
          giftCode: giftCode || 'GIFT-MEMO',
        });
        setComposedStripUrl(stripUrl);
      } catch (err) {
        console.warn('Canvas re-composition fallback', err);
      }
    }
  };

  // Sync settings when updated in storage or another tab
  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
        const match = e.detail.frames?.find((f: PhotoboothFrame) => f.id === e.detail.activeFrameId);
        if (match) setSelectedFrame(match);
      }
    };

    window.addEventListener('memories-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('memories-settings-updated', handleSettingsUpdate);
  }, []);

  // When customer captures today's single photo
  const handleCaptureComplete = async (photo: string) => {
    setTodayPhoto(photo);
    const updated = [...accumulatedPhotos, photo];
    const slots = Math.max(selectedFrame.shotCount || 3, 1);

    // Compose canvas strip in background
    try {
      const stripUrl = await StripComposerService.composeStrip({
        photos: updated,
        totalSlots: slots,
        frame: selectedFrame,
        branding: settings.branding,
        freeGiftOffer: settings.freeGiftOffer,
        giftCode: 'GIFT-MEMO',
      });
      setComposedStripUrl(stripUrl);
    } catch (err) {
      console.warn('Canvas composition fallback', err);
    }
  };

  // Open Lead intake modal
  const handleProceedToGift = () => {
    setIsLeadModalOpen(true);
  };

  // Submit Lead & Link Memory to Visit
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !todayPhoto) return;

    setIsSubmitting(true);
    const code = `GIFT-${Math.floor(1000 + Math.random() * 9000)}`;
    setGiftCode(code);

    const updatedCardPhotos = [...accumulatedPhotos, todayPhoto];
    setAccumulatedPhotos(updatedCardPhotos);
    const slots = Math.max(selectedFrame.shotCount || 3, 1);

    // Save card progress & profile locally
    try {
      localStorage.setItem(`memories_card_photos_${cafeSlug}`, JSON.stringify(updatedCardPhotos));
      localStorage.setItem('memories_customer_name', customerName);
      localStorage.setItem('memories_customer_phone', customerPhone);
      if (customerProfession) {
        localStorage.setItem('memories_customer_role', customerProfession);
      }
    } catch {
      // ignore
    }

    // Re-compose with real gift code
    try {
      const finalStrip = await StripComposerService.composeStrip({
        photos: updatedCardPhotos,
        totalSlots: slots,
        frame: selectedFrame,
        branding: settings.branding,
        freeGiftOffer: settings.freeGiftOffer,
        giftCode: code,
      });
      setComposedStripUrl(finalStrip);
    } catch {
      // keep previous
    }

    // Record session / deduct order shot
    if (deviceId) {
      CooldownService.recordSession(deviceId, cafeSlug);
    }
    if (customerPhone.trim()) {
      CooldownService.recordSession(customerPhone.trim(), cafeSlug);
    }

    // CRITICAL: Reset todayPhoto to null so it does not duplicate on re-render!
    setTodayPhoto(null);

    try {
      const res = await fetch('/api/v1/photobooth/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: customerName,
            phone: customerPhone,
            role: customerProfession || 'زائر مميز',
          },
          photos: updatedCardPhotos,
          cafeSlug,
          frameId: selectedFrame.id,
          giftCode: code,
          visitId: `vis_${Date.now()}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.customer?.visitsCount) {
          setVisitCount(data.customer.visitsCount);
        }
      }
    } catch (err) {
      console.warn('Proceeding locally (static mode)', err);
    } finally {
      setIsSubmitting(false);
      setIsLeadModalOpen(false);
      setIsPrintGiftModalOpen(true);
    }
  };

  const currentDisplayPhotos = todayPhoto ? [...accumulatedPhotos, todayPhoto] : accumulatedPhotos;
  const totalCardSlots = Math.max(selectedFrame.shotCount || 3, 1);
  const isCardComplete = currentDisplayPhotos.length >= totalCardSlots;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col items-center selection:bg-amber-100">
      {/* Top Porcelain Header */}
      <header className="w-full bg-white/85 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-40 py-3.5 px-4 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.branding.logoUrl}
                alt={settings.branding.name}
                className="h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                M
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-stone-900 leading-tight">
                {settings.branding.name || 'Memories • موميريز'}
              </h1>
              <p className="text-[10px] text-stone-500 font-medium">
                كارت الولاء المصور • صورة لكل زيارة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {extraShots > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold shadow-xs animate-pulse">
                <Coffee className="w-3.5 h-3.5" />
                <span>+{extraShots} صور أوردرات</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 text-xs font-bold">
              <Gift className="w-3.5 h-3.5 text-amber-600" />
              <span>الهدية في الخانة الأخيرة</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-xl mx-auto p-4 sm:p-6 flex-1 flex flex-col items-center">
        {/* Check 24-Hour Cooldown */}
        {isLockedByCooldown && !todayPhoto ? (
          <div className="w-full bg-white rounded-3xl p-8 border-2 border-amber-200 shadow-xl text-center my-auto animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4 shadow-inner">
              <Clock className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-stone-900 mb-2">
              لقد وثقت لحظتك لليوم يا بطل! ☕✨
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-6">
              لكل زائر صورة واحدة في اليوم تضاف إلى كارت ذكرياته.
              <br />
              <span className="font-bold text-amber-800">
                متبقي تقريباً {remainingCooldownHours} ساعة لتتمكن من إضافة لقطة زيارتك القادمة.
              </span>
            </p>

            {/* View Current Card */}
            {accumulatedPhotos.length > 0 && (
              <div className="my-6 flex justify-center">
                <PhotoboothStripCard
                  photos={accumulatedPhotos}
                  frame={selectedFrame}
                  branding={settings.branding}
                  freeGiftOffer={settings.freeGiftOffer}
                />
              </div>
            )}

            {/* Barista Order Shots & Override Option */}
            <div className="p-5 bg-gradient-to-br from-amber-50/80 to-orange-50/60 rounded-3xl border-2 border-amber-200/80 text-xs text-stone-800 mb-6 shadow-sm">
              <div className="flex items-center justify-center gap-2 font-black text-stone-900 text-sm mb-1.5">
                <Coffee className="w-5 h-5 text-amber-600" />
                <span>طلبت أوردرات أو مشروبات إضافية؟ ☕</span>
              </div>
              <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                كل أوردر إضافي يمنحك لقطة جديدة تملأ بها كارت ذكرياتك وتصل لهديتك أسرع!
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setPinError(null);
                    setIsBaristaPinModalOpen(true);
                  }}
                  className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-200" />
                  <span>شحن صور الأوردر بـ PIN الباريستا</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const access = CooldownService.checkAccess(deviceId, cafeSlug);
                    if (access.allowed) {
                      setIsLockedByCooldown(false);
                      setExtraShots(access.extraShotsAvailable);
                    }
                  }}
                  className="px-4 py-3 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs border border-stone-300 flex items-center justify-center gap-2 transition"
                >
                  <span>تحديث بعد شحن الكاشير</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                const access = CooldownService.checkAccess(deviceId, cafeSlug);
                if (access.allowed) {
                  setIsLockedByCooldown(false);
                }
              }}
              className="px-6 py-3 rounded-2xl bg-stone-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 mx-auto shadow-md transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>فحص حالة الإذن الآن (بعد إذن الباريستا)</span>
            </button>
          </div>
        ) : (
          <>
            {/* Step Indicator */}
            <div className="w-full flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    !todayPhoto ? 'bg-amber-600 text-white' : 'bg-emerald-500 text-white'
                  }`}
                >
                  {!todayPhoto ? '1' : '✓'}
                </span>
                <span className="text-xs font-bold text-stone-700">صورة زيارة اليوم</span>
              </div>

              <div className="h-[2px] w-12 bg-stone-200" />

              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    todayPhoto && !giftCode
                      ? 'bg-amber-600 text-white'
                      : giftCode
                      ? 'bg-emerald-500 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  2
                </span>
                <span className="text-xs font-bold text-stone-700">كارت الذكريات</span>
              </div>

              <div className="h-[2px] w-12 bg-stone-200" />

              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    giftCode ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  3
                </span>
                <span className="text-xs font-bold text-stone-700">
                  {isCardComplete ? 'استلام الهدية والطباعة' : 'حفظ الكارت'}
                </span>
              </div>
            </div>

            {/* Phase 1: Live Camera for 1 Photo Only */}
            {!todayPhoto ? (
              <div className="w-full animate-in fade-in">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-black text-stone-900">
                    التقط صورة زيارة اليوم 📸
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    لكل زيارة صورة واحدة تملأ خانة في كارت ولائك وتنقلك خطوة نحو الهدية
                  </p>
                </div>

                <CameraViewfinder
                  onCaptureComplete={handleCaptureComplete}
                  brandName={settings.branding.name}
                  visitNumber={accumulatedPhotos.length + 1}
                />
              </div>
            ) : (
              /* Phase 2: Accumulated Card Preview & Next Steps */
              <div className="w-full space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                      <span>كارت ذكرياتك التراكمي</span>
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      تمت إضافة صورة اليوم إلى الخانة #{currentDisplayPhotos.length}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setTodayPhoto(null);
                      setComposedStripUrl(undefined);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة اللقطة</span>
                  </button>
                </div>

                {/* Aesthetic Card Strip */}
                <div className="flex justify-center py-2">
                  <PhotoboothStripCard
                    photos={currentDisplayPhotos}
                    frame={selectedFrame}
                    branding={settings.branding}
                    freeGiftOffer={settings.freeGiftOffer}
                  />
                </div>

                {/* Frame Style Selector */}
                <FrameSelector
                  frames={settings.frames}
                  selectedFrameId={selectedFrame.id}
                  onSelectFrame={handleFrameChange}
                />

                {/* CTA: Proceed to Lead Form */}
                <button
                  onClick={handleProceedToGift}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-base shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <Gift className="w-5 h-5" />
                  <span>
                    {isCardComplete
                      ? '🎉 اكتمل الكارت! استلم هديتك واطبع شريطك الآن'
                      : 'حفظ لقطة اليوم ومتابعة تقدم الكارت'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Customer Profile Intake Modal (Ultra Clean & Minimal) */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-stone-900">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(false)}
              className="absolute top-5 left-5 w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mb-2">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-stone-900">
                توثيق زيارتك وحفظ كارتك
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                سجل بياناتك لربط كارت ذكرياتك برقمك ومتابعة خاناتك القادمة
              </p>
            </div>

            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  الاسم الكريم
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: أحمد سامي"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  رقم الموبايل
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-left bg-white"
                />
              </div>

              {/* Clean, Single Input for Profession / Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  مجالك أو اهتمامك (اختياري)
                </label>
                <input
                  type="text"
                  value={customerProfession}
                  onChange={(e) => setCustomerProfession(e.target.value)}
                  placeholder="مثلاً: مهندس ديكور، صانع محتوى، كاتب، طالب..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                />
                {/* Subtle Clean Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['💻 تقني', '🎨 مبدع', '🎓 طالب', '💼 ريادة', '☕ زائر القهوة'].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setCustomerProfession(tag)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-amber-50 text-stone-600 hover:text-amber-800 rounded-lg text-[11px] font-medium border border-stone-200 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>جاري حفظ الكارت...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>تأكيد وحفظ الكارت</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="py-3.5 px-5 rounded-2xl bg-stone-200/80 hover:bg-stone-300 text-stone-700 font-bold text-sm transition"
                >
                  إلغاء
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>بياناتك محفوظة بأمان تام في سجل أصدقاء المكان</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Barista Order Shots PIN */}
      {isBaristaPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative bg-[#FAF8F5] rounded-3xl p-6 sm:p-7 max-w-sm w-full text-stone-900 shadow-2xl border border-stone-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>

            <h4 className="font-black text-center text-base text-stone-900 mb-1">
              تأكيد أوردر الباريستا والكاشير
            </h4>
            <p className="text-[11px] text-center text-stone-500 mb-4 leading-relaxed">
              يقوم الباريستا بإدخال الرمز السريع لتأكيد الأوردر وشحن اللقطات فوراً
            </p>

            <form onSubmit={handleVerifyPinAndAddShots} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 text-right">
                  عدد الأوردرات / الصور المستحقة:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPinShotsCount(n)}
                      className={`py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        pinShotsCount === n
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      +{n} صورة
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 text-right">
                  رمز PIN الباريستا:
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="أدخل PIN (الافتراضي: 1234 أو 7777)"
                  value={baristaPin}
                  onChange={(e) => setBaristaPin(e.target.value)}
                  className="w-full text-center tracking-widest font-mono text-lg py-2.5 px-4 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                />
                {pinError && (
                  <p className="text-[10px] text-red-600 font-bold text-center mt-1">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition shadow-md"
                >
                  تأكيد وشحن الصور الآن 📸
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsBaristaPinModalOpen(false);
                    setBaristaPin('');
                    setPinError(null);
                  }}
                  className="py-3 px-4 rounded-2xl bg-stone-200/80 hover:bg-stone-300 text-stone-700 text-xs font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print & Gift Modal */}
      <PrintGiftModal
        isOpen={isPrintGiftModalOpen}
        onClose={() => {
          setIsPrintGiftModalOpen(false);
          setTodayPhoto(null);
          const targetId = customerPhone.trim() || deviceId;
          const access = CooldownService.checkAccess(targetId, cafeSlug);
          setExtraShots(access.extraShotsAvailable);
          if (!access.allowed) {
            setIsLockedByCooldown(true);
            setRemainingCooldownHours(access.remainingHours || 24);
          }
        }}
        photos={accumulatedPhotos.length > 0 ? accumulatedPhotos : (todayPhoto ? [todayPhoto] : [])}
        stripDataUrl={composedStripUrl}
        frame={selectedFrame}
        branding={settings.branding}
        freeGiftOffer={settings.freeGiftOffer}
        giftCode={giftCode}
        customerName={customerName}
        customerRoleLabel={customerProfession || 'زائر مميز'}
        visitCount={accumulatedPhotos.length}
        onPrintStrip={() => {
          if (composedStripUrl) {
            PrintService.printStripImage(composedStripUrl);
          } else {
            PrintService.printElement('printable-strip');
          }
        }}
        extraShots={extraShots}
        onTakeNextPhoto={handleTakeNextOrderPhoto}
      />
    </div>
  );
}
