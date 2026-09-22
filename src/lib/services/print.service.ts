/**
 * High-Precision Business Printing Engine
 * 
 * Calibrated with 100% precision for:
 * 1. Standard 2x6 in (50.8 x 152.4 mm) Photobooth Strip at high resolution (300 DPI: 600 x 1800 px).
 * 2. Dual-strip 4x6 in layout (two 2x6 strips printed side-by-side with a subtle dashed cut line).
 * 3. Thermal Sticker Printer mode (80mm and 58mm roll widths with high contrast styling).
 * 4. Exact @page and @media print CSS rules eliminating all browser margins, headers, and footers.
 */

export type PrintFormat =
  | 'standard-2x6'
  | 'dual-4x6'
  | 'thermal-80mm'
  | 'thermal-58mm';

export interface PrintDimensions {
  format: PrintFormat;
  nameAr: string;
  nameEn: string;
  widthMm: number;
  heightMm: number;
  widthInches: number;
  heightInches: number;
  widthPx300Dpi: number;
  heightPx300Dpi: number;
  aspectRatio: number;
  isDualStrip: boolean;
  isThermal: boolean;
  rollWidthMm?: number;
}

export interface PrintCSSOptions {
  format?: PrintFormat | string;
  highContrast?: boolean;
  showCutLine?: boolean;
  cutLineStyle?: 'dashed' | 'dotted' | 'solid';
}

export interface PrintJobOptions {
  format?: PrintFormat | string;
  secondStripUrl?: string;
  highContrast?: boolean;
  showCutLine?: boolean;
  cutLineStyle?: 'dashed' | 'dotted' | 'solid';
  title?: string;
}

export function normalizePrintFormat(raw?: string): PrintFormat {
  if (!raw) return 'standard-2x6';
  const str = raw.toLowerCase().trim();
  if (
    str === 'dual-4x6' ||
    str === '4x6' ||
    str === 'grid_4x6' ||
    str.includes('dual') ||
    str.includes('مزدوج')
  ) {
    return 'dual-4x6';
  }
  if (
    str === 'thermal-80mm' ||
    str === 'thermal-80' ||
    str === '80mm' ||
    str === '80' ||
    str.includes('80')
  ) {
    return 'thermal-80mm';
  }
  if (
    str === 'thermal-58mm' ||
    str === 'thermal-58' ||
    str === '58mm' ||
    str === '58' ||
    str.includes('58')
  ) {
    return 'thermal-58mm';
  }
  if (str.includes('thermal') || str.includes('حرار')) {
    return 'thermal-80mm';
  }
  return 'standard-2x6';
}

export function getPrintDimensions(rawFormat?: PrintFormat | string): PrintDimensions {
  const format = normalizePrintFormat(rawFormat);
  switch (format) {
    case 'standard-2x6':
      return {
        format: 'standard-2x6',
        nameAr: 'شريط فوتوبوث كلاسيكي (2×6 بوصة)',
        nameEn: 'Standard Photobooth Strip (2x6 in)',
        widthMm: 50.8,
        heightMm: 152.4,
        widthInches: 2,
        heightInches: 6,
        widthPx300Dpi: 600,
        heightPx300Dpi: 1800,
        aspectRatio: 2 / 6,
        isDualStrip: false,
        isThermal: false,
      };
    case 'dual-4x6':
      return {
        format: 'dual-4x6',
        nameAr: 'شريطان مزدوجان (4×6 بوصة مع خط قص)',
        nameEn: 'Dual Photobooth Strip (4x6 in)',
        widthMm: 101.6,
        heightMm: 152.4,
        widthInches: 4,
        heightInches: 6,
        widthPx300Dpi: 1200,
        heightPx300Dpi: 1800,
        aspectRatio: 4 / 6,
        isDualStrip: true,
        isThermal: false,
      };
    case 'thermal-80mm':
      return {
        format: 'thermal-80mm',
        nameAr: 'طابعة ملصقات وإيصالات حرارية (80 مم)',
        nameEn: 'Thermal Sticker/Receipt (80mm)',
        widthMm: 80,
        heightMm: 200,
        widthInches: 80 / 25.4,
        heightInches: 200 / 25.4,
        widthPx300Dpi: Math.round((80 / 25.4) * 300),
        heightPx300Dpi: Math.round((200 / 25.4) * 300),
        aspectRatio: 80 / 200,
        isDualStrip: false,
        isThermal: true,
        rollWidthMm: 80,
      };
    case 'thermal-58mm':
      return {
        format: 'thermal-58mm',
        nameAr: 'طابعة ملصقات حرارية مدمجة (58 مم)',
        nameEn: 'Compact Thermal Sticker (58mm)',
        widthMm: 58,
        heightMm: 150,
        widthInches: 58 / 25.4,
        heightInches: 150 / 25.4,
        widthPx300Dpi: Math.round((58 / 25.4) * 300),
        heightPx300Dpi: Math.round((150 / 25.4) * 300),
        aspectRatio: 58 / 150,
        isDualStrip: false,
        isThermal: true,
        rollWidthMm: 58,
      };
  }
}

export function generatePrintCSS(
  rawFormat?: PrintFormat | string,
  options: PrintCSSOptions = {}
): string {
  const format = normalizePrintFormat(rawFormat);
  const dims = getPrintDimensions(format);
  const isThermal = dims.isThermal || options.highContrast;
  const showCutLine = options.showCutLine ?? true;
  const cutLineStyle = options.cutLineStyle || 'dashed';

  let pageRule = '';
  if (format === 'standard-2x6') {
    pageRule = `@page { size: 50.8mm 152.4mm; margin: 0 !important; }`;
  } else if (format === 'dual-4x6') {
    pageRule = `@page { size: 101.6mm 152.4mm; margin: 0 !important; }`;
  } else if (format === 'thermal-80mm') {
    pageRule = `@page { size: 80mm auto; margin: 0 !important; }`;
  } else if (format === 'thermal-58mm') {
    pageRule = `@page { size: 58mm auto; margin: 0 !important; }`;
  }

  return `
    ${pageRule}

    @media print {
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
      }

      /* Eliminate all browser margins, headers, footers, and overflow */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .print-wrapper {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
        break-inside: avoid !important;
        break-after: avoid !important;
      }

      ${
        format === 'standard-2x6'
          ? `
      /* Standard 2x6 in (50.8 x 152.4 mm) Calibration */
      .standard-strip-box {
        width: 50.8mm !important;
        height: 152.4mm !important;
        margin: 0 auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      .standard-strip-box .strip-img {
        width: 50.8mm !important;
        height: 152.4mm !important;
        max-width: 100% !important;
        max-height: 100% !important;
        object-fit: contain !important;
        display: block !important;
        image-rendering: -webkit-optimize-contrast !important;
      }
      `
          : ''
      }

      ${
        format === 'dual-4x6'
          ? `
      /* Dual 4x6 in Layout: Two 2x6 strips side-by-side with subtle dashed cut line */
      .dual-strip-box {
        width: 101.6mm !important;
        height: 152.4mm !important;
        margin: 0 auto !important;
        display: flex !important;
        flex-direction: row !important;
        align-items: stretch !important;
        justify-content: space-between !important;
        position: relative !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      .dual-strip-column {
        width: 50.8mm !important;
        height: 152.4mm !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        overflow: hidden !important;
        position: relative !important;
        box-sizing: border-box !important;
      }

      .dual-strip-column .strip-img {
        width: 50.8mm !important;
        height: 152.4mm !important;
        max-width: 100% !important;
        max-height: 100% !important;
        object-fit: contain !important;
        display: block !important;
        image-rendering: -webkit-optimize-contrast !important;
      }

      /* Subtle dashed cut line between strips */
      .dual-cut-line {
        position: absolute !important;
        top: 0 !important;
        bottom: 0 !important;
        left: 50.8mm !important;
        width: 0 !important;
        border-left: 1px ${cutLineStyle} ${showCutLine ? '#a8a29e' : 'transparent'} !important;
        z-index: 20 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 6mm 0 !important;
        pointer-events: none !important;
      }

      .cut-indicator {
        font-size: 8px !important;
        line-height: 1 !important;
        color: #a8a29e !important;
        background: #ffffff !important;
        padding: 1px 2px !important;
        transform: translateX(-50%) !important;
      }
      `
          : ''
      }

      ${
        isThermal
          ? `
      /* Thermal Sticker Printer Mode: High contrast B&W styling */
      .thermal-strip-box {
        width: ${dims.widthMm}mm !important;
        margin: 0 auto !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      .thermal-strip-box .strip-img {
        width: 100% !important;
        height: auto !important;
        display: block !important;
        filter: grayscale(100%) contrast(160%) brightness(102%) !important;
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
        image-rendering: pixelated !important;
      }
      `
          : ''
      }

      .no-print {
        display: none !important;
      }
    }

    body {
      background-color: #f5f5f4;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
    }
  `;
}

export function generatePrintHTML(
  dataUrl: string,
  options: PrintJobOptions = {}
): string {
  const format = normalizePrintFormat(options.format);
  const dims = getPrintDimensions(format);
  const css = generatePrintCSS(format, {
    format,
    highContrast: options.highContrast,
    showCutLine: options.showCutLine,
    cutLineStyle: options.cutLineStyle,
  });

  const secondStrip = options.secondStripUrl || dataUrl;
  const title = options.title || `Memories Photobooth - ${dims.nameEn}`;

  let bodyContent = '';

  if (format === 'standard-2x6') {
    bodyContent = `
      <div class="print-wrapper">
        <div class="standard-strip-box">
          <img class="strip-img" id="target-strip" src="${dataUrl}" alt="Photobooth Strip 2x6" />
        </div>
      </div>
    `;
  } else if (format === 'dual-4x6') {
    bodyContent = `
      <div class="print-wrapper">
        <div class="dual-strip-box">
          <div class="dual-strip-column strip-left">
            <img class="strip-img" id="target-strip" src="${dataUrl}" alt="Photobooth Strip Left 2x6" />
          </div>
          <div class="dual-cut-line">
            <span class="cut-indicator-line"></span>
          </div>
          <div class="dual-strip-column strip-right">
            <img class="strip-img" src="${secondStrip}" alt="Photobooth Strip Right 2x6" />
          </div>
        </div>
      </div>
    `;
  } else {
    // Thermal modes (80mm / 58mm)
    bodyContent = `
      <div class="print-wrapper">
        <div class="thermal-strip-box">
          <img class="strip-img" id="target-strip" src="${dataUrl}" alt="Thermal Strip ${dims.widthMm}mm" />
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>${css}</style>
    </head>
    <body>
      ${bodyContent}
    </body>
    </html>
  `;
}

export class PrintService {
  /**
   * Calculates and returns calibrated physical print dimensions.
   */
  static getDimensions(format?: PrintFormat | string): PrintDimensions {
    return getPrintDimensions(format);
  }

  /**
   * Generates exact @page and @media print CSS rules eliminating margins, headers, and footers.
   */
  static generatePrintCSS(
    format?: PrintFormat | string,
    options?: PrintCSSOptions
  ): string {
    return generatePrintCSS(format, options);
  }

  /**
   * Generates complete, calibrated standalone HTML ready for browser iframe printing.
   */
  static generatePrintHTML(
    dataUrl: string,
    options?: PrintJobOptions
  ): string {
    return generatePrintHTML(dataUrl, options);
  }

  /**
   * Prints a high-resolution photobooth strip image directly.
   * Backward compatible with printStripImage(dataUrl) and extensible with options.
   */
  static printStripImage(
    dataUrl: string,
    options?: PrintJobOptions | PrintFormat
  ): void {
    if (typeof window === 'undefined' || !dataUrl) return;

    const opts: PrintJobOptions =
      typeof options === 'string'
        ? { format: options }
        : options || { format: 'standard-2x6' };

    const html = this.generatePrintHTML(dataUrl, opts);
    this.executeIframePrint(html);
  }

  /**
   * Prints dual 2x6 strips side-by-side on standard 4x6 photo paper with a center cut line.
   */
  static printDualStrip(
    dataUrl: string,
    secondDataUrl?: string,
    options?: Omit<PrintJobOptions, 'format'>
  ): void {
    this.printStripImage(dataUrl, {
      ...options,
      format: 'dual-4x6',
      secondStripUrl: secondDataUrl || dataUrl,
    });
  }

  /**
   * Prints to an 80mm or 58mm thermal sticker printer with high-contrast styling.
   */
  static printThermal(
    dataUrl: string,
    rollWidth: '80mm' | '58mm' = '80mm',
    options?: Omit<PrintJobOptions, 'format'>
  ): void {
    const format = rollWidth === '58mm' ? 'thermal-58mm' : 'thermal-80mm';
    this.printStripImage(dataUrl, {
      ...options,
      format,
      highContrast: true,
    });
  }

  /**
   * Fallback method to print a DOM element by ID using calibrated iframe isolation.
   */
  static printElement(
    elementId: string = 'printable-strip',
    options?: PrintJobOptions
  ): void {
    if (typeof window === 'undefined') return;

    const sourceEl = document.getElementById(elementId);
    if (!sourceEl) {
      window.print();
      return;
    }

    const format = normalizePrintFormat(options?.format);
    const css = this.generatePrintCSS(format, options);

    let stylesHtml = '';
    const styleSheets = document.querySelectorAll('link[rel="stylesheet"], style');
    styleSheets.forEach((node) => {
      stylesHtml += node.outerHTML;
    });

    const cloned = sourceEl.cloneNode(true) as HTMLElement;
    cloned.style.margin = '0 auto';
    cloned.style.boxShadow = 'none';
    cloned.style.transform = 'none';
    cloned.style.position = 'relative';

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>Memories Photobooth Strip</title>
        ${stylesHtml}
        <style>${css}</style>
      </head>
      <body>
        <div class="print-wrapper">
          <div class="standard-strip-box">
            ${cloned.outerHTML}
          </div>
        </div>
      </body>
      </html>
    `;

    this.executeIframePrint(html);
  }

  /**
   * Executes zero-margin print job via isolated hidden iframe.
   */
  private static executeIframePrint(html: string): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const existing = document.getElementById('memories-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'memories-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '800px';
    iframe.style.height = '1200px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      window.print();
      return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    const img = iframeDoc.getElementById('target-strip') as HTMLImageElement;
    const triggerPrint = () => {
      setTimeout(() => {
        try {
          const win = iframe.contentWindow;
          const cleanup = () => {
            setTimeout(() => {
              try {
                iframe.remove();
              } catch {}
            }, 1000);
          };
          if (win) {
            win.addEventListener('afterprint', cleanup);
            setTimeout(cleanup, 60000);
            win.focus();
            win.print();
          } else {
            iframe.remove();
          }
        } catch (err) {
          console.error('[PrintService] Print execution error', err);
          iframe.remove();
        }
      }, 250);
    };

    if (img && img.complete) {
      triggerPrint();
    } else if (img) {
      img.onload = triggerPrint;
      img.onerror = triggerPrint;
    } else {
      triggerPrint();
    }
  }
}
