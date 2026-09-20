import { PhotoboothFrame, BusinessBranding } from '@/types/photobooth';

export interface ComposeStripOptions {
  photos: string[]; // Base64 data URLs
  frame: PhotoboothFrame;
  branding: BusinessBranding;
  giftCode?: string;
  timestamp?: string;
}

export class StripComposerService {
  /**
   * Composes a complete photobooth strip on an HTML canvas and returns a high-resolution base64 PNG data URL.
   */
  static async composeStrip(options: ComposeStripOptions): Promise<string> {
    const { photos, frame, branding, giftCode = 'MEMO-FREE', timestamp = new Date().toISOString() } = options;

    const isHorizontal = frame.orientation === 'horizontal';
    const canvas = document.createElement('canvas');

    // High resolution canvas dimensions
    const width = isHorizontal ? 1200 : 600;
    const height = isHorizontal ? 800 : 1800;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context for canvas');

    // 1. Draw frame background
    ctx.fillStyle = frame.bgColor || '#FAF8F5';
    ctx.fillRect(0, 0, width, height);

    // Subtle inner border
    ctx.strokeStyle = frame.borderColor || '#E7E2D9';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // 2. Load all photo images
    const loadedImages = await Promise.all(
      photos.map(
        (src) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load capture photo'));
            img.src = src;
          })
      )
    );

    // 3. Load business logo if provided
    let logoImg: HTMLImageElement | null = null;
    if (branding.logoUrl) {
      try {
        logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
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
    const headerY = 50;
    ctx.textAlign = 'center';

    if (logoImg) {
      const maxLogoW = 120;
      const maxLogoH = 48;
      const scale = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height);
      const lw = logoImg.width * scale;
      const lh = logoImg.height * scale;
      ctx.drawImage(logoImg, width / 2 - lw / 2, headerY - 15, lw, lh);
    } else {
      ctx.fillStyle = frame.textColor || '#1C1917';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(branding.name || 'Memories • موميريز', width / 2, headerY + 10);
    }

    if (frame.badgeText) {
      ctx.fillStyle = frame.accentColor || '#D97706';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(frame.badgeText.toUpperCase(), width / 2, headerY + 36);
    }

    // 5. Draw Corner Emojis/Stickers
    if (frame.cornerEmojis && frame.cornerEmojis.enabled) {
      ctx.font = '36px sans-serif';
      // Top-Right emoji
      if (frame.cornerEmojis.topRight) {
        ctx.textAlign = 'right';
        ctx.fillText(frame.cornerEmojis.topRight, width - 28, 55);
      }
      // Bottom-Left emoji
      if (frame.cornerEmojis.bottomLeft) {
        ctx.textAlign = 'left';
        ctx.fillText(frame.cornerEmojis.bottomLeft, 28, height - 35);
      }
    }

    // 6. Draw Photos in Grid or Strip
    const photoAreaTop = 100;
    const photoAreaBottom = height - 120;
    const photoAreaHeight = photoAreaBottom - photoAreaTop;
    const count = loadedImages.length;

    if (!isHorizontal) {
      // Classic Vertical Strip
      const gap = 16;
      const totalGap = gap * (count - 1);
      const photoH = (photoAreaHeight - totalGap) / count;
      const photoW = width - 64;
      const photoX = 32;

      loadedImages.forEach((img, idx) => {
        const photoY = photoAreaTop + idx * (photoH + gap);

        // Draw photo with rounded corners
        ctx.save();
        this.roundRect(ctx, photoX, photoY, photoW, photoH, 12);
        ctx.clip();
        this.drawCoverImage(ctx, img, photoX, photoY, photoW, photoH);
        ctx.restore();

        // Photo border
        ctx.strokeStyle = frame.borderColor || '#E7E2D9';
        ctx.lineWidth = 2;
        this.roundRect(ctx, photoX, photoY, photoW, photoH, 12);
        ctx.stroke();
      });
    } else {
      // Horizontal / Grid Format
      const cols = count >= 4 ? 2 : count;
      const rows = Math.ceil(count / cols);
      const gap = 16;
      const photoW = (width - 64 - gap * (cols - 1)) / cols;
      const photoH = (photoAreaHeight - gap * (rows - 1)) / rows;

      loadedImages.forEach((img, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        const photoX = 32 + c * (photoW + gap);
        const photoY = photoAreaTop + r * (photoH + gap);

        ctx.save();
        this.roundRect(ctx, photoX, photoY, photoW, photoH, 12);
        ctx.clip();
        this.drawCoverImage(ctx, img, photoX, photoY, photoW, photoH);
        ctx.restore();

        ctx.strokeStyle = frame.borderColor || '#E7E2D9';
        ctx.lineWidth = 2;
        this.roundRect(ctx, photoX, photoY, photoW, photoH, 12);
        ctx.stroke();
      });
    }

    // 7. Draw Footer (Date, Gift Voucher, Barcode)
    const footerY = height - 70;
    ctx.textAlign = 'center';

    // Gift Voucher Badge
    ctx.fillStyle = frame.accentColor || '#D97706';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`🎁 هدية فورية: ${giftCode}`, width / 2, footerY);

    // Formatted date
    const dateStr = new Date(timestamp).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    ctx.fillStyle = frame.textColor || '#1C1917';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${dateStr} • Memories`, width / 2, footerY + 22);

    // Barcode lines simulation
    this.drawBarcode(ctx, width / 2 - 90, footerY + 34, 180, 16, frame.textColor || '#1C1917');

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

  private static drawBarcode(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
  ) {
    ctx.fillStyle = color;
    let currX = x;
    const endX = x + w;
    let isBar = true;

    while (currX < endX) {
      const barW = Math.random() > 0.6 ? 3 : 1.5;
      if (isBar) {
        ctx.fillRect(currX, y, Math.min(barW, endX - currX), h);
      }
      currX += barW + (Math.random() > 0.5 ? 2 : 1);
      isBar = !isBar;
    }
  }
}
