import { PhotoboothFrame, BusinessBranding, FreeGiftOffer } from '@/types/photobooth';

export interface ComposeStripOptions {
  photos: string[]; // Base64 data URLs
  totalSlots?: number;
  frame: PhotoboothFrame;
  branding: BusinessBranding;
  freeGiftOffer?: FreeGiftOffer;
  giftCode?: string;
  timestamp?: string;
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
      giftCode = 'MEMO-FREE',
      timestamp = new Date().toISOString(),
    } = options;

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

    // 1. Draw frame background
    ctx.fillStyle = frame.bgColor || '#FAF8F5';
    ctx.fillRect(0, 0, width, height);

    // Outer subtle border
    ctx.strokeStyle = frame.borderColor || '#E7E2D9';
    ctx.lineWidth = 6;
    this.roundRect(ctx, 16, 16, width - 32, height - 32, 28);
    ctx.stroke();

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
      ctx.fillStyle = frame.textColor || '#1C1917';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(branding.name || 'Memories Studio', width / 2, headerY);
      ctx.fillStyle = frame.accentColor || '#D97706';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText((branding.name ? `${branding.name} • MEMORIES` : 'MEMORIES STUDIO').toUpperCase(), width / 2, headerY + 26);
    }

    // 5. Draw Corner Emojis/Stickers
    if (frame.cornerEmojis && frame.cornerEmojis.enabled) {
      ctx.font = '40px sans-serif';
      // Top-Right emoji
      if (frame.cornerEmojis.topRight) {
        ctx.textAlign = 'right';
        ctx.fillText(frame.cornerEmojis.topRight, width - 40, 75);
      }
      // Bottom-Left emoji
      if (frame.cornerEmojis.bottomLeft) {
        ctx.textAlign = 'left';
        ctx.fillText(frame.cornerEmojis.bottomLeft, 40, height - 55);
      }
    }

    // 6. Draw Slots (Multi-visit photos + Last slot reward milestone)
    const photoAreaTop = 130;
    const photoAreaBottom = height - 90;
    const photoAreaHeight = photoAreaBottom - photoAreaTop;

    const gap = 18;
    const totalGap = gap * (totalSlots - 1);
    const slotH = (photoAreaHeight - totalGap) / totalSlots;
    const slotW = width - 72;
    const slotX = 36;

    for (let slotIdx = 0; slotIdx < totalSlots; slotIdx++) {
      const slotY = photoAreaTop + slotIdx * (slotH + gap);
      const photo = loadedImages[slotIdx];
      const isLastSlot = slotIdx === totalSlots - 1;
      const visitNumber = slotIdx + 1;

      if (photo && photo.width) {
        // Filled Photo Slot
        ctx.save();
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.clip();
        this.drawCoverImage(ctx, photo, slotX, slotY, slotW, slotH);
        ctx.restore();

        // Photo border
        ctx.strokeStyle = frame.borderColor || '#E7E2D9';
        ctx.lineWidth = 3;
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.stroke();

        // Badge: الزيارة #N
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        this.roundRect(ctx, slotX + slotW - 120, slotY + slotH - 36, 110, 26, 8);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`الزيارة #${visitNumber}`, slotX + slotW - 65, slotY + slotH - 18);
      } else if (isLastSlot) {
        // The LAST Slot: Grand Gift / Reward Milestone!
        ctx.fillStyle = '#FFFDF7';
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.fill();

        ctx.strokeStyle = frame.accentColor || '#D97706';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.stroke();
        ctx.setLineDash([]);

        // Gift Icon
        ctx.font = '42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎁', width / 2, slotY + slotH / 2 - 25);

        // Milestone Label
        ctx.fillStyle = frame.accentColor || '#D97706';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`الخانة الأخيرة • الزيارة #${visitNumber}`, width / 2, slotY + slotH / 2 + 10);

        // Gift Title
        ctx.fillStyle = '#1C1917';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(freeGiftOffer.title || 'مشروب مجاني أو هدية فورية', width / 2, slotY + slotH / 2 + 35);

        // Completion Note
        ctx.fillStyle = '#78716C';
        ctx.font = '13px sans-serif';
        ctx.fillText('اكتمال الكارت والطباعة', width / 2, slotY + slotH / 2 + 58);
      } else {
        // Upcoming middle slot placeholder
        ctx.fillStyle = '#FAF8F5';
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.fill();

        ctx.strokeStyle = frame.borderColor || '#E7E2D9';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        this.roundRect(ctx, slotX, slotY, slotW, slotH, 20);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#A8A29E';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`الزيارة القادمة #${visitNumber}`, width / 2, slotY + slotH / 2 + 6);
      }
    }

    // 7. Draw Clean Minimal Footer (Date & Brand Name - NO BARCODE!)
    const footerY = height - 42;
    ctx.textAlign = 'center';

    const dateStr = new Date(timestamp).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    ctx.fillStyle = '#78716C';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${dateStr} • ${branding.name ? `${branding.name} • Memories` : 'Memories'}`, width / 2, footerY);

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
