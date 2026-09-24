import { describe, it, expect, vi } from 'vitest';
import { ImageSaveService } from '@/lib/services/image-save.service';

describe('ImageSaveService: Safari & Cross-Platform Save Engine', () => {
  const sampleDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  it('converts dataUrl to valid Blob with correct mime type and binary content', () => {
    const blob = ImageSaveService.dataUrlToBlob(sampleDataUrl);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('triggers navigator.share when available and supported', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);

    const origDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      },
      configurable: true,
      writable: true,
    });

    const result = await ImageSaveService.saveImage({
      dataUrl: sampleDataUrl,
      filename: 'test-strip.png',
      title: 'ذكرياتي',
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe('share');
    expect(mockShare).toHaveBeenCalled();

    if (origDesc) {
      Object.defineProperty(globalThis, 'navigator', origDesc);
    }
  });

  it('falls back to modal on iOS when navigator.share is unavailable', async () => {
    const origDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        platform: 'iPhone',
      },
      configurable: true,
      writable: true,
    });

    const result = await ImageSaveService.saveImage({
      dataUrl: sampleDataUrl,
      filename: 'ios-strip.png',
    });

    expect(result.method).toBe('fallback');
    expect(result.blobUrl).toBeDefined();

    if (origDesc) {
      Object.defineProperty(globalThis, 'navigator', origDesc);
    }
  });

  it('triggers desktop anchor download for non-iOS environments', async () => {
    const origDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      configurable: true,
      writable: true,
    });

    const clickSpy = vi.fn();
    const mockLink = {
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement;

    const originalDocument = globalThis.document;
    // @ts-expect-error mocking document
    globalThis.document = {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      createElement: (tag: string) => (tag === 'a' ? mockLink : {}),
    };

    const result = await ImageSaveService.saveImage({
      dataUrl: sampleDataUrl,
      filename: 'desktop-strip.png',
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe('download');
    expect(clickSpy).toHaveBeenCalled();

    if (origDesc) {
      Object.defineProperty(globalThis, 'navigator', origDesc);
    }
    globalThis.document = originalDocument;
  });
});
