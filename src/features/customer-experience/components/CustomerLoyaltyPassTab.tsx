'use client';

import React, { useState } from 'react';
import { CUSTOMER_THEMES } from '@/features/customization/customer-themes';
import { CustomerLoyaltyCard } from '@/features/loyalty/CustomerLoyaltyCard';
import { TappyCustomerWebCard } from './TappyCustomerWebCard';
import { CheckCircle, UserCheck, CheckCircle2, Smartphone } from 'lucide-react';
import { UseCustomerExperienceReturn } from '../types';

interface Props {
  cx: UseCustomerExperienceReturn;
}

export const CustomerLoyaltyPassTab: React.FC<Props> = ({ cx }) => {
  const {
    settings,
    loyaltyData,
    loyaltyMaxVisits,
    accumulatedPhotos,
    customerPhone,
    customerName,
    customization,
    setIsStaffStampModalOpen,
    setIsNotificationModalOpen,
    handleClearCustomer,
    handleRegisterCustomer,
    regName,
    setRegName,
    regPhone,
    setRegPhone,
    setActiveTab,
  } = cx;

  const [activeCardMode, setActiveCardMode] = useState<'paper' | 'wallet'>('paper');

  const effectiveMaxSlots = settings.loyaltyMaxVisits || loyaltyMaxVisits || 8;
  const effectiveStampedCount = loyaltyData.stampedCount;

  return (
    <div className="w-full flex flex-col items-center space-y-4 animate-in fade-in duration-200">
      {/* View Switcher: Authentic Stampy Paper Card vs Native Apple Wallet Sheet */}
      <div className="flex items-center gap-1.5 p-1 bg-[#FAF5EB] border border-[#DFAB56]/40 rounded-2xl shadow-xs text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveCardMode('paper')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            activeCardMode === 'paper'
              ? 'bg-[#682025] text-[#FAF5EB] shadow-xs'
              : 'text-[#3D2314] hover:bg-white/60'
          }`}
        >
          <span>📜 كارت الأختام التفاعلي (ستامبي)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveCardMode('wallet')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            activeCardMode === 'wallet'
              ? 'bg-[#682025] text-[#FAF5EB] shadow-xs'
              : 'text-[#3D2314] hover:bg-white/60'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-[#DFAB56]" />
          <span>بطاقة المحفظة الرسمية</span>
        </button>
      </div>

      {/* MODE 1: STAMPY AUTHENTIC PHYSICAL DIGITAL CARD */}
      {activeCardMode === 'paper' && (
        <TappyCustomerWebCard
          cafeSlug={cx.cafeSlug}
          settings={settings}
          stampedCount={effectiveStampedCount}
          maxSlots={effectiveMaxSlots}
          customerName={customization.customerName || customerName || 'ضيفنا المميز'}
          customerPhone={customerPhone || ''}
          showSimulator={false}
          onAddStamp={() => {
            cx.handleStaffStampSuccess();
          }}
          onResetStamps={() => {
            // Card reset after redemption
          }}
          onOpenPhotoboothStudio={() => {
            setActiveTab('studio');
          }}
        />
      )}

      {/* MODE 2: NATIVE APPLE/GOOGLE WALLET PASS FLIP CARD */}
      {activeCardMode === 'wallet' && (
        <div className="w-full space-y-4">
          <CustomerLoyaltyCard
            loyaltyData={{
              ...loyaltyData,
              stampedCount: effectiveStampedCount,
              maxSlots: effectiveMaxSlots,
              photos: accumulatedPhotos,
              customerPhone: customerPhone || 'guest',
              cafeSlug: cx.cafeSlug,
            }}
            customerName={customization.customerName || customerName || 'ضيف مميز'}
            customerTitle={customization.badgeTitle || 'عضو مميز'}
            themeConfig={CUSTOMER_THEMES.find((t) => t.id === customization.themeId)}
            stampIconEmoji={settings.stampConfig?.customEmoji || customization.stampEmoji || '☕'}
            stampConfig={settings.stampConfig}
            locationConfig={settings.locationConfig}
            walletPassConfig={{
              ...settings.walletPassConfig,
              cardBackgroundUrl:
                settings.walletPassConfig?.cardBackgroundUrl || customization.customBackgroundUrl,
              cardOverlayOpacity:
                settings.walletPassConfig?.cardOverlayOpacity ?? customization.overlayOpacity ?? 0.65,
              cardBackgroundPresetId:
                settings.walletPassConfig?.cardBackgroundPresetId || customization.backgroundPresetId,
            }}
            giftTitle={settings.freeGiftOffer.title}
            brandName={settings.branding.name}
            cafeLogoUrl={settings.branding?.logoUrl}
            instagramHandle={settings.branding.instagramHandle}
            onOpenStaffStamp={() => setIsStaffStampModalOpen(true)}
            onOpenNotificationBroadcaster={() => setIsNotificationModalOpen(true)}
          />
        </div>
      )}

      {/* Customer Phone Binding Container */}
      <div className="w-full max-w-md">
        {customerPhone ? (
          <div className="w-full p-4 rounded-2xl bg-[#FAF5EB] border border-[#DFAB56]/40 shadow-xs flex items-center justify-between text-xs text-[#3D2314]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#682025] text-white flex items-center justify-center font-bold border border-[#DFAB56]/40">
                <CheckCircle className="w-4 h-4 text-[#DFAB56]" />
              </div>
              <div>
                <span className="font-bold block">{customerName || 'ضيف مميز'}</span>
                <span className="text-[10px] text-[#6E4E38] font-mono block" dir="ltr">{customerPhone}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearCustomer}
              className="text-[11px] font-bold text-[#682025] hover:underline cursor-pointer"
            >
              تغيير الحساب
            </button>
          </div>
        ) : (
          <details className="group w-full p-4 rounded-2xl bg-[#FAF5EB] border border-[#DFAB56]/40 shadow-xs text-[#3D2314] transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#682025]" />
                <span>حفظ رصيد الأختام برقم الهاتف (اختياري عبر الأجهزة)</span>
              </div>
              <span className="text-[10px] text-[#682025] font-mono group-open:rotate-180 transition-transform">▼</span>
            </summary>

            <form onSubmit={handleRegisterCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-2 border-t border-[#DFAB56]/30">
              <div>
                <label className="text-[11px] font-bold text-[#6E4E38] block mb-1">الاسم أو اللقب:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد، سارة، ضيفنا المميز..."
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFAB56]/40 bg-white text-[#3D2314] focus:outline-none focus:border-[#DFAB56] placeholder-[#6E4E38]/60 shadow-2xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#6E4E38] block mb-1">رقم الموبايل:</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DFAB56]/40 bg-white text-[#3D2314] focus:outline-none focus:border-[#DFAB56] font-mono placeholder-[#6E4E38]/60 shadow-2xs"
                  dir="ltr"
                />
              </div>
              <div className="sm:col-span-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#682025] hover:bg-[#52171B] text-[#FAF5EB] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer border border-[#DFAB56]/40"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#DFAB56]" />
                  <span>ربط الرقم بالكارت</span>
                </button>
              </div>
            </form>
          </details>
        )}
      </div>
    </div>
  );
};
