import { afterEach, describe, it, expect, vi } from 'vitest';
import { ImageSaveService } from '@/lib/services/image-save.service';

describe('ImageSaveService: Safari & Cross-Platform Save Engine', () => {
  const sampleDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('converts dataUrl to valid Blob with correct mime type and binary content', () => {
    const blob = ImageSaveService.dataUrlToBlob(sampleDataUrl);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('triggers navigator.share when available and supported', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);

    vi.stubGlobal('navigator', {
      share: mockShare,
      canShare: mockCanShare,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    });

    const result = await ImageSaveService.saveImage({
      dataUrl: sampleDataUrl,
      filename: 'test-strip.png',
      title: 'ذكرياتي',
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe('share');
    expect(mockShare).toHaveBeenCalled();
  });

  it('falls back to modal on iOS when navigator.share is unavailable', async () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      platform: 'iPhone',
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-ios');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const result = await ImageSaveService.saveImage({
      dataUrl: sampleDataUrl,
      filename: 'ios-strip.png',
    });

    expect(result.method).toBe('fallback');
    expect(result.blobUrl).toBe('blob:mock-ios');
  });

  it('triggers desktop anchor download for non-iOS environments', async () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-desktop');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const clickSpy = vi.fn();
    const mockLink = {
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement;

    const appendSpy = vi.fn();
    const removeSpy = vi.fn();
    vi.stubGlobal('document', {
      body: {
        appendChild: appendSpy,
        removeChild: removeSpy,
      },
      createElement: (tag: string) => (tag === 'a' ? mockLink : {}),
    });

    const result = await ImageSaveService.saveImage({
      dataUrl: sampleDataUrl,
      filename: 'desktop-strip.png',
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe('download');
    expect(mockLink.href).toBe('blob:mock-desktop');
    expect(mockLink.download).toBe('desktop-strip.png');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(appendSpy).toHaveBeenCalledWith(mockLink);
    expect(removeSpy).toHaveBeenCalledWith(mockLink);
  });
});
