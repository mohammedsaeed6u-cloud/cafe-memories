'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BusinessSettings, PhotoboothFrame, CardColorPalette, PhotoboothCardMode, PlacedSticker } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { CooldownService } from '@/lib/services/cooldown.service';
import { PrintService } from '@/lib/services/print.service';
import { CameraViewfinder } from '@/components/photobooth/CameraViewfinder';
import { PhotoboothStripCard } from '@/components/photobooth/PhotoboothStripCard';
import { CardColorPicker } from '@/components/photobooth/CardColorPicker';
import { PrintGiftModal } from '@/components/photobooth/PrintGiftModal';
import { StripComposerService } from '@/lib/services/strip-composer.service';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { LoyaltyStampCard } from '@/components/customer/LoyaltyStampCard';
import type { LoyaltyStampSlot } from '@/lib/services/loyalty-stamps';
import { PRESET_COLOR_PALETTES, PHOTOBOOTH_CARD_MODES, PHOTOBOOTH_FRAME_TEMPLATES } from '@/lib/constants/photobooth-presets';
import { StickerControlTray } from '@/components/photobooth/DraggableStickerLayer';
import {
  Sparkles,
  Gift,
  CheckCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Clock,
  Coffee,
  Heart,
  X,
  UserCheck,
  Lock,
  Download,
  Camera,
} from 'lucide-react';

/** Impure id/code factories live at module scope (outside the component) so
 * renders stay pure (react-hooks/purity) while ids stay unique per submit. */
const createGiftCode = () => `GIFT-${Math.floor(1000 + Math.random() * 9000)}`;
const createTrackedId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function CustomerClient({ cafeSlug }: { cafeSlug: string }) {
  // Business settings state
  const [settings, setSettings] = useState<BusinessSettings>(() =>
    BusinessSettingsService.getSettings(cafeSlug)
  );

  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(() => {
    return settings.activeColorPaletteId || 'classic-latte';
  });

  const staffLabel =
    settings.businessType === 'restaurant'
      ? 'الكاشير أو الجرسون'
      : settings.businessType === 'retail'
      ? 'الكاشير'
      : settings.businessType === 'salon'
      ? 'الاستقبال'
      : settings.businessType === 'entertainment'
      ? 'مشرف الألعاب'
      : settings.businessType === 'events'
      ? 'منظم الفعالية'
      : 'الباريستا';

  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [cardMode, setCardMode] = useState<PhotoboothCardMode>(
    settings.defaultCardMode || 'korean_noir'
  );

  const handleAddSticker = (emoji: string) => {
    if (!emoji.trim()) return;
    // Randomness lives in event handlers (never during render), so ids and
    // offsets stay stable across re-renders.
    const randomOffset = (Math.random() - 0.5) * 20;
    const newSticker: PlacedSticker = {
      id: `stk_${crypto.randomUUID()}`,
      emoji: emoji.trim(),
      x: Math.max(15, Math.min(85, 50 + randomOffset)),
      y: Math.max(15, Math.min(85, 40 + randomOffset)),
      rotation: Math.round((Math.random() - 0.5) * 30),
      scale: 1,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const [selectedFrame, setSelectedFrame] = useState<PhotoboothFrame>(() => {
    const base =
      settings.frames.find((f) => f.id === settings.activeFrameId) ||
      settings.frames[0];
    return {
      ...base,
      templateId: settings.defaultTemplateId || base?.templateId || 'korean_noir_2x6',
      layoutType: settings.defaultLayoutType || base?.layoutType,
      shotCount: settings.defaultShotCount || base?.shotCount || 4,
      orientation: settings.defaultOrientation || base?.orientation || 'vertical',
      frameShape: settings.defaultFrameShape || 'rounded',
    };
  });

  // Cooldown / 24-hour limit state
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLockedByCooldown, setIsLockedByCooldown] = useState(false);
  const [remainingCooldownHours, setRemainingCooldownHours] = useState(24);

  // Customer session state (isolated strictly by phone).
  // Initializers MUST NOT read localStorage directly: server render and client
  // hydration would diverge (hydration mismatch). The mount effect below
  // hydrates these states from storage after the first consistent render.
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerProfession, setCustomerProfession] = useState('');

  // Check if current customer is identified in this session

  // Photobooth state: Customer's accumulated photos on their card
  const [accumulatedPhotos, setAccumulatedPhotos] = useState<string[]>([]);
  const [todayPhoto, setTodayPhoto] = useState<string | null>(null);
  const [composedStripUrl, setComposedStripUrl] = useState<string | undefined>(undefined);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isPrintGiftModalOpen, setIsPrintGiftModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [liveWallConsent, setLiveWallConsent] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  // Visit count comes from the server response (customer.visitsCount); the
  // local card only needs its own photo list.

  // Loyalty stamp card: server slots (cloud truth) + honest cloud-sync notice
  const [loyaltySlots, setLoyaltySlots] = useState<LoyaltyStampSlot[]>([]);
  const [cloudSync, setCloudSync] = useState<'idle' | 'synced' | 'local_only'>('idle');
  const [extraShots, setExtraShots] = useState<number>(0);
  const [isBaristaPinModalOpen, setIsBaristaPinModalOpen] = useState<boolean>(false);
  const [baristaPin, setBaristaPin] = useState<string>('');
  const [pinShotsCount, setPinShotsCount] = useState<number>(1);
  const [pinError, setPinError] = useState<string | null>(null);

  // Hydrate persisted session from storage AFTER first render (avoids SSR
  // hydration mismatch): reads happen post-paint, writes batch to one commit.
  useEffect(() => {
    const hydrateSession = () => {
      const storedName = localStorage.getItem('memories_customer_name') || '';
      const storedPhone = localStorage.getItem('memories_customer_phone') || '';
      const storedRole = localStorage.getItem('memories_customer_role') || '';
      if (storedName) setCustomerName(storedName);
      if (storedPhone) setCustomerPhone(storedPhone);
      if (storedRole) setCustomerProfession(storedRole);
      if (storedPhone.trim().length >= 8 && storedName.trim().length > 0) {
        // Session restored from storage; the identity strip below keys off
        // customerPhone, so no extra state is needed.
      }
    };
    // Run after first paint so SSR and first client render match exactly.
    const raf = requestAnimationFrame(hydrateSession);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Holds the device-setup effect's listener cleanup between the post-paint
  // callback and the effect's own teardown.
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize device ID, check 24-hour cooldown & load saved card for THIS customer
  useEffect(() => {
    const runDeviceSetup = () => {
      // Random device id is generated post-paint (inside this callback), not
      // in the component body, to keep renders pure.
      let id = localStorage.getItem('memories_device_id');
      if (!id) {
        id = `dev_${crypto.randomUUID()}`;
        localStorage.setItem('memories_device_id', id);
      }
      setDeviceId(id);

      const clean = customerPhone.trim().replace(/[^0-9]/g, '');

      // Load past photos for THIS specific customer
      if (clean) {
        try {
          const past = localStorage.getItem(`memories_card_photos_${cafeSlug}_${clean}`);
          if (past) {
            const parsed = JSON.parse(past);
            if (Array.isArray(parsed)) {
              setAccumulatedPhotos(parsed);
            } else {
              setAccumulatedPhotos([]);
            }
          } else {
            setAccumulatedPhotos([]);
          }
        } catch {
          setAccumulatedPhotos([]);
        }
      } else {
        setAccumulatedPhotos([]);
      }

      const checkLock = () => {
        if (!clean) {
          setIsLockedByCooldown(false);
          setExtraShots(0);
          return;
        }
        const accessPhone = CooldownService.checkAccess(clean, cafeSlug);
        setExtraShots(accessPhone.extraShotsAvailable);
        if (!accessPhone.allowed) {
          setIsLockedByCooldown(true);
          setRemainingCooldownHours(accessPhone.remainingHours || 24);
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
    };

    // Apply post-paint so SSR and first client render match exactly (the same
    // hydration pattern as the session-hydrate effect above).
    const raf = requestAnimationFrame(() => {
      cleanupRef.current = runDeviceSetup();
    });
    return () => {
      cancelAnimationFrame(raf);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [cafeSlug, customerPhone]);

  /* eslint-disable react-hooks/set-state-in-effect -- real-time auto-fill: while the customer
     types their phone, a returning profile is looked up and the known name/role are filled in.
     This is synchronous, user-visible feedback that must fire per keystroke, not a derived
     value that can live in render. */

  // Real-time lookup as customer types their phone: auto-fills the known
  // name/role for returning customers (read feedback, not derived state).
  useEffect(() => {
    const clean = customerPhone.trim().replace(/[^0-9]/g, '');
    if (clean.length >= 8) {
      const lookup = CustomerRegistryService.lookupCustomer(clean, cafeSlug);
      if (lookup.exists && lookup.name) {
        setCustomerName(lookup.name);
        if (lookup.role) setCustomerProfession(lookup.role);
      }
    }
  }, [customerPhone, cafeSlug]);

  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSwitchCustomer = () => {
    setTodayPhoto(null);
    setAccumulatedPhotos([]);
    setComposedStripUrl(undefined);
    setCustomerPhone('');
    setCustomerName('');
    setCustomerProfession('');
    setIsLockedByCooldown(false);
    setExtraShots(0);
    try {
      localStorage.removeItem('memories_customer_phone');
      localStorage.removeItem('memories_customer_name');
      localStorage.removeItem('memories_customer_role');
    } catch {}
  };

  const handleVerifyPinAndAddShots = (e: React.FormEvent) => {
    e.preventDefault();
    if (!CooldownService.verifyBaristaPin(baristaPin)) {
      setPinError('رمز التحقق غير صحيح. اسأل الموظف المختص عن الرمز الصحيح.');
      return;
    }
    const clean = customerPhone.trim().replace(/[^0-9]/g, '');
    const targetId = clean || deviceId;
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

  const handleColorPaletteChange = async (palette: CardColorPalette) => {
    setSelectedPaletteId(palette.id);
    const updatedFrame: PhotoboothFrame = {
      ...selectedFrame,
      bgColor: palette.bgColor,
      borderColor: palette.borderColor,
      textColor: palette.textColor,
      accentColor: palette.accentColor,
      shotCount: settings.defaultShotCount,
      orientation: settings.defaultOrientation,
      frameShape: settings.defaultFrameShape || 'rounded',
    };
    setSelectedFrame(updatedFrame);

    const currentPhotos = todayPhoto ? [...accumulatedPhotos, todayPhoto] : accumulatedPhotos;
    if (currentPhotos.length > 0) {
      const slots = Math.max(settings.defaultShotCount || 3, 1);
      try {
        const stripUrl = await StripComposerService.composeStrip({
          photos: currentPhotos,
          totalSlots: slots,
          frame: updatedFrame,
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
    const handleSettingsUpdate = (e: Event) => {
      const detail = (e as CustomEvent<BusinessSettings>).detail;
      if (detail) {
        setSettings(detail);
        const match = detail.frames?.find((f: PhotoboothFrame) => f.id === detail.activeFrameId);
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
        giftCode: '',
        cardMode: cardMode,
        stickers: stickers,
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
    const updatedCardPhotos = [...accumulatedPhotos, todayPhoto];
    setAccumulatedPhotos(updatedCardPhotos);
    const slots = Math.max(selectedFrame.shotCount || 3, 1);
    const isCompleted = updatedCardPhotos.length >= slots;
    const code = isCompleted ? createGiftCode() : '';
    setGiftCode(code);

    const cleanPhone = customerPhone.trim().replace(/[^0-9]/g, '');
    const phoneKey = `memories_card_photos_${cafeSlug}_${cleanPhone}`;

    // Save card progress & profile locally (100% isolated per customer phone)
    try {
      localStorage.setItem(phoneKey, JSON.stringify(updatedCardPhotos));
      localStorage.setItem('memories_customer_name', customerName);
      localStorage.setItem('memories_customer_phone', cleanPhone);
      if (customerProfession) {
        localStorage.setItem('memories_customer_role', customerProfession);
      }

      // Sync with in-store Live TV Wall ONLY if customer consented
      if (liveWallConsent) {
        const wallItem = {
          id: createTrackedId('wall'),
          customer: customerName,
          caption: `ذكريات ${customerName} في ${settings.branding.name || 'Memories'} ☕✨`,
          time: 'الآن',
          frames: updatedCardPhotos,
          theme: 'white',
          visibility: 'live_wall',
          status: 'approved',
        };
        const existingFeed = JSON.parse(localStorage.getItem(`memories_wall_feed_${cafeSlug}`) || '[]');
        const newFeed = [wallItem, ...existingFeed].slice(0, 20);
        localStorage.setItem(`memories_wall_feed_${cafeSlug}`, JSON.stringify(newFeed));
        window.dispatchEvent(new CustomEvent('memories-wall-updated', { detail: newFeed }));
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
        cardMode: cardMode,
        stickers: stickers,
      });
      setComposedStripUrl(finalStrip);
    } catch {
      // keep previous
    }

    // Record session / deduct order shot
    if (deviceId) {
      CooldownService.recordSession(deviceId, cafeSlug);
    }
    if (cleanPhone) {
      CooldownService.recordSession(cleanPhone, cafeSlug);
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
          visitId: createTrackedId('vis'),
          liveWallConsent,
        }),
      });

      if (res.ok) {
        await res.json();
        setCloudSync('synced');
        // Cloud truth landed — refresh the stamp card from the server.
        void refreshLoyaltySlots(cleanPhone);
      } else {
        setCloudSync('local_only');
      }
    } catch (err) {
      console.warn('Cloud capture failed — card saved on this device only', err);
      setCloudSync('local_only');
    } finally {
      setIsSubmitting(false);
      setIsLeadModalOpen(false);
      setIsPrintGiftModalOpen(true);
    }
  };

  const currentDisplayPhotos = todayPhoto ? [...accumulatedPhotos, todayPhoto] : accumulatedPhotos;
  const totalCardSlots = Math.max(selectedFrame.shotCount || 3, 1);
  const isCardComplete = currentDisplayPhotos.length >= totalCardSlots;

  // Pull the customer's stamp card from the cloud; silently keeps local fallback.
  const refreshLoyaltySlots = (phone: string) => {
    if (!phone || phone.length < 6) return;
    fetch(`/api/v1/loyalty/stamps?cafeSlug=${encodeURIComponent(cafeSlug)}&phone=${encodeURIComponent(phone)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (Array.isArray(data?.slots)) {
          setLoyaltySlots(data.slots);
          if (data.slots.length > 0) setCloudSync('synced');
        }
      })
      .catch(() => {
        /* offline / static mode — the card renders from local photos */
      });
  };

  useEffect(() => {
    const clean = customerPhone.trim().replace(/[^0-9]/g, '');
    if (clean.length >= 6 && accumulatedPhotos.length >= 0) {
      refreshLoyaltySlots(clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerPhone]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C130D] flex flex-col items-center selection:bg-[#C59A6F]/30 selection:text-[#1C130D]">
      {/* Top Porcelain Minimalist Header */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-[#E6DDD0] sticky top-0 z-40 py-3.5 px-4 shadow-2xs">
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
              <div className="w-8 h-8 rounded-xl bg-[#1C130D] text-[#FDFBF7] flex items-center justify-center font-black text-sm shadow-xs">
                M
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-[#1C130D] leading-tight flex items-center gap-1.5">
                <span>{settings.branding.name || 'Memories'}</span>
                <span className="text-[#C59A6F] font-serif text-xs">✦</span>
              </h1>
              {customerName ? (
                <div className="flex items-center gap-1.5 text-[10px] text-[#8C7A6B] font-medium">
                  <span className="text-[#1C130D] font-bold">كارت: {customerName}</span>
                  <button
                    type="button"
                    onClick={handleSwitchCustomer}
                    className="text-[#8C7A6B] hover:text-[#1C130D] underline text-[10px] font-bold transition"
                  >
                    (تبديل)
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-[#8C7A6B] font-medium">
                  كارت الذكريات ✦ صورة لكل زيارة
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {extraShots > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F4EDE2] text-[#8C6B47] rounded-full text-xs font-bold font-mono">
                <span>+{extraShots} لقطات إضافية</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-xl mx-auto p-4 sm:p-6 flex-1 flex flex-col items-center">
        {/* Guest vs Registered Customer Subtle Identity Strip */}
        {/* Guest vs Registered Customer Subtle Identity Strip */}
        {customerPhone.trim().length >= 8 ? (
          <div className="w-full bg-[#FAF6EE] border border-[#D9CEBF] rounded-2xl p-3 px-4 mb-4 flex items-center justify-between text-xs animate-in fade-in shadow-xs">
            <div className="flex items-center gap-2 text-[#1C130D]">
              <UserCheck className="w-4 h-4 text-[#8C6B47] shrink-0" />
              <span className="font-bold">مرحباً {customerName || 'صديق المكان'} ({customerPhone})</span>
            </div>
            <button
              type="button"
              onClick={handleSwitchCustomer}
              className="text-[#8C6B47] hover:text-[#1C130D] text-[11px] font-bold underline transition shrink-0"
            >
              تبديل الحساب
            </button>
          </div>
        ) : (
          <div className="w-full bg-gradient-to-r from-[#FAF6EE] to-white border border-[#E6DDD0] rounded-2xl p-3 px-4 mb-4 flex items-center justify-between text-xs animate-in fade-in shadow-xs">
            <div className="flex items-center gap-2 text-[#635345]">
              <Sparkles className="w-4 h-4 text-[#8C6B47] shrink-0" />
              <span className="font-medium">تتصفح كضيف ✦ التقط صورتك مباشرة أو احفظ كارتك برقمك</span>
            </div>
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#1C130D] hover:bg-[#2A1D15] text-[#FDFBF7] text-xs font-bold shadow-xs transition shrink-0"
            >
              حفظ برقمي
            </button>
          </div>
        )}

        {isLockedByCooldown && !todayPhoto ? (
          <div className="w-full bg-white rounded-3xl p-8 border border-[#E6DDD0] shadow-xl text-center my-auto animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-[#F4EDE2] text-[#8C6B47] mx-auto flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-[#1C130D]" />
            </div>

            <h2 className="text-2xl font-black text-[#1C130D] mb-2">
              لقد وثقت لحظتك لليوم يا {customerName || 'ضيفنا الكريم'} ✦
            </h2>
            <p className="text-[#635345] text-xs sm:text-sm leading-relaxed mb-6">
              لكل زائر لقطة واحدة تضاف إلى كارت ذكرياته يومياً.
              <br />
              <span className="font-bold text-[#8C6B47]">
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

            {/* Loyalty stamp card — every photo = one stamp (cloud truth + local fallback) */}
            <div className="my-6">
              <LoyaltyStampCard
                slots={loyaltySlots}
                localPhotos={accumulatedPhotos}
                brandName={settings.branding.name || 'Memories'}
                customerName={customerName || undefined}
                onClaimGift={() => setIsPrintGiftModalOpen(true)}
              />
              {cloudSync === 'local_only' && (
                <p className="text-center text-[10px] text-[#8C6B47] mt-2 font-semibold">
                  ☁︎ اتحفظ على جهازك بس دلوقتي — هيتزامن مع كافيه أول ما النت يرجع
                </p>
              )}
            </div>

            {/* Barista Order Shots & Override Option */}
            <div className="p-5 bg-[#FAF6EE] rounded-3xl border border-[#E6DDD0] text-xs text-[#635345] mb-6">
              <div className="flex items-center justify-center gap-2 font-black text-[#1C130D] text-sm mb-1.5">
                <Coffee className="w-4 h-4 text-[#8C6B47]" />
                <span>طلبات إضافية؟ ✦</span>
              </div>
              <p className="text-xs text-[#635345] mb-4 leading-relaxed">
                كل طلب إضافي يمنحك لقطة جديدة تملأ بها كارت ذكرياتك وتصل لهديتك أسرع.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setPinError(null);
                    setIsBaristaPinModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#1C130D] hover:bg-[#2A1D15] text-[#FDFBF7] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.98]"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C59A6F]" />
                  <span>إضافة لقطة عبر كود {staffLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const clean = customerPhone.trim().replace(/[^0-9]/g, '');
                    const access = CooldownService.checkAccess(clean || deviceId, cafeSlug);
                    if (access.allowed) {
                      setIsLockedByCooldown(false);
                      setExtraShots(access.extraShotsAvailable);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-[#1C130D] font-bold text-xs border border-[#D9CEBF] flex items-center justify-center gap-2 transition"
                >
                  <span>تحديث الحالة</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={handleSwitchCustomer}
                className="px-5 py-2.5 rounded-xl bg-[#F4EDE2] hover:bg-[#EAE1D3] text-[#1C130D] text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>تسجيل رقم هاتف آخر</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ============================================================ */}
            {/* DIGITAL PURSE / WALLET PASS HERO (كارت محفظة الذكريات الرقمي) */}
            {/* ============================================================ */}
            <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in duration-300">
              {/* Luxury Digital Purse Sleeve */}
              <div className="w-full max-w-lg bg-gradient-to-b from-[#1E1B18] via-[#141210] to-[#0A0908] border border-[#38302A] rounded-[32px] p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] relative text-[#FDFBF7] overflow-hidden">
                {/* Subtle Leather Texture & Stitching Detail */}
                <div className="absolute inset-2 rounded-[26px] border border-dashed border-[#C59A6F]/20 pointer-events-none" />
                
                {/* Purse Top Crest & Header */}
                <div className="relative z-10 flex items-center justify-between pb-4 mb-4 border-b border-[#38302A]/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C59A6F] to-[#8C6B47] text-[#1C130D] flex items-center justify-center font-black text-sm shadow-md">
                      {settings.branding.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={settings.branding.logoUrl}
                          alt={settings.branding.name}
                          className="w-7 h-7 object-contain rounded-xl"
                        />
                      ) : (
                        <span>✦</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-[#FDFBF7] tracking-tight">
                          {settings.branding.name || 'Memories Studio'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C59A6F]/20 text-[#E8C7A5] font-bold border border-[#C59A6F]/30">
                          {settings.businessType === 'restaurant'
                            ? '🍽️ مطعم معتمد'
                            : settings.businessType === 'retail'
                            ? '🛍️ بوتيك معتمد'
                            : settings.businessType === 'salon'
                            ? '💅 صالون معتمد'
                            : settings.businessType === 'entertainment'
                            ? '🎳 مركز ترفيه'
                            : settings.businessType === 'events'
                            ? '🎟️ فعالية معتمدة'
                            : '☕ كافيه معتمد'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#A69585] block mt-0.5 font-medium">
                        محفظة الذكريات والولاء الرقمية ✦ Digital Memory Purse
                      </span>
                    </div>
                  </div>

                  {/* Business Dictated Badge */}
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-stone-800 text-[#C59A6F] border border-[#C59A6F]/30 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#C59A6F]" />
                      <span>{selectedFrame.orientation === 'horizontal' ? 'كارت عريض' : 'كارت طولي'}</span>
                    </span>
                    <span className="text-[9px] text-[#8C7A6B] block mt-1 text-center font-mono font-bold">
                      {totalCardSlots} خانات إلزامية
                    </span>
                  </div>
                </div>

                {/* Inset Pocket Holding the Authentic Photobooth Strip Card */}
                <div className="relative z-10 flex justify-center py-2">
                  <PhotoboothStripCard
                    photos={currentDisplayPhotos}
                    frame={{
                      ...selectedFrame,
                      shotCount: totalCardSlots,
                      orientation: settings.defaultOrientation || selectedFrame.orientation || 'vertical',
                      frameShape: settings.defaultFrameShape || selectedFrame.frameShape || 'rounded',
                      cardMode: settings.defaultCardMode || selectedFrame.cardMode || 'korean_noir',
                    }}
                    branding={settings.branding}
                    freeGiftOffer={settings.freeGiftOffer}
                    cardMode={settings.defaultCardMode || selectedFrame.cardMode || 'korean_noir'}
                    onSlotClick={() => {
                      if (!todayPhoto && !isLockedByCooldown) {
                        setIsCameraModalOpen(true);
                      }
                    }}
                  />
                </div>

                {/* Purse Progress & Status Strip */}
                <div className="relative z-10 mt-4 pt-3 border-t border-[#38302A]/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#A69585] font-bold">حالة المحفظة:</span>
                    <span className="font-mono text-xs font-black text-[#E8C7A5]">
                      {currentDisplayPhotos.length} / {totalCardSlots} خانات مكتملة
                    </span>
                  </div>

                  {/* Visual Progress Dots */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalCardSlots }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          idx < currentDisplayPhotos.length
                            ? 'bg-[#C59A6F] ring-2 ring-[#C59A6F]/30'
                            : idx === currentDisplayPhotos.length && !todayPhoto
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Primary Interaction Buttons Under the Purse */}
              <div className="w-full max-w-lg space-y-3">
                {!todayPhoto && !isLockedByCooldown ? (
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-extrabold text-base shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-3 active:scale-[0.98] border border-amber-500/30"
                  >
                    <Camera className="w-5 h-5 text-amber-200" />
                    <span>📸 توثيق لقطة زيارة اليوم (+ إضافة للمحفظة)</span>
                  </button>
                ) : todayPhoto ? (
                  <div className="space-y-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>تمت إضافة لقطة اليوم بنجاح إلى الكارت!</span>
                      </div>
                      <button
                        type="button"
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

                    {customerPhone.trim().length >= 8 ? (
                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
                        <span className="text-stone-700 font-medium">
                          الكارت مربوط برقمك: <strong className="font-mono text-stone-900">{customerPhone}</strong>
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700">✓ محفوظ ومحدث</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsLeadModalOpen(true)}
                        className="w-full py-3.5 px-4 rounded-xl bg-stone-950 hover:bg-stone-900 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                      >
                        <Heart className="w-4 h-4 text-amber-400" />
                        <span>ربط الكارت برقم هاتفك لحفظ زياراتك القادمة</span>
                      </button>
                    )}
                  </div>
                ) : null}

                {/* Gated Retention & Download / Print Milestone Unlocks */}
                <div className="w-full bg-[#FAF8F5] border border-[#E6DDD0] rounded-3xl p-5 shadow-sm space-y-4">
                  {!isCardComplete ? (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Lock className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-stone-900 leading-tight">
                            التحميل عالي الدقة (HD) والطباعة يفتحان عند اكتمال الكارت
                          </h3>
                          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                            كارت ذكرياتك يكتمل بزياراتك القادمة للشراء من المتجر. متبقي{' '}
                            <strong className="text-amber-800 font-bold">
                              {totalCardSlots - currentDisplayPhotos.length} زيارات
                            </strong>{' '}
                            لفتح هديتك الفورية ({settings.freeGiftOffer.title || 'مشروب مجاني'}) وتفعيل تحميل وطباعة الكارت التذكاري.
                          </p>
                        </div>
                      </div>

                      {/* Firmly Gated Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          disabled
                          className="py-3 px-4 rounded-2xl bg-stone-100 text-stone-400 font-bold text-xs border border-stone-200 flex items-center justify-center gap-2 cursor-not-allowed"
                          title="التحميل مغلق حتى إكمال الكارت بالشراء المتكرر"
                        >
                          <Lock className="w-3.5 h-3.5 text-stone-400" />
                          <span>تحميل الكارت HD (مغلق)</span>
                        </button>

                        <button
                          type="button"
                          disabled
                          className="py-3 px-4 rounded-2xl bg-stone-100 text-stone-400 font-bold text-xs border border-stone-200 flex items-center justify-center gap-2 cursor-not-allowed"
                          title="الطباعة مغلقة حتى اكتمال جميع الخانات"
                        >
                          <Lock className="w-3.5 h-3.5 text-stone-400" />
                          <span>طباعة الكارت الفاخر (مغلق)</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Card 100% Complete: Full Celebratory Unlock! */
                    <div className="space-y-4 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 shadow-sm mx-auto">
                        <Sparkles className="w-6 h-6 text-emerald-600 animate-bounce" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-stone-950">
                          🎉 ألف مبروك! اكتمل كارت ذكرياتك بالكامل!
                        </h3>
                        <p className="text-xs text-stone-600 mt-1">
                          استحققت هديتك الفورية:{' '}
                          <strong className="text-amber-900">{settings.freeGiftOffer.title}</strong>
                        </p>
                      </div>

                      {/* Cashier Voucher Code */}
                      <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl inline-flex flex-col items-center justify-center min-w-[240px]">
                        <span className="text-[10px] text-amber-800 font-bold mb-0.5">
                          كود صرف الهدية لدى {staffLabel}:
                        </span>
                        <span className="font-mono text-2xl font-black text-amber-950 tracking-wider">
                          {giftCode || 'GIFT-FREE'}
                        </span>
                      </div>

                      {/* Unlocked Actions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (composedStripUrl) {
                              const a = document.createElement('a');
                              a.href = composedStripUrl;
                              a.download = `memories-pass-${Date.now()}.png`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }
                          }}
                          className="py-3.5 px-4 rounded-2xl bg-stone-950 hover:bg-black text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4 text-amber-400" />
                          <span>تحميل كارت الذكريات HD ⬇️</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (composedStripUrl) {
                              PrintService.printStripImage(composedStripUrl);
                            } else {
                              PrintService.printElement('printable-strip');
                            }
                          }}
                          className="py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                        >
                          <span>🖨️ إرسال الكارت للطباعة</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

              {/* Guest Privacy & Consent Option: Live TV Wall Display */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-200/60 text-amber-900 flex items-center justify-center text-sm shrink-0">
                    📺
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 leading-tight">
                      عرض صورتي على شاشة الكافيه الحية (TV Wall)
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      حرية كاملة للاختيار: يمكنك إلغاء العرض والاحتفاظ بخصوصيتك
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={liveWallConsent}
                    onChange={(e) => setLiveWallConsent(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
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
              تأكيد أوردر {staffLabel}
            </h4>
            <p className="text-[11px] text-center text-stone-500 mb-4 leading-relaxed">
              يقوم {staffLabel} بإدخال الرمز السريع لتأكيد الأوردر وشحن اللقطات فوراً
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
                  رمز PIN {staffLabel}:
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="أدخل رمز التحقق"
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

      
      {/* Camera Viewfinder Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-stone-950 rounded-3xl p-4 sm:p-6 shadow-2xl border border-stone-800 text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  توثيق لقطة زيارة اليوم ✦ {settings.branding.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewfinder Component */}
            <CameraViewfinder
              onCaptureComplete={(photo) => {
                handleCaptureComplete(photo);
                setIsCameraModalOpen(false);
              }}
              brandName={settings.branding.name}
              visitNumber={accumulatedPhotos.length + 1}
              aspectRatioGuide={
                selectedFrame.orientation === 'horizontal'
                  ? '4:3'
                  : '3:4'
              }
            />
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
        cardMode={cardMode}
        stickers={stickers}
      />
    </div>
  );
}
