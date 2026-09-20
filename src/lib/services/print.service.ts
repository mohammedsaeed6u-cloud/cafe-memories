/**
 * PrintService
 * Isolates ONLY the photobooth strip element into a dedicated hidden iframe
 * with exact 2x6 inch photobooth dimensions, eliminating multi-page leaks,
 * modal overlays, buttons, share widgets, or browser headers/footers.
 */

export class PrintService {
  /**
   * Prints only the targeted element in an isolated single-page print frame.
   */
  static printElement(elementId: string = 'printable-strip'): void {
    if (typeof window === 'undefined') return;

    const sourceEl = document.getElementById(elementId);
    if (!sourceEl) {
      console.warn(`[PrintService] Element with id #${elementId} not found, falling back to window.print()`);
      window.print();
      return;
    }

    // Remove any previous print frame
    const existingFrame = document.getElementById('memories-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    // Create an invisible iframe
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

    // Extract all stylesheet links and style elements from parent document
    let stylesHtml = '';
    const styleSheets = document.querySelectorAll('link[rel="stylesheet"], style');
    styleSheets.forEach((node) => {
      stylesHtml += node.outerHTML;
    });

    // Strip clone
    const cloned = sourceEl.cloneNode(true) as HTMLElement;
    cloned.style.margin = '0 auto';
    cloned.style.boxShadow = 'none';
    cloned.style.transform = 'none';
    cloned.style.left = 'auto';
    cloned.style.top = 'auto';
    cloned.style.position = 'relative';

    iframeDoc.open();
    iframeDoc.write(
      '<!DOCTYPE html>' +
      '<html dir="rtl" lang="ar">' +
      '<head>' +
      '<meta charset="utf-8" />' +
      '<title>Memories Photobooth Strip</title>' +
      stylesHtml +
      '<style>' +
      '@page { size: 2in 6in; margin: 0mm; }' +
      '@media print {' +
      '  html, body {' +
      '    margin: 0 !important;' +
      '    padding: 0 !important;' +
      '    background: #FAF8F5 !important;' +
      '    width: 100% !important;' +
      '    height: 100% !important;' +
      '    -webkit-print-color-adjust: exact !important;' +
      '    print-color-adjust: exact !important;' +
      '    overflow: hidden !important;' +
      '    page-break-after: avoid !important;' +
      '    page-break-inside: avoid !important;' +
      '    break-inside: avoid !important;' +
      '  }' +
      '  #printable-strip {' +
      '    margin: 0 auto !important;' +
      '    box-shadow: none !important;' +
      '    width: 2in !important;' +
      '    max-width: 2in !important;' +
      '    page-break-after: avoid !important;' +
      '    page-break-inside: avoid !important;' +
      '    break-inside: avoid !important;' +
      '  }' +
      '}' +
      'body {' +
      '  background-color: #FAF8F5;' +
      '  margin: 0;' +
      '  padding: 8px 0;' +
      '  display: flex;' +
      '  justify-content: center;' +
      '  align-items: flex-start;' +
      '  -webkit-print-color-adjust: exact;' +
      '  print-color-adjust: exact;' +
      '}' +
      '</style>' +
      '</head>' +
      '<body>' +
      cloned.outerHTML +
      '</body>' +
      '</html>'
    );
    iframeDoc.close();

    // Ensure all images are loaded before printing
    const images = Array.from(iframeDoc.images);
    const imagePromises = images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = () => resolve(null);
        img.onerror = () => resolve(null);
      });
    });

    Promise.all(imagePromises).then(() => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error('[PrintService] Print execution error', err);
        } finally {
          setTimeout(() => {
            iframe.remove();
          }, 3000);
        }
      }, 300);
    });
  }
}
