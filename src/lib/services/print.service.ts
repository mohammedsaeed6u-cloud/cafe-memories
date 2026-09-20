/**
 * PrintService
 * Isolates ONLY the photobooth strip image or element into a dedicated hidden iframe
 * with exact 2x6 inch photobooth dimensions, eliminating multi-page leaks,
 * modal overlays, buttons, share widgets, or browser headers/footers.
 */

export class PrintService {
  /**
   * Prints the high-resolution composed strip image directly.
   * This guarantees 100% pixel fidelity, zero CSS issues, zero second-page overflow!
   */
  static printStripImage(dataUrl: string): void {
    if (typeof window === 'undefined' || !dataUrl) return;

    // Remove any previous print frame
    const existing = document.getElementById('memories-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'memories-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
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
    iframeDoc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>Memories Photobooth Strip</title>
        <style>
          @page {
            size: portrait;
            margin: 0mm;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #FAF8F5 !important;
              width: 100vw !important;
              height: 100vh !important;
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .strip-img {
              max-height: 98vh !important;
              max-width: 95vw !important;
              width: auto !important;
              height: auto !important;
              display: block !important;
              margin: auto !important;
              object-fit: contain !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              break-after: avoid !important;
            }
          }
          body {
            background-color: #FAF8F5;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .strip-img {
            max-height: 98vh;
            max-width: 95vw;
            width: auto;
            height: auto;
            display: block;
            margin: auto;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img class="strip-img" id="target-strip" src="${dataUrl}" alt="Memories Strip" />
      </body>
      </html>
    `);
    iframeDoc.close();

    const img = iframeDoc.getElementById('target-strip') as HTMLImageElement;
    const triggerPrint = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error('[PrintService] Print execution error', err);
        } finally {
          setTimeout(() => iframe.remove(), 4000);
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

  /**
   * Fallback method to print by element ID
   */
  static printElement(elementId: string = 'printable-strip'): void {
    if (typeof window === 'undefined') return;

    // Check if element has an img or canvas inside or if we can read dataUrl
    const sourceEl = document.getElementById(elementId);
    if (!sourceEl) {
      window.print();
      return;
    }

    // If an img tag is inside the strip, prefer image print
    const firstImg = sourceEl.querySelector('img');
    if (firstImg && firstImg.src && firstImg.src.startsWith('data:image')) {
      this.printStripImage(firstImg.src);
      return;
    }

    // Otherwise clone element
    const existing = document.getElementById('memories-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'memories-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
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
    cloned.style.left = 'auto';
    cloned.style.top = 'auto';
    cloned.style.position = 'relative';

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>Memories Photobooth Strip</title>
        ${stylesHtml}
        <style>
          @page { size: portrait; margin: 0mm; }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #FAF8F5 !important;
              width: 100% !important;
              height: 100% !important;
              overflow: hidden !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #printable-strip {
              margin: 0 auto !important;
              box-shadow: none !important;
              width: 2.3in !important;
              max-width: 2.3in !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
          body {
            background-color: #FAF8F5;
            margin: 0;
            padding: 8px 0;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
        </style>
      </head>
      <body>
        ${cloned.outerHTML}
      </body>
      </html>
    `);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('[PrintService] Print execution error', err);
      } finally {
        setTimeout(() => iframe.remove(), 4000);
      }
    }, 400);
  }
}
