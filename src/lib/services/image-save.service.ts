/**
 * ImageSaveService
 * Safari-compliant & cross-platform image saving engine.
 * Solves the iOS Safari WebKit restriction where <a download="data:..."> fails silently.
 * 
 * Strategy:
 * 1. Native Web Share API (navigator.share with File): On iOS Safari, this brings up the system
 *    Share Sheet featuring "Save Image" (حفظ الصورة) directly into the Apple Photos app.
 * 2. Async Clipboard write (navigator.clipboard.write with ClipboardItem): allows direct copy to pasteboard.
 * 3. Blob-URL standard download for Chromium/Firefox/Desktop.
 * 4. Safe iOS preview modal fallback with long-press touch-callout enabled.
 */

export interface ImageSaveOptions {
  dataUrl: string;
  filename?: string;
  title?: string;
  description?: string;
  text?: string;
}

export interface ImageSaveResult {
  success: boolean;
  method: 'share' | 'download' | 'clipboard' | 'fallback';
  blobUrl?: string;
  error?: string;
}

export class ImageSaveService {
  /**
   * Detects iOS devices (iPhone, iPad, iPod) including iPadOS running desktop Safari.
   */
  public static isIos(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isIosDevice = /iPad|iPhone|iPod/.test(ua);
    const isIpadOs = navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1;
    return isIosDevice || isIpadOs;
  }

  /**
   * Detects Safari browser (iOS Safari, macOS Safari).
   */
  public static isSafari(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|Android/.test(ua);
  }

  /**
   * Fast, reliable Base64 dataURL to Blob converter without network fetch overhead.
   */
  public static dataUrlToBlob(dataUrl: string): Blob {
    try {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0]?.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const byteString = atob(parts[1] || '');
      const len = byteString.length;
      const buffer = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        buffer[i] = byteString.charCodeAt(i);
      }
      return new Blob([buffer], { type: mime });
    } catch {
      // Fallback
      return new Blob([], { type: 'image/png' });
    }
  }

  /**
   * Copies an image dataURL to the system clipboard (PNG).
   * Supported on modern iOS Safari (13.4+) and Chromium.
   */
  public static async copyImageToClipboard(dataUrl: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.clipboard || typeof ClipboardItem === 'undefined') {
      return false;
    }
    try {
      const blob = this.dataUrlToBlob(dataUrl);
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      return false;
    }
  }

  /**
   * Main save/share entrypoint.
   * Priority:
   * 1. On iOS/Safari: Try Web Share API (opens native iOS sheet with "Save Image").
   * 2. On Desktop/Android: Standard Blob URL anchor download.
   * 3. Fallback: Returns method: 'fallback' with blobUrl for UI modal with long-press instruction.
   */
  public static async saveImage(options: ImageSaveOptions): Promise<ImageSaveResult> {
    const filename = options.filename || `memories-${Date.now()}.png`;
    const title = options.title || 'شريط الصور التذكاري';
    const blob = this.dataUrlToBlob(options.dataUrl);

    // 1. Try Native Web Share on mobile / iOS
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const file = new File([blob], filename, { type: blob.type || 'image/png' });
        if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title,
            text: options.text || options.description || 'شريط الذكريات المعتمد',
          });
          return { success: true, method: 'share' };
        }
      } catch (err: any) {
        // If user cancelled the share sheet (AbortError), it's not a fatal error
        if (err?.name === 'AbortError') {
          return { success: true, method: 'share' };
        }
        console.warn('Web Share failed, falling back to download/modal:', err);
      }
    }

    // 2. Standard Download for Desktop / Android
    if (typeof document !== 'undefined') {
      const isIosDevice = this.isIos();
      // On iOS devices, <a download> does not save to Camera Roll; it either fails or navigates away.
      if (!isIosDevice) {
        try {
          const blobUrl = (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function')
            ? URL.createObjectURL(blob)
            : options.dataUrl;
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function' && blobUrl.startsWith('blob:')) {
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          }
          return { success: true, method: 'download' };
        } catch (e: any) {
          console.warn('Download error:', e);
        }
      }
    }

    // 3. Fallback for iOS / Safari: require visual save sheet (long-press)
    const blobUrl = (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function')
      ? URL.createObjectURL(blob)
      : options.dataUrl;
    return {
      success: false,
      method: 'fallback',
      blobUrl,
    };
  }
}
