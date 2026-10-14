'use client';

import { useState, useEffect } from 'react';
import {
  BusinessSettings,
  BusinessType,
  BusinessStampConfig,
  StampCustomType,
  StampShapeStyle,
} from '@/types/photobooth';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { DigitalWalletService } from '@/lib/services/digital-wallet.service';
import { getIndustryProfile } from '@/lib/constants/photobooth-presets';
import { NOTIFICATION_TEMPLATES, UseDashboardSettingsReturn } from '../types';

export function useDashboardSettings(
  settings: BusinessSettings,
  onSettingsUpdated: (updated: BusinessSettings) => void
): UseDashboardSettingsReturn {
  // Business info state
  const [businessType, setBusinessType] = useState<BusinessType>((settings.businessType as BusinessType) || 'general');
  const [businessName, setBusinessName] = useState(settings.branding?.name || 'استوديو الذكريات');
  const [tagline, setTagline] = useState(settings.branding?.tagline || 'SHARED MOMENTS & GUEST ENGAGEMENT STUDIO');
  const [logoUrl, setLogoUrl] = useState(settings.branding?.logoUrl || '');
  const [showLogo, setShowLogo] = useState<boolean>(settings.branding?.showLogo !== false);
  const [shotCount, setShotCount] = useState(settings.defaultShotCount || 5);
  const [giftTitle, setGiftTitle] = useState(settings.freeGiftOffer?.title || 'كوب سبيشالتي مجاني من اختيارك');
  const [giftSubtitle, setGiftSubtitle] = useState(settings.freeGiftOffer?.subtitle || 'مكافأة حصرية للعميل عند إكمال الزيارات');

  // Stamp customization state (Merchant Project Stamp)
  const currentStampConfig = settings.stampConfig || {
    type: 'emoji',
    customEmoji: '☕',
    logoUrl: settings.branding?.logoUrl || '',
    knockoutLogo: true,
    inkColor: '#231C18',
    shape: 'circle',
  };

  const [stampType, setStampType] = useState<StampCustomType>(currentStampConfig.type || 'emoji');
  const [customEmoji, setCustomEmoji] = useState<string>(currentStampConfig.customEmoji || '☕');
  const [stampLogoUrl, setStampLogoUrl] = useState<string>(currentStampConfig.logoUrl || logoUrl || '');
  const [knockoutLogo, setKnockoutLogo] = useState<boolean>(currentStampConfig.knockoutLogo !== false);
  const [inkColor, setInkColor] = useState<string>(currentStampConfig.inkColor || '#231C18');
  const [stampShape, setStampShape] = useState<StampShapeStyle>(currentStampConfig.shape || 'circle');

  // Push notifications state
  const [connectedPassesCount, setConnectedPassesCount] = useState<number>(1);
  const [notificationMsg, setNotificationMsg] = useState<string>(NOTIFICATION_TEMPLATES[0]);
  const [isSendingNotif, setIsSendingNotif] = useState<boolean>(false);
  const [notifResult, setNotifResult] = useState<{ success: boolean; message: string } | null>(null);

  // General feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeIndustry = getIndustryProfile(businessType);

  // Load active passes count
  useEffect(() => {
    try {
      const passes = DigitalWalletService.getIssuedPasses(settings.cafeSlug);
      setConnectedPassesCount(Math.max(1, passes.length));
    } catch {
      setConnectedPassesCount(1);
    }
  }, [settings.cafeSlug]);

  // Keep stamp logo synced if merchant updates brand logo
  useEffect(() => {
    if (logoUrl && !stampLogoUrl) {
      setStampLogoUrl(logoUrl);
    }
  }, [logoUrl, stampLogoUrl]);

  const handleSelectIndustry = (typeId: BusinessType) => {
    setBusinessType(typeId);
    const profile = getIndustryProfile(typeId);
    if (!giftTitle || giftTitle === 'كوب قهوة مختصة مجاني' || giftTitle === 'هدية ترحيبية خاصة' || giftTitle === 'كوب سبيشالتي مجاني من اختيارك') {
      setGiftTitle(profile.defaultGiftTitle);
      setGiftSubtitle(profile.defaultGiftSubtitle);
    }
  };

  const handleSave = () => {
    const updatedStampConfig: BusinessStampConfig = {
      type: stampType,
      customEmoji: customEmoji.trim() || '⭐',
      logoUrl: (stampLogoUrl.trim() || logoUrl.trim()) || undefined,
      knockoutLogo,
      inkColor,
      shape: stampShape,
    };

    const updated: BusinessSettings = {
      ...settings,
      businessType,
      branding: {
        ...settings.branding,
        name: businessName,
        tagline,
        logoUrl: logoUrl.trim() || undefined,
        showLogo,
      },
      defaultShotCount: shotCount,
      loyaltyMaxVisits: shotCount,
      freeGiftOffer: {
        title: giftTitle,
        subtitle: giftSubtitle,
        icon: 'gift',
      },
      stampConfig: updatedStampConfig,
    };

    BusinessSettingsService.saveSettings(updated);
    onSettingsUpdated(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleBroadcastNotification = async () => {
    if (!notificationMsg.trim()) return;
    setIsSendingNotif(true);
    setNotifResult(null);

    try {
      const res = await DigitalWalletService.broadcastVenueNotification(
        notificationMsg.trim(),
        settings.cafeSlug
      );

      if (res.notifiedDevices > 0 || res.sentCount > 0) {
        setNotifResult({
          success: true,
          message: `تم إرسال الإشعار بنجاح إلى ${Math.max(1, res.notifiedDevices)} هاتف ذكي عبر Apple APNs & Google Wallet!`,
        });
      } else {
        setNotifResult({
          success: false,
          message: 'تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت والمحاولة ثانية.',
        });
      }
    } catch (err: any) {
      setNotifResult({
        success: false,
        message: err?.message || 'حدث خطأ أثناء بث الإشعار للمحافظ الرقمية.',
      });
    } finally {
      setIsSendingNotif(false);
      setTimeout(() => setNotifResult(null), 6000);
    }
  };

  return {
    settings,
    businessType,
    setBusinessType,
    businessName,
    setBusinessName,
    tagline,
    setTagline,
    logoUrl,
    setLogoUrl,
    showLogo,
    setShowLogo,
    shotCount,
    setShotCount,
    giftTitle,
    setGiftTitle,
    giftSubtitle,
    setGiftSubtitle,
    stampType,
    setStampType,
    customEmoji,
    setCustomEmoji,
    stampLogoUrl,
    setStampLogoUrl,
    knockoutLogo,
    setKnockoutLogo,
    inkColor,
    setInkColor,
    stampShape,
    setStampShape,
    connectedPassesCount,
    notificationMsg,
    setNotificationMsg,
    isSendingNotif,
    notifResult,
    saveSuccess,
    activeIndustry,
    handleSelectIndustry,
    handleSave,
    handleBroadcastNotification,
  };
}
