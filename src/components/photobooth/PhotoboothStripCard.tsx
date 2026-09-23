'use client';

import React, { useRef } from 'react';
import {
  PhotoboothFrame,
  BusinessBranding,
  FreeGiftOffer,
  PhotoboothCardMode,
  PlacedSticker,
  PhotoboothLayoutType,
} from '@/types/photobooth';
import {
  Check,
  Heart,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Wifi,
  Battery,
  Camera,
  Search,
  Sparkles,
  Volume2,
  Bookmark,
  Reply,
  Share2,
  Gift,
  Lock,
  Mic,
  Coffee,
} from 'lucide-react';
import { CoBrandingLogos } from '@/components/brand/CoBrandingLogos';
import { DraggableStickerLayer } from './DraggableStickerLayer';
import { PHOTOBOOTH_CARD_MODES, PHOTOBOOTH_FRAME_TEMPLATES } from '@/lib/constants/photobooth-presets';
import { MemoriesArchIcon } from '@/components/brand/MemoriesLogo';
import {
  LocomotiveTrainSvg,
  TicketBarcodeSvg,
  SpotifyLogoSvg,
  SpotifyExplicitBadge,
  SpotifyShuffleSvg,
  SpotifyPreviousSvg,
  SpotifyNextSvg,
  SpotifyRepeatSvg,
  IosCellularBarsSvg,
  IosBatterySvg,
  IosPhotosLibrarySvg,
  IosPhotosForYouSvg,
  IosPhotosAlbumsSvg,
  IosCameraReticleSvg,
  IosCameraShutterSvg,
  IosCameraFlipLensSvg,
} from './PhotoboothViralSvgIcons';

interface PhotoboothStripCardProps {
  photos: string[];
  frame: PhotoboothFrame;
  branding: BusinessBranding;
  freeGiftOffer?: FreeGiftOffer;
  giftCode?: string;
  timestamp?: string;
  onPrint?: () => void;
  className?: string;
  isCompleted?: boolean;
  cardMode?: PhotoboothCardMode;
  stickers?: PlacedSticker[];
  onUpdateStickers?: (stickers: PlacedSticker[]) => void;
  isStickersInteractive?: boolean;
  onSlotClick?: (slotIdx: number) => void;
}

export const PhotoboothStripCard: React.FC<PhotoboothStripCardProps> = ({
  photos,
  frame,
  branding,
  freeGiftOffer = {
    title: 'مشروب مجاني مميز + طباعة الكارت',
    subtitle: 'هدية فورية عند اكتمال كارت ذكرياتك',
    icon: 'gift',
  },
  timestamp = new Date().toISOString(),
  className = '',
  cardMode = frame.cardMode || 'korean_noir',
  stickers = [],
  onUpdateStickers,
  isStickersInteractive = false,
  onSlotClick,
}) => {
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Look up template configuration
  const template = PHOTOBOOTH_FRAME_TEMPLATES.find(
    (t) => t.id === frame.templateId || t.layoutType === frame.layoutType
  );

  const isHorizontal = frame.orientation === 'horizontal';

  // Business Authoritative Shot Count: frame.shotCount is the single source of truth
  const totalSlots = Math.max(Number(frame.shotCount) || template?.shotCount || 3, 1);

  // Determine layout type
  const layoutType: PhotoboothLayoutType =
    frame.layoutType ||
    (totalSlots === 1
      ? cardMode === 'polaroid_vintage' || cardMode === 'polaroid_classic'
        ? 'polaroid_vintage'
        : 'strip_1'
      : totalSlots === 2
      ? isHorizontal
        ? 'wide_duo_2cut'
        : 'strip_2'
      : totalSlots === 3
      ? isHorizontal
        ? 'cinema_horizontal'
        : 'strip_3'
      : totalSlots === 4
      ? isHorizontal
        ? 'wide_duo_4cut'
        : 'strip_4'
      : totalSlots === 6
      ? isHorizontal
        ? 'grid_3x2'
        : 'grid_2x3'
      : isHorizontal
      ? 'grid_2x2'
      : 'strip_4');

  // Physical dimensions display
  const widthCm =
    frame.widthCm ||
    template?.widthCm ||
    (layoutType === 'wide_duo_2cut' ? 10 : isHorizontal ? 15.2 : 5);
  const heightCm =
    frame.heightCm ||
    template?.heightCm ||
    (layoutType === 'wide_duo_2cut' ? 7.6 : isHorizontal ? 10 : 15.2);

  const dateObj = new Date(timestamp);
  const dateFormatted = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
  const shortYear = String(dateObj.getFullYear()).slice(-2);
  const tokyoStampDate = `'${shortYear} ${String(dateObj.getMonth() + 1).padStart(2, '0')} ${String(dateObj.getDate()).padStart(2, '0')}`;

  const modeInfo = PHOTOBOOTH_CARD_MODES.find((m) => m.id === cardMode) || PHOTOBOOTH_CARD_MODES[0];

  // Visual Theme Identifiers
  const isTicketExpress = cardMode === 'ticket_express';
  const isSpotifyPlayer = cardMode === 'spotify_player';
  const isIosGalleryLight = cardMode === 'ios_gallery_light';
  const isIosGalleryDark = cardMode === 'ios_gallery_dark';
  const isIosGallery = isIosGalleryLight || isIosGalleryDark;
  const isIosCamera = cardMode === 'ios_camera';
  const isIosIMessage = cardMode === 'ios_imessage';

  const isKoreanNoir = cardMode === 'korean_noir' || template?.cardMode === 'korean_noir';
  const isTokyoPastel = cardMode === 'tokyo_pastel' || template?.cardMode === 'tokyo_pastel';
  const isKinfolkMinimal = cardMode === 'kinfolk_minimal' || template?.cardMode === 'kinfolk_minimal';
  const isFilm35mm = cardMode === 'film_35mm' || cardMode === 'retro_film' || layoutType === 'film_35mm';
  const isArabicaGold = cardMode === 'arabica_luxury_gold' || layoutType === 'arabica_luxury_gold';
  const isPolaroidVintage =
    cardMode === 'polaroid_vintage' ||
    cardMode === 'polaroid_classic' ||
    layoutType === 'polaroid_vintage' ||
    layoutType === 'polaroid_square' ||
    layoutType === 'polaroid_wide' ||
    frame.frameShape === 'polaroid';

  // Base Effective Colors
  const effectiveBg = isTicketExpress
    ? '#FAF5EC'
    : isSpotifyPlayer
    ? frame.bgColor || '#1E1E22'
    : isIosGalleryLight
    ? '#F2F2F7'
    : isIosGalleryDark || isIosCamera
    ? '#000000'
    : isIosIMessage
    ? '#FFFFFF'
    : frame.bgColor || template?.defaultBg || modeInfo.defaultBg;

  const effectiveBorder = isTicketExpress
    ? '#4A121A'
    : isSpotifyPlayer
    ? frame.borderColor || '#2E2E34'
    : isIosGalleryLight
    ? '#D1D1D6'
    : isIosGalleryDark || isIosCamera
    ? '#1C1C1E'
    : isIosIMessage
    ? '#E5E5EA'
    : frame.borderColor || template?.defaultBorder || modeInfo.defaultBorder;

  const effectiveText = isTicketExpress
    ? '#381016'
    : isSpotifyPlayer || isIosGalleryDark || isIosCamera
    ? '#FFFFFF'
    : isIosGalleryLight || isIosIMessage
    ? '#000000'
    : frame.textColor || template?.defaultText || modeInfo.defaultText;

  const effectiveAccent = isTicketExpress
    ? '#8B2635'
    : isSpotifyPlayer
    ? '#1DB954'
    : isIosGallery
    ? '#007AFF'
    : isIosCamera
    ? '#FFCC00'
    : isIosIMessage
    ? '#34C759'
    : frame.accentColor || template?.defaultAccent || modeInfo.defaultAccent;

  // Custom Border Radius
  const borderRadiusValue =
    frame.borderRadius !== undefined
      ? `${frame.borderRadius}px`
      : isTicketExpress
      ? '22px'
      : isSpotifyPlayer
      ? '20px'
      : isIosGallery || isIosCamera || isIosIMessage
      ? '24px'
      : frame.frameShape === 'sharp'
      ? '0px'
      : frame.frameShape === 'polaroid'
      ? '16px'
      : frame.frameShape === 'pill'
      ? '28px'
      : '18px';

  // Container sizing
  let cardContainerClass = 'w-[290px] sm:w-[320px] p-4 py-5';

  if (isTicketExpress) {
    cardContainerClass = 'w-[295px] sm:w-[325px] p-4 pt-4 pb-6';
  } else if (isSpotifyPlayer) {
    cardContainerClass = 'w-[290px] sm:w-[320px] p-4 pt-4 pb-5';
  } else if (isIosGallery) {
    cardContainerClass = 'w-[295px] sm:w-[325px] p-4 pt-3 pb-4';
  } else if (isIosCamera) {
    cardContainerClass = 'w-[295px] sm:w-[325px] p-4 pt-3 pb-5';
  } else if (isIosIMessage) {
    cardContainerClass = 'w-[295px] sm:w-[325px] p-4 pt-3 pb-4';
  } else if (isHorizontal) {
    cardContainerClass = 'w-[370px] sm:w-[420px] p-4 py-4.5';
  } else {
    cardContainerClass = isKinfolkMinimal
      ? 'w-[290px] sm:w-[320px] p-5 py-6'
      : isPolaroidVintage
      ? 'w-[290px] sm:w-[320px] p-4 pt-4 pb-10'
      : 'w-[280px] sm:w-[320px] p-4 py-5';
  }

  // --- Photo Slot Renderer with Specific Theme Styling ---
  const renderPhotoSlot = (slotIdx: number, aspect = 'aspect-[3/4]') => {
    const photo = photos[slotIdx];
    const isLastSlot = slotIdx === totalSlots - 1;
    const visitNumber = slotIdx + 1;
    const slotFormatted = String(visitNumber).padStart(2, '0');

    // Slot border & styling per theme
    let slotBorderClass = 'border';
    let slotInnerClass = 'inset-[3px] rounded-xs';
    let slotNumberBadge = `#${slotFormatted}`;

    if (isTicketExpress) {
      slotBorderClass = 'border-2 border-[#4A121A] rounded-sm shadow-xs';
      slotInnerClass = 'inset-[2px] rounded-none';
      slotNumberBadge = `#${slotFormatted}`;
    } else if (isSpotifyPlayer) {
      slotBorderClass = 'border border-white/20 rounded-xl shadow-md overflow-hidden';
      slotInnerClass = 'inset-0 rounded-xl';
      slotNumberBadge = `0${visitNumber}`;
    } else if (isIosGallery) {
      slotBorderClass = `border ${isIosGalleryDark ? 'border-white/10' : 'border-stone-200'} rounded-2xl shadow-xs overflow-hidden`;
      slotInnerClass = 'inset-0 rounded-2xl';
      slotNumberBadge = `${slotFormatted}`;
    } else if (isIosCamera) {
      slotBorderClass = 'border border-white/30 rounded-lg shadow-sm overflow-hidden';
      slotInnerClass = 'inset-0 rounded-lg';
      slotNumberBadge = `[${slotFormatted}]`;
    } else if (isIosIMessage) {
      slotBorderClass = 'border border-stone-200 rounded-2xl rounded-bl-xs shadow-xs overflow-hidden';
      slotInnerClass = 'inset-0 rounded-2xl rounded-bl-xs';
      slotNumberBadge = 'MSG';
    } else if (isKoreanNoir) {
      slotBorderClass = 'border-[1.5px] border-white/80 shadow-xs';
      slotInnerClass = 'inset-[2px] rounded-xs';
      slotNumberBadge = `#${slotFormatted}`;
    } else if (isTokyoPastel) {
      slotBorderClass = 'border-[1.5px] border-pink-200/90 shadow-2xs rounded-lg';
      slotInnerClass = 'inset-[3px] rounded-md';
      slotNumberBadge = `#${slotFormatted}`;
    } else if (isKinfolkMinimal) {
      slotBorderClass = 'border-[0.5px] border-stone-300 shadow-none';
      slotInnerClass = 'inset-[4px] rounded-none';
      slotNumberBadge = `FIG. ${slotFormatted}`;
    } else if (isFilm35mm) {
      slotBorderClass = 'border border-amber-900/40 shadow-xs';
      slotInnerClass = 'inset-[2px] rounded-xs';
      slotNumberBadge = `► ${slotFormatted}A`;
    } else if (isArabicaGold) {
      slotBorderClass = 'border-[1.5px] border-[#D4AF37]/90 shadow-xs';
      slotInnerClass = 'inset-[3px] rounded-xs';
      slotNumberBadge = `#${slotFormatted}`;
    } else if (isPolaroidVintage) {
      slotBorderClass = 'border border-stone-200 shadow-2xs';
      slotInnerClass = 'inset-[3px] rounded-xs';
      slotNumberBadge = `NO. ${slotFormatted}`;
    }

    return (
      <div
        key={slotIdx}
        style={{ borderColor: isArabicaGold ? '#D4AF37' : effectiveBorder }}
        className={`relative overflow-hidden bg-white shadow-2xs ${aspect} ${slotBorderClass}`}
      >
        <div className={`absolute ${slotInnerClass} bg-stone-100 flex items-center justify-center overflow-hidden`}>
          {photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`Shot ${visitNumber}`}
                className="w-full h-full object-cover filter contrast-[1.03] saturate-[0.98]"
              />
              {isIosCamera && (
                <IosCameraReticleSvg size={42} className="absolute inset-0 m-auto pointer-events-none opacity-80 z-20" />
              )}
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold rounded-xs flex items-center gap-1 select-none z-20">
                <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
                <span>#{slotFormatted}</span>
              </div>
            </>
          ) : slotIdx === photos.length ? (
            /* Active Next Slot: Pulse & Tap to Capture */
            <button
              type="button"
              onClick={() => onSlotClick?.(slotIdx)}
              className="w-full h-full flex flex-col items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 border-2 border-amber-500 text-amber-900 p-2 text-center transition cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center mb-1 text-xs font-black shadow-xs group-hover:scale-110 transition"><Camera className="w-4 h-4 text-stone-950" /></div>
              <span className="text-[10px] font-mono font-black text-amber-950">
                لقطة اليوم
              </span>
              <span className="text-[8px] font-bold text-amber-800 mt-0.5 leading-tight">
                اضغط للتوثيق
              </span>
            </button>
          ) : (
            /* Milestone Placeholder */
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50/90 border border-dashed border-stone-300/80 text-stone-400 p-2 text-center select-none">
              <div className="w-6 h-6 rounded-full bg-stone-200/80 flex items-center justify-center mb-1 text-stone-500 text-xs">
                {isLastSlot ? <Gift className="w-3.5 h-3.5 text-stone-600" /> : <Lock className="w-3.5 h-3.5 text-stone-600" />}
              </div>
              <span className="text-[10px] font-mono font-black text-stone-600">#{slotFormatted}</span>
              <span className="text-[8px] font-bold text-stone-500 mt-0.5 leading-tight">
                {isLastSlot ? 'اللقطة الختامية • الهدية' : `الزيارة #${visitNumber}`}
              </span>
            </div>
          )}
        </div>

        {/* Micro Theme Frame Number Marker */}
        {!isIosGallery && !isSpotifyPlayer && (
          <div className="absolute top-1 left-1.5 text-[7px] font-mono font-bold tracking-tighter select-none z-10 pointer-events-none mix-blend-difference text-white/90">
            {slotNumberBadge}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Printable Base Card with Dynamic Visual Themes */}
      <div
        id="printable-strip"
        ref={cardContainerRef}
        style={{
          backgroundColor: effectiveBg,
          borderColor: isArabicaGold ? '#D4AF37' : effectiveBorder,
          color: effectiveText,
          borderRadius: borderRadiusValue,
        }}
        className={`relative transition-all duration-300 select-none shadow-[0_6px_24px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.06)] border overflow-hidden print:shadow-none print:border-none ${cardContainerClass}`}
      >
        {/* Paper Texture Overlay */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.14] z-0"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")',
          }}
        />

        {/* ------------------------------------------------------------- */}
        {/* HEADER RENDERING PER THEME                                    */}
        {/* ------------------------------------------------------------- */}

        {/* 1. THE SNAP EXPRESS VINTAGE TICKET HEADER */}
        {isTicketExpress && (
          <div className="relative z-10 mb-3 pt-1 text-center">
            {/* Outer Ticket Outline border with double line effect */}
            <div className="border-2 border-[#4A121A] rounded-xl p-2.5 pb-2 bg-[#FAF5EC]/80 shadow-2xs relative overflow-hidden">
              <div className="absolute inset-1 border border-[#4A121A]/30 rounded-lg pointer-events-none" />
              {/* Arched Title */}
              <div className="text-center font-serif font-black tracking-[0.18em] text-[#4A121A] text-sm uppercase leading-tight drop-shadow-2xs">
                MEMORIES STUDIO
              </div>
              <div className="text-[8px] font-mono uppercase tracking-[0.25em] text-[#8B2635] font-bold mt-0.5">
                SPECIALTY COFFEE • PHOTO EXPERIENCE
              </div>

              {/* Specialty Coffee Emblem & Arch */}
              <div className="flex items-center justify-center gap-2 mt-1 text-[#4A121A]">
                <span className="text-[10px] text-[#8B2635] font-mono">EST</span>
                <Coffee className="w-4 h-4 text-[#8B2635]" />
                <span className="text-[10px] text-[#8B2635] font-mono">2026</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. SPOTIFY PLAYER HEADER */}
        {isSpotifyPlayer && (
          <div className="relative z-10 mb-2.5 flex items-center justify-between px-1 text-white/90">
            <div className="flex items-center gap-1.5">
              <SpotifyLogoSvg size={18} color="#1DB954" />
              <span className="text-[11px] font-serif font-black italic tracking-tight text-white">Spotify</span>
              <span className="text-[8.5px] font-mono font-bold tracking-wider uppercase text-white/70 ml-1">
                PHOTOSTRIP #03
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
              <span className="text-[8px] font-mono text-[#1DB954] font-bold">LIVE</span>
            </div>
          </div>
        )}

        {/* 3. IPHONE GALLERY HEADER (Light & Dark) */}
        {isIosGallery && (
          <div className={`relative z-10 mb-2.5 ${isIosGalleryDark ? 'text-white' : 'text-black'}`}>
            {/* iOS Status Bar */}
            <div className="flex items-center justify-between text-[10px] font-bold tracking-tight mb-2 px-1 opacity-90 font-mono">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[8.5px] font-bold">5G</span>
                <IosCellularBarsSvg size={10} color={isIosGalleryDark ? '#FFFFFF' : '#000000'} />
                <IosBatterySvg size={10} color={isIosGalleryDark ? '#FFFFFF' : '#000000'} level={0.92} />
              </div>
            </div>

            {/* Apple Photos Title & Album Subtitle */}
            <div className="px-1 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black tracking-tight leading-none">Albums</h3>
                <span className="text-[9px] font-medium opacity-70">My Albums</span>
              </div>
              <span className="text-[10px] font-bold text-[#007AFF] hover:underline cursor-pointer">
                See All
              </span>
            </div>
          </div>
        )}

        {/* 4. IPHONE CAMERA VIEW FINDER HEADER */}
        {isIosCamera && (
          <div className="relative z-10 mb-2.5 px-1 text-white">
            {/* Camera Toolbar Top */}
            <div className="flex items-center justify-between text-[11px] opacity-80 py-1">
              <span className="text-[9px] font-mono font-bold">RAW</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono">HDR</span>
              <span className="text-[9px] font-mono font-bold">NIGHT</span>
              <span>◎</span>
              <span>⏱</span>
            </div>
          </div>
        )}

        {/* 5. IPHONE IMESSAGE HEADER */}
        {isIosIMessage && (
          <div className="relative z-10 mb-2 px-1 text-black">
            <div className="flex items-center justify-between text-[9px] text-stone-500 mb-1">
              <span className="font-bold text-[#007AFF]">Cancel</span>
              <span className="font-bold text-stone-800">New MMS</span>
              <span className="text-stone-400">Details</span>
            </div>

            {/* Tapback Reactions Drawer */}
            <div className="flex items-center justify-center gap-2 py-0.5 px-3 bg-stone-100 rounded-full text-[9px] font-mono font-bold text-stone-600 shadow-2xs mx-auto w-fit mb-1.5">
              <span>LIKE</span>
              <span>•</span>
              <span>LOVE</span>
              <span>•</span>
              <span>WOW</span>
            </div>
          </div>
        )}

        {/* 6. STANDARD ARTISANAL HEADER (Korean Noir, Kinfolk, Arabica Gold, etc.) */}
        {!isTicketExpress && !isSpotifyPlayer && !isIosGallery && !isIosCamera && !isIosIMessage && (
          <div className={`relative z-10 flex flex-col items-center justify-center text-center ${isKinfolkMinimal ? 'mb-3 pt-1' : 'mb-2'}`}>
            <CoBrandingLogos
              cafeName={branding.name || 'Café Partner'}
              cafeLogoUrl={branding.logoUrl}
              size="sm"
              theme={effectiveText === '#FFFFFF' ? 'dark' : 'light'}
              showTagline={false}
              className="py-0.5"
            />

            <div className="flex items-center gap-1.5 mt-0.5">
              
              
              <span
                style={{ color: isArabicaGold ? '#C5A059' : effectiveAccent }}
                className={`text-[7.5px] font-black uppercase tracking-[0.2em] font-mono opacity-85 ${
                  isKinfolkMinimal ? 'font-serif tracking-[0.28em] italic' : ''
                }`}
              >
                {frame.badgeText || template?.badge || modeInfo.filmBadge}
              </span>
              
              
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PHOTO SLOTS LAYOUT                                            */}
        {/* ------------------------------------------------------------- */}
        <div className={`relative z-10 w-full my-1 ${isFilm35mm && !isHorizontal ? 'px-3' : ''}`}>
          {isHorizontal ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: totalSlots }).map((_, idx) =>
                renderPhotoSlot(idx, 'aspect-[4/3]')
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from({ length: totalSlots }).map((_, idx) =>
                renderPhotoSlot(idx, isTicketExpress ? 'aspect-[4/3]' : 'aspect-[4/3]')
              )}
            </div>
          )}
        </div>

        {/* Draggable Stickers Overlay */}
        {(stickers.length > 0 || isStickersInteractive) && (
          <DraggableStickerLayer
            stickers={stickers}
            onUpdateStickers={onUpdateStickers || (() => {})}
            isInteractive={isStickersInteractive}
            cardContainerRef={cardContainerRef}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* FOOTER RENDERING PER THEME                                    */}
        {/* ------------------------------------------------------------- */}

        {/* 1. THE SNAP EXPRESS TICKET FOOTER */}
        {isTicketExpress && (
          <div className="relative z-10 mt-3 pt-2 text-center text-[#4A121A]">
            <div className="font-serif font-black tracking-widest text-xs uppercase mb-0.5">
              PHOTO PASS
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[8px] mb-1.5 text-[#8B2635]">
              <span className="text-[9px] font-mono font-bold">STUDIO</span>
            </div>

            {/* Clean Roastery Badge Pill */}
            <div className="relative mx-auto w-fit px-4 py-1 rounded-full border border-[#4A121A]/40 bg-[#FAF5EC] font-mono text-[9px] font-bold tracking-wider uppercase shadow-2xs">
              <span>{frame.ticketSeat || 'SPECIALTY EDITION'}</span>
            </div>

            {/* Barcode Strip */}
            <div className="flex flex-col items-center mt-2 opacity-85">
              <TicketBarcodeSvg width={130} height={18} color="#4A121A" />
              <span className="text-[7px] font-mono tracking-widest text-[#4A121A] mt-0.5 font-bold">
                #MEMORIES-HOSPITALITY • VERIFIED VISIT
              </span>
            </div>
          </div>
        )}

        {/* 2. SPOTIFY PLAYER DOCK FOOTER */}
        {isSpotifyPlayer && (
          <div className="relative z-10 mt-3 pt-2 px-1 text-white space-y-2">
            {/* Track Info */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <span className="text-[7.5px] font-mono text-white/50 block">iPhone</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white tracking-tight">
                    {frame.songTitle || 'Nobody Gets Me'}
                  </span>
                  <SpotifyExplicitBadge size={13} />
                </div>
                <p className="text-[9.5px] text-white/70 font-medium">
                  {frame.songArtist || 'SZA • SOS'}
                </p>
              </div>
              <Heart className="w-4 h-4 text-white/80 hover:text-rose-400 cursor-pointer transition fill-white/20 hover:fill-rose-400" />
            </div>

            {/* Scrubber Progress Bar */}
            <div>
              <div className="h-1 bg-white/25 rounded-full overflow-hidden flex items-center relative">
                <div className="h-full bg-white rounded-full w-[42%]" />
                <span className="absolute left-[42%] -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-xs" />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-white/60 mt-1">
                <span>1:28</span>
                <span>-2:25</span>
              </div>
            </div>

            {/* Media Controls Bar with Authentic SVGs */}
            <div className="flex items-center justify-between px-3 pt-0.5 text-white">
              <SpotifyShuffleSvg size={14} className="opacity-70 hover:opacity-100 transition cursor-pointer" />
              <SpotifyPreviousSvg size={15} className="cursor-pointer hover:scale-105 transition" />
              <div className="w-8 h-8 rounded-full bg-white text-stone-900 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition cursor-pointer">
                <Pause className="w-4 h-4 fill-stone-900" />
              </div>
              <SpotifyNextSvg size={15} className="cursor-pointer hover:scale-105 transition" />
              <SpotifyRepeatSvg size={14} className="opacity-70 hover:opacity-100 transition cursor-pointer" />
            </div>

            {/* Watermark branding */}
            <div className="text-center pt-1 border-t border-white/10">
              <span className="text-[7.5px] font-mono text-white/40 tracking-wider">
                memories.cafe/playlist
              </span>
            </div>
          </div>
        )}

        {/* 3. IPHONE GALLERY TAB BAR FOOTER */}
        {isIosGallery && (
          <div className={`relative z-10 mt-3 pt-2 border-t ${isIosGalleryDark ? 'border-white/10 text-white/70' : 'border-stone-200 text-stone-600'}`}>
            <div className="grid grid-cols-4 text-center text-[8px] font-medium">
              <div className="flex flex-col items-center gap-0.5">
                <IosPhotosLibrarySvg size={16} />
                <span>Library</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <IosPhotosForYouSvg size={16} />
                <span>For You</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 text-[#007AFF] font-bold">
                <IosPhotosAlbumsSvg size={16} color="#007AFF" />
                <span>Albums</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. IPHONE CAMERA CONTROLS FOOTER */}
        {isIosCamera && (
          <div className="relative z-10 mt-3 pt-1 text-white text-center space-y-2.5">
            {/* Mode selector wheel */}
            <div className="flex items-center justify-center gap-3 text-[8.5px] font-mono tracking-wider font-bold">
              <span className="opacity-40">SLO-MO</span>
              <span className="opacity-40">VIDEO</span>
              <span className="text-[#FFCC00]">PHOTO</span>
              <span className="opacity-40">PORTRAIT</span>
              <span className="opacity-40">PANO</span>
            </div>

            {/* Circular Shutter Button with SVGs */}
            <div className="flex items-center justify-between px-4 pt-1">
              <div className="w-8 h-8 rounded-lg bg-stone-800 border border-white/20 overflow-hidden shadow-xs">
                {photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photos[0]} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-stone-900 flex items-center justify-center text-[10px] text-stone-400 font-mono">FRAME</div>
                )}
              </div>

              {/* Shutter Circle SVG */}
              <div className="cursor-pointer hover:scale-105 active:scale-95 transition">
                <IosCameraShutterSvg size={52} />
              </div>

              {/* Lens flip icon SVG */}
              <div className="w-8 h-8 rounded-full bg-stone-800/80 border border-white/20 flex items-center justify-center cursor-pointer hover:bg-stone-700 transition">
                <IosCameraFlipLensSvg size={16} color="#FFFFFF" />
              </div>
            </div>
          </div>
        )}

        {/* 5. IPHONE IMESSAGE FOOTER */}
        {isIosIMessage && (
          <div className="relative z-10 mt-2.5 pt-1 text-black">
            <div className="flex items-center justify-between text-[8px] text-stone-500 py-1 border-t border-stone-200">
              <span className="flex items-center gap-1 font-bold text-[#007AFF]">
                <Reply className="w-2.5 h-2.5" /> Reply
              </span>
              <span>Save ↓</span>
              <span className="flex items-center gap-1">
                <Share2 className="w-2.5 h-2.5" /> Forward
              </span>
            </div>
            {/* Input Bar */}
            <div className="mt-1 flex items-center gap-2 py-1 px-3 bg-stone-100 rounded-full border border-stone-200 text-[10px] text-stone-400">
              <Camera className="w-3 h-3 text-stone-500" />
              <span className="flex-1 text-right">iMessage...</span>
              <Mic className="w-3 h-3 text-stone-500" />
            </div>
          </div>
        )}

        {/* 6. STANDARD MINIMALIST ARTISANAL FOOTER */}
        {!isTicketExpress && !isSpotifyPlayer && !isIosGallery && !isIosCamera && !isIosIMessage && (
          <div
            style={{ borderColor: isArabicaGold ? '#D4AF37' : effectiveBorder }}
            className="relative z-10 mt-2.5 pt-1.5 border-t-[0.5px] flex items-center justify-between text-[8px] opacity-85 font-mono px-1"
          >
            <div className="flex items-center gap-2">
              {isTokyoPastel ? (
                <span className="text-[#FF6B35] font-mono font-black tracking-widest text-[9px] drop-shadow-2xs">
                  {tokyoStampDate}
                </span>
              ) : isKinfolkMinimal ? (
                <span className="font-serif italic tracking-wider text-[8px]">
                  Issue No. 04 • {dateFormatted}
                </span>
              ) : (
                <span className="tracking-tight">{dateFormatted}</span>
              )}
            </div>

            <span className="tracking-widest uppercase font-bold text-[7.5px]">
              {widthCm}×{heightCm} CM
            </span>
          </div>
        )}

        {/* Polaroid Authentic Wide Chin Text */}
        {isPolaroidVintage && (
          <div className="mt-3 text-center">
            <div className="w-8 h-[2.5px] mx-auto mb-1.5 flex rounded-full overflow-hidden opacity-80">
              <span className="flex-1 bg-red-500" />
              <span className="flex-1 bg-orange-400" />
              <span className="flex-1 bg-yellow-400" />
              <span className="flex-1 bg-green-500" />
              <span className="flex-1 bg-blue-500" />
            </div>
            <div className="text-[9.5px] italic font-serif opacity-80 tracking-wider text-stone-700">
              {frame.customText || branding.tagline || 'special coffee memory'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
