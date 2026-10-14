'use client';

import React from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import { BusinessSettings } from '@/types/photobooth';
import { WALLET_BROADCAST_TEMPLATES } from '@/lib/constants/wallet-notification-presets';

// Architectural contract export: single source of truth for wallet notifications
export const NOTIF_BROADCAST_TEMPLATES = WALLET_BROADCAST_TEMPLATES;
import { useWalletCommandCenter } from '@/features/wallet-command/hooks/useWalletCommandCenter';
import { WalletQuotaTelemetryBanner } from '@/features/wallet-command/components/WalletQuotaTelemetryBanner';
import { WalletGeofenceSection } from '@/features/wallet-command/components/WalletGeofenceSection';
import { WalletDesignCustomizer } from '@/features/wallet-command/components/WalletDesignCustomizer';
import { WalletBroadcastModal } from '@/features/wallet-command/components/WalletBroadcastModal';
import { WalletIssuedPassesTable } from '@/features/wallet-command/components/WalletIssuedPassesTable';

interface DashboardWalletCommandCenterProps {
  settings: BusinessSettings;
  onSettingsUpdated: (updated: BusinessSettings) => void;
}

export function DashboardWalletCommandCenter({
  settings,
  onSettingsUpdated,
}: DashboardWalletCommandCenterProps) {
  const wallet = useWalletCommandCenter(settings, onSettingsUpdated);
  const brandName = settings.branding?.name || 'مقهى ومحمصة ولاء';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#141212] border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-[#c92a54] to-[#98183c] text-white shadow-md border border-white/10">
              <CreditCard className="w-5 h-5 text-white" />
            </span>
            <span className="text-xs font-bold text-[#FBF9F5] bg-[#98183c]/60 px-2.5 py-1 rounded-md border border-[#c92a54]/40 font-mono">
              WalletWallet Pro Engine • منصة ستامبي
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#FBF9F5] font-serif">
            مركز قيادة محفظة Apple & Google Wallet
          </h2>
          <p className="text-xs text-[#A19E9B] mt-1">
            تخصيص الكروت الرقمية، رفع خلفية البراند، تفعيل شاشة القفل التلقائية (~100 متر)، وبث الإشعارات الحية.
          </p>
        </div>

        <button
          type="button"
          onClick={wallet.handleSaveSettings}
          className="px-6 py-3 rounded-lg bg-[#c92a54] hover:bg-[#B50200] text-[#FBF9F5] text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>حفظ وتطبيق الإعدادات فوراً</span>
        </button>
      </div>

      {wallet.saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>تم حفظ وتحديث إعدادات المحفظة والنطاق الجغرافي بنجاح!</span>
        </div>
      )}

      {/* 1. SaaS Wallet Quota Telemetry Banner */}
      <WalletQuotaTelemetryBanner
        tenantQuota={wallet.tenantQuota}
        usage={wallet.usage}
        isLoadingUsage={wallet.isLoadingUsage}
        onRefreshUsage={wallet.loadUsageAndPasses}
      />

      {/* 2. Geofencing & Lock Screen Proximity (~100m) */}
      <WalletGeofenceSection
        geofenceEnabled={wallet.geofenceEnabled}
        onToggleGeofence={wallet.setGeofenceEnabled}
        latitude={wallet.latitude}
        onLatitudeChange={wallet.setLatitude}
        longitude={wallet.longitude}
        onLongitudeChange={wallet.setLongitude}
        altitude={wallet.altitude}
        onAltitudeChange={wallet.setAltitude}
        relevantText={wallet.relevantText}
        onRelevantTextChange={wallet.setRelevantText}
        isDetectingGps={wallet.isDetectingGps}
        gpsNotice={wallet.gpsNotice}
        onDetectGps={wallet.handleDetectCurrentLocation}
        brandName={brandName}
      />

      {/* 3. Pass Branding & Customization */}
      <WalletDesignCustomizer
        colorPreset={wallet.colorPreset}
        setColorPreset={wallet.setColorPreset}
        colorHex={wallet.colorHex}
        setColorHex={wallet.setColorHex}
        barcodeFormat={wallet.barcodeFormat}
        setBarcodeFormat={wallet.setBarcodeFormat}
        cardBackgroundUrl={wallet.cardBackgroundUrl}
        setCardBackgroundUrl={wallet.setCardBackgroundUrl}
        cardOverlayOpacity={wallet.cardOverlayOpacity}
        setCardOverlayOpacity={wallet.setCardOverlayOpacity}
        cardPresetId={wallet.cardPresetId}
        setCardPresetId={wallet.setCardPresetId}
        isProcessingImage={wallet.isProcessingImage}
        imageSuccessMsg={wallet.imageSuccessMsg}
        imageError={wallet.imageError}
        fileInputRef={wallet.fileInputRef}
        onImageUpload={wallet.handleImageUpload}
        sharingProhibited={wallet.sharingProhibited}
        setSharingProhibited={wallet.setSharingProhibited}
      />

      {/* 4. Instant Broadcast Push Notifications */}
      <WalletBroadcastModal
        broadcastMsg={wallet.broadcastMsg}
        setBroadcastMsg={wallet.setBroadcastMsg}
        isSendingBroadcast={wallet.isSendingBroadcast}
        broadcastResult={wallet.broadcastResult}
        onBroadcast={wallet.handleBroadcast}
        brandName={brandName}
      />

      {/* 5. Live Issued Passes Table */}
      <WalletIssuedPassesTable
        passesList={wallet.passesList}
        filteredPasses={wallet.filteredPasses}
        isLoadingPasses={wallet.isLoadingPasses}
        searchQuery={wallet.searchQuery}
        setSearchQuery={wallet.setSearchQuery}
        inspectingPassBody={wallet.inspectingPassBody}
        setInspectingPassBody={wallet.setInspectingPassBody}
        inspectPassLoading={wallet.inspectPassLoading}
        revokingSerial={wallet.revokingSerial}
        onInspectPass={wallet.handleInspectPass}
        onRevokePass={wallet.handleRevokePass}
      />
    </div>
  );
}
