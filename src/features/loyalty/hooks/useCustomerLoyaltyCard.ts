'use client';

import { useState } from 'react';
import { CardCanvasExportService } from '@/lib/services/card-canvas-export.service';
import { ImageSaveService } from '@/lib/services/image-save.service';
import { DigitalWalletService, DigitalWalletPassData } from '@/lib/services/digital-wallet.service';
import { reportIgnoredError } from '@/lib/services/diagnostics';

export interface UseCustomerLoyaltyCardProps {
  passData: DigitalWalletPassData;
  customerName: string;
  customerTitle: string;
  brandName: string;
  stampedCountLive: number;
  maxSlots: number;
  activeThemeId: string;
  cafeSlug: string;
  giftTitle: string;
  activeStamp?: string;
  cafeLogoUrl?: string;
  passBgColor?: string;
  cardBgUrl?: string;
}

export function useCustomerLoyaltyCard({
  passData,
  customerName,
  customerTitle,
  brandName,
  stampedCountLive,
  maxSlots,
  activeThemeId,
  cafeSlug,
  giftTitle,
  activeStamp,
  cafeLogoUrl,
  passBgColor,
  cardBgUrl,
}: UseCustomerLoyaltyCardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [iosModalImage, setIosModalImage] = useState<string | null>(null);
  const [isPassFlipped, setIsPassFlipped] = useState(false);
  const [oneTapState, setOneTapState] = useState<'idle' | 'working' | 'done'>('idle');

  const buildCardDataUrl = async (): Promise<string> => {
    const cleanPhone = (passData.customerPhone || 'guest').trim().replace(/[^0-9]/g, '') || 'guest';
    const qrTargetUrl = `https://memories-c9w.pages.dev/c/${cafeSlug || 'stampy'}?action=stamp&customer=${cleanPhone}`;

    return CardCanvasExportService.exportCardToDataUrl({
      format: 'apple_wallet',
      customerName: customerName || 'ضيف مميز',
      profession: customerTitle || 'عضو مميز',
      cafeName: brandName || 'Stampy',
      stampsCount: stampedCountLive,
      totalSlots: maxSlots,
      giftTitle: giftTitle || 'هدية الزيارة أو خصم ترحيبي',
      stampIcon: activeStamp || '📸',
      cafeLogoUrl: cafeLogoUrl,
      qrTargetUrl,
      backgroundColor: passBgColor || '#1C1C1E',
      cardBackgroundUrl: cardBgUrl,
      theme: activeThemeId,
    });
  };

  const handleSaveCardToDevice = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await buildCardDataUrl();
      const filename = `${cafeSlug || 'stampy'}-loyalty-card.png`;
      const res = await ImageSaveService.saveImage({
        dataUrl,
        filename,
        title: `كارت ولاء ${brandName}`,
      });
      if (res.method === 'fallback') {
        setIosModalImage(res.blobUrl || dataUrl);
      }
    } catch (err) {
      console.warn('Failed to save card to device:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareCard = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await buildCardDataUrl();
      await CardCanvasExportService.shareCardImage(dataUrl, `كارت ولاء ${brandName}`);
    } catch (err) {
      console.warn('Failed to share card:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOneTapAddToAppleWallet = async () => {
    setOneTapState('working');
    try {
      // Clear stale session cache so new customizations and uploads are immediately effective
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const k = window.sessionStorage.key(i);
            if (k && k.startsWith('ww_pass_')) keysToRemove.push(k);
          }
          keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
        } catch (e) {
          reportIgnoredError('customer/sessionStorage_clear', e);
        }
      }

      // Always regenerate fresh strip image with exact live stamps count, active stamp, and uploaded background
      try {
        passData.stripUrl = await CardCanvasExportService.generateAppleWalletStripImage({
          stampsCount: stampedCountLive,
          totalSlots: maxSlots,
          stampIcon: activeStamp || '⭐',
          giftTitle: giftTitle || 'هدية الزيارة أو خصم ترحيبي',
          cafeName: brandName || 'Stampy',
          backgroundColor: passBgColor || '#1C1C1E',
          cardBackgroundUrl: cardBgUrl,
        });
      } catch (err) {
        console.warn('Strip generation note:', err);
      }

      passData.stampIcon = activeStamp || passData.stampIcon || '📸';
      passData.giftTitle = giftTitle || passData.giftTitle;
      passData.color = passBgColor || passData.color || '#1C1C1E';
      if (cardBgUrl) {
        passData.backgroundUrl = cardBgUrl;
      }
      if (cafeLogoUrl) {
        passData.logoUrl = cafeLogoUrl;
        passData.iconUrl = cafeLogoUrl;
      }

      const issued = await DigitalWalletService.issueSignedPass(passData);
      const isIOS =
        typeof navigator !== 'undefined' &&
        (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
          (/Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1));

      if (isIOS) {
        const isInAppBrowser = /Instagram|FBAN|FBAV|Twitter|Snapchat|WhatsApp/i.test(navigator.userAgent);
        if (isInAppBrowser) {
          window.location.href = issued.shareUrl;
        } else {
          window.location.href = issued.pkpassUrl;
        }
      } else if (issued.applePassBase64) {
        const bytes = Uint8Array.from(atob(issued.applePassBase64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'application/vnd.apple.pkpass' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${passData.cafeSlug}-loyalty-card.pkpass`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      } else {
        window.location.href = issued.shareUrl || issued.pkpassUrl;
      }

      setOneTapState('done');
      setTimeout(() => setOneTapState('idle'), 4000);
    } catch (err) {
      console.warn('WalletWallet pass issuance failed, falling back to local pass:', err);
      window.location.href = DigitalWalletService.getApplePassUrl(passData);
      setOneTapState('done');
      setTimeout(() => setOneTapState('idle'), 4000);
    }
  };

  const handleOneTapAddToGoogleWallet = async () => {
    try {
      const issued = await DigitalWalletService.issueSignedPass(passData);
      window.location.href = issued.googleSaveUrl || issued.shareUrl;
    } catch {
      window.location.href = DigitalWalletService.generateGoogleWalletSaveUrl(passData);
    }
  };

  return {
    isExporting,
    iosModalImage,
    setIosModalImage,
    isPassFlipped,
    setIsPassFlipped,
    oneTapState,
    handleSaveCardToDevice,
    handleShareCard,
    handleOneTapAddToAppleWallet,
    handleOneTapAddToGoogleWallet,
  };
}
