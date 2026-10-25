import { afterEach, describe, it, expect, vi } from 'vitest';
import { CardCanvasExportService } from '@/lib/services/card-canvas-export.service';

function createCanvasContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 150 }),
    lineWidth: 1,
    strokeStyle: '',
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
  };
}

function mockCanvas(dataUrl = 'data:image/png;base64,MOCK_CANVAS_EXPORT') {
  const ctx = createCanvasContext();
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(ctx),
    toDataURL: vi.fn().mockReturnValue(dataUrl),
  };
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'canvas') return canvas as unknown as HTMLCanvasElement;
    return originalCreateElement(tagName);
  });
  return { canvas, ctx };
}

describe('CardCanvasExportService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('exportCardToDataUrl', () => {
    it('returns a fallback base64 png data URL in SSR / headless environment without document', async () => {
      vi.stubGlobal('document', undefined);

      const url = await CardCanvasExportService.exportCardToDataUrl({
        customerName: 'سارة أحمد',
        cafeName: 'Espresso Lab',
        stampsCount: 3,
        totalSlots: 10,
      });

      expect(url).toMatch(/^data:image\/png;base64,/);
    });

    it('renders with canvas context when document is available', async () => {
      const { canvas, ctx } = mockCanvas();

      const url = await CardCanvasExportService.exportCardToDataUrl({
        customerName: 'كريم محمود',
        cafeName: 'قهوة زمان',
        stampsCount: 5,
        totalSlots: 10,
        theme: 'botanical_matcha',
        profession: 'Software Engineer',
      });

      expect(url).toBe('data:image/png;base64,MOCK_CANVAS_EXPORT');
      expect(canvas.width).toBe(1200);
      expect(canvas.height).toBe(750);
      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('قهوة زمان'),
        expect.any(Number),
        expect.any(Number)
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('كريم محمود'),
        expect.any(Number),
        expect.any(Number)
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('Software Engineer'),
        expect.any(Number),
        expect.any(Number)
      );
      expect(ctx.arc).toHaveBeenCalled();
    });

    it('handles all 4 theme presets correctly without errors', async () => {
      const themes = ['espresso_pass', 'minimal_kraft', 'neon_cyber_latte', 'botanical_matcha'] as const;

      for (const theme of themes) {
        mockCanvas();
        const url = await CardCanvasExportService.exportCardToDataUrl({
          customerName: 'أحمد علي',
          cafeName: 'Specialty Coffee',
          stampsCount: 2,
          totalSlots: 8,
          theme,
        });
        expect(url).toMatch(/^data:image\/png;base64,/);
        vi.restoreAllMocks();
      }
    });

    it('correctly adapts to custom slot counts (4, 6, 8, 12)', async () => {
      for (const slots of [4, 6, 8, 12]) {
        mockCanvas();
        const url = await CardCanvasExportService.exportCardToDataUrl({
          customerName: 'فاطمة',
          cafeName: 'Cafe',
          stampsCount: 4,
          totalSlots: slots,
        });
        expect(url).toMatch(/^data:image\/png;base64,/);
        vi.restoreAllMocks();
      }
    });
  });

  describe('downloadCardImage', () => {
    it('creates an anchor link, triggers download, and cleans up DOM', () => {
      const clickSpy = vi.fn();
      const mockLink = {
        href: '',
        download: '',
        click: clickSpy,
      } as unknown as HTMLAnchorElement;

      const appendSpy = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockLink as unknown as Node);
      const removeSpy = vi
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockLink as unknown as Node);
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') return mockLink;
        return originalCreateElement(tagName);
      });

      CardCanvasExportService.downloadCardImage('data:image/png;base64,TEST', 'my-card.png');

      expect(mockLink.href).toBe('data:image/png;base64,TEST');
      expect(mockLink.download).toBe('my-card.png');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(appendSpy).toHaveBeenCalledWith(mockLink);
      expect(removeSpy).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('shareCardImage', () => {
    it('calls navigator.share when available and supported', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      const mockCanShare = vi.fn().mockReturnValue(true);

      vi.stubGlobal('navigator', {
        share: mockShare,
        canShare: mockCanShare,
      });

      const success = await CardCanvasExportService.shareCardImage(
        'data:image/png;base64,TEST',
        'كارت الولاء'
      );
      expect(success).toBe(true);
      expect(mockShare).toHaveBeenCalled();
    });

    it('falls back to downloadCardImage when navigator.share is unsupported', async () => {
      vi.stubGlobal('navigator', {});
      const downloadSpy = vi
        .spyOn(CardCanvasExportService, 'downloadCardImage')
        .mockImplementation(() => {});

      const success = await CardCanvasExportService.shareCardImage('data:image/png;base64,TEST');
      expect(success).toBe(true);
      expect(downloadSpy).toHaveBeenCalledWith('data:image/png;base64,TEST');
    });
  });
});
