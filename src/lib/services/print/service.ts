import { generatePrintCSS } from './css';
import { getPrintDimensions, normalizePrintFormat } from './dimensions';
import { generatePrintHTML } from './html';
import type { PrintCSSOptions, PrintDimensions, PrintFormat, PrintJobOptions } from './types';

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
   * Prints an acrylic table tent card / standee (A6 standard: 105x148mm) in isolated iframe.
   */
  static printTableStand(
    elementId: string = 'table-stand-print',
    options?: { title?: string; cafeName?: string }
  ): void {
    if (typeof window === 'undefined') return;

    const sourceEl = document.getElementById(elementId);
    if (!sourceEl) {
      window.print();
      return;
    }

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
    cloned.style.width = '100%';
    cloned.style.maxWidth = '100%';

    const css = `
      @page {
        size: 105mm 148mm;
        margin: 0mm;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #FFFFFF !important;
        width: 105mm;
        height: 148mm;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .standee-container {
        width: 105mm;
        height: 148mm;
        padding: 6mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: #FFFFFF;
      }
      .standee-box {
        width: 100%;
        height: 100%;
        border: 2px solid #1c1917;
        border-radius: 12px;
        padding: 5mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
      }
    `;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>${options?.title || 'Table Standee A6'}</title>
        ${stylesHtml}
        <style>${css}</style>
      </head>
      <body>
        <div class="standee-container">
          <div class="standee-box">
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
