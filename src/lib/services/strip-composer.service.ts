import {
  PhotoboothFrame,
  BusinessBranding,
  FreeGiftOffer,
  PhotoboothCardMode,
  PlacedSticker,
} from '@/types/photobooth';
import { PHOTOBOOTH_CARD_MODES } from '@/lib/constants/photobooth-presets';

export interface ComposeStripOptions {
  photos: string[]; // Base64 data URLs
  totalSlots?: number;
  frame: PhotoboothFrame;
  branding: BusinessBranding;
  freeGiftOffer?: FreeGiftOffer;
  giftCode?: string;
  timestamp?: string;
  cardMode?: PhotoboothCardMode;
  stickers?: PlacedSticker[];
}

export class StripComposerService {
  /**
   * Composes a complete photobooth strip on an HTML canvas and returns a high-resolution base64 PNG data URL.
   */
  static async composeStrip(options: ComposeStripOptions): Promise<string> {
    const {
      photos,
      frame,
      branding,
      freeGiftOffer = {
        title: 'مشروب مجاني مميز + طباعة الكارت 2x6',
        subtitle: 'هدية فورية عند اكتمال كارت ذكرياتك',
        icon: 'gift',
      },
      giftCode = '',
      timestamp = new Date().toISOString(),
      cardMode = frame.cardMode || 'ticket_express',
      stickers = frame.stickers || [],
    } = options;

    const modeInfo =
      PHOTOBOOTH_CARD_MODES.find((m) => m.id === cardMode) ||
      PHOTOBOOTH_CARD_MODES[0];

    const isHorizontal = frame.orientation === 'horizontal';
    const totalSlots = Math.max(options.totalSlots || frame.shotCount || 3, 1);
    const canvas = document.createElement('canvas');

    const is4x6 = frame.dimensionsPreset === 'grid_4x6' || frame.widthCm === 10;
    // High resolution canvas dimensions (300 DPI print standard)
    // 2x6 strip: 600 x 1800 px
    // 4x6 postcard: 1200 x 1800 px
    const width = isHorizontal ? (is4x6 ? 1800 : 1200) : (is4x6 ? 1200 : 600);
    const height = isHorizontal ? (is4x6 ? 1200 : 800) : 1800;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context for canvas');

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

    // 1. Draw frame background
    ctx.fillStyle = effectiveBg;
    ctx.fillRect(0, 0, width, height);

    // Outer border
    ctx.strokeStyle = isArabicaGold ? '#D4AF37' : effectiveBorder;
    ctx.lineWidth = isTicketExpress ? 8 : isArabicaGold ? 8 : 6;
    this.roundRect(
      ctx,
      16,
      16,
      width - 32,
      height - 32,
      isPolaroid ? 16 : isTicketExpress ? 24 : isSpotifyPlayer ? 24 : 28
    );
    ctx.stroke();

    if (isTicketExpress) {
      // Inner thin ticket border
      ctx.strokeStyle = 'rgba(74, 18, 26, 0.4)';
      ctx.lineWidth = 2;
      this.roundRect(ctx, 24, 24, width - 48, height - 48, 20);
      ctx.stroke();
    } else if (isArabicaGold) {
      // Inner luxury gold filigree line
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 2;
      this.roundRect(ctx, 24, 24, width - 48, height - 48, 22);
      ctx.stroke();
    }

    // Retro 35mm Sprocket Holes on side margins
    if (isRetro) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      const sprocketH = 26;
      const sprocketW = 16;
      const count = 18;
      const step = (height - 80) / count;
      for (let i = 0; i < count; i++) {
        const sy = 40 + i * step;
        this.roundRect(ctx, 24, sy, sprocketW, sprocketH, 4);
        ctx.fill();
        this.roundRect(ctx, width - 24 - sprocketW, sy, sprocketW, sprocketH, 4);
        ctx.fill();
      }
    }

    // 2. Load all captured photos
    const loadedImages = await Promise.all(
      photos.map(
        (src) =>
          new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img);
            img.src = src;
          })
      )
    );

    // 3. Load business logo if provided
    let logoImg: HTMLImageElement | null = null;
    if (branding.logoUrl) {
      try {
        logoImg = await new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null as any);
          img.src = branding.logoUrl!;
        });
      } catch {
        logoImg = null;
      }
    }

    // 4. Draw Header
    if (isTicketExpress) {
      // Arched Vintage Train Ticket Header
      const headerBoxY = 40;
      ctx.save();
      // Outer ticket header box
      ctx.strokeStyle = '#4A121A';
      ctx.lineWidth = 4;
      this.roundRect(ctx, 42, headerBoxY, width - 84, 110, 16);
      ctx.stroke();

      ctx.fillStyle = '#4A121A';
      ctx.textAlign = 'center';
      ctx.font = '900 28px serif';
      ctx.fillText('MEMORIES STUDIO', width / 2, headerBoxY + 40);

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#8B2635';
      ctx.fillText('MEMORIES RAILWAY • SPECIALTY LINE', width / 2, headerBoxY + 62);

      // Star & Train icon representation
      ctx.font = '16px serif';
      ctx.fillStyle = '#4A121A';
      ctx.fillText('MEMORIES STUDIO', width / 2, headerBoxY + 92);
      ctx.restore();
    } else if (isSpotifyPlayer) {
      // Spotify Top Bar
      const spY = 50;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.textAlign = 'left';
      ctx.font = 'italic 18px serif';
      ctx.fillText('Spotify', 42, spY);

      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillText('PHOTOSTRIP #03', 115, spY - 2);

      // Pulsing green dot
      ctx.fillStyle = '#1DB954';
      ctx.beginPath();
      ctx.arc(width - 48, spY - 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (isIosGallery) {
      // Apple Photos Status Bar + Albums Title
      ctx.save();
      ctx.fillStyle = isIosGalleryDark ? '#FFFFFF' : '#000000';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('9:41', 44, 46);

      ctx.textAlign = 'right';
      ctx.font = '12px sans-serif';
      ctx.fillText('5G   100%', width - 44, 46);

      // Albums / See all
      ctx.textAlign = 'left';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Albums', 44, 82);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = isIosGalleryDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
      ctx.fillText('My Albums', 44, 100);

      ctx.fillStyle = '#007AFF';
      ctx.textAlign = 'right';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('See All', width - 44, 86);
      ctx.restore();
    } else if (isIosCamera) {
      // iPhone Camera Toolbar Top
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RAW • HDR • 300DPI', width / 2, 55);
      ctx.restore();
    } else if (isIosIMessage) {
      // iMessage Header
      ctx.save();
      ctx.fillStyle = '#007AFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Cancel', 44, 48);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('New MMS', width / 2, 48);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Details', width - 44, 48);

      // Reactions Drawer
      ctx.fillStyle = '#F2F2F7';
      this.roundRect(ctx, width / 2 - 120, 64, 240, 36, 18);
      ctx.fill();
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MEMORIES • EDITORIAL', width / 2, 89);
      ctx.restore();
    } else {
      // Standard artisanal header
      const headerY = 70;
      ctx.textAlign = 'center';

      if (logoImg && logoImg.width) {
        const maxLogoW = 160;
        const maxLogoH = 55;
        const scale = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height);
        const lw = logoImg.width * scale;
        const lh = logoImg.height * scale;
        ctx.drawImage(logoImg, width / 2 - lw / 2, headerY - 20, lw, lh);
      } else {
        ctx.fillStyle = effectiveText;
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(branding.name || 'Memories Studio', width / 2, headerY);
      }

      ctx.fillStyle = effectiveAccent;
      ctx.font = 'bold 12px monospace';
      const badgeText = frame.badgeText || modeInfo.filmBadge;
      ctx.fillText(badgeText.toUpperCase(), width / 2, headerY + 26);
    }

    // 5. Draw Corner Emojis/Stickers (if applicable)
    if (frame.cornerEmojis && frame.cornerEmojis.enabled && !isTicketExpress && !isSpotifyPlayer && !isIosGallery) {
      ctx.font = '40px sans-serif';
      if (frame.cornerEmojis.topRight) {
        ctx.textAlign = 'right';
        ctx.fillText(frame.cornerEmojis.topRight, width - 40, 75);
      }
      if (frame.cornerEmojis.bottomLeft) {
        ctx.textAlign = 'left';
        ctx.fillText(frame.cornerEmojis.bottomLeft, 40, height - 55);
      }
    }

    // 6. Slots Coordinates & Dimensions
    let photoAreaTop = 130;
    let photoAreaBottom = isPolaroid ? height - 140 : height - 90;

    if (isTicketExpress) {
      photoAreaTop = 170;
      photoAreaBottom = height - 160;
    } else if (isSpotifyPlayer) {
      photoAreaTop = 75;
      photoAreaBottom = height - 240;
    } else if (isIosGallery) {
      photoAreaTop = 120;
      photoAreaBottom = height - 90;
    } else if (isIosCamera) {
      photoAreaTop = 85;
      photoAreaBottom = height - 160;
    } else if (isIosIMessage) {
      photoAreaTop = 115;
      photoAreaBottom = height - 110;
    }

    const photoAreaHeight = photoAreaBottom - photoAreaTop;
    const marginSide = isRetro ? 52 : isTicketExpress ? 42 : 36;
    const gapX = 20;
    const gapY = isTicketExpress ? 16 : isSpotifyPlayer ? 16 : 18;

    let slotW: number;
    let slotH: number;

    if (isHorizontal) {
      const cols = 2;
      const rows = Math.ceil(totalSlots / cols);
      slotW = (width - marginSide * 2 - (cols - 1) * gapX) / cols;
      slotH = (photoAreaHeight - (rows - 1) * gapY) / rows;
    } else {
      const totalGap = gapY * (totalSlots - 1);
      slotW = width - marginSide * 2;
      slotH = (photoAreaHeight - totalGap) / totalSlots;
    }

    const slotCornerRadius = isTicketExpress
      ? 6
      : isSpotifyPlayer
      ? 18
      : isIosGallery
      ? 20
      : isIosCamera
      ? 10
      : 20;

    for (let slotIdx = 0; slotIdx < totalSlots; slotIdx++) {
      let slotX: number;
      let slotY: number;

      if (isHorizontal) {
        const col = slotIdx % 2;
        const row = Math.floor(slotIdx / 2);
        slotX = marginSide + col * (slotW + gapX);
        slotY = photoAreaTop + row * (slotH + gapY);
      } else {
        slotX = marginSide;
        slotY = photoAreaTop + slotIdx * (slotH + gapY);
      }

      const slotCenterX = slotX + slotW / 2;
      const slotCenterY = slotY + slotH / 2;

      const photo = loadedImages[slotIdx];
      const isLastSlot = slotIdx === totalSlots - 1;
      const visitNumber = slotIdx + 1;
      const slotNumStr = String(visitNumber).padStart(2, '0');

      if (photo && photo.width) {
        // Filled Photo Slot
        ctx.save();
        this.roundRect(ctx, slotX, slotY, slotW, slotH, slotCornerRadius);
        ctx.clip();
        this.drawCoverImage(ctx, photo, slotX, slotY, slotW, slotH);
        ctx.restore();

        // Photo border
        ctx.strokeStyle = isTicketExpress ? '#4A121A' : effectiveBorder;
        ctx.lineWidth = isTicketExpress ? 4 : 3;
        this.roundRect(ctx, slotX, slotY, slotW, slotH, slotCornerRadius);
        ctx.stroke();

        // Slot badge
        if (!isIosGallery && !isSpotifyPlayer) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          this.roundRect(ctx, slotX + 10, slotY + 10, 52, 24, 6);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(isTicketExpress ? '#' + slotNumStr : '#' + slotNumStr, slotX + 36, slotY + 26);
        }
      } else if (isLastSlot) {
        // Milestone / Last slot
        ctx.fillStyle = isTicketExpress ? '#FAF5EC' : isSpotifyPlayer ? 'rgba(255,255,255,0.08)' : '#FFFDF7';
        this.roundRect(ctx, slotX, slotY, slotW, slotH, slotCornerRadius);
        ctx.fill();

        ctx.strokeStyle = effectiveAccent;
        ctx.lineWidth = 3;
        if (typeof ctx.setLineDash === 'function') ctx.setLineDash([8, 6]);
        this.roundRect(ctx, slotX, slotY, slotW, slotH, slotCornerRadius);
        ctx.stroke();
        if (typeof ctx.setLineDash === 'function') ctx.setLineDash([]);

        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('REWARD', slotCenterX, slotCenterY - 20);

        ctx.fillStyle = isTicketExpress ? '#4A121A' : effectiveText;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(freeGiftOffer.title || 'هدية فورية', slotCenterX, slotCenterY + 25);

        ctx.fillStyle = effectiveAccent;
        ctx.font = '13px sans-serif';
        ctx.fillText('اكتمال الكارت والطباعة', slotCenterX, slotCenterY + 50);
      } else {
        // Empty upcoming slot
        ctx.fillStyle = isSpotifyPlayer ? 'rgba(255,255,255,0.05)' : effectiveBg;
        this.roundRect(ctx, slotX, slotY, slotW, slotH, slotCornerRadius);
        ctx.fill();

        ctx.strokeStyle = effectiveBorder;
        ctx.lineWidth = 2;
        if (typeof ctx.setLineDash === 'function') ctx.setLineDash([6, 6]);
        this.roundRect(ctx, slotX, slotY, slotW, slotH, slotCornerRadius);
        ctx.stroke();
        if (typeof ctx.setLineDash === 'function') ctx.setLineDash([]);

        ctx.fillStyle = isSpotifyPlayer ? 'rgba(255,255,255,0.4)' : '#A8A29E';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('اللقطة #' + visitNumber, slotCenterX, slotCenterY + 6);
      }
    }

    // 7. Draggable Stickers
    if (stickers && stickers.length > 0) {
      for (const sticker of stickers) {
        const posX = (sticker.x / 100) * width;
        const posY = (sticker.y / 100) * height;

        ctx.save();
        ctx.translate(posX, posY);
        if (sticker.rotation) {
          ctx.rotate((sticker.rotation * Math.PI) / 180);
        }
        const stickerFontSize = Math.round(50 * (sticker.scale || 1));
        ctx.font = stickerFontSize + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.emoji, 0, 0);
        ctx.restore();
      }
    }

    // 8. Draw Footers per Theme
    if (isTicketExpress) {
      // The Snap Express Ticket Footer
      const footY = height - 120;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4A121A';
      ctx.font = '900 18px serif';
      ctx.fillText('PHOTO PASS', width / 2, footY);

      ctx.fillStyle = '#8B2635';
      ctx.font = '12px serif';
      ctx.fillText('• • •', width / 2, footY + 18);

      // Seat Pill with Notches
      const pillW = 280;
      const pillH = 42;
      const pillX = width / 2 - pillW / 2;
      const pillY = footY + 30;

      ctx.fillStyle = '#FAF5EC';
      ctx.strokeStyle = '#4A121A';
      ctx.lineWidth = 3;
      this.roundRect(ctx, pillX, pillY, pillW, pillH, 21);
      ctx.fill();
      ctx.stroke();

      // Left notch cutout circle
      ctx.fillStyle = '#FAF5EC';
      ctx.beginPath();
      ctx.arc(pillX, pillY + pillH / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right notch cutout circle
      ctx.beginPath();
      ctx.arc(pillX + pillW, pillY + pillH / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#381016';
      ctx.font = '900 14px monospace';
      ctx.fillText(frame.ticketSeat || 'ROW 15 • SEAT A33', width / 2, pillY + 26);
      ctx.restore();
    } else if (isSpotifyPlayer) {
      // Spotify Music Player Dock Footer
      const dockY = height - 210;
      ctx.save();
      // Track Info
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '11px monospace';
      ctx.fillText('iPhone', 42, dockY);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px sans-serif';
      const songTitle = frame.songTitle || 'Nobody Gets Me';
      ctx.fillText(songTitle, 42, dockY + 26);

      // [E] Explicit Badge
      const titleW = ctx.measureText(songTitle).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      this.roundRect(ctx, 42 + titleW + 8, dockY + 12, 16, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('E', 42 + titleW + 16, dockY + 24);

      // Artist
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '14px sans-serif';
      ctx.fillText(frame.songArtist || 'SZA • SOS', 42, dockY + 48);

      // Heart Icon
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '22px sans-serif';
      ctx.fillText('LIKE', width - 42, dockY + 30);

      // Timeline Scrubber Bar
      const scrubY = dockY + 68;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      this.roundRect(ctx, 42, scrubY, width - 84, 6, 3);
      ctx.fill();

      // Progress filled line & dot
      const progressW = (width - 84) * 0.42;
      ctx.fillStyle = '#FFFFFF';
      this.roundRect(ctx, 42, scrubY, progressW, 6, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(42 + progressW, scrubY + 3, 6, 0, Math.PI * 2);
      ctx.fill();

      // Time labels
      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'left';
      ctx.fillText('1:28', 42, scrubY + 20);
      ctx.textAlign = 'right';
      ctx.fillText('-2:25', width - 42, scrubY + 20);

      // Media Controls Bar
      const ctrlY = scrubY + 48;
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('SHUFFLE   PREV   PLAY   NEXT   REPEAT', width / 2, ctrlY);

      // Watermark
      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('memories.cafe/playlist', width / 2, height - 20);
      ctx.restore();
    } else if (isIosGallery) {
      // Apple Photos Tab Bar Footer
      const tabY = height - 55;
      ctx.save();
      ctx.strokeStyle = isIosGalleryDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(36, tabY - 15);
      ctx.lineTo(width - 36, tabY - 15);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '13px sans-serif';
      ctx.fillStyle = isIosGalleryDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)';
      const step = (width - 72) / 4;
      ctx.fillText('Library', 36 + step * 0.5, tabY + 12);
      ctx.fillText('For You', 36 + step * 1.5, tabY + 12);

      ctx.fillStyle = '#007AFF';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Albums', 36 + step * 2.5, tabY + 12);

      ctx.fillStyle = isIosGalleryDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)';
      ctx.font = '13px sans-serif';
      ctx.fillText('Search', 36 + step * 3.5, tabY + 12);
      ctx.restore();
    } else if (isIosCamera) {
      // iPhone Camera Controls Footer
      const camY = height - 120;
      ctx.save();
      // Wheel
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('SLO-MO   VIDEO   ', width / 2 - 70, camY);
      ctx.fillStyle = '#FFCC00';
      ctx.fillText('PHOTO', width / 2, camY);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('   PORTRAIT   PANO', width / 2 + 75, camY);

      // Shutter Circle
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(width / 2, camY + 48, 32, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(width / 2, camY + 48, 26, 0, Math.PI * 2);
      ctx.fill();

      // Thumbnail & lens flip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.roundRect(ctx, 60, camY + 30, 36, 36, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(width - 78, camY + 48, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px sans-serif';
      ctx.fillText('FLIP', width - 78, camY + 54);
      ctx.restore();
    } else if (isIosIMessage) {
      // iMessage Footer
      const msgY = height - 70;
      ctx.save();
      ctx.fillStyle = '#F2F2F7';
      this.roundRect(ctx, 42, msgY, width - 84, 44, 22);
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('iMessage...', 60, msgY + 28);

      ctx.textAlign = 'right';
      ctx.fillText('REC', width - 60, msgY + 28);
      ctx.restore();
    } else {
      // Standard Minimalist Footer
      const footerY = height - 42;
      const dateObj = new Date(timestamp);
      const dateStr = dateObj.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const shortYear = String(dateObj.getFullYear()).slice(-2);
      const tokyoStampDate = `'${shortYear} ${String(dateObj.getMonth() + 1).padStart(2, '0')} ${String(dateObj.getDate()).padStart(2, '0')}`;

      if (isKorean || isRetro) {
        ctx.fillStyle = effectiveText;
        const barX = marginSide;
        const barY = footerY - 14;
        const bars = [3, 1, 4, 1, 2, 4, 1, 3, 2, 1];
        let curX = barX;
        for (const b of bars) {
          ctx.fillRect(curX, barY, b, 16);
          curX += b + 2;
        }
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(isKorean ? 'SEOUL 4-CUT' : '35MM DX', curX + 4, barY + 12);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = effectiveText;

      if (isTokyo) {
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = '#FF6B35';
        ctx.fillText(tokyoStampDate + ' • ' + (branding.name || 'TOKYO MEMORIES'), width / 2, footerY);
      } else if (isKinfolk) {
        ctx.font = 'italic 13px serif';
        ctx.fillText(`KINFOLK ARCHIVES • ${branding.name || 'A SENSE OF PLACE'}`, width / 2, footerY);
      } else if (isArabicaGold) {
        ctx.font = 'bold 12px serif';
        ctx.fillStyle = '#C5A059';
        ctx.fillText(`% ARABICA SPECIALTY ROASTERS • ${dateStr}`, width / 2, footerY);
      } else {
        ctx.font = '13px sans-serif';
        ctx.fillText(dateStr + ' • ' + (branding.name ? branding.name + ' • Memories' : 'Memories'), width / 2, footerY);
      }

      if (isPolaroid) {
        ctx.font = 'italic 13px serif';
        ctx.fillStyle = effectiveText;
        const chinNote = frame.customText || branding.tagline || 'special coffee memory';
        ctx.fillText(chinNote, width / 2, footerY + 22);
      }
    }

    // Draw Placed Stickers onto Canvas (at exact percentage coordinates)
    if (stickers && stickers.length > 0) {
      for (const sticker of stickers) {
        ctx.save();
        const posX = (sticker.x / 100) * width;
        const posY = (sticker.y / 100) * height;
        ctx.translate(posX, posY);
        if (sticker.rotation) {
          ctx.rotate((sticker.rotation * Math.PI) / 180);
        }
        const fontSize = Math.round(36 * (sticker.scale || 1) * (width / 600));
        ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.emoji, 0, 0);
        ctx.restore();
      }
    }

    return canvas.toDataURL('image/png', 0.95);
  }

  private static roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  private static drawCoverImage(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    let sx = 0,
      sy = 0,
      sw = img.width,
      sh = img.height;

    if (imgRatio > boxRatio) {
      sw = img.height * boxRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / boxRatio;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
}
