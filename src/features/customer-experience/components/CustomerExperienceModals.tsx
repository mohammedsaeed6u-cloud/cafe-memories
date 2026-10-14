'use client';

import React from 'react';
import { CustomerCameraModal } from '@/components/customer/CustomerCameraModal';
import { StaffQuickStampModal } from '@/features/loyalty/StaffQuickStampModal';
import { WalletNotificationModal } from '@/features/notifications/WalletNotificationModal';
import { WallConsentModal } from '@/features/wall-consent/WallConsentModal';
import { CompletionGiftRewardModal } from '@/features/rewards/CompletionGiftRewardModal';
import { IosSaveImageModal } from '@/components/photobooth/IosSaveImageModal';
import { UseCustomerExperienceReturn } from '../types';

interface Props {
  cx: UseCustomerExperienceReturn;
}

export const CustomerExperienceModals: React.FC<Props> = ({ cx }) => {
  const {
    isCameraModalOpen,
    setIsCameraModalOpen,
    settings,
    activeCaptureSlot,
    accumulatedPhotos,
    handleCommitPhoto,
    isStaffStampModalOpen,
    setIsStaffStampModalOpen,
    handleStaffStampSuccess,
    staffLabel,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    cafeSlug,
    isWallConsentModalOpen,
    setIsWallConsentModalOpen,
    handleWallConsent,
    isCompletionRewardOpen,
    setIsCompletionRewardOpen,
    giftCode,
    handlePrintOrDownload,
    iosSaveModalImage,
    setIosSaveModalImage,
  } = cx;

  return (
    <>
      {/* Live Camera Viewfinder Modal */}
      <CustomerCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        brandName={settings.branding.name}
        visitNumber={(activeCaptureSlot !== null ? activeCaptureSlot : accumulatedPhotos.length) + 1}
        onCaptureComplete={(photo: string) => {
          handleCommitPhoto(photo);
          setIsCameraModalOpen(false);
        }}
      />

      {/* Staff Quick Stamp Modal */}
      <StaffQuickStampModal
        isOpen={isStaffStampModalOpen}
        onClose={() => setIsStaffStampModalOpen(false)}
        onStampSuccess={handleStaffStampSuccess}
        staffLabel={staffLabel}
      />

      {/* Merchant-side Wallet Push Notification Broadcaster */}
      <WalletNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        cafeSlug={cafeSlug}
        cafeName={settings.branding.name}
      />

      {/* TV Wall Display Consent Modal */}
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
    </>
  );
};
