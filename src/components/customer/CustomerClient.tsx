'use client';

import React, { useState, useEffect } from 'react';
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
import { PRESET_COLOR_PALETTES, PHOTOBOOTH_CARD_MODES, PHOTOBOOTH_FRAME_TEMPLATES } from '@/lib/constants/photobooth-presets';
import { StickerControlTray } from '@/components/photobooth/DraggableStickerLayer';
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
  Camera,
  User,
  UserCheck,
  Palette,
} from 'lucide-react';

export function CustomerClient({ cafeSlug }: { cafeSlug: string }) {
  // Business settings state
  const [settings, setSettings] = useState<BusinessSettings>(() =>
    BusinessSettingsService.getSettings(cafeSlug)
  );

  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(() => {
    return settings.activeColorPaletteId || 'classic-latte';
  });

  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [cardMode, setCardMode] = useState<PhotoboothCardMode>(
    settings.defaultCardMode || 'korean_noir'
  );

  const handleAddSticker = (emoji: string) => {
    if (!emoji.trim()) return;
    const randomOffset = (Math.random() - 0.5) * 20;
    const newSticker: PlacedSticker = {
      id: `stk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
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

  // Customer session state (isolated strictly by phone)
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

  // Check if current customer is identified in this session
  const [isSessionStarted, setIsSessionStarted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const phone = localStorage.getItem('memories_customer_phone');
      const name = localStorage.getItem('memories_customer_name');
      return !!phone && phone.trim().length >= 8 && !!name && name.trim().length > 0;
    }
    return false;
  });

  // Photobooth state: Customer's accumulated photos on their card
  const [accumulatedPhotos, setAccumulatedPhotos] = useState<string[]>([]);
  const [todayPhoto, setTodayPhoto] = useState<string | null>(null);
  const [composedStripUrl, setComposedStripUrl] = useState<string | undefined>(undefined);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isPrintGiftModalOpen, setIsPrintGiftModalOpen] = useState(false);
  const [giftCode, setGiftCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitCount, setVisitCount] = useState(1);
  const [extraShots, setExtraShots] = useState<number>(0);
  const [isBaristaPinModalOpen, setIsBaristaPinModalOpen] = useState<boolean>(false);
  const [baristaPin, setBaristaPin] = useState<string>('');
  const [pinShotsCount, setPinShotsCount] = useState<number>(1);
  const [pinError, setPinError] = useState<string | null>(null);

  // Initialize device ID, check 24-hour cooldown & load saved card for THIS customer
  useEffect(() => {
    let id = localStorage.getItem('memories_device_id');
    if (!id) {
      id = `dev_${Math.random().toString(36).substring(2, 10)}`;
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
            setVisitCount(parsed.length + 1);
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
  }, [cafeSlug, customerPhone]);

  const [recognizedCustomer, setRecognizedCustomer] = useState<{
    name: string;
    totalVisits: number;
    photos?: string[];
  } | null>(null);
  const [showNameInput, setShowNameInput] = useState<boolean>(false);

  // Real-time lookup as customer types their phone
  useEffect(() => {
    const clean = customerPhone.trim().replace(/[^0-9]/g, '');
    if (clean.length >= 8) {
      const lookup = CustomerRegistryService.lookupCustomer(clean, cafeSlug);
      if (lookup.exists && lookup.name) {
        setRecognizedCustomer({
          name: lookup.name,
          totalVisits: lookup.totalVisits || 1,
          photos: lookup.photos,
        });
        setCustomerName(lookup.name);
        if (lookup.role) setCustomerProfession(lookup.role);
        setShowNameInput(false);
      } else {
        setRecognizedCustomer(null);
        setShowNameInput(true);
      }
    } else {
      setRecognizedCustomer(null);
      setShowNameInput(false);
    }
  }, [customerPhone, cafeSlug]);

  const handleStartCustomerSession = (e?: React.FormEvent, directName?: string) => {
    if (e) e.preventDefault();
    const clean = customerPhone.trim().replace(/[^0-9]/g, '');
    if (!clean || clean.length < 8) {
      alert('من فضلك أدخل رقم موبايل صحيح (8 أرقام على الأقل)');
      return;
    }

    const lookup = CustomerRegistryService.lookupCustomer(clean, cafeSlug);
    const finalName = directName || (lookup.exists && lookup.name ? lookup.name : customerName.trim());

    if (!finalName) {
      setShowNameInput(true);
      return;
    }

    // Register or update customer permanently
    CustomerRegistryService.registerCustomer(clean, finalName, customerProfession, cafeSlug);

    // Load isolated photos for this customer
    const phoneKey = `memories_card_photos_${cafeSlug}_${clean}`;
    try {
      localStorage.setItem('memories_customer_phone', clean);
      localStorage.setItem('memories_customer_name', finalName);

      const stored = localStorage.getItem(phoneKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setAccumulatedPhotos(parsed);
          setVisitCount(parsed.length + 1);
        } else {
          setAccumulatedPhotos([]);
          setVisitCount(1);
        }
      } else {
        setAccumulatedPhotos([]);
        setVisitCount(1);
      }
    } catch {
      setAccumulatedPhotos([]);
      setVisitCount(1);
    }

    const access = CooldownService.checkAccess(clean, cafeSlug);
    setExtraShots(access.extraShotsAvailable);
    if (!access.allowed) {
      setIsLockedByCooldown(true);
      setRemainingCooldownHours(access.remainingHours || 24);
    } else {
      setIsLockedByCooldown(false);
    }

    setIsSessionStarted(true);
  };

  const handleSwitchCustomer = () => {
    setIsSessionStarted(false);
    setTodayPhoto(null);
    setAccumulatedPhotos([]);
    setComposedStripUrl(undefined);
    setCustomerPhone('');
    setCustomerName('');
    setCustomerProfession('');
    setRecognizedCustomer(null);
    setShowNameInput(false);
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
      setPinError('رمز الباريستا غير صحيح (الرمز الافتراضي: 1234 أو 7777 أو 2026)');
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
    const code = isCompleted ? `GIFT-${Math.floor(1000 + Math.random() * 9000)}` : '';
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

      // Sync with in-store Live TV Wall
      const wallItem = {
        id: `wall_${Date.now()}`,
        customer: customerName,
        caption: `ذكريات ${customerName} في ${settings.branding.name || 'Memories'} ☕✨`,
        time: 'الآن',
        frames: updatedCardPhotos,
        theme: 'white',
      };
      const existingFeed = JSON.parse(localStorage.getItem(`memories_wall_feed_${cafeSlug}`) || '[]');
      const newFeed = [wallItem, ...existingFeed].slice(0, 20);
      localStorage.setItem(`memories_wall_feed_${cafeSlug}`, JSON.stringify(newFeed));
      window.dispatchEvent(new CustomEvent('memories-wall-updated', { detail: newFeed }));
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
              {isSessionStarted && customerName ? (
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
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FDFBF7] text-[#8C6B47] rounded-full border border-[#D9CEBF] text-xs font-bold font-mono">
              <span>✦</span>
              <span>المكافأة في الخانة الأخيرة</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-xl mx-auto p-4 sm:p-6 flex-1 flex flex-col items-center">
        {/* Step 0: Customer Intake & Isolation First */}
        {!isSessionStarted ? (
          <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DDD0] shadow-xl text-[#1C130D] my-auto animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-[#F4EDE2] text-[#8C6B47] flex items-center justify-center mx-auto mb-4">
              <Camera className="w-7 h-7 text-[#1C130D]" />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-[#1C130D] mb-1.5">
                كارت ذكرياتك وهديتك الفورية
              </h2>
              <p className="text-xs sm:text-sm text-[#635345] leading-relaxed max-w-sm mx-auto">
                سجل رقم هاتفك لفتح كارتك الخاص ومتابعة لقطاتك ومكافآتك في كل زيارة.
              </p>
            </div>

            <form onSubmit={handleStartCustomerSession} className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-xs font-bold text-[#1C130D] mb-1.5 text-right">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01012345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#D9CEBF] focus:border-[#1C130D] focus:ring-2 focus:ring-[#C59A6F]/20 focus:outline-none font-mono text-base text-left bg-[#FDFBF7] transition"
                  dir="ltr"
                  autoFocus
                />
              </div>

              {recognizedCustomer ? (
                /* 1. Existing Registered Customer: Direct 1-Click Auto-Login */
                <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#D9CEBF] text-center animate-in fade-in space-y-2.5">
                  <div className="flex items-center justify-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#8C6B47]" />
                    <p className="text-sm font-black text-[#1C130D]">
                      أهلاً بك مجدداً، {recognizedCustomer.name} ✦ كارتك جاهز
                    </p>
                  </div>
                  <p className="text-xs text-[#635345]">
                    تم العثور على {recognizedCustomer.photos?.length || 0} لقطات سابقة في كارتك
                  </p>
                  <button
                    type="button"
                    onClick={() => handleStartCustomerSession(undefined, recognizedCustomer.name)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#1C130D] hover:bg-[#2A1D15] text-[#FDFBF7] font-bold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <span>دخول مباشر والتقاط صورة اليوم</span>
                    <ArrowRight className="w-4 h-4 text-[#C59A6F] rotate-180" />
                  </button>
                </div>
              ) : showNameInput || customerPhone.trim().length >= 8 ? (
                /* 2. New Customer: Enter Name once */
                <div className="animate-in fade-in space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1C130D] mb-1.5 text-right">
                      الاسم الكريم
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد سامي"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-[#D9CEBF] focus:border-[#1C130D] focus:ring-2 focus:ring-[#C59A6F]/20 focus:outline-none text-base text-right bg-[#FDFBF7] transition"
                      autoFocus
                    />
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#1C130D] hover:bg-[#2A1D15] text-[#FDFBF7] font-bold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <span>فتح كارت الذكريات ✦</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* 3. Initial state before phone completion */
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#1C130D] hover:bg-[#2A1D15] text-[#FDFBF7] font-bold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <span>متابعة</span>
                    <ArrowRight className="w-4 h-4 text-[#C59A6F] rotate-180" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8C7A6B] pt-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8C6B47]" />
                <span>بياناتك وصورك محفوظة بأعلى معايير الخصوصية</span>
              </div>
            </form>
          </div>
        ) : isLockedByCooldown && !todayPhoto ? (
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
                  <span>إضافة لقطة عبر كود الباريستا</span>
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
                    وثّق لحظة زيارة اليوم ✦
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    لكل زيارة لقطة استوديو حية تملأ خانة في كارت ولائك وتقربك من هديتك الفورية
                  </p>
                </div>

                <CameraViewfinder
                  onCaptureComplete={handleCaptureComplete}
                  brandName={settings.branding.name}
                  visitNumber={accumulatedPhotos.length + 1}
                  aspectRatioGuide={
                    selectedFrame.layoutType === 'wide_duo_2cut'
                      ? '4:3'
                      : selectedFrame.layoutType === 'cinema_horizontal'
                      ? '16:9'
                      : selectedFrame.layoutType === 'polaroid_square'
                      ? '1:1'
                      : '3:4'
                  }
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

                {/* Photobooth Mode Selector (5 Authentic Open-Source Modes) */}
                {settings.allowCustomerModeChoice !== false && (
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-stone-200/90 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>ستايل شريط الصور (Photobooth Style):</span>
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {PHOTOBOOTH_CARD_MODES.find((m) => m.id === cardMode)?.nameEn}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {PHOTOBOOTH_CARD_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => {
                            setCardMode(mode.id);
                            const matchingTemplate = PHOTOBOOTH_FRAME_TEMPLATES.find(
                              (t: any) => t.id === mode.id || t.layoutType === (mode.id as any)
                            );
                            setSelectedFrame((prev) => ({
                              ...prev,
                              cardMode: mode.id,
                              layoutType:
                                matchingTemplate?.layoutType ||
                                (mode.id === 'wide_duo_2cut'
                                  ? 'wide_duo_2cut'
                                  : mode.id === 'cinema_horizontal'
                                  ? 'cinema_horizontal'
                                  : mode.id === 'polaroid_classic'
                                  ? 'polaroid_square'
                                  : mode.id === 'kinfolk_minimal'
                                  ? 'kinfolk_minimal'
                                  : mode.id === 'arabica_monochrome'
                                  ? 'arabica_monochrome'
                                  : mode.id === 'retro_film'
                                  ? 'film_35mm'
                                  : prev.layoutType),
                              shotCount: matchingTemplate?.shotCount || prev.shotCount,
                              orientation: matchingTemplate?.orientation || prev.orientation,
                              widthCm: mode.widthCm || matchingTemplate?.widthCm || prev.widthCm,
                              heightCm: mode.heightCm || matchingTemplate?.heightCm || prev.heightCm,
                              bgColor: mode.defaultBg,
                              borderColor: mode.defaultBorder,
                              textColor: mode.defaultText,
                              accentColor: mode.defaultAccent,
                              badgeText: mode.filmBadge,
                            }));
                          }}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition ${
                            cardMode === mode.id
                              ? 'bg-amber-500/10 border-amber-500 text-amber-900 shadow-2xs scale-[1.02]'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <span className="text-base">{mode.icon}</span>
                          <span className="text-[11px] truncate w-full text-center leading-tight">
                            {mode.nameEn}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aesthetic Card Strip with Interactive Draggable Stickers */}
                <div className="flex justify-center py-2">
                  <PhotoboothStripCard
                    photos={currentDisplayPhotos}
                    frame={selectedFrame}
                    branding={settings.branding}
                    freeGiftOffer={settings.freeGiftOffer}
                    cardMode={cardMode}
                    stickers={stickers}
                    onUpdateStickers={setStickers}
                    isStickersInteractive={true}
                  />
                </div>

                {/* Draggable Sticker & Emoji Control Tray */}
                {settings.allowCustomerStickers !== false && (
                  <StickerControlTray
                    onAddSticker={handleAddSticker}
                    stickersCount={stickers.length}
                    onClearAll={() => setStickers([])}
                  />
                )}

                {/* Customer Allowed Color Picker (Strictly Controlled by Business Owner) */}
                {settings.allowCustomerColorChoice && (
                  <CardColorPicker
                    palettes={
                      settings.allowedColorIds && settings.allowedColorIds.length > 0
                        ? PRESET_COLOR_PALETTES.filter((p) =>
                            settings.allowedColorIds?.includes(p.id)
                          )
                        : PRESET_COLOR_PALETTES
                    }
                    selectedPaletteId={selectedPaletteId}
                    onSelectPalette={handleColorPaletteChange}
                  />
                )}

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
        cardMode={cardMode}
        stickers={stickers}
      />
    </div>
  );
}
