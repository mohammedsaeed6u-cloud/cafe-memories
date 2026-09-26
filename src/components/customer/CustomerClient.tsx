'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BusinessSettings, PhotoboothFrame, CardColorPalette, PhotoboothCardMode, PlacedSticker } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { CooldownService } from '@/lib/services/cooldown.service';
import { PrintService } from '@/lib/services/print.service';
import { CameraViewfinder } from '@/components/photobooth/CameraViewfinder';
import { CardColorPicker } from '@/components/photobooth/CardColorPicker';
import { StripComposerService } from '@/lib/services/strip-composer.service';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { PRESET_COLOR_PALETTES, PHOTOBOOTH_CARD_MODES, PHOTOBOOTH_FRAME_TEMPLATES } from '@/lib/constants/photobooth-presets';
import { StickerControlTray } from '@/components/photobooth/DraggableStickerLayer';
import { PasswordInput } from '@/components/ui/PasswordInput';

// Dedicated Feature Slices
import { CoBrandingHeader } from '@/features/co-branding/CoBrandingHeader';
import { CustomerLoyaltyCard } from '@/features/loyalty/CustomerLoyaltyCard';
import { StaffQuickStampModal } from '@/features/loyalty/StaffQuickStampModal';
import { LoyaltyPurseService, CustomerLoyaltyData } from '@/features/loyalty/loyalty-purse.service';
import { VoucherService } from '@/lib/services/voucher.service';
import { PhotoboothResponsiveCard } from '@/features/photobooth/PhotoboothResponsiveCard';
import { PhotoCaptureOrUpload } from '@/features/photobooth/PhotoCaptureOrUpload';
import { InstagramMentionPrompt } from '@/features/social/InstagramMentionPrompt';
import { WallConsentModal } from '@/features/wall-consent/WallConsentModal';
import { CompletionGiftRewardModal } from '@/features/rewards/CompletionGiftRewardModal';
import { ImageSaveService } from '@/lib/services/image-save.service';
import { IosSaveImageModal } from '@/components/photobooth/IosSaveImageModal';
import { AppleLuxuryShowcase } from '@/components/photobooth/AppleLuxuryShowcase';

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
  Share2,
  Award,
} from 'lucide-react';

const createGiftCode = () => `GIFT-${Math.floor(1000 + Math.random() * 9000)}`;
const createTrackedId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function CustomerClient({ cafeSlug: propCafeSlug }: { cafeSlug: string }) {
  // Resolve authoritative cafe slug from query params, pathname, or prop
  const [cafeSlug, setCafeSlug] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryCafe = urlParams.get('cafe') || urlParams.get('slug');
      if (queryCafe) return decodeURIComponent(queryCafe);

      const match = window.location.pathname.match(/\/c\/([^/?#]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    return propCafeSlug || 'memories';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryCafe = urlParams.get('cafe') || urlParams.get('slug');
      if (queryCafe) {
        const resolved = decodeURIComponent(queryCafe);
        if (resolved !== cafeSlug) {
          setCafeSlug(resolved);
          return;
        }
      }
      const match = window.location.pathname.match(/\/c\/([^/?#]+)/);
      if (match && match[1]) {
        const resolved = decodeURIComponent(match[1]);
        if (resolved !== cafeSlug) {
          setCafeSlug(resolved);
        }
      }
    }
  }, [propCafeSlug, cafeSlug]);

  // Business settings state
  const [settings, setSettings] = useState<BusinessSettings>(() =>
    BusinessSettingsService.getSettings(cafeSlug)
  );

  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(() => {
    return settings.activeColorPaletteId || 'memories-signature';
  });

  const staffLabel =
    settings.businessType === 'restaurant'
      ? 'الكاشير أو طاقم الخدمة'
      : settings.businessType === 'retail'
      ? 'الكاشير وفريق المبيعات'
      : settings.businessType === 'salon'
      ? 'فريق الاستقبال'
      : settings.businessType === 'events'
      ? 'منظم الفعالية'
      : 'موظف الكاونتر / الخدمة';

  // Frame selection
  const [selectedFrame, setSelectedFrame] = useState<PhotoboothFrame>(() => {
    const base =
      settings.frames.find((f) => f.id === settings.activeFrameId) ||
      settings.frames[0];
    return {
      ...base,
      templateId: settings.defaultTemplateId || base?.templateId || 'korean_noir_2x6',
      layoutType: settings.defaultLayoutType || base?.layoutType,
      shotCount: settings.defaultShotCount || base?.shotCount || 3,
      orientation: settings.defaultOrientation || base?.orientation || 'vertical',
      frameShape: settings.defaultFrameShape || 'rounded',
      dimensionsPreset: (settings.defaultDimensionsPreset as any) || 'strip_2x6',
    };
  });

  const [cardMode, setCardMode] = useState<PhotoboothCardMode>(
    settings.defaultCardMode || 'polaroid_vintage'
  );

  // Sub-customizer states for viral frames
  const [spotifyBg, setSpotifyBg] = useState<string>('#384C5A');
  const [spotifyTrack, setSpotifyTrack] = useState<{ title: string; artist: string }>({
    title: 'Nobody Gets Me',
    artist: 'SZA • SOS',
  });
  const [ticketSeat, setTicketSeat] = useState<string>('ROW 15 • SEAT A33');
  const [activeTab, setActiveTab] = useState<'studio' | 'loyalty'>('studio');

  // Customer session state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerProfession, setCustomerProfession] = useState('');

  // Loyalty purse state
  const [loyaltyData, setLoyaltyData] = useState<CustomerLoyaltyData>(() =>
    LoyaltyPurseService.getData(customerPhone, cafeSlug, 5)
  );

  // Modals & Flows
  const [isStaffStampModalOpen, setIsStaffStampModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isWallConsentModalOpen, setIsWallConsentModalOpen] = useState(false);
  const [isCompletionRewardOpen, setIsCompletionRewardOpen] = useState(false);
  const [hasAnsweredWallConsent, setHasAnsweredWallConsent] = useState(false);
  const [iosSaveModalImage, setIosSaveModalImage] = useState<string | null>(null);

  // Card photos state
  const [accumulatedPhotos, setAccumulatedPhotos] = useState<string[]>([]);
  const [todayPhoto, setTodayPhoto] = useState<string | null>(null);
  const [composedStripUrl, setComposedStripUrl] = useState<string | undefined>(undefined);
  const [giftCode, setGiftCode] = useState('');
  const [liveWallConsent, setLiveWallConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [isStickerTrayOpen, setIsStickerTrayOpen] = useState(false);
  const [activeCaptureSlot, setActiveCaptureSlot] = useState<number | null>(null);

  const handleAddSticker = (emoji: string) => {
    if (!emoji.trim()) return;
    const randomOffset = (Math.random() - 0.5) * 20;
    const newSticker: PlacedSticker = {
      id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      emoji: emoji.trim(),
      x: Math.max(15, Math.min(85, 50 + randomOffset)),
      y: Math.max(15, Math.min(85, 40 + randomOffset)),
      rotation: Math.round((Math.random() - 0.5) * 30),
      scale: 1,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  // Customer Onboarding / Registration Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccessNotice, setRegSuccessNotice] = useState<string | null>(null);

  // Total slots authoritative from merchant
  const totalCardSlots = Math.max(selectedFrame.shotCount || 3, 1);
  const loyaltyMaxVisits = settings.loyaltyMaxVisits || 5;

  // Hydrate persisted session from storage
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setSettings(BusinessSettingsService.getSettings(cafeSlug));
    };
    window.addEventListener('memories-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('memories-settings-updated', handleSettingsUpdate);
  }, [cafeSlug]);

  useEffect(() => {
    const hydrateSession = () => {
      const storedName = localStorage.getItem('memories_customer_name') || '';
      const storedPhone = localStorage.getItem('memories_customer_phone') || '';
      const storedRole = localStorage.getItem('memories_customer_role') || '';
      if (storedName) setCustomerName(storedName);
      if (storedPhone) setCustomerPhone(storedPhone);
      if (storedRole) setCustomerProfession(storedRole);

      // Restore loyalty data
      const loyalty = LoyaltyPurseService.getData(storedPhone, cafeSlug, loyaltyMaxVisits);
      setLoyaltyData(loyalty);

      // Check wall consent answer
      const consentAnswered = localStorage.getItem(`memories_wall_consent_${cafeSlug}_${storedPhone || 'guest'}`);
      if (consentAnswered) {
        setHasAnsweredWallConsent(true);
        setLiveWallConsent(consentAnswered === 'true');
      }

      // Restore saved photos for this customer
      if (storedPhone) {
        const clean = storedPhone.trim().replace(/[^0-9]/g, '');
        const saved = localStorage.getItem(`memories_card_photos_${cafeSlug}_${clean}`);
        if (saved) {
          try {
            const list = JSON.parse(saved);
            if (Array.isArray(list) && list.length > 0) {
              setAccumulatedPhotos(list);
            }
          } catch {}
        }
      }
    };
    requestAnimationFrame(hydrateSession);
  }, [cafeSlug, loyaltyMaxVisits]);

  // Current photos to display: customer's actual captured photos
  const currentDisplayPhotos = todayPhoto
    ? [...accumulatedPhotos, todayPhoto]
    : accumulatedPhotos;

  // Check completion
  const isCardCompleted = accumulatedPhotos.length >= totalCardSlots || (todayPhoto && accumulatedPhotos.length + 1 >= totalCardSlots);

  // Direct Staff Stamp Handler
  const handleStaffStampSuccess = () => {
    const res = LoyaltyPurseService.addDirectStamp(customerPhone, cafeSlug, loyaltyMaxVisits);
    const updated = LoyaltyPurseService.getData(customerPhone, cafeSlug, loyaltyMaxVisits);
    setLoyaltyData(updated);
    if (res.isCardComplete) {
      const issued = VoucherService.issueVoucher({
        cafeSlug,
        customerPhone,
        customerName: customerName || 'ضيف مميز',
        giftTitle: settings.freeGiftOffer.title,
        giftSubtitle: settings.freeGiftOffer.subtitle,
      });
      setGiftCode(issued.code);
      setIsCompletionRewardOpen(true);
    }
  };

  // Customer Registration & Check-in Handler
  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = regPhone.trim().replace(/[^0-9]/g, '');
    const name = regName.trim();
    if (!clean || clean.length < 8 || !name) return;

    CustomerRegistryService.registerCustomer(clean, name, 'vip_guest', cafeSlug);
    setCustomerPhone(clean);
    setCustomerName(name);
    const updatedLoyalty = LoyaltyPurseService.getData(clean, cafeSlug, loyaltyMaxVisits);
    setLoyaltyData(updatedLoyalty);
    setRegSuccessNotice(`تم تثبيت كارت الولاء بنجاح للعميل (${name})! يمكنك الآن التقاط صورك وختم زياراتك.`);
    setTimeout(() => setRegSuccessNotice(null), 4000);
  };

  const handleClearCustomer = () => {
    setCustomerPhone('');
    setCustomerName('');
    localStorage.removeItem('memories_customer_phone');
    localStorage.removeItem('memories_customer_name');
    setLoyaltyData(LoyaltyPurseService.getData('', cafeSlug, loyaltyMaxVisits));
  };

  // Add or Replace Photo Handler (from camera or file upload)
  const handleCommitPhoto = (photoBase64: string, targetSlot?: number) => {
    const slotIdx = targetSlot !== undefined ? targetSlot : (activeCaptureSlot !== null ? activeCaptureSlot : accumulatedPhotos.length);
    let updated: string[];
    if (slotIdx < accumulatedPhotos.length) {
      updated = [...accumulatedPhotos];
      updated[slotIdx] = photoBase64;
    } else {
      updated = [...accumulatedPhotos, photoBase64];
    }
    setAccumulatedPhotos(updated);
    setActiveCaptureSlot(null);

    const clean = customerPhone.trim().replace(/[^0-9]/g, '') || 'guest';
    try {
      localStorage.setItem(`memories_card_photos_${cafeSlug}_${clean}`, JSON.stringify(updated));
      CustomerRegistryService.registerCustomer(clean, customerName || 'ضيف مميز', 'vip_guest', cafeSlug);
    } catch {}

    // Check if card just completed!
    if (updated.length >= totalCardSlots) {
      const issued = VoucherService.issueVoucher({
        cafeSlug,
        customerPhone: clean,
        customerName: customerName || 'ضيف مميز',
        giftTitle: settings.freeGiftOffer.title,
        giftSubtitle: settings.freeGiftOffer.subtitle,
      });
      setGiftCode(issued.code);

      // Trigger 1-time TV Wall Consent if not answered yet
      if (!hasAnsweredWallConsent) {
        setIsWallConsentModalOpen(true);
      } else {
        setIsCompletionRewardOpen(true);
      }
    }
  };

  // Handle Wall Consent Answer
  const handleWallConsent = (consent: boolean) => {
    setLiveWallConsent(consent);
    setHasAnsweredWallConsent(true);
    const clean = customerPhone.trim().replace(/[^0-9]/g, '') || 'guest';
    localStorage.setItem(`memories_wall_consent_${cafeSlug}_${clean}`, consent ? 'true' : 'false');
    setIsWallConsentModalOpen(false);

    // If consent given, broadcast to wall feed and notify connected TV screens
    if (consent) {
      try {
        const wallItem = {
          id: createTrackedId('wall'),
          customerName: customerName || 'ضيف مميز',
          photoUrl: accumulatedPhotos[0] || '',
          caption: `ذكريات ${customerName || 'ضيف مميز'} في ${settings.branding.name || 'Memories'} ✨☕`,
          timeFormatted: 'الآن',
          visitNumber: loyaltyData.stampedCount || 1,
          createdAt: new Date().toISOString(),
          visibility: 'live_wall',
          status: 'approved',
        };
        const existingFeed = JSON.parse(localStorage.getItem(`memories_wall_feed_${cafeSlug}`) || '[]');
        const newFeed = [wallItem, ...existingFeed].slice(0, 20);
        localStorage.setItem(`memories_wall_feed_${cafeSlug}`, JSON.stringify(newFeed));
        localStorage.setItem('memories_wall_cache_screen-1', JSON.stringify(newFeed));
        window.dispatchEvent(new CustomEvent('memories-wall-updated', { detail: newFeed }));

        try {
          const channel = new BroadcastChannel('memories_screens_channel');
          channel.postMessage({ type: 'WALL_NEW_PHOTO', item: wallItem, feed: newFeed });
          channel.close();
        } catch {}
      } catch {}
    }

    // Now open completion gift reward modal
    setIsCompletionRewardOpen(true);
  };

  // Direct 300 DPI Print or Download
  const handlePrintOrDownload = async () => {
    try {
      const highRes = await StripComposerService.composeStrip({
        photos: currentDisplayPhotos,
        totalSlots: totalCardSlots,
        frame: {
          ...selectedFrame,
          shotCount: totalCardSlots,
          cardMode,
          bgColor: cardMode === 'spotify_player' ? spotifyBg : selectedFrame.bgColor,
          songTitle: spotifyTrack.title,
          songArtist: spotifyTrack.artist,
          ticketSeat,
        },
        branding: settings.branding,
        freeGiftOffer: settings.freeGiftOffer,
        giftCode: giftCode || 'GIFT-2026',
        cardMode,
        stickers,
      });

      // Queue in isolated merchant print station
      try {
        const queueKey = `memories_print_queue_${cafeSlug}`;
        const existingQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
        const newPrintJob = {
          id: createTrackedId('print'),
          name: customerName || 'عميل مميز',
          phone: customerPhone || 'guest',
          role: 'loyal_customer',
          totalVisits: loyaltyData.stampedCount,
          lastVisit: new Date().toISOString(),
          photoStripUrl: highRes,
          format: ((selectedFrame.dimensionsPreset as string) === 'grid_4x6' || (selectedFrame.dimensionsPreset as string) === 'postcard_4x6') ? 'postcard-4x6' : 'standard-2x6',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(queueKey, JSON.stringify([newPrintJob, ...existingQueue].slice(0, 30)));
        window.dispatchEvent(new CustomEvent('memories-print-queue-updated'));

        try {
          const printChannel = new BroadcastChannel('memories_print_channel');
          printChannel.postMessage({ type: 'NEW_PRINT_JOB', job: newPrintJob, cafeSlug });
          printChannel.close();
        } catch {}
      } catch {}

      // Cross-platform & Safari-compliant Image Save / Share
      const saveResult = await ImageSaveService.saveImage({
        dataUrl: highRes,
        filename: `${settings.branding.name}-photostrip-${Date.now()}.png`,
        title: `شريط صور ${customerName || settings.branding.name}`,
      });

      if (saveResult.method === 'fallback') {
        // Open iOS Save Modal for iPhone / Safari
        setIosSaveModalImage(saveResult.blobUrl || highRes);
      }
    } catch {
      window.print();
    }
  };

  return (
    <div className="w-full min-h-screen bg-transparent text-white flex flex-col items-center selection:bg-[#DD0200] selection:text-white pb-16 apple-font">
      {/* 1. CO-BRANDING HEADER: memories × Business */}
      <div className="w-full pt-3 px-3 sm:px-4">
        <CoBrandingHeader branding={settings.branding} />
      </div>

      <main className="w-full max-w-xl mx-auto px-3 sm:px-4 pt-3 flex flex-col items-center space-y-4">
        {/* Registration Success Toast */}
        {regSuccessNotice && (
          <div className="w-full p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-lg backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{regSuccessNotice}</span>
          </div>
        )}

        {/* TOP LEVEL SEGMENTED NAVIGATION: Clear separation between Photobooth Studio and Loyalty Pass */}
        <div className="w-full grid grid-cols-2 p-1.5 bg-[#141212] rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-4px_rgba(221,2,0,0.5)] font-black'
                : 'text-[#A19E9B] hover:text-[#FBF9F5] hover:bg-white/[0.04]'
            }`}
          >
            <Camera className="w-4 h-4 text-[#FBF9F5]" />
            <span>استوديو الصور ({totalCardSlots} لقطات)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('loyalty')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'loyalty'
                ? 'bg-[#DD0200] text-[#FBF9F5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-4px_rgba(221,2,0,0.5)] font-black'
                : 'text-[#A19E9B] hover:text-[#FBF9F5] hover:bg-white/[0.04]'
            }`}
          >
            <Award className="w-4 h-4 text-[#FBF9F5]" />
            <span>كارت الولاء ({loyaltyData.stampedCount}/{loyaltyMaxVisits})</span>
          </button>
        </div>

        {/* VIEW 1: PHOTOBOOTH STUDIO (Focused 100% on capturing & customizing the strip) */}
        {activeTab === 'studio' && (
          <div className="w-full flex flex-col items-center space-y-4 animate-in fade-in duration-200">
            {/* Header Strip: Title and slots badge */}
            <div className="w-full flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  شريط الذكريات
                </h2>
                <span className="text-[10px] font-mono text-[#D9D9D9] bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-full font-bold">
                  {totalCardSlots} لقطات • {selectedFrame.widthCm === 10 ? 'بوستكارد 4×6' : 'شريط 2×6'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#D9D9D9]/80 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                <span>{accumulatedPhotos.length} من {totalCardSlots} لقطات موثقة</span>
              </div>
            </div>

            {/* Hero Photobooth Card */}
            <div className="w-full flex justify-center py-1 animate-in zoom-in-95 duration-200">
              <PhotoboothResponsiveCard
                photos={currentDisplayPhotos}
                frame={{
                  ...selectedFrame,
                  shotCount: totalCardSlots,
                  cardMode,
                  bgColor: cardMode === 'spotify_player' ? spotifyBg : selectedFrame.bgColor,
                  songTitle: spotifyTrack.title,
                  songArtist: spotifyTrack.artist,
                  ticketSeat,
                }}
                branding={settings.branding}
                freeGiftOffer={settings.freeGiftOffer}
                cardMode={cardMode}
                stickers={stickers}
                onUpdateStickers={setStickers}
                isStickersInteractive={true}
                onSlotClick={(slotIdx) => {
                  setActiveCaptureSlot(slotIdx);
                  setIsCameraModalOpen(true);
                }}
                dimensionPreset={selectedFrame.dimensionsPreset || (selectedFrame.widthCm === 10 ? 'grid_4x6' : 'strip_2x6')}
              />
            </div>

            {/* Action: Take Photo Or Upload */}
            <PhotoCaptureOrUpload
              canShoot={true}
              onOpenLiveCamera={() => {
                setActiveCaptureSlot(accumulatedPhotos.length < totalCardSlots ? accumulatedPhotos.length : 0);
                setIsCameraModalOpen(true);
              }}
              onUploadPhoto={(b64) => handleCommitPhoto(b64)}
            />

            {/* Viral Theme Pills Selector */}
            <div className="w-full space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-[#D9D9D9]/80">طابع وإطار الكارت:</span>
                <span className="text-[10px] text-[#DD0200] font-mono font-bold">THEMES</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x">
                {[
                  { id: 'luxury_glass', label: 'جلاسي فاخر (Luxury Glass)', icon: '💎' },
                  { id: 'polaroid_vintage', label: 'بولارويد كلاسيك', icon: '🎞️' },
                  { id: 'korean_noir', label: 'نوار كوري عاجي', icon: '☕' },
                  { id: 'ticket_express', label: 'تذكرة الزيارة', icon: '🎟️' },
                  { id: 'ios_camera', label: 'كاميرا آيفون', icon: '📷' },
                  { id: 'spotify_player', label: 'مشغل سبوتيفاي', icon: '🎵' },
                  { id: 'ios_gallery_light', label: 'ألبوم آيفون', icon: '🖼️' },
                  { id: 'ios_imessage', label: 'آي مسج', icon: '💬' },
                ].map((mode) => {
                  const isActive = cardMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setCardMode(mode.id as PhotoboothCardMode)}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-[#DD0200] text-[#FBF9F5] border-[#DD0200] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_16px_-4px_rgba(221,2,0,0.5)] font-black'
                          : 'bg-[#1C1B1B]/70 hover:bg-[#211F1F] text-[#A19E9B] hover:text-[#FBF9F5] border-white/10'
                      }`}
                    >
                      <span className="text-sm">{mode.icon}</span>
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-customizer for Spotify */}
              {cardMode === 'spotify_player' && (
                <div className="p-4 bg-[#141212] border border-white/10 rounded-2xl space-y-3 text-xs shadow-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-[#e6e1e1]">لون الخلفية:</span>
                    {[
                      { id: '#384C5A', name: 'Slate Blue', hex: '#384C5A' },
                      { id: '#4E483E', name: 'Warm Taupe', hex: '#4E483E' },
                      { id: '#161618', name: 'OLED Charcoal', hex: '#161618' },
                      { id: '#8B3A2B', name: 'Terracotta', hex: '#8B3A2B' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSpotifyBg(c.hex)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                          spotifyBg === c.hex ? 'border-[#DD0200] ring-1 ring-[#DD0200]/40 text-[#FBF9F5] bg-[#55100D]/30' : 'border-white/10 text-[#A19E9B] bg-[#1C1B1B]'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#e6e1e1]">الأغنية المفضلة للكارت:</span>
                      <span className="text-[10px] text-[#DD0200] font-mono font-bold">SPOTIFY DOCK</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { title: 'Morning Coffee', artist: 'Lofi Cafe Beats' },
                        { title: 'Nobody Gets Me', artist: 'SZA • SOS' },
                        { title: 'صباح ومساء', artist: 'فيروز' },
                        { title: 'Golden Hour', artist: 'JVKE' },
                        { title: 'نسم علينا الهوى', artist: 'فيروز' },
                      ].map((preset) => (
                        <button
                          key={preset.title}
                          type="button"
                          onClick={() => setSpotifyTrack(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                            spotifyTrack.title === preset.title
                              ? 'bg-[#55100D]/60 text-[#FBF9F5] border-[#DD0200]/50 font-black'
                              : 'bg-[#1C1B1B] border-white/10 text-[#A19E9B] hover:text-[#FBF9F5]'
                          }`}
                        >
                          🎵 {preset.title}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      <input
                        type="text"
                        value={spotifyTrack.title}
                        onChange={(e) => setSpotifyTrack((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="اسم الأغنية..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] focus:bg-[#0E0D0D] focus:outline-none focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30 font-bold placeholder-[#A19E9B]/50"
                      />
                      <input
                        type="text"
                        value={spotifyTrack.artist}
                        onChange={(e) => setSpotifyTrack((prev) => ({ ...prev, artist: e.target.value }))}
                        placeholder="اسم الفنان / الألبوم..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] focus:bg-[#0E0D0D] focus:outline-none focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30 font-bold placeholder-[#A19E9B]/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-customizer for Location / Seat */}
              {cardMode === 'ticket_express' && (
                <div className="p-4 bg-[#141212] border border-white/10 rounded-2xl space-y-2 text-xs shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#e6e1e1]">موقع الجلسة أو الركن:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['طاولة 04 • صالة', 'جلسة VIP', 'ركن الاستقبال', 'الفرع الرئيسي'].map((seat) => (
                        <button
                          key={seat}
                          type="button"
                          onClick={() => setTicketSeat(seat)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                            ticketSeat === seat
                              ? 'bg-[#55100D]/60 text-[#FBF9F5] border-[#DD0200]/50 font-black'
                              : 'bg-[#1C1B1B] border-white/10 text-[#A19E9B] hover:text-[#FBF9F5]'
                          }`}
                        >
                          {seat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={ticketSeat}
                    onChange={(e) => setTicketSeat(e.target.value)}
                    placeholder="رقم الطاولة أو الموقع (مثال: طاولة VIP 12 أو الركن 03)..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-white/10 bg-[#0B0A0A] text-[#FBF9F5] focus:bg-[#0E0D0D] focus:outline-none focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30 font-bold placeholder-[#A19E9B]/50"
                  />
                </div>
              )}
            </div>

            {/* Stickers & Doodles Decoration Tray */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => setIsStickerTrayOpen(!isStickerTrayOpen)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#141212] hover:bg-[#1C1B1B] border border-white/10 text-[#FBF9F5] font-bold text-xs shadow-xl transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#DD0200]" />
                  <span>تزيين الكارت بالملصقات والإيموجي (Stickers &amp; Doodles)</span>
                </div>
                <span className="text-[10px] font-mono text-[#FBF9F5] bg-[#55100D]/60 px-2.5 py-0.5 rounded-md border border-[#DD0200]/40 font-bold uppercase tracking-wider">
                  {stickers.length > 0 ? `${stickers.length} ملصق بالكارت` : 'إضافة ملصقات +'}
                </span>
              </button>

              {isStickerTrayOpen && (
                <div className="animate-in fade-in duration-200">
                  <StickerControlTray
                    onAddSticker={handleAddSticker}
                    onClearAll={() => setStickers([])}
                    stickersCount={stickers.length}
                  />
                </div>
              )}
            </div>

            {/* High Res Download Direct Action */}
            <button
              type="button"
              onClick={handlePrintOrDownload}
              className="w-full max-w-md py-3 px-4 rounded-lg bg-[#141212] hover:bg-[#1C1B1B] border border-white/10 hover:border-[#DD0200]/30 text-[#FBF9F5] font-bold text-xs shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-[#DD0200]" />
              <span>تحميل شريط الذكريات عالي الدقة (300 DPI)</span>
            </button>

            {/* Instagram Mention Prompt */}
            <InstagramMentionPrompt
              instagramHandle={settings.branding.instagramHandle || '@memories_studio'}
              businessName={settings.branding.name}
            />

            {/* Contextual Link to Loyalty */}
            <div className="w-full p-4 rounded-2xl bg-[#141212] border border-white/10 flex items-center justify-between gap-3 text-right shadow-2xl mt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#55100D] border border-[#DD0200]/40 text-[#FBF9F5] flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <Award className="w-5 h-5 text-[#DD0200]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#FBF9F5]">هل أنت من رواد {settings.branding.name}؟</p>
                  <p className="text-[11px] text-[#A19E9B]">اجمع أختام زياراتك واستلم هديتك المجانية في كارت ولاء هاتفك</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('loyalty')}
                className="px-3.5 py-2 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shrink-0 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] cursor-pointer"
              >
                عرض كارت الولاء
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: LOYALTY PASS & WALLET (Focused 100% on Visits, Stamps, Wallet Passes, and Free Gifts) */}
        {activeTab === 'loyalty' && (
          <div className="w-full flex flex-col items-center space-y-4 animate-in fade-in duration-200">
            {/* Header: Title and Visits Status */}
            <div className="w-full flex items-center justify-between px-1 pt-1">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#FBF9F5]" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                  كارت الولاء والمحفظة الرقمية
                </h2>
                <p className="text-[11px] text-[#A19E9B]">
                  أختام زياراتك المعتمدة وهديتك الفورية في {settings.branding.name}
                </p>
              </div>

              <span className="text-[11px] font-mono text-[#FBF9F5] bg-[#55100D]/60 border border-[#DD0200]/40 px-2.5 py-1 rounded-md font-bold">
                {loyaltyData.stampedCount} من {loyaltyMaxVisits} أختام
              </span>
            </div>

            {/* Customer Profile & Digital Wallet Pass */}
            <div className="w-full">
              {customerPhone ? (
                <div className="space-y-3">
                  <div className="w-full p-3 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#55100D] border border-[#DD0200]/40 text-[#FBF9F5] flex items-center justify-center font-bold">
                        <CheckCircle className="w-4 h-4 text-[#DD0200]" />
                      </div>
                      <div>
                        <span className="font-bold text-[#FBF9F5]">{customerName || 'ضيف مميز'}</span>
                        <span className="text-[10px] text-[#A19E9B] font-mono block" dir="ltr">{customerPhone}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      className="text-[10px] text-[#A19E9B] hover:text-[#FBF9F5] underline cursor-pointer"
                    >
                      تغيير الحساب
                    </button>
                  </div>

                  <CustomerLoyaltyCard
                    loyaltyData={loyaltyData}
                    giftTitle={settings.freeGiftOffer.title}
                    brandName={settings.branding.name}
                    instagramHandle={settings.branding.instagramHandle}
                    onOpenStaffStamp={() => setIsStaffStampModalOpen(true)}
                  />
                </div>
              ) : (
                <div className="w-full p-4 sm:p-5 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl text-[#e6e1e1] space-y-3">
                  <div className="flex items-center gap-2.5 border-b border-white/10 pb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#55100D] border border-[#DD0200]/40 text-[#FBF9F5] flex items-center justify-center font-bold shadow-xs">
                      <UserCheck className="w-4 h-4 text-[#DD0200]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#FBF9F5]">
                        احفظ أختامك وصورك في محفظة هاتفك
                      </h3>
                      <p className="text-[11px] text-[#A19E9B]">
                        سجّل رقمك لحفظ أختام كارتك واستلام هديتك الفورية عند اكتماله
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleRegisterCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-[#e6e1e1] block mb-1">الاسم أو اللقب:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: أحمد، سارة، ضيفنا المميز..."
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-[#FBF9F5] focus:bg-[#0E0D0D] focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30 focus:outline-none placeholder-[#A19E9B]/50"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#e6e1e1] block mb-1">رقم الموبايل:</label>
                      <input
                        type="tel"
                        required
                        placeholder="01xxxxxxxxx"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0B0A0A] text-xs text-[#FBF9F5] focus:bg-[#0E0D0D] focus:border-[#DD0200] focus:ring-1 focus:ring-[#DD0200]/30 focus:outline-none font-mono placeholder-[#A19E9B]/50"
                        dir="ltr"
                      />
                    </div>
                    <div className="sm:col-span-2 pt-1">
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-5px_rgba(221,2,0,0.4)] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#FBF9F5]" />
                        <span>حفظ كارت الولاء والأختام</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Contextual Link to Studio */}
            <div className="w-full p-4 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl flex items-center justify-between gap-3 text-right mt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#55100D] border border-[#DD0200]/40 text-[#FBF9F5] flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-[#DD0200]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#FBF9F5]">وثّق زيارتك الحالية بصورة في الاستوديو</p>
                  <p className="text-[11px] text-[#A19E9B]">التقط لقطة تذكارية بالكاميرا وأضف نغمتك والملصقات المفضلة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className="px-3.5 py-2 rounded-lg bg-[#DD0200] hover:bg-[#B50200] text-[#FBF9F5] font-bold text-xs shrink-0 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] cursor-pointer"
              >
                فتح استوديو الصور
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 9. MODALS */}
      {/* Live Camera Viewfinder Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#141212] rounded-2xl p-4 overflow-hidden border border-white/10 shadow-[0_0_50px_-10px_rgba(221,2,0,0.3)] relative">
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(false)}
              className="absolute top-4 left-4 z-30 w-8 h-8 rounded-lg bg-black/60 hover:bg-[#DD0200] text-white flex items-center justify-center transition cursor-pointer border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
            <CameraViewfinder
              brandName={settings.branding.name}
              visitNumber={(activeCaptureSlot !== null ? activeCaptureSlot : accumulatedPhotos.length) + 1}
              onCaptureComplete={(photo: string) => {
                handleCommitPhoto(photo);
                setIsCameraModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Staff Quick Stamp Modal */}
      <StaffQuickStampModal
        isOpen={isStaffStampModalOpen}
        onClose={() => setIsStaffStampModalOpen(false)}
        onStampSuccess={handleStaffStampSuccess}
        staffLabel={staffLabel}
      />

      {/* TV Wall Display Consent Modal (Triggered ONCE on 100% completion) */}
      <WallConsentModal
        isOpen={isWallConsentModalOpen}
        businessName={settings.branding.name}
        onConsent={handleWallConsent}
        onClose={() => setIsWallConsentModalOpen(false)}
      />

      {/* Completion Gift Reward Voucher Modal */}
      <CompletionGiftRewardModal
        isOpen={isCompletionRewardOpen}
        giftTitle={settings.freeGiftOffer.title}
        giftSubtitle={settings.freeGiftOffer.subtitle}
        giftCode={giftCode || 'GIFT-2026'}
        onClose={() => setIsCompletionRewardOpen(false)}
        onPrintStrip={handlePrintOrDownload}
      />

      {/* Safari / iOS Save Image Sheet Modal */}
      <IosSaveImageModal
        open={!!iosSaveModalImage}
        imageUrl={iosSaveModalImage}
        filename={`${settings.branding.name}-photostrip.png`}
        onClose={() => setIosSaveModalImage(null)}
      />
    </div>
  );
}
