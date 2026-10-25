import { generatePrintCSS } from './css';
import { getPrintDimensions, normalizePrintFormat } from './dimensions';
import type { PrintJobOptions } from './types';

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
