import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CardCanvasExportService,
  type CardExportOptions,
} from '@/lib/services/card-canvas-export.service';

describe('CardCanvasExportService', () => {
  describe('exportCardToDataUrl', () => {
    it('returns a fallback base64 png data URL in SSR / headless environment without document', async () => {
      const originalDocument = globalThis.document;
      // @ts-expect-error simulating SSR
      delete globalThis.document;

      const url = await CardCanvasExportService.exportCardToDataUrl({
        customerName: 'سارة أحمد',
        cafeName: 'Espresso Lab',
        stampsCount: 3,
        totalSlots: 10,
      });

      expect(url).toMatch(/^data:image\/png;base64,/);
      globalThis.document = originalDocument;
    });

    it('renders with canvas context when document is available', async () => {
      const mockFill = vi.fn();
      const mockStroke = vi.fn();
      const mockFillText = vi.fn();
      const mockArc = vi.fn();
      const mockRoundRect = vi.fn();
      const mockSave = vi.fn();
      const mockRestore = vi.fn();
      const mockBeginPath = vi.fn();
      const mockMeasureText = vi.fn().mockReturnValue({ width: 150 });

      const mockCtx = {
        save: mockSave,
        restore: mockRestore,
        beginPath: mockBeginPath,
        roundRect: mockRoundRect,
        arc: mockArc,
        fill: mockFill,
        stroke: mockStroke,
        fillText: mockFillText,
        measureText: mockMeasureText,
        lineWidth: 1,
        strokeStyle: '',
        fillStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockCtx),
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,MOCK_CANVAS_EXPORT'),
      };

      const originalDocument = globalThis.document;
      // @ts-expect-error Mock document for node environment
      globalThis.document = {
        createElement: (tagName: string) => {
          if (tagName === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
          return {};
        },
      };

      const url = await CardCanvasExportService.exportCardToDataUrl({
        customerName: 'كريم محمود',
        cafeName: 'قهوة زمان',
        stampsCount: 5,
        totalSlots: 10,
        theme: 'botanical_matcha',
        profession: 'Software Engineer',
      });

      expect(url).toBe('data:image/png;base64,MOCK_CANVAS_EXPORT');
      expect(mockCanvas.width).toBe(1200);
      expect(mockCanvas.height).toBe(750);
      expect(mockFillText).toHaveBeenCalledWith(expect.stringContaining('قهوة زمان'), expect.any(Number), expect.any(Number));
      expect(mockFillText).toHaveBeenCalledWith(expect.stringContaining('كريم محمود'), expect.any(Number), expect.any(Number));
      expect(mockFillText).toHaveBeenCalledWith(expect.stringContaining('Software Engineer'), expect.any(Number), expect.any(Number));
      expect(mockArc).toHaveBeenCalled();

      globalThis.document = originalDocument;
    });

    it('handles all 4 theme presets correctly without errors', async () => {
      const themes = ['espresso_pass', 'minimal_kraft', 'neon_cyber_latte', 'botanical_matcha'] as const;

      for (const theme of themes) {
        const url = await CardCanvasExportService.exportCardToDataUrl({
          customerName: 'أحمد علي',
          cafeName: 'Specialty Coffee',
          stampsCount: 2,
          totalSlots: 8,
          theme,
        });
        expect(url).toMatch(/^data:image\/png;base64,/);
      }
    });

    it('correctly adapts to custom slot counts (4, 6, 8, 12)', async () => {
      for (const slots of [4, 6, 8, 12]) {
        const url = await CardCanvasExportService.exportCardToDataUrl({
          customerName: 'فاطمة',
          cafeName: 'Cafe',
          stampsCount: 4,
          totalSlots: slots,
        });
        expect(url).toBeTruthy();
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

      const appendSpy = vi.fn();
      const removeSpy = vi.fn();

      const originalDocument = globalThis.document;
      // @ts-expect-error Mock document for node environment
      globalThis.document = {
        body: {
          appendChild: appendSpy,
          removeChild: removeSpy,
        },
        createElement: (tag: string) => {
          if (tag === 'a') return mockLink;
          return {};
        },
      };

      CardCanvasExportService.downloadCardImage('data:image/png;base64,TEST', 'my-card.png');

      expect(mockLink.href).toBe('data:image/png;base64,TEST');
      expect(mockLink.download).toBe('my-card.png');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(appendSpy).toHaveBeenCalledWith(mockLink);
      expect(removeSpy).toHaveBeenCalledWith(mockLink);

      globalThis.document = originalDocument;
    });
  });

  describe('shareCardImage', () => {
    it('calls navigator.share when available and supported', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      const mockCanShare = vi.fn().mockReturnValue(true);

      globalThis.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' })),
      } as unknown as Response);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: mockShare,
          canShare: mockCanShare,
        },
        configurable: true,
        writable: true,
      });

      const success = await CardCanvasExportService.shareCardImage('data:image/png;base64,TEST', 'كارت الولاء');
      expect(success).toBe(true);
      expect(mockShare).toHaveBeenCalled();
    });

    it('falls back to downloadCardImage when navigator.share is unsupported', async () => {
      const downloadSpy = vi.spyOn(CardCanvasExportService, 'downloadCardImage').mockImplementation(() => {});

      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        configurable: true,
        writable: true,
      });

      const success = await CardCanvasExportService.shareCardImage('data:image/png;base64,TEST');
      expect(success).toBe(true);
      expect(downloadSpy).toHaveBeenCalledWith('data:image/png;base64,TEST');

      downloadSpy.mockRestore();
    });
  });
});
