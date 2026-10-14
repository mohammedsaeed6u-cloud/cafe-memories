'use client';

import React from 'react';
import { Award, CheckCircle, X } from 'lucide-react';
import { StaffPinModal } from '@/components/dashboard/StaffPinModal';
import { TerminalBarcodeScannerModal } from '@/components/terminal/TerminalBarcodeScannerModal';
import { useTerminalCashier } from '@/features/terminal/hooks/useTerminalCashier';
import { TerminalHeader } from '@/features/terminal/components/TerminalHeader';
import { TerminalShiftStats } from '@/features/terminal/components/TerminalShiftStats';
import { TerminalScanRibbon } from '@/features/terminal/components/TerminalScanRibbon';
import { TerminalKeypad } from '@/features/terminal/components/TerminalKeypad';
import { TerminalCustomerCard } from '@/features/terminal/components/TerminalCustomerCard';
import { TerminalGuidelines } from '@/features/terminal/components/TerminalGuidelines';

export default function StaffTerminalPage() {
  const terminal = useTerminalCashier();

  return (
    <div className="min-h-screen bg-[#141313] text-[#FBF9F5] flex flex-col font-sans select-none antialiased">
      {/* Staff Authentication PIN Modal */}
      <StaffPinModal
        open={terminal.isPinModalOpen}
        onClose={() => terminal.setIsPinModalOpen(false)}
        onSuccess={(member) => {
          terminal.setStaffMember(member);
          terminal.setIsPinModalOpen(false);
          terminal.setSuccessNotice(`مرحباً بك ${member.name}! تم تسجيل دخولك للكاونتر بنجاح.`);
          setTimeout(() => terminal.setSuccessNotice(null), 3000);
        }}
      />

      {/* Top POS Header */}
      <TerminalHeader cafeSlug={terminal.cafeSlug} branding={terminal.settings.branding} />

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">


        {/* Shift Stats Ribbon */}
        <TerminalShiftStats
          shiftStampsCount={terminal.shiftStampsCount}
          shiftRedeemedCount={terminal.shiftRedeemedCount}
          printQueueCount={terminal.printQueue.length}
        />

        {/* Success or Error Notice */}
        {terminal.successNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{terminal.successNotice}</span>
          </div>
        )}
        {terminal.errorNotice && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 font-bold text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
            <X className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{terminal.errorNotice}</span>
          </div>
        )}

        {/* LOYALTY STAMPS & REWARDS KEYPAD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* LEFT/MAIN: Customer Lookup & Action Center */}
            <div className="lg:col-span-7 space-y-4">
              <TerminalScanRibbon
                onOpenScanner={() => terminal.setIsScannerOpen(true)}
                stampsToAdd={terminal.stampsToAdd}
                setStampsToAdd={terminal.setStampsToAdd}
                autoStampEnabled={terminal.autoStampEnabled}
                onToggleAutoStamp={terminal.handleToggleAutoStamp}
                autoResetTimer={terminal.autoResetTimer}
                onCancelAutoReset={terminal.cancelAutoReset}
              />

              <TerminalKeypad
                searchQuery={terminal.searchQuery}
                onSearchChange={terminal.setSearchQuery}
                onLookup={terminal.handleLookup}
                onKeyPress={terminal.handleKeyPress}
                onClear={terminal.handleClearKeypad}
              />

              {terminal.selectedCustomer && terminal.loyaltyData && (
                <TerminalCustomerCard
                  selectedCustomer={terminal.selectedCustomer}
                  loyaltyData={terminal.loyaltyData}
                  activeVoucher={terminal.activeVoucher}
                  requiredVisits={terminal.requiredVisits}
                  giftTitle={terminal.giftTitle}
                  stampsToAdd={terminal.stampsToAdd}
                  isEligibleForGift={terminal.isEligibleForGift}
                  onAddStamp={() => terminal.handleAddStamp()}
                  onRedeemGift={terminal.handleRedeemGift}
                  onRedeemVoucherDirect={terminal.handleRedeemVoucherDirect}
                  onUnlockCooldown={terminal.handleUnlockCooldown}
                />
              )}
            </div>

            {/* RIGHT: Shift Activity & Guidelines */}
            <div className="lg:col-span-5 space-y-4">
              <TerminalGuidelines
                requiredVisits={terminal.requiredVisits}
                staffLabel={terminal.industry.staffLabel}
                staffMemberName={terminal.staffMember?.name}
              />
            </div>
          </div>
      </main>

      {/* Terminal Barcode Scanner Modal */}
      <TerminalBarcodeScannerModal
        isOpen={terminal.isScannerOpen}
        onClose={() => terminal.setIsScannerOpen(false)}
        onScan={terminal.handleScannedCode}
        autoStampEnabled={terminal.autoStampEnabled}
      />
    </div>
  );
}
