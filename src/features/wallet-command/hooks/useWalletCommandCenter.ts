'use client';

import { useState, useEffect, useRef } from 'react';
import {
  BusinessSettings,
  VenueLocationConfig,
  WalletPassCustomizationConfig,
  WalletBarcodeFormat,
  WalletColorPreset,
} from '@/types/photobooth';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { SuperAdminService } from '@/lib/services/super-admin.service';
import { LOCKSCREEN_MESSAGE_PRESETS, WALLET_BROADCAST_TEMPLATES } from '@/lib/constants/wallet-notification-presets';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { CardImageService } from '@/lib/services/card-image.service';

export function useWalletCommandCenter(
  settings: BusinessSettings,
  onSettingsUpdated: (updated: BusinessSettings) => void
) {
  // 0. SaaS Tenant Quota Telemetry
  const [tenantQuota, setTenantQuota] = useState(() => {
    const q = SuperAdminService.checkTenantQuota(settings.cafeSlug);
    const cfg = SuperAdminService.getTenantWalletConfig(settings.cafeSlug);
    return { ...q, resetDate: cfg.quotaResetDate };
  });

  useEffect(() => {
    SuperAdminService.getTenantWalletConfigAsync(settings.cafeSlug).then((cfg) => {
      const q = SuperAdminService.checkTenantQuota(settings.cafeSlug);
      setTenantQuota({ ...q, resetDate: cfg.quotaResetDate });
    });
  }, [settings.cafeSlug]);

  // 1. Location / Geofencing State (~100m Lock Screen)
  const initialLoc: VenueLocationConfig = settings.locationConfig || {
    enabled: true,
    latitude: 30.0444,
    longitude: 31.2357,
    relevantText: `أهلاً بك في ${settings.branding?.name || 'المكان'}! كارت الذكرى والولاء جاهز للتوثيق ✨`,
  };

  const [geofenceEnabled, setGeofenceEnabled] = useState<boolean>(initialLoc.enabled);
  const [latitude, setLatitude] = useState<number>(initialLoc.latitude || 30.0444);
  const [longitude, setLongitude] = useState<number>(initialLoc.longitude || 31.2357);
  const [altitude, setAltitude] = useState<number | undefined>(initialLoc.altitude);
  const [relevantText, setRelevantText] = useState<string>(
    initialLoc.relevantText || `أهلاً بك في ${settings.branding?.name || 'المكان'}! كارت الذكرى والولاء جاهز للتوثيق ✨`
  );
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  // 2. Pass Branding & Customization State
  const initialWalletConfig: WalletPassCustomizationConfig = settings.walletPassConfig || {
    colorPreset: 'dark',
    barcodeFormat: 'QR',
    sharingProhibited: true,
  };

  const [colorPreset, setColorPreset] = useState<WalletColorPreset>(
    initialWalletConfig.colorPreset || 'dark'
  );
  const [colorHex, setColorHex] = useState<string>(initialWalletConfig.colorHex || '#231C18');
  const [barcodeFormat, setBarcodeFormat] = useState<WalletBarcodeFormat>(
    initialWalletConfig.barcodeFormat || 'QR'
  );
  const [sharingProhibited, setSharingProhibited] = useState<boolean>(
    initialWalletConfig.sharingProhibited !== false
  );

  // Background artwork & opacity
  const [cardBackgroundUrl, setCardBackgroundUrl] = useState<string | undefined>(
    initialWalletConfig.cardBackgroundUrl
  );
  const [cardOverlayOpacity, setCardOverlayOpacity] = useState<number>(
    initialWalletConfig.cardOverlayOpacity ?? 0.65
  );
  const [cardPresetId, setCardPresetId] = useState<string | undefined>(
    initialWalletConfig.cardBackgroundPresetId
  );
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [imageSuccessMsg, setImageSuccessMsg] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 3. Quota & Usage State
  const [usage, setUsage] = useState<{
    count: number;
    limit: number;
    remaining: number;
    resetDate: string;
    plan: string;
    isByok?: boolean;
  } | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState<boolean>(true);

  // 4. Push Broadcast State
  const [broadcastMsg, setBroadcastMsg] = useState<string>(WALLET_BROADCAST_TEMPLATES[0]);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);
  const [broadcastResult, setBroadcastResult] = useState<{ success: boolean; message: string } | null>(
    null
  );

  // 5. Issued Passes Registry State
  const [passesList, setPassesList] = useState<any[]>([]);
  const [isLoadingPasses, setIsLoadingPasses] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingPassBody, setInspectingPassBody] = useState<any | null>(null);
  const [inspectPassLoading, setInspectPassLoading] = useState<boolean>(false);
  const [revokingSerial, setRevokingSerial] = useState<string | null>(null);

  // Feedback banner
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load live usage & passes
  const loadUsageAndPasses = async () => {
    setIsLoadingUsage(true);
    setIsLoadingPasses(true);
    try {
      const [usageData, passesData] = await Promise.all([
        DigitalWalletService.getUsage(settings.cafeSlug),
        DigitalWalletService.listPasses({ limit: 50 }),
      ]);
      setUsage(usageData);
      setPassesList(passesData.passes || []);
    } catch (e) {
      console.warn('Failed to load wallet stats:', e);
    } finally {
      setIsLoadingUsage(false);
      setIsLoadingPasses(false);
    }
  };

  useEffect(() => {
    loadUsageAndPasses();
  }, []);

  // Real-time GPS Detection
  const handleDetectCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsNotice('متصفحك لا يدعم تحديد الموقع الجغرافي GPS');
      return;
    }

    setIsDetectingGps(true);
    setGpsNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        if (pos.coords.altitude) {
          setAltitude(parseFloat(pos.coords.altitude.toFixed(1)));
        }
        setIsDetectingGps(false);
        setGpsNotice('تم التقاط إحداثيات موقعك بنجاح عبر GPS!');
        setTimeout(() => setGpsNotice(null), 4000);
      },
      (err) => {
        setIsDetectingGps(false);
        setGpsNotice(`تعذر التقاط الموقع: ${err.message || 'يرجى السماح بالوصول للموقع'}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle Image Upload & Fast Client-side Compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    setImageError(null);
    setImageSuccessMsg(null);
    try {
      const result = await CardImageService.compressAndCropImage(file, {
        targetWidth: 690,
        targetHeight: 1010,
        quality: 0.85,
      });
      await CardImageService.saveCustomImage(`merchant_bg_${settings.cafeSlug}`, result.dataUrl);
      setCardBackgroundUrl(result.dataUrl);
      setCardPresetId(undefined);
      setImageSuccessMsg(`تم ضغط وتحسين الصورة بنجاح (${result.sizeKb} KB) بمقاس 690×1010 لكروت Apple & Google Wallet`);
      setTimeout(() => setImageSuccessMsg(null), 5000);
    } catch (err: any) {
      setImageError(err?.message || 'تعذر معالجة الصورة، يرجى المحاولة بصورة أخرى');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save Settings
  const handleSaveSettings = () => {
    const updatedLocation: VenueLocationConfig = {
      enabled: geofenceEnabled,
      latitude: Number(latitude),
      longitude: Number(longitude),
      altitude: altitude ? Number(altitude) : undefined,
      relevantText: relevantText.trim() || undefined,
    };

    const updatedWalletConfig: WalletPassCustomizationConfig = {
      colorPreset,
      colorHex: colorHex.trim() || undefined,
      barcodeFormat,
      sharingProhibited,
      cardBackgroundUrl: cardBackgroundUrl || undefined,
      cardOverlayOpacity: cardOverlayOpacity,
      cardBackgroundPresetId: cardPresetId || undefined,
    };

    const updatedSettings: BusinessSettings = {
      ...settings,
      locationConfig: updatedLocation,
      walletPassConfig: updatedWalletConfig,
    };

    BusinessSettingsService.saveSettings(updatedSettings);
    onSettingsUpdated(updatedSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Broadcast Push Notification
  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setIsSendingBroadcast(true);
    setBroadcastResult(null);

    try {
      const res = await DigitalWalletService.broadcastVenueNotification(
        broadcastMsg.trim(),
        settings.cafeSlug
      );

      if (res.sentCount > 0 || res.notifiedDevices > 0) {
        setBroadcastResult({
          success: true,
          message: `تم بث الإشعار بنجاح إلى ${Math.max(1, res.notifiedDevices)} جهاز آبل وأندرويد عبر APNs!`,
        });
      } else {
        setBroadcastResult({
          success: true,
          message: 'تم تحديث الإشعار في سجل الكروت بنجاح وسيتزامن فور اتصال الأجهزة.',
        });
      }
    } catch (err: any) {
      setBroadcastResult({
        success: false,
        message: err?.message || 'حدث خطأ أثناء بث الإشعار للمحافظ.',
      });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Inspect Pass Body
  const handleInspectPass = async (serial: string) => {
    setInspectPassLoading(true);
    try {
      const res = await DigitalWalletService.getPassBody(serial);
      setInspectingPassBody({ serial, ...res });
    } catch (e: any) {
      alert(`تعذر جلب تفاصيل الكارت: ${e?.message}`);
    } finally {
      setInspectPassLoading(false);
    }
  };

  // Revoke Pass
  const handleRevokePass = async (serial: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الكارت نهائياً؟ ستظهر البطاقة كمنتهية الصلاحية ولن يتمكن العميل من مسحها.')) {
      return;
    }
    setRevokingSerial(serial);
    try {
      await DigitalWalletService.revokePass(serial);
      setPassesList((prev) =>
        prev.map((p) => (p.serialNumber === serial ? { ...p, revoked: true } : p))
      );
      alert('تم إلغاء صلاحية الكارت بنجاح وتم تحديث الأجهزة!');
    } catch (e: any) {
      alert(`تعذر إلغاء الكارت: ${e?.message}`);
    } finally {
      setRevokingSerial(null);
    }
  };

  const filteredPasses = passesList.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.serialNumber?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.detail?.toLowerCase().includes(q)
    );
  });

  return {
    tenantQuota,
    geofenceEnabled,
    setGeofenceEnabled,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    altitude,
    setAltitude,
    relevantText,
    setRelevantText,
    isDetectingGps,
    gpsNotice,
    colorPreset,
    setColorPreset,
    colorHex,
    setColorHex,
    barcodeFormat,
    setBarcodeFormat,
    sharingProhibited,
    setSharingProhibited,
    cardBackgroundUrl,
    setCardBackgroundUrl,
    cardOverlayOpacity,
    setCardOverlayOpacity,
    cardPresetId,
    setCardPresetId,
    isProcessingImage,
    imageSuccessMsg,
    imageError,
    fileInputRef,
    usage,
    isLoadingUsage,
    broadcastMsg,
    setBroadcastMsg,
    isSendingBroadcast,
    broadcastResult,
    passesList,
    filteredPasses,
    isLoadingPasses,
    searchQuery,
    setSearchQuery,
    inspectingPassBody,
    setInspectingPassBody,
    inspectPassLoading,
    revokingSerial,
    saveSuccess,
    loadUsageAndPasses,
    handleDetectCurrentLocation,
    handleImageUpload,
    handleSaveSettings,
    handleBroadcast,
    handleInspectPass,
    handleRevokePass,
  };
}
