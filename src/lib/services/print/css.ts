import { getPrintDimensions, normalizePrintFormat } from './dimensions';
import type { PrintCSSOptions, PrintFormat } from './types';

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
