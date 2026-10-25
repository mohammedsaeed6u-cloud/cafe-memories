import type { PhotoboothCardMode, PhotoboothFrame } from '@/types/photobooth';

export interface StripModeDefaults {
  defaultBg: string;
  defaultBorder: string;
  defaultText: string;
  defaultAccent: string;
}

export interface StripThemeInput {
  frame: PhotoboothFrame;
  cardMode: PhotoboothCardMode;
  modeInfo: StripModeDefaults;
}

/**
 * Theme flags and effective colors for a strip.
 *
 * This used to be the first 60 lines of `composeStrip`, which made the drawing
 * code impossible to test in isolation. It is pure: given a frame and a mode it
 * returns the same palette every time.
 */
export function resolveStripTheme({ frame, cardMode, modeInfo }: StripThemeInput) {
    // Theme identification
    const isLuxuryGlass = cardMode === 'luxury_glass';
    const isTicketExpress = cardMode === 'ticket_express';
    const isSpotifyPlayer = cardMode === 'spotify_player';
    const isIosGalleryLight = cardMode === 'ios_gallery_light';
    const isIosGalleryDark = cardMode === 'ios_gallery_dark';
    const isIosGallery = isIosGalleryLight || isIosGalleryDark;
    const isIosCamera = cardMode === 'ios_camera';
    const isIosIMessage = cardMode === 'ios_imessage';

    const isKorean = cardMode === 'korean_noir';
    const isRetro = cardMode === 'retro_film' || cardMode === 'film_35mm';
    const isPolaroid = cardMode === 'polaroid_classic' || cardMode === 'polaroid_vintage' || frame.frameShape === 'polaroid';
    const isTokyo = cardMode === 'tokyo_pastel';
    const isKinfolk = cardMode === 'kinfolk_minimal';
    const isArabicaGold = cardMode === 'arabica_luxury_gold';

    // Base effective colors
    const effectiveBg = isLuxuryGlass
      ? '#08080B'
      : isTicketExpress
      ? '#FAF5EC'
      : isSpotifyPlayer
      ? frame.bgColor || '#384C5A'
      : isIosGalleryLight
      ? '#F2F2F7'
      : isIosGalleryDark || isIosCamera
      ? '#000000'
      : isIosIMessage
      ? '#FFFFFF'
      : frame.bgColor || modeInfo.defaultBg;

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
      : frame.borderColor || modeInfo.defaultBorder;

    const effectiveText = isTicketExpress
      ? '#381016'
      : isSpotifyPlayer || isIosGalleryDark || isIosCamera
      ? '#FFFFFF'
      : isIosGalleryLight || isIosIMessage
      ? '#000000'
      : frame.textColor || modeInfo.defaultText;

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
      : frame.accentColor || modeInfo.defaultAccent;

  return {
    isLuxuryGlass,
    isTicketExpress,
    isSpotifyPlayer,
    isIosGalleryLight,
    isIosGalleryDark,
    isIosGallery,
    isIosCamera,
    isIosIMessage,
    isKorean,
    isRetro,
    isPolaroid,
    isTokyo,
    isKinfolk,
    isArabicaGold,
    effectiveBg,
    effectiveBorder,
    effectiveText,
    effectiveAccent,
  };
}

export type StripTheme = ReturnType<typeof resolveStripTheme>;
