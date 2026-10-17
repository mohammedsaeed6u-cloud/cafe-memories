'use client';

import { useState, useEffect } from 'react';
import { BusinessSettings, PhotoboothFrame, PhotoboothCardMode, PlacedSticker } from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { StripComposerService } from '@/lib/services/strip-composer.service';
import { CustomerRegistryService } from '@/lib/services/customer-registry.service';
import { LoyaltyPurseService, CustomerLoyaltyData } from '@/features/loyalty/loyalty-purse.service';
import { VoucherService } from '@/lib/services/voucher.service';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { ImageSaveService } from '@/lib/services/image-save.service';
import { reportIgnoredError } from '@/lib/services/diagnostics';
import { useCustomerCardCustomization } from '@/features/customization/useCustomerCardCustomization';
import { WallFeedService } from '@/lib/services/wall-feed.service';
import { SoundEffectsService } from '@/lib/services/sound-effects.service';
import { EventOrchestratorService } from '@/lib/services/event-orchestrator.service';
import { TenantSubdomainService } from '@/lib/services/tenant-subdomain.service';
import { UseCustomerExperienceReturn } from '../types';

export function useCustomerExperience(propCafeSlug: string): UseCustomerExperienceReturn {
  const [cafeSlug, setCafeSlug] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryCafe = urlParams.get('cafe') || urlParams.get('slug');
      if (queryCafe) return decodeURIComponent(queryCafe);

      const match = window.location.pathname.match(/\/c\/([^/?#]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }

      const subdomainSlug = TenantSubdomainService.extractTenantSlug(window.location.hostname);
      if (subdomainSlug) return subdomainSlug;
    }
    return propCafeSlug || 'memories';
  });

  const [activeTab, setActiveTab] = useState<'studio' | 'loyalty'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('tab') === 'studio') return 'studio';
    }
    return 'loyalty';
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
      const qTable = urlParams.get('table');
      if (qTable && qTable !== tableNumber) setTableNumber(qTable);
      if (urlParams.get('tab') === 'loyalty' || urlParams.get('action') === 'stamp') {
        setActiveTab('loyalty');
      }
    }
  }, [propCafeSlug, cafeSlug]);

  const [tableNumber, setTableNumber] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('table') || null;
    }
    return null;
  });

  const [settings, setSettings] = useState<BusinessSettings>(() =>
    BusinessSettingsService.getSettings(cafeSlug)
  );

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

  const [cardMode, setCardMode] = useState<PhotoboothCardMode>('apple_cupertino');
  const [spotifyBg, setSpotifyBg] = useState<string>('#384C5A');
  const [spotifyTrack, setSpotifyTrack] = useState<{ title: string; artist: string }>({
    title: 'Nobody Gets Me',
    artist: 'SZA • SOS',
  });
  const [ticketSeat, setTicketSeat] = useState<string>('ROW 15 • SEAT A33');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [loyaltyData, setLoyaltyData] = useState<CustomerLoyaltyData>(() =>
    LoyaltyPurseService.getData(customerPhone, cafeSlug, 5)
  );

  const { customization, handleCustomizationChange } = useCustomerCardCustomization(cafeSlug, customerPhone);

  const [isStaffStampModalOpen, setIsStaffStampModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isWallConsentModalOpen, setIsWallConsentModalOpen] = useState(false);
  const [isCompletionRewardOpen, setIsCompletionRewardOpen] = useState(false);
  const [hasAnsweredWallConsent, setHasAnsweredWallConsent] = useState(false);
  const [iosSaveModalImage, setIosSaveModalImage] = useState<string | null>(null);

  const [accumulatedPhotos, setAccumulatedPhotos] = useState<string[]>([]);
  const [giftCode, setGiftCode] = useState('');
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [isStickerTrayOpen, setIsStickerTrayOpen] = useState(false);
  const [activeCaptureSlot, setActiveCaptureSlot] = useState<number | null>(null);

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccessNotice, setRegSuccessNotice] = useState<string | null>(null);

  const totalCardSlots = Math.max(selectedFrame.shotCount || 3, 1);
  const loyaltyMaxVisits = settings.loyaltyMaxVisits || 5;

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setSettings(BusinessSettingsService.getSettings(cafeSlug));
    };
    window.addEventListener('memories-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('memories-settings-updated', handleSettingsUpdate);
  }, [cafeSlug]);

  // Real-Time Event Bus Listener: Updates the card dynamically when staff awards a stamp from the terminal
  useEffect(() => {
    const unsub = EventOrchestratorService.subscribe('STAMP_AWARDED', (evt) => {
      if (evt.cafeSlug === cafeSlug) {
        const matchesCustomer = !customerPhone || evt.payload.customerPhone === customerPhone;
        if (matchesCustomer) {
          const updatedPurse = LoyaltyPurseService.setStampedCount(
            evt.payload.customerPhone,
            cafeSlug,
            evt.payload.newStampCount,
            loyaltyMaxVisits
          );
          setLoyaltyData((prev) => ({ ...prev, ...updatedPurse }));
          SoundEffectsService.playStampSound();
          setRegSuccessNotice(
            evt.payload.isCardComplete
              ? `🎉 مبروك! اكتملت بطاقة الولاء وحصلت على ${evt.payload.rewardTitle || settings.freeGiftOffer.title}!`
              : `✨ تمت إضافة ختم جديد من الكاشير! (${evt.payload.newStampCount}/${loyaltyMaxVisits})`
          );
        }
      }
    });

    return () => unsub();
  }, [cafeSlug, customerPhone, loyaltyMaxVisits, settings.freeGiftOffer.title]);

  useEffect(() => {
    const hydrateSession = () => {
      let resolvedPhone = '';
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const qPhone = urlParams.get('customer') || urlParams.get('phone');
        if (qPhone) {
          const cleanQ = qPhone.trim().replace(/[^0-9]/g, '');
          if (cleanQ.length >= 6) {
            resolvedPhone = cleanQ;
            localStorage.setItem('memories_customer_phone', cleanQ);
          }
        }
      }

      const storedName = localStorage.getItem('memories_customer_name') || '';
      const storedPhone = resolvedPhone || localStorage.getItem('memories_customer_phone') || '';
      if (storedName) setCustomerName(storedName);
      if (storedPhone) setCustomerPhone(storedPhone);

      const loyalty = LoyaltyPurseService.getData(storedPhone, cafeSlug, loyaltyMaxVisits);
      setLoyaltyData(loyalty);

      // Authoritative Cloud Fetch for real visits & stamps from Supabase
      if (storedPhone) {
        fetch(`/api/v1/loyalty/stamps?cafeSlug=${encodeURIComponent(cafeSlug)}&phone=${encodeURIComponent(storedPhone)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.ok && typeof data.stampedCount === 'number') {
              if (data.customerName && !storedName) {
                setCustomerName(data.customerName);
                localStorage.setItem('memories_customer_name', data.customerName);
              }
              const updatedPurse = LoyaltyPurseService.setStampedCount(
                storedPhone,
                cafeSlug,
                data.stampedCount,
                loyaltyMaxVisits
              );
              setLoyaltyData((prev) => ({ ...prev, ...updatedPurse }));
            }
          })
          .catch((e) => reportIgnoredError('customer/fetchStamps', e));
      }

      const consentAnswered = localStorage.getItem(`memories_wall_consent_${cafeSlug}_${storedPhone || 'guest'}`);
      if (consentAnswered) {
        setHasAnsweredWallConsent(true);
      }

      if (storedPhone) {
        const clean = storedPhone.trim().replace(/[^0-9]/g, '');
        const saved = localStorage.getItem(`memories_card_photos_${cafeSlug}_${clean}`);
        if (saved) {
          try {
            const list = JSON.parse(saved);
            if (Array.isArray(list) && list.length > 0) {
              setAccumulatedPhotos(list);
            }
          } catch (e) { reportIgnoredError('customer/CustomerClient#1', e); }
        }
      }
    };
    requestAnimationFrame(hydrateSession);

    // Live background polling (every 4s) so cashier stamps reflect instantly on phone
    const pollInterval = setInterval(() => {
      const currentPhone = localStorage.getItem('memories_customer_phone');
      if (currentPhone) {
        fetch(`/api/v1/loyalty/stamps?cafeSlug=${encodeURIComponent(cafeSlug)}&phone=${encodeURIComponent(currentPhone)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.ok && typeof data.stampedCount === 'number') {
              setLoyaltyData((prev) => {
                if (prev.stampedCount !== data.stampedCount) {
                  const updatedPurse = LoyaltyPurseService.setStampedCount(
                    currentPhone,
                    cafeSlug,
                    data.stampedCount,
                    loyaltyMaxVisits
                  );
                  return { ...prev, ...updatedPurse };
                }
                return prev;
              });
            }
          })
          .catch((err) => {
            reportIgnoredError('customer/pollStamps', err);
          });
      }
    }, 4000);

    const handleFocus = () => hydrateSession();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [cafeSlug, loyaltyMaxVisits]);

  const currentDisplayPhotos = accumulatedPhotos;

  const handleAddSticker = (emoji: string) => {
    if (!emoji.trim()) return;
    const randomOffset = (Math.random() - 0.5) * 20;
    const idSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : `${Date.now()}`;
    const newSticker: PlacedSticker = {
      id: `stk_${idSuffix}`,
      emoji: emoji.trim(),
      x: Math.max(15, Math.min(85, 50 + randomOffset)),
      y: Math.max(15, Math.min(85, 40 + randomOffset)),
      rotation: Math.round((Math.random() - 0.5) * 30),
      scale: 1,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const handleStaffStampSuccess = () => {
    // LoyaltyPurseService.addDirectStamp syncs exactly once to Supabase via CustomerRegistryService
    const res = LoyaltyPurseService.addDirectStamp(customerPhone, cafeSlug, loyaltyMaxVisits, settings.freeGiftOffer.title);
    const updated = LoyaltyPurseService.getData(customerPhone, cafeSlug, loyaltyMaxVisits);
    setLoyaltyData({ ...updated, photos: accumulatedPhotos });

    try {
      DigitalWalletService.updateCustomerCardComprehensive({
        cafeSlug,
        customerPhone,
        customerName: customerName || 'ضيف مميز',
        stampedCount: updated.stampedCount,
        maxSlots: loyaltyMaxVisits,
        giftTitle: settings.freeGiftOffer.title,
        logoUrl: settings.branding?.logoUrl,
        cafeName: settings.branding?.name || 'متجر الولاء',
        cardBackgroundUrl: settings.walletPassConfig?.cardBackgroundUrl,
        stampIcon: settings.stampConfig?.customEmoji || '☕',
        colorHex: settings.walletPassConfig?.colorHex || '#1C1C1E',
        pushMessage: res.isCardComplete
          ? `🎉 مبروك! اكتملت بطاقة الولاء الخاصة بك واستحققت: ${settings.freeGiftOffer.title}! 🎁`
          : `☕ تمت إضافة ختم جديد لكارت الولاء في ${settings.branding?.name || 'المتجر'}! رصيدك: ${updated.stampedCount}/${loyaltyMaxVisits}`,
      }).catch((e) => console.warn('Customer staff stamp wallet push error:', e));
    } catch (e) {
      reportIgnoredError('customer/staff_stamp_wallet_push', e);
    }

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

  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = regPhone.trim().replace(/[^0-9]/g, '');
    const name = regName.trim();
    if (!clean || clean.length < 8 || !name) return;

    CustomerRegistryService.registerCustomer(clean, name, 'vip_guest', cafeSlug);
    // Persist customer record to Supabase Cloud
    fetch('/api/v1/loyalty/stamps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerPhone: clean,
        cafeSlug,
        customerName: name,
        count: 0,
      }),
    }).catch((err) => console.warn('Failed to register customer in cloud:', err));
    localStorage.setItem('memories_customer_phone', clean);
    localStorage.setItem('memories_customer_name', name);
    setCustomerPhone(clean);
    setCustomerName(name);
    const updatedLoyalty = LoyaltyPurseService.getData(clean, cafeSlug, loyaltyMaxVisits);
    setLoyaltyData(updatedLoyalty);
    setRegSuccessNotice(`تم حفظ وربط كارت الولاء بنجاح للعميل (${name})!`);
    setTimeout(() => setRegSuccessNotice(null), 4000);
  };

  const handleClearCustomer = () => {
    setCustomerPhone('');
    setCustomerName('');
    localStorage.removeItem('memories_customer_phone');
    localStorage.removeItem('memories_customer_name');
    setLoyaltyData(LoyaltyPurseService.getData('', cafeSlug, loyaltyMaxVisits));
  };

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
    } catch (e) { reportIgnoredError('customer/CustomerClient#2', e); }

    if (updated.length > loyaltyData.stampedCount) {
      const stampRes = LoyaltyPurseService.addDirectStamp(clean, cafeSlug, loyaltyMaxVisits, settings.freeGiftOffer.title);
      const updatedPurse = LoyaltyPurseService.getData(clean, cafeSlug, loyaltyMaxVisits);
      setLoyaltyData({ ...updatedPurse, photos: updated });

      // 1. Audio feedback
      try {
        if (stampRes.isCardComplete) {
          SoundEffectsService.playRewardCelebration();
        } else {
          SoundEffectsService.playStampChime();
        }
      } catch (e) {
        reportIgnoredError('customer/photobooth_audio', e);
      }

      // 2. B2C Real-time Push Notification to Mobile Wallet (Apple & Google Wallet)
      try {
        DigitalWalletService.updateCustomerCardComprehensive({
          cafeSlug,
          customerPhone: clean,
          customerName: customerName || 'ضيف مميز',
          stampedCount: updatedPurse.stampedCount,
          maxSlots: loyaltyMaxVisits,
          giftTitle: settings.freeGiftOffer.title,
          logoUrl: settings.branding?.logoUrl,
          cafeName: settings.branding?.name || 'متجر الولاء',
          cardBackgroundUrl: settings.walletPassConfig?.cardBackgroundUrl,
          stampIcon: settings.stampConfig?.customEmoji || '☕',
          colorHex: settings.walletPassConfig?.colorHex || '#1C1C1E',
          pushMessage: stampRes.isCardComplete
            ? `🎉 مبروك! اكتملت بطاقة الولاء الخاصة بك من فوتوبوث ${settings.branding?.name || 'المتجر'}! استحققت: ${settings.freeGiftOffer.title} 🎁`
            : `📸✨ تم توثيق لقطة جديدة في شريط ذكرياتك وإضافة ختم لبطاقة الولاء في ${settings.branding?.name || 'المتجر'}! رصيدك: ${updatedPurse.stampedCount}/${loyaltyMaxVisits}`,
        }).catch((e) => reportIgnoredError('customer/photobooth_wallet_push', e));
      } catch (e) {
        reportIgnoredError('customer/photobooth_wallet_push_outer', e);
      }

      // 3. Supabase Cloud Sync
      fetch('/api/v1/loyalty/stamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: clean,
          cafeSlug,
          customerName: customerName || 'ضيف مميز',
          count: updatedPurse.stampedCount,
        }),
      }).catch((err) => reportIgnoredError('customer/photobooth_stamps_sync', err));

      // 4. B2B Real-time Event Broadcast (to Merchant POS / Dashboard)
      const b2bPayload = {
        type: 'PHOTOBOOTH_STAMP',
        customerName: customerName || 'ضيف مميز',
        phone: clean,
        stampedCount: updatedPurse.stampedCount,
        maxSlots: loyaltyMaxVisits,
        timestamp: new Date().toISOString(),
        cafeSlug,
      };

      // Authoritative State Orchestrator Dispatch
      EventOrchestratorService.dispatch(
        'STAMP_AWARDED',
        {
          customerPhone: clean,
          customerName: customerName || 'ضيف مميز',
          cafeSlug,
          newStampCount: updatedPurse.stampedCount,
          maxSlots: loyaltyMaxVisits,
          isCardComplete: Boolean(stampRes.isCardComplete),
          rewardTitle: settings.freeGiftOffer.title,
          timestamp: new Date().toISOString(),
          source: 'customer_action',
        },
        cafeSlug
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('stampy-b2b-activity', { detail: b2bPayload }));
        try {
          const bc = new BroadcastChannel('stampy_b2b_channel');
          bc.postMessage(b2bPayload);
          bc.close();
        } catch (e) {
          reportIgnoredError('customer/b2b_broadcast', e);
        }
      }

      // 5. In-app Customer Feedback Banner
      setRegSuccessNotice(
        stampRes.isCardComplete
          ? `🎉 مبروك! اكتملت بطاقة الولاء وحصلت على ${settings.freeGiftOffer.title}!`
          : `📸 تم حفظ اللقطة وإضافة ختم جديد لبطاقة الولاء! (${updatedPurse.stampedCount}/${loyaltyMaxVisits})`
      );
      setTimeout(() => setRegSuccessNotice(null), 4500);
    } else {
      setLoyaltyData((prev) => ({ ...prev, photos: updated }));
    }

    if (updated.length >= totalCardSlots) {
      const issued = VoucherService.issueVoucher({
        cafeSlug,
        customerPhone: clean,
        customerName: customerName || 'ضيف مميز',
        giftTitle: settings.freeGiftOffer.title,
        giftSubtitle: settings.freeGiftOffer.subtitle,
      });
      setGiftCode(issued.code);

      if (!hasAnsweredWallConsent) {
        setIsWallConsentModalOpen(true);
      } else {
        setIsCompletionRewardOpen(true);
      }
    }
  };

  const handleWallConsent = (consent: boolean) => {
    setHasAnsweredWallConsent(true);
    const clean = customerPhone.trim().replace(/[^0-9]/g, '') || 'guest';
    localStorage.setItem(`memories_wall_consent_${cafeSlug}_${clean}`, consent ? 'true' : 'false');
    setIsWallConsentModalOpen(false);

    const photoToPublish = accumulatedPhotos[0] || '';
    const tableBadge = tableNumber ? ` (طاولة ${tableNumber})` : '';
    const photoCaption = `ذكريات ${customerName || 'ضيف مميز'}${tableBadge} في ${settings.branding.name || 'Memories'} ✨☕`;

    if (consent) {
      WallFeedService.publishWallItem(cafeSlug, {
        customerName: customerName || 'ضيف مميز',
        photoUrl: photoToPublish,
        caption: photoCaption,
        timeFormatted: 'الآن',
        visitNumber: loyaltyData.stampedCount || 1,
        createdAt: new Date().toISOString(),
        visibility: 'live_wall',
        status: 'approved',
      });

      EventOrchestratorService.dispatch(
        'PHOTO_CASTED',
        {
          memoryId: 'phone_' + Date.now(),
          customerName: customerName || 'ضيف مميز',
          photoUrl: photoToPublish,
          caption: photoCaption,
          tableNumber,
          visitNumber: loyaltyData.stampedCount || 1,
          cafeSlug,
          timestamp: new Date().toISOString(),
          source: 'customer_mobile',
        },
        cafeSlug
      );
    }

    // Always commit to Supabase Storage & Memories table with appropriate visibility
    fetch('/api/v1/photobooth/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customerName || 'ضيف مميز',
        phone: customerPhone || clean,
        role: 'ضيف مميز',
        originalUrl: photoToPublish,
        photos: accumulatedPhotos,
        caption: `ذكريات ${customerName || 'ضيف مميز'} في ${settings.branding.name || 'stampy.'} ✨`,
        cafeSlug,
        liveWallConsent: consent,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.totalVisits) {
          const updatedPurse = LoyaltyPurseService.setStampedCount(
            customerPhone || clean,
            cafeSlug,
            data.totalVisits,
            loyaltyMaxVisits
          );
          setLoyaltyData((prev) => ({ ...prev, ...updatedPurse }));
        }
      })
      .catch((e) => reportIgnoredError('customer/capture-sync', e));

    setIsCompletionRewardOpen(true);
  };

  const handlePrintOrDownload = async () => {
    try {
      const highRes = await StripComposerService.composeStrip({
        photos: currentDisplayPhotos,
        totalSlots: totalCardSlots,
        frame: {
          ...selectedFrame,
          cardMode,
          bgColor: cardMode === 'spotify_player' ? spotifyBg : selectedFrame.bgColor,
          songTitle: spotifyTrack.title,
          songArtist: spotifyTrack.artist,
          ticketSeat,
        },
        branding: settings.branding,
        stickers,
        freeGiftOffer: settings.freeGiftOffer,
      });

      const isMobileSafari =
        typeof navigator !== 'undefined' &&
        /iP(ad|hone|od)/.test(navigator.userAgent) &&
        /WebKit/.test(navigator.userAgent) &&
        !/(CriOS|FxiOS|OPiOS|mercury)/.test(navigator.userAgent);

      if (isMobileSafari) {
        setIosSaveModalImage(highRes);
      } else {
        await ImageSaveService.saveImage({
          dataUrl: highRes,
          filename: `${settings.branding.name}-photostrip.png`,
        });
      }
    } catch (err) {
      console.warn('Direct print/download encountered an error:', err);
      if (currentDisplayPhotos[0]) {
        setIosSaveModalImage(currentDisplayPhotos[0]);
      }
    }
  };

  return {
    cafeSlug,
    tableNumber,
    settings,
    setSettings,
    staffLabel,
    selectedFrame,
    setSelectedFrame,
    cardMode,
    setCardMode,
    spotifyBg,
    setSpotifyBg,
    spotifyTrack,
    setSpotifyTrack,
    ticketSeat,
    setTicketSeat,
    activeTab,
    setActiveTab,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    loyaltyData,
    setLoyaltyData,
    customization,
    handleCustomizationChange,
    isStaffStampModalOpen,
    setIsStaffStampModalOpen,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    isCustomizerOpen,
    setIsCustomizerOpen,
    isCameraModalOpen,
    setIsCameraModalOpen,
    isWallConsentModalOpen,
    setIsWallConsentModalOpen,
    isCompletionRewardOpen,
    setIsCompletionRewardOpen,
    hasAnsweredWallConsent,
    iosSaveModalImage,
    setIosSaveModalImage,
    accumulatedPhotos,
    setAccumulatedPhotos,
    giftCode,
    stickers,
    setStickers,
    isStickerTrayOpen,
    setIsStickerTrayOpen,
    activeCaptureSlot,
    setActiveCaptureSlot,
    regName,
    setRegName,
    regPhone,
    setRegPhone,
    regSuccessNotice,
    totalCardSlots,
    loyaltyMaxVisits,
    currentDisplayPhotos,
    handleAddSticker,
    handleStaffStampSuccess,
    handleRegisterCustomer,
    handleClearCustomer,
    handleCommitPhoto,
    handleWallConsent,
    handlePrintOrDownload,
  };
}
