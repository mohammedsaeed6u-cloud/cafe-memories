/**
 * Card Canvas Export Service
 * 
 * High-resolution client-side canvas rendering engine for digital loyalty cards.
 * Generates crisp 2x retina PNG images suitable for saving to camera roll (1:1 Apple Wallet fidelity)
 * or native device sharing via navigator.share.
 * Also generates authentic strip.png images for Apple Wallet storeCard passes.
 */

import { ImageSaveService } from './image-save.service';
import { reportIgnoredError } from './diagnostics';

export interface CardExportOptions {
  customerName: string;
  cafeName: string;
  stampsCount: number;
  totalSlots: number;
  theme?: 'espresso_pass' | 'minimal_kraft' | 'neon_cyber_latte' | 'botanical_matcha' | string;
  profession?: string;
  qrCodeDataUrl?: string;
  qrTargetUrl?: string;
  giftTitle?: string;
  stampIcon?: string;
  cafeLogoUrl?: string;
  backgroundColor?: string;
  cardBackgroundUrl?: string;
  format?: 'apple_wallet' | 'landscape';
}

export interface StripImageOptions {
  stampsCount: number;
  totalSlots: number;
  stampIcon?: string;
  giftTitle?: string;
  cafeName?: string;
  backgroundColor?: string;
  cardBackgroundUrl?: string;
}

interface ThemePalette {
  background: string;
  cardBorder: string;
  titleColor: string;
  textColor: string;
  accentColor: string;
  slotBg: string;
  slotBorder: string;
  slotActiveBg: string;
  slotActiveBorder: string;
}

const THEME_PALETTES: Record<string, ThemePalette> = {
  atelier_nostalgia: {
    background: '#141212',
    cardBorder: 'rgba(201, 42, 84, 0.45)',
    titleColor: '#FBF9F5',
    textColor: '#A19E9B',
    accentColor: '#c92a54',
    slotBg: '#1C1B1B',
    slotBorder: 'rgba(255, 255, 255, 0.12)',
    slotActiveBg: '#c92a54',
    slotActiveBorder: '#e14974',
  },
  luxury_glass_cherry: {
    background: '#08080B',
    cardBorder: 'rgba(255, 255, 255, 0.22)',
    titleColor: '#FFFFFF',
    textColor: '#D9D9D9',
    accentColor: '#c92a54',
    slotBg: '#120909',
    slotBorder: '#98183c',
    slotActiveBg: '#c92a54',
    slotActiveBorder: '#FF2A28',
  },
  espresso_pass: {
    background: '#1C130D',
    cardBorder: '#C59A6F',
    titleColor: '#F5EBE1',
    textColor: '#A89F91',
    accentColor: '#C59A6F',
    slotBg: '#2A1D15',
    slotBorder: '#4A3525',
    slotActiveBg: '#C59A6F',
    slotActiveBorder: '#E5BA8F',
  },
  minimal_kraft: {
    background: '#F4ECE4',
    cardBorder: '#8C7A6B',
    titleColor: '#2C1E14',
    textColor: '#5C4A3E',
    accentColor: '#8C7A6B',
    slotBg: '#E8DDD3',
    slotBorder: '#C5B5A5',
    slotActiveBg: '#2C1E14',
    slotActiveBorder: '#1C130D',
  },
  neon_cyber_latte: {
    background: '#0B0E14',
    cardBorder: '#00F0FF',
    titleColor: '#FFFFFF',
    textColor: '#708298',
    accentColor: '#FFB800',
    slotBg: '#151B26',
    slotBorder: '#232D3F',
    slotActiveBg: '#00F0FF',
    slotActiveBorder: '#80F8FF',
  },
  botanical_matcha: {
    background: '#24332C',
    cardBorder: '#88A788',
    titleColor: '#F0F5F1',
    textColor: '#A0B8A6',
    accentColor: '#88A788',
    slotBg: '#2E4239',
    slotBorder: '#3F594D',
    slotActiveBg: '#88A788',
    slotActiveBorder: '#A6C2A6',
  },
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

function escapeSvg(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class CardCanvasExportService {
  /**
   * Builds an SVG string for the Apple Wallet storeCard strip image.
   */
  public static buildStripSvg(options: StripImageOptions): string {
    const width = 1125;
    const height = 369;
    const slots = Math.max(options.totalSlots || 5, 1);
    const active = Math.min(Math.max(options.stampsCount || 0, 0), slots);
    const remaining = Math.max(slots - active, 0);
    const isCompleted = active >= slots;
    const icon = escapeSvg(options.stampIcon || '⭐');
    const bgColor = escapeSvg(options.backgroundColor || '#1C1C1E');
    const safeBgUrl = options.cardBackgroundUrl ? escapeSvg(options.cardBackgroundUrl) : '';

    // Responsive slot sizing and positioning
    const gap = slots <= 5 ? 20 : 14;
    const paddingX = slots <= 5 ? 60 : 40;
    const totalGaps = (slots - 1) * gap;
    const availableW = width - (paddingX * 2);
    const slotW = Math.min(170, Math.floor((availableW - totalGaps) / slots));
    const slotH = 152;
    const startX = Math.floor((width - (slots * slotW + totalGaps)) / 2);
    const startY = 118;

    let slotsSvg = '';
    for (let i = 0; i < slots; i++) {
      const x = startX + i * (slotW + gap);
      const isStamped = i < active;
      const isReward = i === slots - 1;

      if (isStamped) {
        slotsSvg += `
          <g transform="translate(${x}, ${startY})">
            <rect width="${slotW}" height="${slotH}" rx="24" fill="url(#goldGrad)" stroke="#FDE68A" stroke-width="3" filter="url(#goldGlow)"/>
            <text x="${slotW / 2}" y="${slotH / 2 - 4}" font-size="${slotW > 140 ? 54 : 44}" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${icon}</text>
            <text x="${slotW / 2}" y="${slotH - 22}" font-size="${slotW > 140 ? 19 : 16}" text-anchor="middle" fill="#18181B" font-weight="900" font-family="Segoe UI, -apple-system, system-ui, sans-serif">ختم #${i + 1}</text>
            <circle cx="${slotW - 15}" cy="15" r="15" fill="#18181B" stroke="#FDE68A" stroke-width="2.5"/>
            <text x="${slotW - 15}" y="21" font-size="16" text-anchor="middle" fill="#FCD34D" font-weight="900" font-family="Segoe UI, sans-serif">✓</text>
          </g>
        `;
      } else if (isReward) {
        slotsSvg += `
          <g transform="translate(${x}, ${startY})">
            <rect width="${slotW}" height="${slotH}" rx="24" fill="rgba(245, 158, 11, 0.12)" stroke="#F59E0B" stroke-width="3.5" stroke-dasharray="10,8"/>
            <text x="${slotW / 2}" y="${slotH / 2 - 4}" font-size="${slotW > 140 ? 50 : 40}" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">🎁</text>
            <text x="${slotW / 2}" y="${slotH - 22}" font-size="${slotW > 140 ? 19 : 16}" text-anchor="middle" fill="#FCD34D" font-weight="bold" font-family="Segoe UI, -apple-system, system-ui, sans-serif">الهدية</text>
          </g>
        `;
      } else {
        slotsSvg += `
          <g transform="translate(${x}, ${startY})">
            <rect width="${slotW}" height="${slotH}" rx="24" fill="rgba(255, 255, 255, 0.06)" stroke="rgba(255, 255, 255, 0.16)" stroke-width="2"/>
            <text x="${slotW / 2}" y="${slotH / 2 + 8}" font-size="${slotW > 140 ? 36 : 28}" text-anchor="middle" fill="rgba(255, 255, 255, 0.45)" font-family="monospace" font-weight="bold">#${i + 1}</text>
            <circle cx="${slotW / 2}" cy="${slotH - 26}" r="4" fill="rgba(255, 255, 255, 0.22)"/>
          </g>
        `;
      }
    }

    const progressPercent = Math.min(100, Math.round((active / slots) * 100));
    const progressW = Math.max(14, Math.round((width - 160) * (progressPercent / 100)));

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${bgColor}"/>
            <stop offset="100%" stop-color="#0E0E10"/>
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FCD34D"/>
            <stop offset="40%" stop-color="#F59E0B"/>
            <stop offset="100%" stop-color="#D97706"/>
          </linearGradient>
          <filter id="goldGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="rgba(245, 158, 11, 0.45)"/>
          </filter>
        </defs>

        <clipPath id="stripClip">
          <rect width="${width}" height="${height}" rx="32"/>
        </clipPath>
        <g clip-path="url(#stripClip)">
          <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
          ${safeBgUrl ? `<image href="${safeBgUrl}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="0.45"/>` : ''}
          <rect width="${width}" height="${height}" fill="rgba(0, 0, 0, 0.35)"/>
        </g>
        <rect width="${width}" height="${height}" rx="32" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2.5"/>

        <rect x="50" y="22" width="${width - 100}" height="70" rx="22" fill="rgba(0, 0, 0, 0.6)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5"/>

        <text x="${width - 85}" y="66" font-size="28" font-weight="bold" fill="#FFFFFF" text-anchor="end" font-family="Segoe UI, -apple-system, system-ui, sans-serif">سجل أختامك التراكمية</text>

        <rect x="${width - 440}" y="38" width="115" height="38" rx="19" fill="rgba(245, 158, 11, 0.2)" stroke="rgba(245, 158, 11, 0.45)" stroke-width="1.5"/>
        <text x="${width - 382}" y="63" font-size="20" font-weight="bold" fill="#FDE68A" text-anchor="middle" font-family="monospace, sans-serif">${active} / ${slots}</text>

        <text x="85" y="66" font-size="24" font-weight="bold" fill="#FCD34D" text-anchor="start" font-family="Segoe UI, -apple-system, system-ui, sans-serif">
          ${isCompleted ? '🎉 هديتك جاهزة للاستلام!' : `متبقي ${remaining} أختام للهدية 🎁`}
        </text>

        ${slotsSvg}

        <rect x="80" y="306" width="${width - 160}" height="14" rx="7" fill="rgba(255, 255, 255, 0.12)"/>
        <rect x="80" y="306" width="${progressW}" height="14" rx="7" fill="url(#goldGrad)"/>
      </svg>
    `;
  }

  /**
   * Generates a 1125x369 PNG strip image for Apple Wallet storeCard passes.
   * Works in both browser (canvas) and server/node environments (sharp).
   */
  public static async generateAppleWalletStripImage(options: StripImageOptions): Promise<string> {
    if (typeof document === 'undefined') {
      try {
        const getModule = (globalThis as any)['require'];
        if (!getModule) throw new Error('Not node');
        const sharp = getModule('sharp');
        const svg = this.buildStripSvg(options);
        const buf = await sharp(Buffer.from(svg)).png().toBuffer();
        return `data:image/png;base64,${buf.toString('base64')}`;
      } catch {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      }
    }

    const width = 1125;
    const height = 369;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }

    // High-fidelity vector rasterization in browser via SVG Image
    const svg = this.buildStripSvg(options);
    try {
      if (typeof Image !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const blobUrl = URL.createObjectURL(svgBlob);
        const img = new Image();
        const loaded = await new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = blobUrl;
        });
        if (loaded) {
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(blobUrl);
          return canvas.toDataURL('image/png');
        }
        URL.revokeObjectURL(blobUrl);
      }
    } catch {
      // Proceed to canvas fallback
    }

    const slots = Math.max(options.totalSlots || 5, 1);
    const active = Math.min(Math.max(options.stampsCount || 0, 0), slots);
    const remaining = Math.max(slots - active, 0);
    const isCompleted = active >= slots;
    const icon = options.stampIcon || '📸';
    const bgColor = options.backgroundColor || '#1C1C1E';

    // Background
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, 0, 0, width, height, 32);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.stroke();
    ctx.restore();

    // Top Header Ribbon
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, 40, 24, width - 80, 64, 20);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('سجل أختامك التراكمية', width - 70, 66);

    ctx.fillStyle = '#FCD34D';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `${active} من ${slots} أختام · ${isCompleted ? '🎉 هديتك جاهزة للاستلام!' : 'متبقي ' + remaining + ' أختام للهدية 🎁'}`,
      70,
      66
    );
    ctx.restore();

    // Slots
    const slotW = Math.min(105, Math.floor((width - 160 - (slots - 1) * 24) / slots));
    const startX = Math.floor((width - (slots * slotW + (slots - 1) * 24)) / 2);
    const startY = 120;

    for (let i = 0; i < slots; i++) {
      const x = startX + i * (slotW + 24);
      const isStamped = i < active;
      const isReward = i === slots - 1;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + slotW / 2, startY + slotW / 2, slotW / 2, 0, Math.PI * 2);

      if (isStamped) {
        ctx.fillStyle = '#F59E0B';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FDE68A';
        ctx.stroke();

        ctx.fillStyle = '#18181B';
        ctx.font = '40px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x + slotW / 2, startY + slotW / 2);

        // Checkmark badge
        ctx.beginPath();
        ctx.arc(x + slotW - 8, startY + 10, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#18181B';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FCD34D';
        ctx.stroke();

        ctx.fillStyle = '#FCD34D';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', x + slotW - 8, startY + 10);
      } else if (isReward) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#F59E0B';
        ctx.stroke();

        ctx.font = '38px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎁', x + slotW / 2, startY + slotW / 2 - 4);

        ctx.fillStyle = '#FCD34D';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('الهدية', x + slotW / 2, startY + slotW + 24);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${i + 1}`, x + slotW / 2, startY + slotW / 2);
      }
      ctx.restore();
    }

    // Progress bar
    const progressPercent = Math.min(100, Math.round((active / slots) * 100));
    const progressW = Math.round((width - 160) * (progressPercent / 100));

    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, 80, 315, width - 160, 12, 6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();

    if (progressW > 0) {
      ctx.beginPath();
      drawRoundedRect(ctx, 80, 315, progressW, 12, 6);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
    }
    ctx.restore();

    return canvas.toDataURL('image/png');
  }

  /**
   * Render the digital loyalty card onto an HTML5 Canvas and return PNG data URL.
   * If format === 'apple_wallet', renders the exact vertical Apple Wallet pass (800x1320 px).
   * Otherwise renders standard horizontal card (1200x750 px).
   */
  static async exportCardToDataUrl(options: CardExportOptions): Promise<string> {
    if (typeof document === 'undefined') {
      // Server-side fallback
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }

    // If QR code is not pre-rendered but target URL exists, generate it
    if (!options.qrCodeDataUrl && options.qrTargetUrl) {
      try {
        const QRCode = await import('qrcode');
        options.qrCodeDataUrl = await QRCode.default.toDataURL(options.qrTargetUrl, {
          margin: 1,
          width: 320,
          color: { dark: '#141212', light: '#FFFFFF' },
        });
      } catch (err) {
        reportIgnoredError('canvas-export/qrcode', err);
      }
    }

    const isAppleWalletVertical = options.format === 'apple_wallet';

    // 1. VERTICAL APPLE WALLET CARD RENDERING (1:1 FIDELITY WITH APPLE WALLET PASS FACE)
    if (isAppleWalletVertical) {
      const width = 800;
      const height = 1320;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');

      const bgColor = options.backgroundColor || '#1C1C1E';
      const stampsCount = Math.max(options.stampsCount || 0, 0);
      const totalSlots = Math.max(options.totalSlots || 5, 1);
      const activeStamps = Math.min(stampsCount, totalSlots);
      const remaining = Math.max(totalSlots - activeStamps, 0);
      const isCompleted = activeStamps >= totalSlots;
      const stampIcon = options.stampIcon || '📸';
      const cafeName = options.cafeName || 'Stampy';
      const giftTitle = options.giftTitle || 'هدية الزيارة أو خصم ترحيبي';
      const customerName = options.customerName || 'ضيف مميز';
      const profession = options.profession || 'عضو مميز';

      // 1. Card Base Background & Outer Shadow/Border
      const cardX = 30;
      const cardY = 30;
      const cardW = width - 60;
      const cardH = height - 60;
      const cardRadius = 36;

      ctx.save();
      ctx.beginPath();
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
      ctx.fillStyle = bgColor;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.stroke();

      // Top Inner Highlight
      ctx.beginPath();
      drawRoundedRect(ctx, cardX + 2, cardY + 2, cardW - 4, 180, cardRadius - 2);
      const topGrad = ctx.createLinearGradient(0, cardY, 0, cardY + 180);
      topGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      topGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = topGrad;
      ctx.fill();
      ctx.restore();

      // 2. Header Row: Store Name & Stamps Counter
      ctx.save();
      // Store Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(cafeName, cardX + 40, cardY + 65);

      // Stamps Counter
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('الأختام', cardX + cardW - 40, cardY + 50);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px monospace';
      ctx.fillText(`${activeStamps}/${totalSlots} ${stampIcon}`, cardX + cardW - 40, cardY + 85);
      ctx.restore();

      // 3. Primary Field: "المكافأة القادمة"
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(isCompleted ? 'المكافأة جاهزة للاستلام' : 'المكافأة القادمة', cardX + cardW - 40, cardY + 140);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(giftTitle, cardX + cardW - 40, cardY + 185);
      ctx.restore();

      // 4. Secondary Fields Row: Customer Name & Member Tier
      ctx.save();
      // Customer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('العميل', cardX + cardW - 40, cardY + 235);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(customerName, cardX + cardW - 40, cardY + 268);

      // Tier
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('الفئة', cardX + 40, cardY + 235);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(profession, cardX + 40, cardY + 268);
      ctx.restore();

      // 5. Signature Stamp Slots Grid Container
      const gridBoxX = cardX + 24;
      const gridBoxY = cardY + 300;
      const gridBoxW = cardW - 48;
      const gridBoxH = 280;

      ctx.save();
      ctx.beginPath();
      drawRoundedRect(ctx, gridBoxX, gridBoxY, gridBoxW, gridBoxH, 24);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      // Container Header
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('سجل أختامك التراكمية', gridBoxX + gridBoxW - 24, gridBoxY + 38);

      ctx.fillStyle = '#FCD34D';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        isCompleted ? '🎉 هديتك جاهزة للاستلام!' : `متبقي ${remaining} أختام للهدية 🎁`,
        gridBoxX + 24,
        gridBoxY + 38
      );

      // Stamp Slots
      const slotGap = 16;
      const cols = totalSlots <= 5 ? totalSlots : Math.ceil(totalSlots / 2);
      const slotSize = Math.min(84, Math.floor((gridBoxW - 48 - (cols - 1) * slotGap) / cols));
      const slotsStartX = gridBoxX + Math.floor((gridBoxW - (cols * slotSize + (cols - 1) * slotGap)) / 2);
      const slotsStartY = gridBoxY + 60;

      for (let i = 0; i < totalSlots; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = slotsStartX + col * (slotSize + slotGap);
        const y = slotsStartY + row * (slotSize + slotGap);
        const isStamped = i < activeStamps;
        const isReward = i === totalSlots - 1;

        ctx.beginPath();
        ctx.arc(x + slotSize / 2, y + slotSize / 2, slotSize / 2, 0, Math.PI * 2);

        if (isStamped) {
          ctx.fillStyle = '#F59E0B';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#FDE68A';
          ctx.stroke();

          ctx.fillStyle = '#18181B';
          ctx.font = `${Math.floor(slotSize * 0.45)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stampIcon, x + slotSize / 2, y + slotSize / 2);

          // Checkmark
          ctx.beginPath();
          ctx.arc(x + slotSize - 6, y + 8, 10, 0, Math.PI * 2);
          ctx.fillStyle = '#18181B';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#FCD34D';
          ctx.stroke();

          ctx.fillStyle = '#FCD34D';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('✓', x + slotSize - 6, y + 8);
        } else if (isReward) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#F59E0B';
          ctx.stroke();

          ctx.font = `${Math.floor(slotSize * 0.45)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🎁', x + slotSize / 2, y + slotSize / 2 - 2);
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.font = `bold ${Math.floor(slotSize * 0.32)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`#${i + 1}`, x + slotSize / 2, y + slotSize / 2);
        }
      }

      // Progress Track
      const progressPercent = Math.min(100, Math.round((activeStamps / totalSlots) * 100));
      const progTrackW = gridBoxW - 48;
      const progW = Math.round(progTrackW * (progressPercent / 100));

      ctx.beginPath();
      drawRoundedRect(ctx, gridBoxX + 24, gridBoxY + gridBoxH - 22, progTrackW, 8, 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fill();

      if (progW > 0) {
        ctx.beginPath();
        drawRoundedRect(ctx, gridBoxX + 24, gridBoxY + gridBoxH - 22, progW, 8, 4);
        ctx.fillStyle = '#F59E0B';
        ctx.fill();
      }
      ctx.restore();

      // 6. Signature White Barcode Box (Apple Wallet QR Container)
      const qrBoxW = 460;
      const qrBoxH = 460;
      const qrBoxX = Math.floor((width - qrBoxW) / 2);
      const qrBoxY = cardY + 605;

      ctx.save();
      ctx.beginPath();
      drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 28);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.stroke();

      // Render QR Code if available
      if (options.qrCodeDataUrl) {
        try {
          const qrImg = await new Promise<HTMLImageElement | null>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = options.qrCodeDataUrl!;
          });
          if (qrImg) {
            ctx.drawImage(qrImg, qrBoxX + 60, qrBoxY + 35, 340, 340);
          }
        } catch (err) {
          reportIgnoredError('canvas-export/draw_qr', err);
        }
      }

      // Barcode Alt Text
      ctx.fillStyle = '#18181B';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('امسح عند الكاشير للختم الفوري', qrBoxX + qrBoxW / 2, qrBoxY + 415);
      ctx.restore();

      // 7. Footer: Apple Wallet Pass Badge
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(cardX + 40, cardY + cardH - 65, cardW - 80, 1);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('APPLE WALLET PASS', cardX + cardW - 40, cardY + cardH - 30);

      ctx.textAlign = 'left';
      ctx.fillText('MEMORIES VIP LOYALTY', cardX + 40, cardY + cardH - 30);
      ctx.restore();

      return canvas.toDataURL('image/png');
    }

    // 2. STANDARD HORIZONTAL RETINA CARD (1200x750 px - Preserves backward compatibility)
    const width = 1200;
    const height = 750;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    const themeKey = options.theme && THEME_PALETTES[options.theme] ? options.theme : 'atelier_nostalgia';
    const palette = THEME_PALETTES[themeKey];

    // Card Background
    const radius = 32;
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, 0, 0, width, height, radius);
    ctx.fillStyle = palette.background;
    ctx.fill();

    // Border
    ctx.lineWidth = 4;
    ctx.strokeStyle = palette.cardBorder;
    ctx.stroke();
    ctx.restore();

    // Subtle Luxury Grain / Inner Glow
    ctx.save();
    ctx.beginPath();
    drawRoundedRect(ctx, 8, 8, width - 16, height - 16, radius - 4);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `${palette.cardBorder}44`;
    ctx.stroke();
    ctx.restore();

    // Header: Cafe Name & Brand Star
    ctx.save();
    ctx.fillStyle = palette.titleColor;
    ctx.font = 'bold 44px "Cinzel", "Playfair Display", serif, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(options.cafeName || 'Memories Café', 60, 90);

    // Customer Identity
    ctx.fillStyle = palette.textColor;
    ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('بطاقة ولاء مميزة · VIP PASS', 60, 130);

    ctx.fillStyle = palette.titleColor;
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(options.customerName || 'ضيف مميز', 60, 185);

    if (options.profession) {
      ctx.fillStyle = palette.accentColor;
      ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(options.profession, 60, 220);
    }
    ctx.restore();

    // Stamp Slots Grid
    const totalSlots = Math.max(options.totalSlots || 10, 4);
    const activeStamps = Math.min(Math.max(options.stampsCount || 0, 0), totalSlots);

    const cols = totalSlots <= 6 ? totalSlots : Math.ceil(totalSlots / 2);

    const startX = 60;
    const startY = options.profession ? 270 : 250;
    const availableWidth = width - 120;
    const slotGap = 20;
    const slotSize = Math.min(90, Math.floor((availableWidth - (cols - 1) * slotGap) / cols));

    for (let i = 0; i < totalSlots; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (slotSize + slotGap);
      const y = startY + row * (slotSize + slotGap);
      const isActive = i < activeStamps;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + slotSize / 2, y + slotSize / 2, slotSize / 2, 0, Math.PI * 2);

      if (isActive) {
        ctx.fillStyle = palette.slotActiveBg;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = palette.slotActiveBorder;
        ctx.stroke();

        ctx.fillStyle = palette.background;
        ctx.font = `bold ${Math.floor(slotSize * 0.45)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', x + slotSize / 2, y + slotSize / 2);
      } else {
        ctx.fillStyle = palette.slotBg;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = palette.slotBorder;
        ctx.stroke();

        ctx.fillStyle = palette.textColor;
        ctx.font = `500 ${Math.floor(slotSize * 0.35)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${i + 1}`, x + slotSize / 2, y + slotSize / 2);
      }
      ctx.restore();
    }

    // Optional Scannable QR Code on top-right of the card
    if (options.qrCodeDataUrl) {
      try {
        const qrImg = await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = options.qrCodeDataUrl!;
        });
        if (qrImg) {
          const qrBoxSize = 150;
          const qrX = width - qrBoxSize - 60;
          const qrY = 50;

          ctx.save();
          ctx.beginPath();
          drawRoundedRect(ctx, qrX, qrY, qrBoxSize, qrBoxSize + 24, 16);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = palette.cardBorder;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.drawImage(qrImg, qrX + 10, qrY + 10, qrBoxSize - 20, qrBoxSize - 20);

          ctx.fillStyle = '#1C130D';
          ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('امسح للختم الفوري', qrX + qrBoxSize / 2, qrY + qrBoxSize + 15);
          ctx.restore();
        }
      } catch (err) {
        reportIgnoredError('canvas-export/horizontal_qr', err);
      }
    }

    // Footer Counter Badge
    ctx.save();
    const footerY = height - 70;
    ctx.fillStyle = palette.textColor;
    ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${activeStamps} من ${totalSlots} أختام مكتملة`, 60, footerY);

    if (activeStamps >= totalSlots) {
      ctx.fillStyle = palette.accentColor;
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('هديتك القادمة مجانية من المنشأة', 60, footerY + 32);
    } else {
      const remaining = totalSlots - activeStamps;
      ctx.fillText(`متبقي ${remaining} ${remaining === 1 ? 'ختم' : 'أختام'} للمكافأة`, 60, footerY + 32);
    }

    // Watermark
    ctx.fillStyle = `${palette.textColor}66`;
    ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Powered by Memories Studio • Experience & Loyalty', width - 60, height - 40);
    ctx.restore();

    return canvas.toDataURL('image/png');
  }

  /**
   * Trigger native browser image download.
   */
  static downloadCardImage(dataUrl: string, filename: string = 'memories-loyalty-card.png'): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Native device share sheet or download fallback with Safari iOS support.
   */
  static async shareCardImage(dataUrl: string, title: string = 'كارت ولاء الذكريات'): Promise<boolean> {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const res = await ImageSaveService.saveImage({
          dataUrl,
          filename: 'memories-loyalty-card.png',
          title,
          text: 'كارت الولاء الرقمي الخاص بي ✨',
        });
        if (res.success && res.method === 'share') {
          return true;
        }
      } catch {
        // Fall back to direct download
      }
    }

    this.downloadCardImage(dataUrl);
    return true;
  }
}
