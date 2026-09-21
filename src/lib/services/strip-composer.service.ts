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
        icon: '🎁',
      },
      giftCode = '',
      timestamp = new Date().toISOString(),
      cardMode = frame.cardMode || 'korean_noir',
      stickers = frame.stickers || [],
    } = options;

    const modeInfo =
      PHOTOBOOTH_CARD_MODES.find((m) => m.id === cardMode) ||
      PHOTOBOOTH_CARD_MODES[0];

    const isHorizontal = frame.orientation === 'horizontal';
    const totalSlots = Math.max(options.totalSlots || frame.shotCount || 3, 1);
    const canvas = document.createElement('canvas');

    // High resolution canvas dimensions (Exact 1:3 2x6 strip at 300 DPI)
    const width = isHorizontal ? 1200 : 600;
    const height = isHorizontal ? 800 : 1800;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context for canvas');

    const effectiveBg = frame.bgColor || modeInfo.defaultBg;
    const effectiveBorder = frame.borderColor || modeInfo.defaultBorder;
    const effectiveText = frame.textColor || modeInfo.defaultText;
    const effectiveAccent = frame.accentColor || modeInfo.defaultAccent;

    const isKorean = cardMode === 'korean_noir';
    const isRetro = cardMode === 'retro_film' || cardMode === 'film_35mm';
    const isPolaroid = cardMode === 'polaroid_classic' || cardMode === 'polaroid_vintage' || frame.frameShape === 'polaroid';
    const isTokyo = cardMode === 'tokyo_pastel';
    const isKinfolk = cardMode === 'kinfolk_minimal';
    const isArabicaGold = cardMode === 'arabica_luxury_gold';

    // 1. Draw frame background
    ctx.fillStyle = effectiveBg;
    ctx.fillRect(0, 0, width, height);

    // Outer subtle border
    ctx.strokeStyle = isArabicaGold ? '#D4AF37' : effectiveBorder;
    ctx.lineWidth = isArabicaGold ? 8 : 6;
    this.roundRect(ctx, 16, 16, width - 32, height - 32, isPolaroid ? 16 : 28);
    ctx.stroke();

    if (isArabicaGold) {
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

    // Header Mode Film Badge
    ctx.fillStyle = effectiveAccent;
    ctx.font = 'bold 12px monospace';
    const badgeText = frame.badgeText || modeInfo.filmBadge;
    ctx.fillText(badgeText.toUpperCase(), width / 2, headerY + 26);

    // 5. Draw Corner Emojis/Stickers (from frame config)
    if (frame.cornerEmojis && frame.cornerEmojis.enabled) {
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

    // 6. Draw Slots (Multi-visit photos + Last slot reward milestone)
    const photoAreaTop = 130;
    const photoAreaBottom = isPolaroid ? height - 140 : height - 90;
    const photoAreaHeight = photoAreaBottom - photoAreaTop;

    let slotW: number;
    let slotH: number;
    const gapX = 20;
    const gapY = 18;
    const marginSide = isRetro ? 52 : 36;

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
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.clip();
        this.drawCoverImage(ctx, photo, slotX, slotY, slotW, slotH);
        ctx.restore();

        // Photo border
        ctx.strokeStyle = effectiveBorder;
        ctx.lineWidth = 3;
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.stroke();

        // Film Frame Number (#01, #02...)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        this.roundRect(ctx, slotX + 10, slotY + 10, 52, 24, 6);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('#' + slotNumStr, slotX + 36, slotY + 26);

        // Visit Badge: الزيارة #N
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        this.roundRect(ctx, slotX + slotW - 120, slotY + slotH - 36, 110, 26, 8);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('الزيارة #' + visitNumber, slotX + slotW - 65, slotY + slotH - 18);
      } else if (isLastSlot) {
        // The LAST Slot: Grand Gift / Reward Milestone!
        ctx.fillStyle = '#FFFDF7';
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.fill();

        ctx.strokeStyle = effectiveAccent;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.stroke();
        ctx.setLineDash([]);

        // Slot number on milestone
        ctx.fillStyle = effectiveAccent;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('#' + slotNumStr, slotX + 14, slotY + 24);

        // Gift Icon
        ctx.font = isHorizontal ? '32px sans-serif' : '42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎁', slotCenterX, slotCenterY - (isHorizontal ? 18 : 25));

        // Milestone Label
        ctx.fillStyle = effectiveAccent;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('الخانة الأخيرة • الزيارة #' + visitNumber, slotCenterX, slotCenterY + (isHorizontal ? 6 : 10));

        // Gift Title
        ctx.fillStyle = '#1C1917';
        ctx.font = isHorizontal ? 'bold 15px sans-serif' : 'bold 18px sans-serif';
        ctx.fillText(freeGiftOffer.title || 'مشروب مجاني أو هدية فورية', slotCenterX, slotCenterY + (isHorizontal ? 26 : 35));

        // Completion Note
        ctx.fillStyle = '#78716C';
        ctx.font = '12px sans-serif';
        ctx.fillText('اكتمال الكارت والطباعة', slotCenterX, slotCenterY + (isHorizontal ? 44 : 58));
      } else {
        // Upcoming middle slot placeholder
        ctx.fillStyle = effectiveBg;
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.fill();

        ctx.strokeStyle = effectiveBorder;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#A8A29E';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('الزيارة القادمة #' + visitNumber, slotCenterX, slotCenterY + 6);
      }
    }

    // 7. Draw Draggable Stickers/Emojis at Exact Coordinates
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

    // 8. Draw Clean Minimal Footer (Date & Brand Name & Barcode)
    const footerY = height - 42;
    const dateObj = new Date(timestamp);
    const dateStr = dateObj.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const shortYear = String(dateObj.getFullYear()).slice(-2);
    const tokyoStampDate = `'${shortYear} ${String(dateObj.getMonth() + 1).padStart(2, '0')} ${String(dateObj.getDate()).padStart(2, '0')}`;

    // Barcode on footer for Korean / Retro modes
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
      const chinNote = frame.customText || branding.tagline || 'special coffee memory ♡';
      ctx.fillText(chinNote, width / 2, footerY + 22);
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