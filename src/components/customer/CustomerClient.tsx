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
import { PhotoboothResponsiveCard } from '@/features/photobooth/PhotoboothResponsiveCard';
import { PhotoCaptureOrUpload } from '@/features/photobooth/PhotoCaptureOrUpload';
import { InstagramMentionPrompt } from '@/features/social/InstagramMentionPrompt';
import { WallConsentModal } from '@/features/wall-consent/WallConsentModal';
import { CompletionGiftRewardModal } from '@/features/rewards/CompletionGiftRewardModal';

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
} from 'lucide-react';

const createGiftCode = () => `GIFT-${Math.floor(1000 + Math.random() * 9000)}`;
const createTrackedId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function CustomerClient({ cafeSlug }: { cafeSlug: string }) {
  // Business settings state
  const [settings, setSettings] = useState<BusinessSettings>(() =>
    BusinessSettingsService.getSettings(cafeSlug)
  );

  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(() => {
    return settings.activeColorPaletteId || 'memories-signature';
  });

  const staffLabel =
    settings.businessType === 'restaurant'
      ? 'الكاشير أو الجرسون'
      : settings.businessType === 'retail'
      ? 'الكاشير'
      : settings.businessType === 'salon'
      ? 'الاستقبال'
      : 'الباريستا';

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
    setLoyaltyData(LoyaltyPurseService.getData(customerPhone, cafeSlug, loyaltyMaxVisits));
  };

  // Customer Registration & Check-in Handler
  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = regPhone.trim().replace(/[^0-9]/g, '');
    const name = regName.trim();
    if (!clean || clean.length < 8 || !name) return;

    CustomerRegistryService.registerCustomer(clean, name, 'coffee_lover', cafeSlug);
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
      CustomerRegistryService.registerCustomer(clean, customerName || 'ضيف الكافيه', 'coffee_lover', cafeSlug);
    } catch {}

    // Check if card just completed!
    if (updated.length >= totalCardSlots) {
      const code = createGiftCode();
      setGiftCode(code);

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
          name: customerName || 'ضيف الكافيه',
          phone: customerPhone || 'guest',
          role: 'coffee_lover',
          totalVisits: loyaltyData.stampedCount,
          lastVisit: new Date().toISOString(),
          photoStripUrl: highRes,
          format: ((selectedFrame.dimensionsPreset as string) === 'grid_4x6' || (selectedFrame.dimensionsPreset as string) === 'postcard_4x6') ? 'postcard-4x6' : 'standard-2x6',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(queueKey, JSON.stringify([newPrintJob, ...existingQueue].slice(0, 30)));
        window.dispatchEvent(new CustomEvent('memories-print-queue-updated'));
      } catch {}

      // Trigger download
      const link = document.createElement('a');
      link.href = highRes;
      link.download = `${settings.branding.name}-photostrip-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.print();
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col items-center selection:bg-amber-500/20 pb-16">
      {/* 1. CO-BRANDING HEADER: memories × Business */}
      <div className="w-full pt-3 px-3 sm:px-4">
        <CoBrandingHeader branding={settings.branding} />
      </div>

      <main className="w-full max-w-xl mx-auto px-3 sm:px-4 pt-3 flex flex-col items-center space-y-4">
        {/* Registration Success Toast */}
        {regSuccessNotice && (
          <div className="w-full p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{regSuccessNotice}</span>
          </div>
        )}

        {/* TOP LEVEL SEGMENTED NAVIGATION: Clear separation between Photobooth Studio and Loyalty Pass */}
        <div className="w-full grid grid-cols-2 p-1.5 bg-stone-200/80 rounded-2xl border border-stone-300/70 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-white text-stone-950 shadow-sm font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-600" />
            <span>استوديو الصور ({totalCardSlots} لقطات)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('loyalty')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'loyalty'
                ? 'bg-white text-stone-950 shadow-sm font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Coffee className="w-4 h-4 text-amber-600" />
            <span>كارت الولاء ({loyaltyData.stampedCount}/{loyaltyMaxVisits})</span>
          </button>
        </div>

        {/* VIEW 1: PHOTOBOOTH STUDIO (Focused 100% on capturing & customizing the strip) */}
        {activeTab === 'studio' && (
          <div className="w-full flex flex-col items-center space-y-4 animate-in fade-in duration-200">
            {/* Header Strip: Title and slots badge */}
            <div className="w-full flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-stone-950">
                  شريط الذكريات
                </h2>
                <span className="text-[10px] font-mono text-amber-900 bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 rounded-full font-bold">
                  {totalCardSlots} لقطات • {selectedFrame.widthCm === 10 ? 'بوستكارد 4×6' : 'شريط 2×6'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
                <span className="text-[11px] font-bold text-stone-600">طابع وإطار الكارت:</span>
                <span className="text-[10px] text-amber-700 font-mono font-bold">THEMES</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x">
                {[
                  { id: 'polaroid_vintage', label: 'بولارويد كلاسيك', icon: '🎞️' },
                  { id: 'korean_noir', label: 'نوار كوري عاجي', icon: '☕' },
                  { id: 'ticket_express', label: 'تذكرة الكافيه', icon: '🎟️' },
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
                      className={`px-3 py-2 rounded-2xl border text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-black'
                          : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
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
                <div className="p-3.5 bg-white border border-stone-200/90 rounded-2xl space-y-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-stone-700">لون الخلفية:</span>
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
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-[10px] font-bold transition cursor-pointer ${
                          spotifyBg === c.hex ? 'border-amber-500 ring-2 ring-amber-400/40' : 'border-stone-200'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-1 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-700">الأغنية المفضلة للكارت:</span>
                      <span className="text-[10px] text-stone-400 font-mono">SPOTIFY DOCK</span>
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
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-black'
                              : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
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
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-500 font-bold"
                      />
                      <input
                        type="text"
                        value={spotifyTrack.artist}
                        onChange={(e) => setSpotifyTrack((prev) => ({ ...prev, artist: e.target.value }))}
                        placeholder="اسم الفنان / الألبوم..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-500 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-customizer for Cafe Table / Spot */}
              {cardMode === 'ticket_express' && (
                <div className="p-3.5 bg-white border border-stone-200/90 rounded-2xl space-y-2 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-700">موقع الجلسة بالكافيه:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['طاولة 04 • صالة', 'طاولة 08 • تراس', 'جلسة بار • كاونتر'].map((seat) => (
                        <button
                          key={seat}
                          type="button"
                          onClick={() => setTicketSeat(seat)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                            ticketSeat === seat ? 'bg-amber-100 text-amber-900 border-amber-300 font-black' : 'bg-stone-50 border-stone-200 text-stone-600'
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
                    placeholder="أو اكتب رقم طاولتك (مثال: طاولة VIP 12)..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              )}
            </div>

            {/* Stickers & Doodles Decoration Tray */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => setIsStickerTrayOpen(!isStickerTrayOpen)}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-xs shadow-2xs transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>تزيين الكارت بالملصقات والإيموجي (Stickers &amp; Doodles)</span>
                </div>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-bold">
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
              className="w-full max-w-md py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>تحميل شريط الذكريات عالي الدقة (300 DPI)</span>
            </button>

            {/* Instagram Mention Prompt */}
            <InstagramMentionPrompt
              instagramHandle={settings.branding.instagramHandle || '@espressolab_eg'}
              businessName={settings.branding.name}
            />

            {/* Contextual Link to Loyalty */}
            <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between gap-3 text-right shadow-2xs mt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-stone-950">هل أنت من رواد {settings.branding.name}؟</p>
                  <p className="text-[11px] text-stone-600">اجمع أختام زياراتك واستلم هديتك المجانية في كارت ولاء هاتفك</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('loyalty')}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition shadow-xs cursor-pointer"
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
                <h2 className="text-sm sm:text-base font-black text-stone-950">
                  كارت الولاء والمحفظة الرقمية
                </h2>
                <p className="text-[11px] text-stone-500">
                  أختام زياراتك المعتمدة وهديتك الفورية في {settings.branding.name}
                </p>
              </div>

              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2.5 py-1 rounded-full font-bold">
                {loyaltyData.stampedCount} من {loyaltyMaxVisits} أختام
              </span>
            </div>

            {/* Customer Profile & Digital Wallet Pass */}
            <div className="w-full">
              {customerPhone ? (
                <div className="space-y-3">
                  <div className="w-full p-3 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-stone-950">{customerName || 'ضيف مميز'}</span>
                        <span className="text-[10px] text-stone-500 font-mono block" dir="ltr">{customerPhone}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      className="text-[10px] text-stone-400 hover:text-stone-700 underline cursor-pointer"
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
                <div className="w-full p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm text-stone-900 space-y-3">
                  <div className="flex items-center gap-2.5 border-b border-stone-100 pb-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-stone-950">
                        احفظ أختامك وصورك في محفظة هاتفك
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        سجّل رقمك لحفظ أختام كارتك واستلام هديتك الفورية عند اكتماله
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleRegisterCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">الاسم أو اللقب:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: أحمد، سارة، ضيف الكافيه..."
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/70 text-xs text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">رقم الموبايل:</label>
                      <input
                        type="tel"
                        required
                        placeholder="01xxxxxxxxx"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/70 text-xs text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div className="sm:col-span-2 pt-1">
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>حفظ كارت الولاء والأختام</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Contextual Link to Studio */}
            <div className="w-full p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center justify-between gap-3 text-right mt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-stone-950">وثّق زيارتك الحالية بصورة في الاستوديو</p>
                  <p className="text-[11px] text-stone-600">التقط لقطة تذكارية بالكاميرا وأضف نغمتك والملصقات المفضلة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shrink-0 transition shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-stone-900 rounded-3xl p-4 overflow-hidden border border-stone-700 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(false)}
              className="absolute top-4 left-4 z-30 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer"
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
    </div>
  );
}
