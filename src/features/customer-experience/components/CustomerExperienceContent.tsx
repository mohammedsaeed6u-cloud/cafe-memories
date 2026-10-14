'use client';

import React from 'react';
import { CoBrandingHeader } from '@/features/co-branding/CoBrandingHeader';
import { CheckCircle2 } from 'lucide-react';
import { CustomerTopNav } from '@/components/customer/CustomerTopNav';
import { UseCustomerExperienceReturn } from '../types';
import { CustomerLoyaltyPassTab } from './CustomerLoyaltyPassTab';
import { CustomerPhotoboothStudioTab } from './CustomerPhotoboothStudioTab';
import { CustomerExperienceModals } from './CustomerExperienceModals';

interface Props {
  cx: UseCustomerExperienceReturn;
}

export const CustomerExperienceContent: React.FC<Props> = ({ cx }) => {
  return (
    <div className="w-full min-h-screen bg-transparent text-[#1B1B1E] flex flex-col items-center selection:bg-[#682025] selection:text-white pb-20">
      {/* 1. CO-BRANDING HEADER */}
      <div className="w-full pt-3 px-3 sm:px-4">
        <CoBrandingHeader branding={cx.settings.branding} />
      </div>

      <main className="w-full max-w-xl mx-auto px-3 sm:px-4 pt-3 flex flex-col items-center space-y-5">
        {/* Table Attribution Badge from NFC Standee */}
        {cx.tableNumber ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF5EB] border border-[#DFAB56]/40 shadow-xs text-xs font-mono font-bold animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-[#DFAB56] animate-ping" />
            <span className="text-[#3D2314]">📍 طاولة {cx.tableNumber}</span>
            <span className="text-[#6E4E38] text-[11px] font-sans">· تصوير وبث مباشر من مقعدك</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF5EB] border border-[#DFAB56]/30 shadow-xs text-xs font-bold text-[#6E4E38]">
            <span>☕ ضيف كافيه {cx.settings.branding?.name || 'الذكريات'}</span>
          </div>
        )}

        {/* Navigation Switcher: Quick Jump between Loyalty Card & Korean Photobooth Studio */}
        <CustomerTopNav
          activeTab={cx.activeTab}
          onTabChange={cx.setActiveTab}
          totalCardSlots={cx.totalCardSlots}
          stampedCount={cx.loyaltyData.stampedCount}
          loyaltyMaxVisits={cx.loyaltyMaxVisits}
        />

        {/* Registration & Stamp Success Toast */}
        {cx.regSuccessNotice && (
          <div className="w-full p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cx.regSuccessNotice}</span>
          </div>
        )}

        {/* UNIFIED EXPERIENCE: In Default View, both Loyalty Card and Photobooth Studio are seamlessly integrated */}
        {cx.activeTab === 'loyalty' ? (
          <div className="w-full space-y-6 animate-in fade-in duration-200">
            {/* Section 1: Tactile Tappy Card with Apple & Google Wallet */}
            <CustomerLoyaltyPassTab cx={cx} />

            {/* Seamless Divider between Card and Studio */}
            <div className="w-full pt-4 flex items-center justify-between border-t border-dashed border-[#DFAB56]/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DFAB56] animate-pulse" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#3D2314]">
                  استوديو الذكريات الكورية (4-Cuts) • التقط وبث لشاشة الكافيه
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#682025] bg-[#FAF5EB] px-2.5 py-0.5 rounded-full border border-[#DFAB56]/40 shadow-xs">
                +1 ختم هدية
              </span>
            </div>

            {/* Section 2: Integrated Photobooth Studio */}
            <CustomerPhotoboothStudioTab cx={cx} />
          </div>
        ) : (
          /* Focused Studio Tab View */
          <div className="w-full animate-in fade-in duration-200">
            <CustomerPhotoboothStudioTab cx={cx} />
          </div>
        )}
      </main>

      {/* MODALS */}
      <CustomerExperienceModals cx={cx} />
    </div>
  );
};

