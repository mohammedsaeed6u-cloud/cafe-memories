'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BusinessSettings,
  PhotoboothFrame,
  PhotoboothCardMode,
  PlacedSticker,
} from '@/types/photobooth';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/constants/photobooth-presets';
import { PrintService } from '@/lib/services/print.service';
import { CameraViewfinder } from '@/components/photobooth/CameraViewfinder';
import { StripComposerService } from '@/lib/services/strip-composer.service';
import { StickerControlTray } from '@/components/photobooth/DraggableStickerLayer';
import { TicketButton } from '@/components/ui/TicketButton';
import { CoBrandingHeader } from '@/features/co-branding/CoBrandingHeader';
import { CustomerLoyaltyCard } from '@/features/loyalty/CustomerLoyaltyCard';
import { PhotoboothResponsiveCard } from '@/features/photobooth/PhotoboothResponsiveCard';
import { PhotoCaptureOrUpload } from '@/features/photobooth/PhotoCaptureOrUpload';
import { InstagramMentionPrompt } from '@/features/social/InstagramMentionPrompt';
import { WallConsentModal } from '@/features/wall-consent/WallConsentModal';
import { CompletionGiftRewardModal } from '@/features/rewards/CompletionGiftRewardModal';
import { ImageSaveService } from '@/lib/services/image-save.service';
import { IosSaveImageModal } from '@/components/photobooth/IosSaveImageModal';
import {
  Sparkles,
  Gift,
  CheckCircle,
  CheckCircle2,
  ShieldCheck,
  Clock,
  X,
  UserCheck,
  Download,
  Camera,
  Award,
  Loader2,
  AlertCircle,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* API types                                                                  */
/* -------------------------------------------------------------------------- */

interface Venue {
  organization: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    tagline: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    socialLinks: Record<string, unknown>;
  };
  branch: { id: string; slug: string; name: string; address: string | null };
  settings: Record<string, unknown>;
}

interface CustomerCard {
  customer: {
    id: string;
    displayName: string;
    phone: string | null;
    persona: string | null;
    createdAt: string;
  };
  loyalty: {
    stampedCount: number;
    maxSlots: number;
    completedCardsCount: number;
    totalVerifiedVisits: number;
    rewardName: string | null;
    lastStampedAt: string | null;
  };
  rewards: Array<{ id: string; name: string; threshold: number; unlockedAt: string }>;
  stamps: Array<{ memoryId: string; takenAt: string; thumbnailUrl: string }>;
  vouchers: Array<{
    code: string;
    title: string;
    status: string;
    expiresAt: string | null;
    createdAt: string;
  }>;
  memories: Array<{
    id: string;
    originalUrl: string;
    thumbnailUrl: string;
    caption: string | null;
    status: string;
    visibility: string;
    createdAt: string;
  }>;
  walletPass: { status: string; shareUrl: string | null } | null;
}

interface ApiEnvelope<T> {
  ok?: boolean;
  code?: string;
  error?: string;
  [key: string]: unknown;
}

async function readApi<T>(response: Response): Promise<ApiEnvelope<T> & T> {
  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & T;
  if (!response.ok) {
    const error = new Error(body.error || 'تعذر إكمال الطلب');
    (error as Error & { code?: string; status?: number }).code = body.code;
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return body;
}

function publicSettingsFromVenue(venue: Venue): BusinessSettings {
  const raw = venue.settings ?? {};
  const social = venue.organization.socialLinks ?? {};
  const instagram = typeof social.instagram === 'string' ? social.instagram : '';
  const storedFrames = Array.isArray(raw.frames) ? (raw.frames as Partial<PhotoboothFrame>[]) : [];
  const frames = storedFrames.length
    ? storedFrames.map((frame, index) => ({
        ...DEFAULT_BUSINESS_SETTINGS.frames[index % DEFAULT_BUSINESS_SETTINGS.frames.length],
        ...frame,
        cornerEmojis: frame.cornerEmojis ?? { topRight: '', bottomLeft: '', enabled: false },
      })) as PhotoboothFrame[]
    : DEFAULT_BUSINESS_SETTINGS.frames;

  return {
    ...DEFAULT_BUSINESS_SETTINGS,
    cafeSlug: venue.organization.slug,
    cafeName: venue.organization.name,
    branding: {
      name: venue.organization.name,
      logoUrl: venue.organization.logoUrl ?? undefined,
      tagline: venue.organization.tagline ?? undefined,
      instagramHandle: instagram || undefined,
    },
    defaultShotCount: typeof raw.shotCount === 'number' ? raw.shotCount : DEFAULT_BUSINESS_SETTINGS.defaultShotCount,
    defaultOrientation: raw.orientation === 'horizontal' ? 'horizontal' : 'vertical',
    defaultFrameShape: (raw.frameShape as BusinessSettings['defaultFrameShape']) ?? 'rounded',
    defaultBorderRadius: typeof raw.borderRadius === 'number' ? raw.borderRadius : 22,
    defaultDimensionsPreset: typeof raw.dimensionsPreset === 'string' ? raw.dimensionsPreset : 'strip_2x6',
    defaultCardMode: (raw.cardMode as PhotoboothCardMode) ?? 'luxury_glass',
    defaultTemplateId: typeof raw.templateId === 'string' ? raw.templateId : undefined,
    defaultLayoutType: raw.layoutType as BusinessSettings['defaultLayoutType'],
    defaultWidthCm: typeof raw.widthCm === 'number' ? raw.widthCm : undefined,
    defaultHeightCm: typeof raw.heightCm === 'number' ? raw.heightCm : undefined,
    loyaltyMaxVisits: typeof raw.loyaltyMaxVisits === 'number' ? raw.loyaltyMaxVisits : 5,
    freeGiftOffer: raw.freeGiftOffer as BusinessSettings['freeGiftOffer'],
    activeFrameId: typeof raw.activeFrameId === 'string' ? raw.activeFrameId : frames[0]?.id ?? '',
    activeColorPaletteId:
      typeof raw.activeColorPaletteId === 'string'
        ? raw.activeColorPaletteId
        : DEFAULT_BUSINESS_SETTINGS.activeColorPaletteId,
    allowCustomerColorChoice: raw.allowCustomerColorChoice !== false,
    allowedColorIds: Array.isArray(raw.allowedColorIds) ? (raw.allowedColorIds as string[]) : [],
    allowCustomerStickers: raw.allowCustomerStickers !== false,
    allowCustomerModeChoice: raw.allowCustomerModeChoice === true,
    allowedModes: Array.isArray(raw.allowedModes)
      ? (raw.allowedModes as PhotoboothCardMode[])
      : [],
    lockFrameForCustomers: raw.lockFrameForCustomers !== false,
    businessType: (raw.businessType as BusinessSettings['businessType']) ?? 'general',
    wallSettings: raw.wallSettings as BusinessSettings['wallSettings'],
    frames,
  };
}

async function dataUrlToImageFile(dataUrl: string, baseName: string): Promise<File> {
  const source = await fetch(dataUrl);
  const blob = await source.blob();
  if (blob.type === 'image/webp') {
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
  }

  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذر تجهيز الصورة');
    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    const webp = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.9)
    );
    // Safari's canvas cannot encode WebP and silently returns PNG.
    if (webp && webp.type === 'image/webp') {
      return new File([webp], `${baseName}.webp`, { type: 'image/webp' });
    }
  } catch {
    // Fall through to the original bytes; the server accepts PNG and JPEG too.
  }

  const type = blob.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const extension = type === 'image/jpeg' ? 'jpg' : 'png';
  return new File([blob], `${baseName}.${extension}`, { type });
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function CustomerClient({ cafeSlug: propCafeSlug }: { cafeSlug: string }) {
  const cafeSlug = propCafeSlug.trim() || 'memories';

  const [venue, setVenue] = useState<Venue | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [card, setCard] = useState<CustomerCard | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  const [selectedFrame] = useState<PhotoboothFrame>(() => {
    const base =
      DEFAULT_BUSINESS_SETTINGS.frames.find((f) => f.id === DEFAULT_BUSINESS_SETTINGS.activeFrameId) ??
      DEFAULT_BUSINESS_SETTINGS.frames[0];
    return {
      ...base,
      templateId: DEFAULT_BUSINESS_SETTINGS.defaultTemplateId,
      layoutType: DEFAULT_BUSINESS_SETTINGS.defaultLayoutType,
      shotCount: DEFAULT_BUSINESS_SETTINGS.defaultShotCount,
      orientation: DEFAULT_BUSINESS_SETTINGS.defaultOrientation,
      frameShape: DEFAULT_BUSINESS_SETTINGS.defaultFrameShape,
      dimensionsPreset: 'strip_2x6',
    };
  });

  const [cardMode, setCardMode] = useState<PhotoboothCardMode>('polaroid_vintage');
  const [spotifyBg, setSpotifyBg] = useState('#384C5A');
  const [spotifyTrack, setSpotifyTrack] = useState({ title: 'Nobody Gets Me', artist: 'SZA • SOS' });
  const [ticketSeat, setTicketSeat] = useState('طاولة 04 • صالة');
  const [activeTab, setActiveTab] = useState<'studio' | 'loyalty'>('studio');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNotice, setRegNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isWallConsentModalOpen, setIsWallConsentModalOpen] = useState(false);
  const [isCompletionRewardOpen, setIsCompletionRewardOpen] = useState(false);
  const [iosSaveModalImage, setIosSaveModalImage] = useState<string | null>(null);
  const [completionTitle, setCompletionTitle] = useState<string>('');

  const [accumulatedPhotos, setAccumulatedPhotos] = useState<string[]>([]);
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [isStickerTrayOpen, setIsStickerTrayOpen] = useState(false);
  const [activeCaptureSlot, setActiveCaptureSlot] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingConsent, setPendingConsent] = useState(false);

  const capturedMemoryRef = useRef<{ memoryId: string; storageKey: string } | null>(null);
  const captureIdempotencyRef = useRef<string>(crypto.randomUUID());

  const totalCardSlots = Math.max(settings?.defaultShotCount ?? selectedFrame.shotCount ?? 3, 1);
  const loyaltyMaxVisits = settings?.loyaltyMaxVisits ?? card?.loyalty.maxSlots ?? 5;

  /* ----------------------------- bootstrap -------------------------------- */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/v1/public/settings?cafeSlug=${encodeURIComponent(cafeSlug)}`,
          { cache: 'no-store' }
        );
        const body = await readApi<{ venue: Venue }>(response);
        if (cancelled) return;
        setVenue(body.venue);
        const mapped = publicSettingsFromVenue(body.venue);
        setSettings(mapped);
        setCardMode(mapped.defaultCardMode ?? 'polaroid_vintage');

        const sessionResponse = await fetch(
          `/api/v1/customer/session?cafeSlug=${encodeURIComponent(cafeSlug)}`,
          { cache: 'no-store' }
        );
        if (sessionResponse.ok) {
          const session = (await sessionResponse.json()) as CustomerCard & { ok: true };
          if (!cancelled) {
            setCard(session);
            setCustomerName(session.customer.displayName ?? '');
            setCustomerPhone(session.customer.phone ?? '');
          }
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'تعذر تحميل المنشأة');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cafeSlug]);

  const refreshCard = useCallback(async () => {
    const response = await fetch(
      `/api/v1/customer/session?cafeSlug=${encodeURIComponent(cafeSlug)}`,
      { cache: 'no-store' }
    );
    if (!response.ok) return null;
    const session = (await response.json()) as CustomerCard & { ok: true };
    setCard(session);
    setCustomerName(session.customer.displayName ?? '');
    setCustomerPhone(session.customer.phone ?? '');
    return session;
  }, [cafeSlug]);

  const ensureSession = useCallback(
    async (profile?: { displayName?: string; phone?: string }) => {
      if (card) {
        if (!profile?.displayName && !profile?.phone) return card;
        setIsSessionLoading(true);
        try {
          const response = await fetch('/api/v1/customer/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cafeSlug,
              displayName: profile.displayName ?? card.customer.displayName,
              phone: profile.phone ?? card.customer.phone,
            }),
          });
          const body = await readApi<CustomerCard>(response);
          setCard(body);
          setCustomerName(body.customer.displayName ?? '');
          setCustomerPhone(body.customer.phone ?? '');
          return body;
        } finally {
          setIsSessionLoading(false);
        }
      }

      setIsSessionLoading(true);
      try {
        const response = await fetch('/api/v1/customer/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cafeSlug,
            displayName: profile?.displayName,
            phone: profile?.phone,
          }),
        });
        const body = await readApi<CustomerCard>(response);
        setCard(body);
        setCustomerName(body.customer.displayName ?? '');
        setCustomerPhone(body.customer.phone ?? '');
        return body;
      } finally {
        setIsSessionLoading(false);
      }
    },
    [cafeSlug, card]
  );

  /* ------------------------------ photos ---------------------------------- */

  const handleAddSticker = (emoji: string) => {
    if (!emoji.trim()) return;
    const randomOffset = (Math.random() - 0.5) * 20;
    setStickers((prev) => [
      ...prev,
      {
        id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        emoji: emoji.trim(),
        x: Math.max(15, Math.min(85, 50 + randomOffset)),
        y: Math.max(15, Math.min(85, 40 + randomOffset)),
        rotation: Math.round((Math.random() - 0.5) * 30),
        scale: 1,
      },
    ]);
  };

  const handleCommitPhoto = (photo: string, targetSlot?: number) => {
    const slot = targetSlot ?? (activeCaptureSlot ?? accumulatedPhotos.length);
    setAccumulatedPhotos((previous) => {
      const next = [...previous];
      next[slot] = photo;
      return next.filter(Boolean).slice(0, totalCardSlots);
    });
    setActiveCaptureSlot(null);
  };

  const isCardComplete = accumulatedPhotos.filter(Boolean).length >= totalCardSlots;

  const composeStrip = useCallback(async () => {
    if (!settings) throw new Error('الإعدادات غير جاهزة');
    return StripComposerService.composeStrip({
      photos: accumulatedPhotos,
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
      giftCode: '',
      cardMode,
      stickers,
    });
  }, [
    accumulatedPhotos,
    totalCardSlots,
    selectedFrame,
    cardMode,
    spotifyBg,
    spotifyTrack,
    ticketSeat,
    settings,
    stickers,
  ]);

  const uploadAndCapture = useCallback(
    async (liveWallConsent: boolean) => {
      if (!settings) throw new Error('الإعدادات غير جاهزة');
      if (capturedMemoryRef.current) return capturedMemoryRef.current;

      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const dataUrl = await composeStrip();
        const file = await dataUrlToImageFile(dataUrl, `strip-${Date.now()}`);

        const form = new FormData();
        form.append('file', file);
        form.append('cafeSlug', cafeSlug);
        const uploadResponse = await fetch('/api/v1/memories/upload', {
          method: 'POST',
          body: form,
        });
        const upload = await readApi<{
          storageKey: string;
          optimizedKey: string;
          thumbnailKey: string;
        }>(uploadResponse);

        const captureResponse = await fetch('/api/v1/photobooth/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cafeSlug,
            storageKey: upload.storageKey,
            optimizedUrl: upload.optimizedKey,
            thumbnailUrl: upload.thumbnailKey,
            caption: `ذكريات ${customerName || 'ضيف مميز'} في ${settings.branding.name}`,
            liveWallConsent,
            socialShareConsent: false,
            marketingConsent: false,
            idempotencyKey: captureIdempotencyRef.current,
          }),
        });
        const capture = await readApi<{
          memory: { id: string } | null;
          duplicate: boolean;
          balance: { availableRewards?: number } | null;
        }>(captureResponse);

        if (!capture.memory?.id) throw new Error('لم يتم حفظ الذكرى');
        capturedMemoryRef.current = {
          memoryId: capture.memory.id,
          storageKey: upload.storageKey,
        };

        const updated = await refreshCard();
        const unlocked = updated?.rewards ?? [];
        setCompletionTitle(
          unlocked[0]?.name ||
            updated?.loyalty.rewardName ||
            settings.freeGiftOffer?.title ||
            'هدية ترحيبية'
        );
        return capturedMemoryRef.current;
      } finally {
        setIsSubmitting(false);
      }
    },
    [cafeSlug, composeStrip, customerName, refreshCard, settings]
  );

  const requestPrint = useCallback(async (memoryId: string) => {
    const response = await fetch('/api/v1/customer/print-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memoryId }),
    });
    if (!response.ok && response.status !== 409) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error || 'تعذر إرسال طلب الطباعة');
    }
  }, []);

  const handleDownloadStrip = useCallback(async () => {
    try {
      const dataUrl = await composeStrip();
      const saveResult = await ImageSaveService.saveImage({
        dataUrl,
        filename: `${settings?.branding.name ?? 'stampy'}-photostrip-${Date.now()}.png`,
        title: `شريط صور ${customerName || settings?.branding.name || ''}`,
      });
      if (saveResult.method === 'fallback') {
        setIosSaveModalImage(saveResult.blobUrl || dataUrl);
      }
    } catch {
      PrintService.printElement('printable-strip');
    }
  }, [composeStrip, customerName, settings]);

  const handlePrintOrDownload = useCallback(async () => {
    try {
      const saved = capturedMemoryRef.current ?? (await uploadAndCapture(false));
      await requestPrint(saved.memoryId);
      await handleDownloadStrip();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'تعذر تجهيز الصورة');
    }
  }, [handleDownloadStrip, requestPrint, uploadAndCapture]);

  const handleWallConsent = async (consent: boolean) => {
    setPendingConsent(consent);
    setIsWallConsentModalOpen(false);
    try {
      const saved = await uploadAndCapture(consent);
      if (saved) setIsCompletionRewardOpen(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'تعذر حفظ الذكرى');
    }
  };

  const handleCompleteCard = async () => {
    try {
      await ensureSession();
      if (!capturedMemoryRef.current) {
        setIsWallConsentModalOpen(true);
      } else {
        setIsCompletionRewardOpen(true);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'تعذر بدء الجلسة');
    }
  };

  /* --------------------------- registration ------------------------------- */

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const name = regName.trim();
    const phone = regPhone.trim();
    if (name.length < 2) {
      setFormError('اكتب اسمك الكريم');
      return;
    }
    if (phone.replace(/\D/g, '').length < 8) {
      setFormError('اكتب رقم جوال صحيح');
      return;
    }
    try {
      await ensureSession({ displayName: name, phone });
      setRegNotice('تم حفظ بطاقتك وأختامك على هذا الجهاز.');
      setTimeout(() => setRegNotice(null), 4000);
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      setFormError(
        code === 'phone_in_use'
          ? 'هذا الرقم مرتبط ببطاقة أخرى. استخدم بطاقة المحفظة أو اطلب من الموظف.'
          : error instanceof Error
            ? error.message
            : 'تعذر حفظ البطاقة'
      );
    }
  };

  const handleSwitchAccount = async () => {
    await fetch('/api/v1/customer/session', { method: 'DELETE' });
    setCard(null);
    setCustomerName('');
    setCustomerPhone('');
    setAccumulatedPhotos([]);
    setStickers([]);
    capturedMemoryRef.current = null;
    captureIdempotencyRef.current = crypto.randomUUID();
  };

  const loyaltyData = useMemo(
    () => ({
      customerPhone: card?.customer.phone ?? customerPhone,
      cafeSlug,
      stampedCount: card?.loyalty.stampedCount ?? 0,
      maxSlots: card?.loyalty.maxSlots ?? loyaltyMaxVisits,
      lastStampedAt: card?.loyalty.lastStampedAt ?? undefined,
      completedCardsCount: card?.loyalty.completedCardsCount ?? 0,
    }),
    [card, cafeSlug, customerPhone, loyaltyMaxVisits]
  );

  /* -------------------------------- render -------------------------------- */

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#12100E] text-white flex items-center justify-center p-6">
        {loadError ? (
          <div className="max-w-sm text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h1 className="text-lg font-bold">المنشأة غير متاحة</h1>
            <p className="text-sm text-stone-400">{loadError}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#DFAB56]" />
            <span className="text-xs text-stone-400">جاري تحميل الاستوديو...</span>
          </div>
        )}
      </div>
    );
  }

  const currentDisplayPhotos = accumulatedPhotos;

  return (
    <div className="w-full min-h-screen bg-transparent text-white flex flex-col items-center selection:bg-[#DFAB56] selection:text-[#12100E] pb-16 apple-font">
      <div className="w-full pt-3 px-3 sm:px-4">
        <CoBrandingHeader branding={settings.branding} />
      </div>

      <main className="w-full max-w-xl mx-auto px-3 sm:px-4 pt-3 flex flex-col items-center space-y-4">
        {regNotice && (
          <div className="w-full p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{regNotice}</span>
          </div>
        )}
        {submitError && (
          <div className="w-full p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="w-full grid grid-cols-2 p-1.5 bg-white rounded-xl border border-[#EADDC4] shadow-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'studio'
                ? 'bg-[#DFAB56] text-[#12100E] font-black'
                : 'text-[#3D2314]/70'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>استوديو الصور ({totalCardSlots} لقطات)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('loyalty')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'loyalty'
                ? 'bg-[#DFAB56] text-[#12100E] font-black'
                : 'text-[#3D2314]/70'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>
              كارت الولاء ({loyaltyData.stampedCount}/{loyaltyMaxVisits})
            </span>
          </button>
        </div>

        {activeTab === 'studio' && (
          <div className="w-full flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">شريط الذكريات</h2>
                <span className="text-[10px] font-mono text-[#D9D9D9] bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-full font-bold">
                  {totalCardSlots} لقطات
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#D9D9D9]/80 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                <span>
                  {accumulatedPhotos.filter(Boolean).length} من {totalCardSlots}
                </span>
              </div>
            </div>

            <div className="w-full flex justify-center py-1">
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
                isStickersInteractive
                onSlotClick={(slotIdx) => {
                  setActiveCaptureSlot(slotIdx);
                  setIsCameraModalOpen(true);
                }}
                dimensionPreset={
                  selectedFrame.dimensionsPreset ||
                  (selectedFrame.widthCm === 10 ? 'grid_4x6' : 'strip_2x6')
                }
              />
            </div>

            <PhotoCaptureOrUpload
              canShoot={!isSubmitting}
              onOpenLiveCamera={async () => {
                try {
                  await ensureSession();
                  setActiveCaptureSlot(
                    accumulatedPhotos.filter(Boolean).length < totalCardSlots
                      ? accumulatedPhotos.filter(Boolean).length
                      : 0
                  );
                  setIsCameraModalOpen(true);
                } catch (error) {
                  setSubmitError(error instanceof Error ? error.message : 'تعذر بدء الجلسة');
                }
              }}
              onUploadPhoto={(photo) => {
                void ensureSession().then(() => handleCommitPhoto(photo));
              }}
            />

            <div className="w-full space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-[#D9D9D9]/80">طابع وإطار الكارت:</span>
                <span className="text-[10px] text-[#DFAB56] font-mono font-bold">THEMES</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none touch-pan-x">
                {[
                  { id: 'luxury_glass', label: 'جلاسي فاخر', icon: '💎' },
                  { id: 'polaroid_vintage', label: 'بولارويد كلاسيك', icon: '🎞️' },
                  { id: 'korean_noir', label: 'نوار كوري عاجي', icon: '🏛️' },
                  { id: 'ticket_express', label: 'تذكرة الزيارة', icon: '🎟️' },
                  { id: 'ios_camera', label: 'كاميرا آيفون', icon: '📷' },
                  { id: 'spotify_player', label: 'مشغل سبوتيفاي', icon: '🎵' },
                  { id: 'ios_gallery_light', label: 'ألبوم آيفون', icon: '🖼️' },
                  { id: 'ios_imessage', label: 'آي مسج', icon: '💬' },
                ].map((mode) => {
                  const isAllowed =
                    !settings.lockFrameForCustomers ||
                    settings.allowCustomerModeChoice ||
                    settings.allowedModes?.includes(mode.id as PhotoboothCardMode);
                  const isActive = cardMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={!isAllowed}
                      onClick={() => setCardMode(mode.id as PhotoboothCardMode)}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 disabled:opacity-40 ${
                        isActive
                          ? 'bg-[#DFAB56] text-[#12100E] border-[#DFAB56] font-black'
                          : 'bg-[#1C1B1B]/70 text-[#D9D9D9] border-[#EADDC4]'
                      }`}
                    >
                      <span className="text-sm">{mode.icon}</span>
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {cardMode === 'spotify_player' && (
                <div className="p-4 bg-white border border-[#EADDC4] rounded-2xl space-y-3 text-xs shadow-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-[#3D2314]">لون الخلفية:</span>
                    {[
                      { id: '#384C5A', name: 'Slate Blue' },
                      { id: '#4E483E', name: 'Warm Taupe' },
                      { id: '#161618', name: 'OLED Charcoal' },
                      { id: '#8B3A2B', name: 'Terracotta' },
                    ].map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSpotifyBg(color.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${
                          spotifyBg === color.id
                            ? 'border-[#DFAB56] ring-1 ring-[#DFAB56]/40'
                            : 'border-[#EADDC4]'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color.id }}
                        />
                        <span>{color.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={spotifyTrack.title}
                      onChange={(event) =>
                        setSpotifyTrack((previous) => ({ ...previous, title: event.target.value }))
                      }
                      placeholder="اسم الأغنية..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#EADDC4] bg-[#FAF5EB] text-[#3D2314]"
                    />
                    <input
                      type="text"
                      value={spotifyTrack.artist}
                      onChange={(event) =>
                        setSpotifyTrack((previous) => ({ ...previous, artist: event.target.value }))
                      }
                      placeholder="اسم الفنان..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#EADDC4] bg-[#FAF5EB] text-[#3D2314]"
                    />
                  </div>
                </div>
              )}

              {cardMode === 'ticket_express' && (
                <div className="p-4 bg-white border border-[#EADDC4] rounded-2xl space-y-2 text-xs shadow-2xl">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['طاولة 04 • صالة', 'جلسة VIP', 'ركن الاستقبال', 'الفرع الرئيسي'].map(
                      (seat) => (
                        <button
                          key={seat}
                          type="button"
                          onClick={() => setTicketSeat(seat)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                            ticketSeat === seat
                              ? 'bg-[#3D2314]/60 text-[#FAF5EB] border-[#DFAB56]/50'
                              : 'bg-[#1C1B1B] border-[#EADDC4] text-[#D9D9D9]'
                          }`}
                        >
                          {seat}
                        </button>
                      )
                    )}
                  </div>
                  <input
                    type="text"
                    value={ticketSeat}
                    onChange={(event) => setTicketSeat(event.target.value)}
                    placeholder="رقم الطاولة أو الموقع..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#EADDC4] bg-[#FAF5EB] text-[#3D2314]"
                  />
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => setIsStickerTrayOpen(!isStickerTrayOpen)}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#1C1B1B] border border-[#EADDC4] text-[#3D2314] font-bold text-xs shadow-xl transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#DFAB56]" />
                  <span>تزيين الكارت بالملصقات والإيموجي</span>
                </div>
                <span className="text-[10px] font-mono bg-[#3D2314]/60 px-2.5 py-0.5 rounded-md border border-[#DFAB56]/40 text-[#FAF5EB] font-bold">
                  {stickers.length > 0 ? `${stickers.length} ملصق` : 'إضافة +'}
                </span>
              </button>
              {isStickerTrayOpen && (
                <StickerControlTray
                  onAddSticker={handleAddSticker}
                  onClearAll={() => setStickers([])}
                  stickersCount={stickers.length}
                />
              )}
            </div>

            {isCardComplete ? (
              <button
                type="button"
                onClick={handleCompleteCard}
                disabled={isSubmitting || isSessionLoading}
                className="w-full max-w-md py-3 px-4 rounded-lg bg-[#DFAB56] hover:bg-[#C99645] text-[#12100E] font-bold text-xs shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'جاري حفظ الذكرى...' : 'إتمام الذكرى واستلام المكافأة'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadStrip}
                className="w-full max-w-md py-3 px-4 rounded-lg bg-white hover:bg-[#1C1B1B] border border-[#EADDC4] text-[#3D2314] font-bold text-xs shadow-xl transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#DFAB56]" />
                <span>تحميل شريط الذكريات عالي الدقة</span>
              </button>
            )}

            {isCardComplete && (
              <button
                type="button"
                onClick={handlePrintOrDownload}
                disabled={isSubmitting}
                className="w-full max-w-md py-3 px-4 rounded-lg bg-white hover:bg-[#1C1B1B] border border-[#EADDC4] text-[#3D2314] font-bold text-xs shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-[#DFAB56]" />
                <span>طلب الطباعة + تحميل الصورة</span>
              </button>
            )}

            <InstagramMentionPrompt
              instagramHandle={settings.branding.instagramHandle || ''}
              businessName={settings.branding.name}
            />

            <div className="w-full p-4 rounded-2xl bg-white border border-[#EADDC4] flex items-center justify-between gap-3 text-right shadow-2xl mt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3D2314] border border-[#DFAB56]/40 text-[#FAF5EB] flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-[#DFAB56]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#3D2314]">
                    هل أنت من رواد {settings.branding.name}؟
                  </p>
                  <p className="text-[11px] text-[#3D2314]/70">
                    اجمع أختام زياراتك واستلم هديتك المجانية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('loyalty')}
                className="px-3.5 py-2 rounded-lg bg-[#DFAB56] hover:bg-[#C99645] text-[#12100E] font-bold text-xs shrink-0"
              >
                عرض كارت الولاء
              </button>
            </div>
          </div>
        )}

        {activeTab === 'loyalty' && (
          <div className="w-full flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between px-1 pt-1">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#FAF5EB]">
                  كارت الولاء والمحفظة الرقمية
                </h2>
                <p className="text-[11px] text-[#D9D9D9]/70">
                  أختام زياراتك المعتمدة وهديتك الفورية في {settings.branding.name}
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#FAF5EB] bg-[#3D2314]/60 border border-[#DFAB56]/40 px-2.5 py-1 rounded-md font-bold">
                {loyaltyData.stampedCount} من {loyaltyMaxVisits} أختام
              </span>
            </div>

            {card ? (
              <div className="w-full space-y-3">
                <div className="w-full p-3 rounded-2xl bg-white border border-[#EADDC4] shadow-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#3D2314] border border-[#DFAB56]/40 text-[#FAF5EB] flex items-center justify-center font-bold">
                      <CheckCircle className="w-4 h-4 text-[#DFAB56]" />
                    </div>
                    <div>
                      <span className="font-bold text-[#3D2314]">
                        {card.customer.displayName || 'ضيف مميز'}
                      </span>
                      <span className="text-[10px] text-[#3D2314]/70 font-mono block" dir="ltr">
                        {card.customer.phone ?? 'بطاقة بدون رقم'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="text-[10px] text-[#3D2314]/70 hover:text-[#3D2314] underline"
                  >
                    تغيير الحساب
                  </button>
                </div>

                <CustomerLoyaltyCard
                  loyaltyData={loyaltyData}
                  giftTitle={card.loyalty.rewardName || settings.freeGiftOffer.title}
                  brandName={settings.branding.name}
                  customerName={card.customer.displayName}
                  instagramHandle={settings.branding.instagramHandle}
                />

                {card.rewards.length > 0 && (
                  <div className="w-full p-4 rounded-2xl bg-white border border-[#EADDC4] shadow-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#3D2314] font-bold text-xs">
                      <Gift className="w-4 h-4 text-[#DFAB56]" />
                      <span>مكافآتك الجاهزة للاستلام</span>
                    </div>
                    {card.rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF5EB] border border-[#EADDC4]"
                      >
                        <span className="font-bold text-[#3D2314]">{reward.name}</span>
                        <span className="text-[10px] text-[#3D2314]/60">
                          أظهر بطاقتك للموظف
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {card.vouchers.length > 0 && (
                  <div className="w-full p-4 rounded-2xl bg-white border border-[#EADDC4] shadow-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#3D2314] font-bold text-xs">
                      <Gift className="w-4 h-4 text-[#DFAB56]" />
                      <span>قسائمك</span>
                    </div>
                    {card.vouchers.map((voucher) => (
                      <div
                        key={voucher.code}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF5EB] border border-[#EADDC4]"
                      >
                        <span className="font-bold text-[#3D2314]">{voucher.title}</span>
                        <span className="font-mono text-[10px] text-[#3D2314]/70" dir="ltr">
                          {voucher.code} • {voucher.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {card.stamps.length > 0 && (
                  <div className="w-full p-4 rounded-2xl bg-white border border-[#EADDC4] shadow-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#3D2314] font-bold text-xs">
                      <Clock className="w-4 h-4 text-[#DFAB56]" />
                      <span>آخر لقطاتك</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {card.stamps.slice(0, 8).map((stamp) => (
                        <div
                          key={stamp.memoryId}
                          className="aspect-square rounded-lg overflow-hidden border border-[#EADDC4] bg-[#FAF5EB]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={stamp.thumbnailUrl}
                            alt="ذكرى"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full p-4 sm:p-5 rounded-2xl bg-white border border-[#EADDC4] shadow-2xl text-[#3D2314] space-y-3">
                <div className="flex items-center gap-2.5 border-b border-[#EADDC4] pb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#3D2314] border border-[#DFAB56]/40 text-[#FAF5EB] flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4 text-[#DFAB56]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">احفظ أختامك وصورك</h3>
                    <p className="text-[11px] text-[#3D2314]/70">
                      سجّل اسمك ورقمك لحفظ أختام كارتك على هذا الجهاز
                    </p>
                  </div>
                </div>

                {formError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold block mb-1">الاسم أو اللقب:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد، سارة..."
                      value={regName}
                      onChange={(event) => setRegName(event.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#EADDC4] bg-[#FAF5EB] text-xs text-[#3D2314] focus:border-[#DFAB56] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1">رقم الموبايل:</label>
                    <input
                      type="tel"
                      required
                      placeholder="01xxxxxxxxx"
                      value={regPhone}
                      onChange={(event) => setRegPhone(event.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#EADDC4] bg-[#FAF5EB] text-xs text-[#3D2314] font-mono focus:border-[#DFAB56] focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                  <div className="sm:col-span-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSessionLoading}
                      className="w-full py-2.5 rounded-lg bg-[#DFAB56] hover:bg-[#C99645] text-[#12100E] font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSessionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>حفظ كارت الولاء والأختام</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="w-full p-4 rounded-2xl bg-white border border-[#EADDC4] shadow-2xl flex items-center justify-between gap-3 text-right mt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3D2314] border border-[#DFAB56]/40 text-[#FAF5EB] flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-[#DFAB56]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#3D2314]">وثّق زيارتك الحالية بصورة</p>
                  <p className="text-[11px] text-[#3D2314]/70">
                    التقط لقطة تذكارية وأضف ملصقاتك المفضلة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className="px-3.5 py-2 rounded-lg bg-[#DFAB56] hover:bg-[#C99645] text-[#12100E] font-bold text-xs shrink-0"
              >
                فتح استوديو الصور
              </button>
            </div>
          </div>
        )}
      </main>

      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-2xl p-4 overflow-hidden border border-[#EADDC4] relative">
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(false)}
              className="absolute top-4 left-4 z-30 w-8 h-8 rounded-lg bg-black/60 hover:bg-[#DFAB56] text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <CameraViewfinder
              brandName={settings.branding.name}
              visitNumber={
                (activeCaptureSlot ?? accumulatedPhotos.filter(Boolean).length) + 1
              }
              onCaptureComplete={(photo: string) => {
                handleCommitPhoto(photo);
                setIsCameraModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <WallConsentModal
        isOpen={isWallConsentModalOpen}
        businessName={settings.branding.name}
        onConsent={(consent) => void handleWallConsent(consent)}
        onClose={() => {
          setIsWallConsentModalOpen(false);
          void handleWallConsent(false);
        }}
      />

      <CompletionGiftRewardModal
        isOpen={isCompletionRewardOpen}
        giftTitle={completionTitle || settings.freeGiftOffer.title}
        giftSubtitle="أظهر بطاقة الولاء للموظف لاستلام مكافأتك، واحتفظ بشريط ذكرياتك على هاتفك."
        onClose={() => setIsCompletionRewardOpen(false)}
        onPrintStrip={() => void handlePrintOrDownload()}
      />

      <IosSaveImageModal
        open={Boolean(iosSaveModalImage)}
        imageUrl={iosSaveModalImage}
        filename={`${settings.branding.name}-photostrip.png`}
        onClose={() => setIosSaveModalImage(null)}
      />
    </div>
  );
}
