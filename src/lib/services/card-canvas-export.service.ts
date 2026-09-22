/**
 * Card Canvas Export Service
 * 
 * High-resolution client-side canvas rendering engine for digital loyalty cards.
 * Generates crisp 2x retina PNG images suitable for saving to camera roll
 * or native device sharing via navigator.share.
 */

export interface CardExportOptions {
  customerName: string;
  cafeName: string;
  stampsCount: number;
  totalSlots: number;
  theme?: 'espresso_pass' | 'minimal_kraft' | 'neon_cyber_latte' | 'botanical_matcha' | string;
  profession?: string;
  qrCodeDataUrl?: string;
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

export class CardCanvasExportService {
  /**
   * Render the digital loyalty card onto an HTML5 Canvas and return PNG data URL.
   */
  static async exportCardToDataUrl(options: CardExportOptions): Promise<string> {
    if (typeof document === 'undefined') {
      // Server-side fallback
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }

    const width = 1200;
    const height = 750;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    const themeKey = options.theme && THEME_PALETTES[options.theme] ? options.theme : 'espresso_pass';
    const palette = THEME_PALETTES[themeKey];

    // Card Background
    const radius = 32;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
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
    ctx.roundRect(8, 8, width - 16, height - 16, radius - 4);
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

    ctx.fillStyle = palette.accentColor;
    ctx.font = '32px serif';
    ctx.fillText('✦', 60 + ctx.measureText(options.cafeName || 'Memories Café').width + 16, 88);

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
    const rows = totalSlots <= 6 ? 1 : 2;

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

        // Active stamp icon (coffee cup or star)
        ctx.fillStyle = palette.background;
        ctx.font = `bold ${Math.floor(slotSize * 0.45)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☕', x + slotSize / 2, y + slotSize / 2);
      } else {
        ctx.fillStyle = palette.slotBg;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = palette.slotBorder;
        ctx.stroke();

        // Slot number
        ctx.fillStyle = palette.textColor;
        ctx.font = `500 ${Math.floor(slotSize * 0.35)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${i + 1}`, x + slotSize / 2, y + slotSize / 2);
      }
      ctx.restore();
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
      ctx.fillText('★ مبروك! قهوتك القادمة مجانية من الكافيه ★', 60, footerY + 32);
    } else {
      const remaining = totalSlots - activeStamps;
      ctx.fillText(`متبقي ${remaining} ${remaining === 1 ? 'ختم' : 'أختام'} للمكافأة`, 60, footerY + 32);
    }

    // Watermark
    ctx.fillStyle = `${palette.textColor}66`;
    ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Powered by Café Memories ✦ Photobooth & Loyalty', width - 60, height - 40);
    ctx.restore();

    return canvas.toDataURL('image/png');
  }

  /**
   * Trigger native browser image download.
   */
  static downloadCardImage(dataUrl: string, filename: string = 'cafe-loyalty-card.png'): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Native device share sheet or download fallback.
   */
  static async shareCardImage(dataUrl: string, title: string = 'كارت ولاء كافيه ميموريز'): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        // Convert data URL to Blob for sharing
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'cafe-loyalty-card.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title,
            text: 'كارت الولاء الرقمي الخاص بي في الكافيه ☕✨',
            files: [file],
          });
          return true;
        }
      } catch {
        // Fall back to download
      }
    }

    // Fallback to direct download
    this.downloadCardImage(dataUrl);
    return true;
  }
}
