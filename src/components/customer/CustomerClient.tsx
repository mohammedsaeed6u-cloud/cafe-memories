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
import { AestheticSampleToggle } from '@/features/photobooth/AestheticSampleToggle';
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

const AESTHETIC_PREVIEW_PORTRAITS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
];

export function CustomerClient({ cafeSlug }: { cafeSlug: string }) {
  // Business settings state
  const [settings, setSettings] = useState<BusinessSettings>(() =>
    BusinessSettingsService.getSettings(cafeSlug)
  );

  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(() => {
    return settings.activeColorPaletteId || 'ticket-express-cream';
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
      templateId: settings.defaultTemplateId || base?.templateId || 'snap_express_ticket_2x6',
      layoutType: settings.defaultLayoutType || base?.layoutType,
      shotCount: settings.defaultShotCount || base?.shotCount || 3,
      orientation: settings.defaultOrientation || base?.orientation || 'vertical',
      frameShape: settings.defaultFrameShape || 'rounded',
      dimensionsPreset: (settings.defaultDimensionsPreset as any) || 'strip_2x6',
    };
  });

  const [cardMode, setCardMode] = useState<PhotoboothCardMode>(
    settings.defaultCardMode || 'ticket_express'
  );

  // Sub-customizer states for viral frames
  const [spotifyBg, setSpotifyBg] = useState<string>('#384C5A');
  const [spotifyTrack, setSpotifyTrack] = useState<{ title: string; artist: string }>({
    title: 'Nobody Gets Me',
    artist: 'SZA • SOS',
  });
  const [ticketSeat, setTicketSeat] = useState<string>('ROW 15 • SEAT A33');

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

  // Preview Mode with high-aesthetic portraits (defaults to false for real customer card)
  const [isPreviewWithSamples, setIsPreviewWithSamples] = useState<boolean>(false);

  // Customer Onboarding / Registration Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccessNotice, setRegSuccessNotice] = useState<string | null>(null);

  // Total slots authoritative from merchant
  const totalCardSlots = Math.max(selectedFrame.shotCount || 3, 1);

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
      const loyalty = LoyaltyPurseService.getData(storedPhone, cafeSlug, 5);
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
              setIsPreviewWithSamples(false); // Switch to real card if photos exist
            }
          } catch {}
        }
      }
    };
    requestAnimationFrame(hydrateSession);
  }, [cafeSlug]);

  // Current photos to display: samples if preview mode, or customer's actual photos
  const currentDisplayPhotos =
    isPreviewWithSamples && accumulatedPhotos.length === 0
      ? AESTHETIC_PREVIEW_PORTRAITS.slice(0, totalCardSlots)
      : todayPhoto
      ? [...accumulatedPhotos, todayPhoto]
      : accumulatedPhotos;

  // Check completion
  const isCardCompleted = accumulatedPhotos.length >= totalCardSlots || (todayPhoto && accumulatedPhotos.length + 1 >= totalCardSlots);

  // Direct Staff Stamp Handler
  const handleStaffStampSuccess = () => {
    const res = LoyaltyPurseService.addDirectStamp(customerPhone, cafeSlug, 5);
    setLoyaltyData(LoyaltyPurseService.getData(customerPhone, cafeSlug, 5));
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
    const updatedLoyalty = LoyaltyPurseService.getData(clean, cafeSlug, 5);
    setLoyaltyData(updatedLoyalty);
    setRegSuccessNotice(`تم تثبيت كارت الولاء بنجاح للعميل (${name})! يمكنك الآن التقاط صورك وختم زياراتك.`);
    setTimeout(() => setRegSuccessNotice(null), 4000);
  };

  const handleClearCustomer = () => {
    setCustomerPhone('');
    setCustomerName('');
    localStorage.removeItem('memories_customer_phone');
    localStorage.removeItem('memories_customer_name');
    setLoyaltyData(LoyaltyPurseService.getData('', cafeSlug, 5));
  };

  // Add Photo Handler (from camera, file upload, or test shot)
  const handleCommitPhoto = (photoBase64: string) => {
    setIsPreviewWithSamples(false);
    const updated = [...accumulatedPhotos, photoBase64];
    setAccumulatedPhotos(updated);

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

  // Quick aesthetic test shot
  const handleQuickSampleShot = () => {
    const nextIdx = accumulatedPhotos.length % AESTHETIC_PREVIEW_PORTRAITS.length;
    handleCommitPhoto(AESTHETIC_PREVIEW_PORTRAITS[nextIdx]);
  };

  // Handle Wall Consent Answer
  const handleWallConsent = (consent: boolean) => {
    setLiveWallConsent(consent);
    setHasAnsweredWallConsent(true);
    const clean = customerPhone.trim().replace(/[^0-9]/g, '') || 'guest';
    localStorage.setItem(`memories_wall_consent_${cafeSlug}_${clean}`, consent ? 'true' : 'false');
    setIsWallConsentModalOpen(false);

    // If consent given, broadcast to wall feed
    if (consent) {
      try {
        const wallItem = {
          id: createTrackedId('wall'),
          customer: customerName || 'ضيف مميز',
          caption: `ذكريات ${customerName || 'ضيف مميز'} في ${settings.branding.name || 'Memories'}`,
          time: 'الآن',
          frames: accumulatedPhotos,
          theme: 'white',
          visibility: 'live_wall',
          status: 'approved',
        };
        const existingFeed = JSON.parse(localStorage.getItem(`memories_wall_feed_${cafeSlug}`) || '[]');
        const newFeed = [wallItem, ...existingFeed].slice(0, 20);
        localStorage.setItem(`memories_wall_feed_${cafeSlug}`, JSON.stringify(newFeed));
        window.dispatchEvent(new CustomEvent('memories-wall-updated', { detail: newFeed }));
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

      <main className="w-full max-w-xl mx-auto px-3 sm:px-4 pt-4 flex flex-col items-center space-y-5">
        {/* Registration Success Toast */}
        {regSuccessNotice && (
          <div className="w-full p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{regSuccessNotice}</span>
          </div>
        )}

        {/* 2. REAL CUSTOMER REGISTRATION / IDENTIFICATION */}
        {!customerPhone ? (
          <div className="w-full p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm text-stone-900 space-y-3">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-stone-950">
                  تسجيل كارت الولاء وبدء التوثيق
                </h3>
                <p className="text-[11px] text-stone-500">
                  سجّل اسمك ورقمك لحفظ أختامك وصورك في كارتك واستلام هديتك فوراً
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
                  className="w-full py-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>تثبيت الكارت وبدء التصوير</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
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
        )}

        {/* 3. CUSTOMER DIGITAL LOYALTY CARD WITH QR CODE */}
        <CustomerLoyaltyCard
          loyaltyData={loyaltyData}
          giftTitle={settings.freeGiftOffer.title}
          onOpenStaffStamp={() => setIsStaffStampModalOpen(true)}
        />

        {/* 3. PHOTOBOOTH STRIP SPECIFICATIONS & SAMPLE PREVIEW TOGGLE */}
        <div className="w-full flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-stone-700">
              {selectedFrame.widthCm === 10 ? 'كارت بوستكارد 4×6' : 'شريط طولي 2×6'}:
            </span>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold">
              {totalCardSlots} لقطات
            </span>
          </div>

          <AestheticSampleToggle
            isPreviewMode={isPreviewWithSamples}
            onToggle={setIsPreviewWithSamples}
          />
        </div>

        {/* 4. VIRAL THEME PILLS SELECTOR */}
        <div className="w-full space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x">
            {[
              { id: 'ticket_express', label: 'تذكرة قطار', icon: 'EXP' },
              { id: 'spotify_player', label: 'مشغل سبوتيفاي', icon: 'AUD' },
              { id: 'ios_gallery_light', label: 'ألبوم آيفون', icon: 'IOS' },
              { id: 'ios_gallery_dark', label: 'آيفون دارك', icon: 'DARK' },
              { id: 'ios_camera', label: 'كاميرا آيفون', icon: 'CAM' },
              { id: 'ios_imessage', label: 'آي مسج', icon: 'MSG' },
              { id: 'korean_noir', label: 'نوار كوري', icon: 'RAW' },
              { id: 'polaroid_vintage', label: 'بولارويد', icon: 'FILM' },
            ].map((mode) => {
              const isActive = cardMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setCardMode(mode.id as PhotoboothCardMode)}
                  className={`px-3 py-2 rounded-2xl border text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs font-black'
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
            <div className="p-3 bg-white border border-stone-200/90 rounded-2xl space-y-2.5 text-xs shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-stone-700">اللون:</span>
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
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-[10px] font-bold transition ${
                      spotifyBg === c.hex ? 'border-amber-500 ring-2 ring-amber-400/40' : 'border-stone-200'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sub-customizer for Ticket Express */}
          {cardMode === 'ticket_express' && (
            <div className="p-3 bg-white border border-stone-200/90 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
              <span className="text-[11px] font-bold text-stone-700">المقعد / الطاولة:</span>
              <div className="flex items-center gap-1.5">
                {['ROW 15 • SEAT A33', 'TABLE 04 • VIP', 'CAR 02 • SEAT B12'].map((seat) => (
                  <button
                    key={seat}
                    type="button"
                    onClick={() => setTicketSeat(seat)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition ${
                      ticketSeat === seat ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    {seat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. THE HERO PHOTOBOOTH CARD (2x6 or 4x6) */}
        <div className="w-full flex justify-center py-2 animate-in zoom-in-95 duration-200">
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
            onSlotClick={() => setIsCameraModalOpen(true)}
            dimensionPreset={selectedFrame.dimensionsPreset || (selectedFrame.widthCm === 10 ? 'grid_4x6' : 'strip_2x6')}
          />
        </div>

        {/* 6. PHOTO CAPTURE & UPLOAD ACTIONS */}
        <PhotoCaptureOrUpload
          canShoot={LoyaltyPurseService.canCustomerShoot(customerPhone, cafeSlug, accumulatedPhotos.length)}
          onOpenLiveCamera={() => setIsCameraModalOpen(true)}
          onUploadPhoto={handleCommitPhoto}
          onQuickSampleShot={handleQuickSampleShot}
        />

        {/* 7. HIGH RES DOWNLOAD DIRECT ACTION */}
        <button
          type="button"
          onClick={handlePrintOrDownload}
          className="w-full max-w-md py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4 text-amber-600" />
          <span>تحميل شريط الذكريات عالي الدقة (300 DPI)</span>
        </button>

        {/* 8. INSTAGRAM MENTION PROMPT BANNER */}
        <InstagramMentionPrompt
          instagramHandle={settings.branding.instagramHandle || '@espressolab_eg'}
          businessName={settings.branding.name}
        />
      </main>

      {/* 9. MODALS */}
      {/* Live Camera Viewfinder Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-stone-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-stone-950 rounded-3xl p-4 overflow-hidden border border-stone-800 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(false)}
              className="absolute top-4 left-4 z-30 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <CameraViewfinder
              brandName={settings.branding.name}
              visitNumber={accumulatedPhotos.length + 1}
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
