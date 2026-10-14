'use client';

import React from 'react';
import { CustomerThemeConfig } from '@/features/customization/customer-themes';
import { CUSTOMER_THEMES } from '@/features/customization/CustomerCustomizerBar';
import { IosSaveImageModal } from '@/components/photobooth/IosSaveImageModal';
import { VenueLocationConfig, WalletPassCustomizationConfig } from '@/types/photobooth';
import { AppleWalletPassFace } from './components/AppleWalletPassFace';
import { AppleWalletPassBack } from './components/AppleWalletPassBack';
import { AppleWalletInstallButtons } from './components/AppleWalletInstallButtons';
import { LoyaltyCardActionRow } from './components/LoyaltyCardActionRow';
import { useCustomerLoyaltyCard } from './hooks/useCustomerLoyaltyCard';

export interface CustomerLoyaltyDataProp {
  stampedCount: number;
  maxSlots: number;
  completedCardsCount?: number;
  customerPhone?: string;
  cafeSlug?: string;
  photos?: string[];
}

export interface CustomerLoyaltyCardProps {
  loyaltyData: CustomerLoyaltyDataProp;
  giftTitle?: string;
  brandName?: string;
  cafeLogoUrl?: string;
  customerName?: string;
  customerTitle?: string;
  themeConfig?: CustomerThemeConfig;
  stampIconEmoji?: string;
  stampConfig?: any;
  locationConfig?: VenueLocationConfig;
  walletPassConfig?: WalletPassCustomizationConfig;
  instagramHandle?: string;
  onOpenStaffStamp: () => void;
  onOpenNotificationBroadcaster?: () => void;
  className?: string;
}

export const CustomerLoyaltyCard: React.FC<CustomerLoyaltyCardProps> = ({
  loyaltyData,
  giftTitle = 'هدية الزيارة أو خصم ترحيبي',
  brandName = 'Stampy',
  cafeLogoUrl,
  customerName = 'ضيف مميز',
  customerTitle = 'عضو مميز',
  themeConfig,
  stampIconEmoji = '📸',
  stampConfig,
  locationConfig,
  walletPassConfig,
  instagramHandle = '@stampy',
  onOpenStaffStamp,
  onOpenNotificationBroadcaster,
  className = '',
}) => {
  const { stampedCount, maxSlots, customerPhone, cafeSlug } = loyaltyData;
  const activeTheme = themeConfig || CUSTOMER_THEMES[0];
  const activeStamp = stampConfig?.customEmoji || stampIconEmoji || '📸';
  const stampedCountLive = Math.min(stampedCount, maxSlots);

  const passData = {
    cafeSlug: cafeSlug || 'stampy',
    cafeName: brandName || 'Stampy',
    logoUrl: cafeLogoUrl,
    iconUrl: cafeLogoUrl,
    customerPhone: customerPhone || 'guest',
    customerName: customerName || 'ضيف مميز',
    customerTitle: customerTitle || 'عضو مميز',
    colorPreset: walletPassConfig?.colorPreset || 'dark',
    color: walletPassConfig?.colorHex || '#1C1C1E',
    barcodeFormat: walletPassConfig?.barcodeFormat || 'QR',
    barcodeAltText: walletPassConfig?.barcodeAltText || 'امسح عند الكاشير للختم الفوري',
    sharingProhibited: walletPassConfig?.sharingProhibited ?? true,
    expirationDays: walletPassConfig?.expirationDays,
    stampIcon: activeStamp,
    stampedCount: stampedCountLive,
    maxSlots,
    giftTitle,
    instagramHandle: instagramHandle || `@${cafeSlug || 'stampy'}`,
    locations:
      locationConfig?.enabled && locationConfig.latitude && locationConfig.longitude
        ? [
            {
              latitude: locationConfig.latitude,
              longitude: locationConfig.longitude,
              altitude: locationConfig.altitude,
              relevantText:
                locationConfig.relevantText || `أهلاً بك في ${brandName}! كارتك جاهز للختم ☕`,
            },
          ]
        : undefined,
  };

  const {
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
  } = useCustomerLoyaltyCard({
    passData,
    customerName,
    customerTitle,
    brandName,
    stampedCountLive,
    maxSlots,
    activeThemeId: activeTheme.id,
    cafeSlug: cafeSlug || 'stampy',
    giftTitle,
    activeStamp,
    cafeLogoUrl,
    passBgColor: walletPassConfig?.colorHex || '#1C1C1E',
    cardBgUrl: walletPassConfig?.cardBackgroundUrl,
  });

  const passBgColor = walletPassConfig?.colorHex || '#1C1C1E';
  const cardBgUrl = walletPassConfig?.cardBackgroundUrl;
  const overlayOpacity = walletPassConfig?.cardOverlayOpacity ?? 0.65;
  const qrTargetUrl = `https://memories-c9w.pages.dev/c/${cafeSlug || 'stampy'}?action=stamp&customer=${(customerPhone || '').replace(/[^0-9]/g, '')}`;

  return (
    <div className={`w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center select-none ${className}`}>
      {/* Exact Native iOS Apple Wallet Sheet Header Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 mb-2 bg-[#161618] rounded-2xl border border-white/10 shadow-md text-white">
        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-stone-300">
          ✕
        </div>
        <span className="text-xs sm:text-sm font-semibold tracking-tight text-white font-sans">
          كارت ولاء {brandName} الذكي
        </span>
        <button
          type="button"
          onClick={handleOneTapAddToAppleWallet}
          className="bg-[#007AFF] hover:bg-[#0062CC] active:scale-95 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm transition cursor-pointer"
        >
          Add
        </button>
      </div>

      {/* Exact Native Apple Wallet Pass Container */}
      <div
        className="w-full relative rounded-[26px] overflow-hidden transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] border border-white/10"
        style={{
          backgroundColor: passBgColor,
          color: '#FFFFFF',
        }}
      >
        {/* Optional Brand Background Artwork */}
        {cardBgUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-300 pointer-events-none"
            style={{ backgroundImage: `url(${cardBgUrl})` }}
          />
        )}
        {/* Dark / Tint Overlay for Crisp Readability */}
        <div
          className="absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none"
          style={{
            backgroundColor: passBgColor,
            opacity: cardBgUrl ? overlayOpacity : 1,
          }}
        />
        {/* Subtle Radial Glass Sheen */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/10 via-transparent to-black/40 pointer-events-none" />

        {!isPassFlipped ? (
          <AppleWalletPassFace
            brandName={brandName}
            cafeLogoUrl={cafeLogoUrl}
            stampedCount={stampedCountLive}
            maxSlots={maxSlots}
            activeStamp={activeStamp}
            giftTitle={giftTitle}
            customerName={customerName}
            customerTitle={customerTitle}
            qrTargetUrl={qrTargetUrl}
            onFlip={() => setIsPassFlipped(true)}
            accentColor={activeTheme.accentHex}
          />
        ) : (
          <AppleWalletPassBack
            brandName={brandName}
            customerPhone={customerPhone}
            giftTitle={giftTitle}
            maxSlots={maxSlots}
            instagramHandle={instagramHandle}
            onFlipBack={() => setIsPassFlipped(false)}
          />
        )}
      </div>

      {/* Apple & Google Wallet One-Tap Add Buttons */}
      <AppleWalletInstallButtons
        onAddToAppleWallet={handleOneTapAddToAppleWallet}
        onAddToGoogleWallet={handleOneTapAddToGoogleWallet}
        oneTapState={oneTapState}
      />

      {/* Actions: Share & Save */}
      <LoyaltyCardActionRow
        onShare={handleShareCard}
        onSaveToDevice={handleSaveCardToDevice}
        onOpenStaffStamp={onOpenStaffStamp}
        onOpenNotificationBroadcaster={onOpenNotificationBroadcaster}
        isExporting={isExporting}
      />

      {/* Hidden/Modal: iOS Save Image Modal */}
      <IosSaveImageModal
        isOpen={Boolean(iosModalImage)}
        imageUrl={iosModalImage || ''}
        onClose={() => setIosModalImage(null)}
      />
    </div>
  );
};
