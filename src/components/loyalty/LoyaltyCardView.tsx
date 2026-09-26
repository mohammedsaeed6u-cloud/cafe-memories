'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Coffee,
  Gift,
  Sparkles,
  Crown,
  Tag,
  Cookie,
  Cake,
  Star,
  Check,
  RotateCw,
  Volume2,
  VolumeX,
  QrCode as QrIcon,
  ShieldCheck,
  Info,
  Award,
  Download,
  Share2,
} from 'lucide-react';
import {
  LoyaltyCardTemplate,
  LoyaltyCardState,
  LoyaltyMilestone,
  LoyaltyMilestoneIcon,
} from '@/types/loyalty-card';
import { LoyaltyCardService } from '@/lib/services/loyalty-card.service';
import { CardCanvasExportService } from '@/lib/services/card-canvas-export.service';
import { AddToWalletButtons } from '@/components/wallet/AddToWalletButtons';
import { ImageSaveService } from '@/lib/services/image-save.service';
import { IosSaveImageModal } from '@/components/photobooth/IosSaveImageModal';

export interface LoyaltyCardViewProps {
  template: LoyaltyCardTemplate;
  cardState?: LoyaltyCardState;
  brandName?: string;
  brandLogoUrl?: string;
  customerName?: string;
  customerPhone?: string;
  interactive?: boolean;
  onStampChange?: (stampsCount: number, state: LoyaltyCardState) => void;
  showBackDefault?: boolean;
  className?: string;
}

const STAMP_TILTS = [-4, 3, -6, 5, -2, 4, -5, 3, -3, 6, -4, 2];

export const LoyaltyCardView: React.FC<LoyaltyCardViewProps> = ({
  template,
  cardState: externalState,
  brandName = 'Memories Cafe',
  brandLogoUrl,
  customerName = 'ضيف مميز',
  customerPhone = '',
  interactive = true,
  onStampChange,
  showBackDefault = false,
  className = '',
}) => {
  // Internal state when external is not fully managed
  const [internalState, setInternalState] = useState<LoyaltyCardState>(() =>
    externalState ||
    LoyaltyCardService.createInitialCardState(
      'memories',
      customerPhone,
      template,
      customerName
    )
  );

  const activeState = externalState || internalState;

  const [isFlipped, setIsFlipped] = useState(showBackDefault);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [justStampedSlot, setJustStampedSlot] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync state if template changes slotCount
  useEffect(() => {
    if (activeState.totalSlots !== template.slotCount) {
      const updated = {
        ...activeState,
        totalSlots: template.slotCount,
        activeStamps: Math.min(activeState.activeStamps, template.slotCount),
      };
      setInternalState(updated);
    }
  }, [template.slotCount]);

  // Generate QR Code for Barista Scanner
  useEffect(() => {
    let isMounted = true;
    const payload =
      activeState.qrPayload ||
      LoyaltyCardService.generateBaristaQrPayload(
        activeState.cafeSlug || 'memories',
        customerPhone,
        activeState.activeStamps,
        template.id
      );

    QRCode.toDataURL(payload, {
      width: 256,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.warn('QR Code generation failed:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeState.qrPayload, activeState.activeStamps, template.id, customerPhone]);

  // Milestone calculations
  const milestoneProgress = useMemo(
    () => LoyaltyCardService.evaluateMilestones(template, activeState.activeStamps),
    [template, activeState.activeStamps]
  );

  // Trigger stamp action
  const handleSlotClick = (slotNumber: number) => {
    if (!interactive) return;

    // If clicking the next slot or clicking to add stamp
    if (slotNumber === activeState.activeStamps + 1) {
      const isMilestoneSlot = template.milestones.some((m) => m.slot === slotNumber);
      const isCompleteSlot = slotNumber === template.slotCount;

      if (soundEnabled) {
        LoyaltyCardService.playStampChime(isMilestoneSlot, isCompleteSlot);
      }

      setJustStampedSlot(slotNumber);
      setTimeout(() => setJustStampedSlot(null), 700);

      const nextState = LoyaltyCardService.addStampToCardState(activeState, template);
      setInternalState(nextState);
      if (onStampChange) {
        onStampChange(nextState.activeStamps, nextState);
      }
    }
  };
  const [isExporting, setIsExporting] = useState(false);
  const [iosModalImage, setIosModalImage] = useState<string | null>(null);

  const handleExportCard = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await CardCanvasExportService.exportCardToDataUrl({
        customerName,
        cafeName: brandName,
        stampsCount: activeState.activeStamps,
        totalSlots: template.slotCount,
        theme: template.id,
      });
      const result = await ImageSaveService.saveImage({
        dataUrl,
        filename: `loyalty-card-${customerName || 'card'}.png`,
        title: `كارت ولاء ${customerName || brandName}`,
      });
      if (result.method === 'fallback') {
        setIosModalImage(result.blobUrl || dataUrl);
      }
    } catch (err) {
      console.error('Failed to export card image', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareCard = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await CardCanvasExportService.exportCardToDataUrl({
        customerName,
        cafeName: brandName,
        stampsCount: activeState.activeStamps,
        totalSlots: template.slotCount,
        theme: template.id,
      });
      await CardCanvasExportService.shareCardImage(dataUrl, `كارت ولاء ${customerName} في ${brandName}`);
    } catch (err) {
      console.error('Failed to share card image', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetCard = () => {
    const resetState = LoyaltyCardService.createInitialCardState(
      activeState.cafeSlug || 'memories',
      customerPhone,
      template,
      customerName
    );
    setInternalState(resetState);
    if (onStampChange) onStampChange(0, resetState);
  };

  // Helper to render milestone icon
  const renderMilestoneIcon = (icon?: LoyaltyMilestoneIcon, className: string = 'w-4 h-4') => {
    switch (icon) {
      case 'coffee':
        return <Coffee className={className} />;
      case 'crown':
        return <Crown className={className} />;
      case 'tag':
        return <Tag className={className} />;
      case 'cookie':
        return <Cookie className={className} />;
      case 'cake':
        return <Cake className={className} />;
      case 'star':
        return <Star className={className} />;
      case 'sparkles':
        return <Sparkles className={className} />;
      case 'gift':
      default:
        return <Gift className={className} />;
    }
  };

  // Calculate dynamic grid columns based on slot count and dimension
  const gridClasses = useMemo(() => {
    if (template.dimensionType === 'strip') {
      if (template.slotCount <= 4) return 'grid-cols-1 gap-2.5';
      if (template.slotCount <= 6) return 'grid-cols-2 gap-2';
      return 'grid-cols-2 gap-2';
    }

    // Wallet & Square dimensions
    switch (template.slotCount) {
      case 4:
        return 'grid-cols-4 sm:grid-cols-4 gap-2.5';
      case 6:
        return 'grid-cols-3 sm:grid-cols-3 gap-2.5';
      case 8:
        return 'grid-cols-4 sm:grid-cols-4 gap-2';
      case 10:
        return 'grid-cols-5 sm:grid-cols-5 gap-2';
      case 12:
        return 'grid-cols-6 sm:grid-cols-6 gap-1.5';
      default:
        return 'grid-cols-5 gap-2';
    }
  }, [template.slotCount, template.dimensionType]);

  // Dynamic aspect ratio and container classes based on dimension type
  const containerStyle = useMemo(() => {
    if (template.dimensionType === 'wallet') {
      return {
        aspectRatio: '85.6 / 53.98',
        maxWidth: '520px',
      };
    }
    if (template.dimensionType === 'square') {
      return {
        aspectRatio: '1 / 1',
        maxWidth: '440px',
      };
    }
    // Strip ticket
    return {
      aspectRatio: '50 / 140',
      maxWidth: '340px',
    };
  }, [template.dimensionType]);

  // Foil effect classes
  const foilEffectClass = useMemo(() => {
    switch (template.theme.foilEffect) {
      case 'bronze':
        return 'shadow-[0_12px_40px_rgba(140,104,58,0.25)] border-[#8C683A]/40';
      case 'gold':
        return 'shadow-[0_12px_40px_rgba(212,175,55,0.3)] border-[#D4AF37]/50';
      case 'neon':
        return 'shadow-[0_0_35px_rgba(0,242,254,0.35)] border-[#00F2FE]/50';
      case 'silver':
        return 'shadow-[0_12px_35px_rgba(226,232,240,0.25)] border-slate-300/40';
      default:
        return 'shadow-xl border-stone-200/40';
    }
  }, [template.theme.foilEffect]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 3D Flip Card Container */}
      <div
        className="w-full relative transition-all duration-500"
        style={{
          perspective: '1200px',
          ...containerStyle,
        }}
      >
        <div
          ref={cardRef}
          className="w-full h-full relative rounded-3xl transition-transform duration-700 ease-out shadow-2xl"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ========================================================================= */}
          {/* FRONT FACE (Stamp Grid & Brand Pass)                                     */}
          {/* ========================================================================= */}
          <div
            className={`absolute inset-0 w-full h-full rounded-3xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden border-2 ${foilEffectClass}`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: template.theme.background,
              color: template.theme.textColor,
              borderColor: template.theme.borderColor,
            }}
          >
            {/* Subtle Texture & Shine Overlays */}
            {template.theme.texture === 'leather' && (
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(#C5A059 1px, transparent 1px), radial-gradient(#8C6830 1px, transparent 1px)',
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 4px 4px',
                }}
              />
            )}
            {template.theme.texture === 'kraft' && (
              <div
                className="absolute inset-0 opacity-15 pointer-events-none mix-blend-multiply"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)',
                  backgroundSize: '6px 6px',
                }}
              />
            )}
            {template.theme.texture === 'neon' && (
              <>
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              </>
            )}
            {template.theme.texture === 'botanical' && (
              <div className="absolute -right-6 -bottom-6 w-36 h-36 opacity-15 pointer-events-none">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                  <path d="M50 0 C60 30 70 40 100 50 C70 60 60 70 50 100 C40 70 30 60 0 50 C30 40 40 30 50 0 Z" />
                </svg>
              </div>
            )}

            {/* Top Shine Glare Bar */}
            <div className="absolute -top-[150%] left-0 w-full h-[200%] bg-gradient-to-b from-white/20 via-transparent to-transparent -rotate-45 pointer-events-none" />

            {/* Header: Brand & Card Type */}
            <div className="relative z-10 flex items-start justify-between gap-2 border-b border-current/15 pb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {brandLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brandLogoUrl}
                    alt={brandName}
                    className="w-8 h-8 rounded-xl object-contain shadow-xs"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-inner"
                    style={{
                      background: template.theme.badgeBg || template.theme.accentColor,
                      color: template.theme.badgeTextColor || template.theme.textColor,
                    }}
                  >
                    <Coffee className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-black text-xs sm:text-sm tracking-tight truncate">
                    {brandName}
                  </h3>
                  <p
                    className="text-[9px] sm:text-[10px] font-semibold truncate opacity-85"
                    style={{ color: template.theme.secondaryTextColor }}
                  >
                    {template.nameAr} • {customerName}
                  </p>
                </div>
              </div>

              {/* Badges & Flip Button */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs"
                  style={{
                    background: template.theme.badgeBg || 'transparent',
                    color: template.theme.badgeTextColor || 'inherit',
                    borderColor: template.theme.accentColor,
                  }}
                >
                  {template.badgeTextAr || template.badgeText || 'VIP CARD'}
                </span>

                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="p-1 rounded-lg bg-black/10 hover:bg-black/20 text-current transition cursor-pointer"
                  title="عرض رمز الـ QR لموظف الكاونتر"
                  aria-label="عرض رمز الـ QR"
                >
                  <QrIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Center: Dynamic Stamps Grid */}
            <div className="relative z-10 my-auto py-2">
              <div
                className={`grid ${gridClasses} items-center justify-center w-full`}
                role="region"
                aria-label={`خانات بطاقة الولاء ${activeState.activeStamps} من ${template.slotCount}`}
              >
                {Array.from({ length: template.slotCount }).map((_, idx) => {
                  const slotNumber = idx + 1;
                  const isStamped = slotNumber <= activeState.activeStamps;
                  const isJustStamped = slotNumber === justStampedSlot;
                  const isNextToStamp = slotNumber === activeState.activeStamps + 1;
                  const milestone = template.milestones.find((m) => m.slot === slotNumber);
                  const isMilestone = Boolean(milestone);
                  const tilt = STAMP_TILTS[idx % STAMP_TILTS.length];
                  const stampRecord = activeState.stamps.find(
                    (s) => s.slotNumber === slotNumber || s.slotIndex === idx
                  );

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSlotClick(slotNumber)}
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden ${
                        isStamped
                          ? 'shadow-md scale-100'
                          : isNextToStamp
                          ? 'hover:scale-105 ring-2 ring-current/40 animate-pulse'
                          : 'opacity-80 hover:opacity-100'
                      } ${isJustStamped ? 'scale-115' : ''}`}
                      style={{
                        background: isStamped
                          ? template.theme.stampActiveBg
                          : template.theme.stampInactiveBg,
                        color: isStamped
                          ? template.theme.stampActiveColor
                          : template.theme.stampInactiveColor,
                        border: isStamped
                          ? `2px solid ${template.theme.stampBorderColor}`
                          : `2px dashed ${template.theme.borderColor}`,
                      }}
                      title={
                        isStamped
                          ? `ختم مكتمل (${slotNumber})`
                          : milestone
                          ? `مكافأة: ${milestone.rewardTitle}`
                          : `اضغط لاحتساب الختم #${slotNumber}`
                      }
                    >
                      {/* Photobooth Photo Thumbnail inside stamp if exists */}
                      {isStamped && stampRecord?.thumbnailUrl ? (
                        <div
                          className="w-full h-full p-0.5 rounded-xl overflow-hidden"
                          style={{ transform: `rotate(${tilt}deg)` }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={stampRecord.thumbnailUrl}
                            alt={`ختم ${slotNumber}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ) : isStamped ? (
                        /* Graphic Authentic Stamp Seal */
                        <div
                          className="flex flex-col items-center justify-center text-center p-1"
                          style={{ transform: `rotate(${tilt}deg)` }}
                        >
                          <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                            {isMilestone ? (
                              renderMilestoneIcon(milestone?.icon, 'w-3 h-3')
                            ) : (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                          </div>
                          <span className="text-[7px] font-black uppercase mt-0.5 tracking-tighter">
                            {isMilestone ? 'REWARD' : 'STAMP'}
                          </span>
                        </div>
                      ) : (
                        /* Unstamped Slot */
                        <div className="flex flex-col items-center justify-center text-center p-1">
                          {isMilestone ? (
                            <div className="relative">
                              {renderMilestoneIcon(milestone?.icon, 'w-5 h-5 text-[#DD0200] animate-bounce')}
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#DD0200]" />
                            </div>
                          ) : (
                            <Coffee className="w-4 h-4 opacity-50" />
                          )}
                          <span className="text-[8px] font-bold mt-0.5 opacity-75">
                            {String(slotNumber).padStart(2, '0')}
                          </span>
                        </div>
                      )}

                      {/* Milestone Ribbon on Slot Corner */}
                      {isMilestone && !isStamped && (
                        <div
                          className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#DD0200] text-[#FBF9F5] flex items-center justify-center rounded-bl-lg text-[7px] font-black"
                          title={milestone?.rewardTitle}
                        >
                          #
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Progress Bar & Milestone Status */}
            <div className="relative z-10 border-t border-current/15 pt-2">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#DD0200] flex-shrink-0" />
                  <span>
                    {milestoneProgress.isComplete
                      ? 'اكتملت البطاقة — استلم هديتك الكبرى!'
                      : milestoneProgress.nextMilestone
                      ? `متبقي ${milestoneProgress.stampsToNext} أختام للحصول على: ${milestoneProgress.nextMilestone.rewardTitle}`
                      : `متبقي ${milestoneProgress.stampsToNext} أختام لاكتمال البطاقة`}
                  </span>
                </span>
                <span className="font-mono font-black">
                  {activeState.activeStamps} / {template.slotCount}
                </span>
              </div>

              {/* Visual Progress Track */}
              <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${milestoneProgress.progressPercent}%`,
                    background: template.theme.accentColor,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BACK FACE (Barista Scanner QR Code & Rewards Voucher)                     */}
          {/* ========================================================================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden bg-[#141212] text-[#FBF9F5] border border-white/10 shadow-2xl"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Header: Barista Terminal Mode */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#55100D]/60 text-[#DD0200] border border-[#DD0200]/30 flex items-center justify-center text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4
                    style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                    className="text-xs font-bold text-[#FBF9F5]"
                  >
                    كود التحقق لموظف الكاونتر • Staff Pass
                  </h4>
                  <p className="text-[9px] text-[#A19E9B] font-mono">
                    ID: {activeState.cardId.slice(0, 14)}...
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFlipped(false)}
                className="px-2.5 py-1 rounded-lg bg-[#1C1B1B] hover:bg-[#211F1F] text-[#FBF9F5] text-[10px] font-bold flex items-center gap-1 transition cursor-pointer border border-white/10"
              >
                <RotateCw className="w-3 h-3 text-[#DD0200]" />
                <span>الواجهة</span>
              </button>
            </div>

            {/* Middle: High-Contrast QR Code */}
            <div className="flex items-center justify-center gap-4 my-auto py-1">
              <div className="p-2 bg-white rounded-2xl shadow-xl border border-stone-200 flex-shrink-0">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Barista Verification QR Code"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center bg-stone-100 text-stone-400 text-xs">
                    جاري توليد الرمز...
                  </div>
                )}
              </div>

              {/* Status Details */}
              <div className="flex flex-col justify-center space-y-1.5 text-[10px]">
                <div className="bg-[#1C1B1B] p-2 rounded-xl border border-white/10">
                  <p className="text-[#A19E9B] text-[9px]">رقم هاتف العميل</p>
                  <p className="font-mono font-bold text-[#FBF9F5] text-xs">
                    {customerPhone}
                  </p>
                </div>

                <div className="bg-[#1C1B1B] p-2 rounded-xl border border-white/10">
                  <p className="text-[#A19E9B] text-[9px]">الأختام المعتمدة</p>
                  <p className="font-bold text-[#FBF9F5] text-xs">
                    {activeState.activeStamps} من إجمالي {template.slotCount} أختام
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom: Unlocked Rewards Summary */}
            <div className="border-t border-white/10 pt-2">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-bold text-[#A19E9B] flex items-center gap-1">
                  <Award className="w-3 h-3 text-[#DD0200]" />
                  <span>المكافآت المفتوحة:</span>
                </span>
                <span className="text-[9px] text-[#DD0200] font-mono font-bold">
                  {milestoneProgress.unlockedRewards.length} جاهزة للاستلام
                </span>
              </div>

              <div className="space-y-1 max-h-16 overflow-y-auto pr-1">
                {milestoneProgress.unlockedRewards.length > 0 ? (
                  milestoneProgress.unlockedRewards.map((reward, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-[#55100D]/40 border border-[#DD0200]/30 px-2 py-1 rounded-lg text-[9px]"
                    >
                      <span className="font-bold text-[#FBF9F5] truncate">
                        {reward.rewardTitle}
                      </span>
                      <span className="font-mono font-black text-[#FBF9F5] bg-[#0B0A0A] border border-white/10 px-1.5 py-0.5 rounded">
                        {reward.code}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[9px] text-[#A19E9B] text-center py-1">
                    أكمل الأختام المطلوبة لفتح قسائم الهدايا التلقائية
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {interactive && (
        <div className="mt-4 w-full max-w-sm flex items-center justify-between gap-2 px-3 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-stone-200 shadow-sm text-xs">
          <div className="flex-1 py-1.5 px-3 bg-stone-100 text-stone-700 rounded-xl font-bold flex items-center justify-center gap-1.5 text-[11px]">
            <span>{activeState.activeStamps} / {template.slotCount} أختام مكتملة</span>
          </div>

          <button
            type="button"
            onClick={() => setIsFlipped((prev) => !prev)}
            className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
            title="قلب البطاقة"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isFlipped ? 'الواجهة' : 'الباركود'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCard}
            disabled={isExporting}
            className="py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
            title="حفظ الكارت كصورة PNG"
            aria-label="حفظ كصورة"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">حفظ</span>
          </button>

          <button
            type="button"
            onClick={handleShareCard}
            disabled={isExporting}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl border border-stone-200 transition cursor-pointer disabled:opacity-50"
            title="مشاركة الكارت"
            aria-label="مشاركة الكارت"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-stone-100 border-stone-200 text-stone-400'
            }`}
            title={soundEnabled ? 'الصوت مفعّل' : 'الصوت مكتوم'}
            aria-label="تبديل صوت الختم"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {interactive && (
        <div className="pt-2 w-full flex items-center justify-center">
          <AddToWalletButtons
            passData={{
              cafeSlug: activeState.cafeSlug || template.id.split('-')[0] || 'memories',
              cafeName: brandName,
              customerPhone: customerPhone,
              customerName: customerName,
              stampedCount: activeState.activeStamps,
              maxSlots: activeState.totalSlots || template.slotCount,
              giftTitle: template.milestones[0]?.rewardTitle || 'مشروب مجاني مميز',
              instagramHandle: '@' + brandName.toLowerCase().replace(/\s+/g, ''),
            }}
          />
        </div>
      )}

      {/* Safari / iOS Save Image Sheet Modal */}
      <IosSaveImageModal
        open={!!iosModalImage}
        imageUrl={iosModalImage}
        filename="loyalty-card.png"
        onClose={() => setIosModalImage(null)}
      />
    </div>
  );
};
