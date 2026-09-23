/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as capturePOST, captureSchema } from '@/app/api/v1/photobooth/capture/route';
import { GET as memoriesGET } from '@/app/api/v1/memories/route';
import {
  PrintService,
  getPrintDimensions,
  generatePrintCSS,
  generatePrintHTML,
  normalizePrintFormat,
} from '@/lib/services/print.service';

// Mock handles for Supabase
const mockAdminFrom = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockAdminFrom,
  }),
}));

function createMockQueryBuilder(result: { data?: any; error?: any; count?: number | null } = {}) {
  const queryResult = {
    data: result.data ?? null,
    error: result.error ?? null,
    count: result.count ?? null,
  };

  const builder: any = {
    select: vi.fn().mockImplementation(() => builder),
    insert: vi.fn().mockImplementation(() => builder),
    update: vi.fn().mockImplementation(() => builder),
    delete: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation(() => builder),
    limit: vi.fn().mockImplementation(() => builder),
    range: vi.fn().mockImplementation(() => builder),
    order: vi.fn().mockImplementation(() => builder),
    maybeSingle: vi.fn().mockImplementation(async () => queryResult),
    single: vi.fn().mockImplementation(async () => queryResult),
    then: (resolve: any, reject: any) => Promise.resolve(queryResult).then(resolve, reject),
  };

  return builder;
}

describe('Requirement 1: Guest Privacy & Consent Engine', () => {
  const orgId = '123e4567-e89b-42d3-a456-426614174000';
  const branchId = '987fcdeb-51a2-43f7-9876-543210987654';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Zod Schema Consent Calibration', () => {
    it('defaults liveWallConsent to true when customer does not specify', () => {
      const parsed = captureSchema.safeParse({
        name: 'عميل تجريبي',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.liveWallConsent).toBe(true);
      }
    });

    it('preserves liveWallConsent: false when customer opts out of TV wall display', () => {
      const parsed = captureSchema.safeParse({
        name: 'سارة خالد',
        phone: '0555555555',
        liveWallConsent: false,
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.liveWallConsent).toBe(false);
      }
    });

    it('accepts explicit liveWallConsent: true', () => {
      const parsed = captureSchema.safeParse({
        name: 'خالد ناصر',
        liveWallConsent: true,
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.liveWallConsent).toBe(true);
      }
    });
  });

  describe('POST /api/v1/photobooth/capture Privacy Isolation', () => {
    it('sets visibility to "private" and status to "approved" (NOT "live_wall") when liveWallConsent is false', async () => {
      let insertedMemoryPayload: any = null;

      mockAdminFrom.mockImplementation((tableName: string) => {
        if (tableName === 'organizations') {
          return createMockQueryBuilder({ data: { id: orgId } });
        }
        if (tableName === 'branches') {
          return createMockQueryBuilder({ data: { id: branchId, organization_id: orgId } });
        }
        if (tableName === 'customers') {
          return createMockQueryBuilder({
            data: { id: 'cust-privacy-1', display_name: 'ضيف خاص', anonymous_id: '0599999999' },
          });
        }
        if (tableName === 'visits') {
          return createMockQueryBuilder({
            data: { id: 'visit-priv-1', created_at: '2026-09-21T18:00:00Z' },
          });
        }
        if (tableName === 'memories') {
          const builder = createMockQueryBuilder();
          builder.insert = vi.fn().mockImplementation((payload: any) => {
            insertedMemoryPayload = payload;
            return createMockQueryBuilder({
              data: {
                id: 'mem-privacy-private',
                status: payload.status,
                visibility: payload.visibility,
                caption: payload.caption,
                created_at: '2026-09-21T18:00:00Z',
              },
            });
          });
          return builder;
        }
        return createMockQueryBuilder();
      });

      const request = new NextRequest('http://localhost:3000/api/v1/photobooth/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'ضيف خاص',
          phone: '0599999999',
          originalUrl: 'https://example.com/private-photo.jpg',
          organizationId: orgId,
          branchId: branchId,
          liveWallConsent: false, // Customer declines TV wall display!
        }),
      });

      const response = await capturePOST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);

      // Verify that database insertion strictly followed privacy requirements:
      expect(insertedMemoryPayload).toBeDefined();
      expect(insertedMemoryPayload.visibility).toBe('private');
      expect(insertedMemoryPayload.status).toBe('approved');
      expect(insertedMemoryPayload.status).not.toBe('live_wall');

      // Verify response payload
      expect(json.memory.visibility).toBe('private');
      expect(json.memory.status).toBe('approved');
      expect(json.memory.status).not.toBe('live_wall');
    });

    it('sets visibility to "live_wall" and status to "approved" when liveWallConsent is true', async () => {
      let insertedMemoryPayload: any = null;

      mockAdminFrom.mockImplementation((tableName: string) => {
        if (tableName === 'organizations') {
          return createMockQueryBuilder({ data: { id: orgId } });
        }
        if (tableName === 'branches') {
          return createMockQueryBuilder({ data: { id: branchId, organization_id: orgId } });
        }
        if (tableName === 'customers') {
          return createMockQueryBuilder({
            data: { id: 'cust-privacy-2', display_name: 'ضيف عام', anonymous_id: '0588888888' },
          });
        }
        if (tableName === 'visits') {
          return createMockQueryBuilder({
            data: { id: 'visit-priv-2', created_at: '2026-09-21T18:00:00Z' },
          });
        }
        if (tableName === 'memories') {
          const builder = createMockQueryBuilder();
          builder.insert = vi.fn().mockImplementation((payload: any) => {
            insertedMemoryPayload = payload;
            return createMockQueryBuilder({
              data: {
                id: 'mem-privacy-public',
                status: payload.status,
                visibility: payload.visibility,
                created_at: '2026-09-21T18:00:00Z',
              },
            });
          });
          return builder;
        }
        return createMockQueryBuilder();
      });

      const request = new NextRequest('http://localhost:3000/api/v1/photobooth/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'ضيف عام',
          phone: '0588888888',
          originalUrl: 'https://example.com/public-photo.jpg',
          organizationId: orgId,
          branchId: branchId,
          liveWallConsent: true, // Customer approves TV wall display!
        }),
      });

      const response = await capturePOST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(insertedMemoryPayload.visibility).toBe('live_wall');
      expect(insertedMemoryPayload.status).toBe('approved');
      expect(json.memory.visibility).toBe('live_wall');
      expect(json.memory.status).toBe('approved');
    });
  });

  describe('GET /api/v1/memories Strict Wall Query Filtering', () => {
    it('strictly filters by status="approved" and visibility="live_wall" by default', async () => {
      const eqCalls: [string, any][] = [];

      mockAdminFrom.mockImplementation((tableName: string) => {
        if (tableName === 'memories') {
          const builder = createMockQueryBuilder({
            data: [
              {
                id: 'mem-1',
                status: 'approved',
                visibility: 'live_wall',
                caption: 'ذكريات القهوة',
              },
            ],
            count: 1,
          });

          builder.eq = vi.fn().mockImplementation((col: string, val: any) => {
            eqCalls.push([col, val]);
            return builder;
          });

          return builder;
        }
        return createMockQueryBuilder();
      });

      const request = new NextRequest('http://localhost:3000/api/v1/memories?branchId=' + branchId);
      const response = await memoriesGET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);

      // Verify strict security & privacy filtering
      expect(eqCalls).toContainEqual(['branch_id', branchId]);
      expect(eqCalls).toContainEqual(['status', 'approved']);
      expect(eqCalls).toContainEqual(['visibility', 'live_wall']);

      // Private memories must NEVER be queried without explicit authorization
      expect(eqCalls).not.toContainEqual(['visibility', 'private']);
    });

    it('allows dashboard moderation to pass status="all" and visibility="all" to review queue', async () => {
      const eqCalls: [string, any][] = [];

      mockAdminFrom.mockImplementation((tableName: string) => {
        if (tableName === 'memories') {
          const builder = createMockQueryBuilder({
            data: [],
            count: 0,
          });
          builder.eq = vi.fn().mockImplementation((col: string, val: any) => {
            eqCalls.push([col, val]);
            return builder;
          });
          return builder;
        }
        return createMockQueryBuilder();
      });

      const request = new NextRequest('http://localhost:3000/api/v1/memories?status=all&visibility=all');
      const response = await memoriesGET(request);
      expect(response.status).toBe(200);

      // When moderation explicitly passes 'all', status and visibility filters are bypassed
      const statusFilter = eqCalls.find(([col]) => col === 'status');
      const visibilityFilter = eqCalls.find(([col]) => col === 'visibility');
      expect(statusFilter).toBeUndefined();
      expect(visibilityFilter).toBeUndefined();
    });
  });
});

describe('Requirement 2: High-Precision Business Printing Engine', () => {
  describe('Print Format Normalization', () => {
    it('maps various aliases to standardized formats correctly', () => {
      expect(normalizePrintFormat('standard-2x6')).toBe('standard-2x6');
      expect(normalizePrintFormat('2x6')).toBe('standard-2x6');
      expect(normalizePrintFormat('strip_2x6')).toBe('standard-2x6');
      expect(normalizePrintFormat('')).toBe('standard-2x6');

      expect(normalizePrintFormat('dual-4x6')).toBe('dual-4x6');
      expect(normalizePrintFormat('4x6')).toBe('dual-4x6');
      expect(normalizePrintFormat('grid_4x6')).toBe('dual-4x6');
      expect(normalizePrintFormat('dual')).toBe('dual-4x6');
      expect(normalizePrintFormat('شريط مزدوج')).toBe('dual-4x6');

      expect(normalizePrintFormat('thermal-80mm')).toBe('thermal-80mm');
      expect(normalizePrintFormat('thermal-80')).toBe('thermal-80mm');
      expect(normalizePrintFormat('80mm')).toBe('thermal-80mm');
      expect(normalizePrintFormat('thermal')).toBe('thermal-80mm');

      expect(normalizePrintFormat('thermal-58mm')).toBe('thermal-58mm');
      expect(normalizePrintFormat('thermal-58')).toBe('thermal-58mm');
      expect(normalizePrintFormat('58mm')).toBe('thermal-58mm');
    });
  });

  describe('Precision Physical Dimension Calculations', () => {
    it('calibrates Standard 2x6 in Photobooth Strip to exact millimeter and 300 DPI specifications', () => {
      const dims = getPrintDimensions('standard-2x6');

      // Exact physical metrics: 50.8 mm x 152.4 mm (2x6 inches)
      expect(dims.format).toBe('standard-2x6');
      expect(dims.widthMm).toBe(50.8);
      expect(dims.heightMm).toBe(152.4);
      expect(dims.widthInches).toBe(2);
      expect(dims.heightInches).toBe(6);

      // Commercial 300 DPI pixel matrix
      expect(dims.widthPx300Dpi).toBe(600);
      expect(dims.heightPx300Dpi).toBe(1800);
      expect(dims.aspectRatio).toBeCloseTo(1 / 3, 4);

      expect(dims.isDualStrip).toBe(false);
      expect(dims.isThermal).toBe(false);
    });

    it('calibrates Dual-strip 4x6 in Layout to exact millimeter and 300 DPI specifications', () => {
      const dims = PrintService.getDimensions('dual-4x6');

      // Exact physical metrics: 101.6 mm x 152.4 mm (4x6 inches)
      expect(dims.format).toBe('dual-4x6');
      expect(dims.widthMm).toBe(101.6);
      expect(dims.heightMm).toBe(152.4);
      expect(dims.widthInches).toBe(4);
      expect(dims.heightInches).toBe(6);

      // Commercial 300 DPI pixel matrix for dual strip
      expect(dims.widthPx300Dpi).toBe(1200);
      expect(dims.heightPx300Dpi).toBe(1800);
      expect(dims.aspectRatio).toBeCloseTo(2 / 3, 4);

      expect(dims.isDualStrip).toBe(true);
      expect(dims.isThermal).toBe(false);
    });

    it('calibrates Thermal Sticker Printer 80mm roll width', () => {
      const dims = PrintService.getDimensions('thermal-80mm');

      expect(dims.format).toBe('thermal-80mm');
      expect(dims.widthMm).toBe(80);
      expect(dims.rollWidthMm).toBe(80);
      expect(dims.widthInches).toBeCloseTo(80 / 25.4, 3);
      expect(dims.isThermal).toBe(true);
      expect(dims.isDualStrip).toBe(false);
      expect(dims.widthPx300Dpi).toBe(945); // (80 / 25.4) * 300
    });

    it('calibrates Compact Thermal Sticker Printer 58mm roll width', () => {
      const dims = PrintService.getDimensions('thermal-58mm');

      expect(dims.format).toBe('thermal-58mm');
      expect(dims.widthMm).toBe(58);
      expect(dims.rollWidthMm).toBe(58);
      expect(dims.widthInches).toBeCloseTo(58 / 25.4, 3);
      expect(dims.isThermal).toBe(true);
      expect(dims.isDualStrip).toBe(false);
      expect(dims.widthPx300Dpi).toBe(685); // (58 / 25.4) * 300
    });
  });

  describe('High-Precision CSS Generation & Browser Margin Elimination', () => {
    it('generates zero-margin @page and @media print rules for Standard 2x6', () => {
      const css = generatePrintCSS('standard-2x6');

      // Elimination of browser margins, headers, and footers
      expect(css).toContain('@page { size: 50.8mm 152.4mm; margin: 0 !important; }');
      expect(css).toContain('margin: 0 !important');
      expect(css).toContain('padding: 0 !important');

      // High color accuracy and overflow prevention
      expect(css).toContain('-webkit-print-color-adjust: exact !important');
      expect(css).toContain('print-color-adjust: exact !important');
      expect(css).toContain('overflow: hidden !important');
      expect(css).toContain('page-break-inside: avoid !important');
      expect(css).toContain('break-inside: avoid !important');

      // Exact 2x6 container calibration
      expect(css).toContain('.standard-strip-box');
      expect(css).toContain('width: 50.8mm !important');
      expect(css).toContain('height: 152.4mm !important');
    });

    it('generates Dual-strip 4x6 rules with subtle dashed cut line down the center', () => {
      const css = PrintService.generatePrintCSS('dual-4x6', { showCutLine: true, cutLineStyle: 'dashed' });

      // Page size 4x6 in (101.6mm x 152.4mm)
      expect(css).toContain('@page { size: 101.6mm 152.4mm; margin: 0 !important; }');

      // Dual container dimensions
      expect(css).toContain('.dual-strip-box');
      expect(css).toContain('width: 101.6mm !important');
      expect(css).toContain('height: 152.4mm !important');

      // Two side-by-side columns of 50.8mm each
      expect(css).toContain('.dual-strip-column');
      expect(css).toContain('width: 50.8mm !important');

      // Subtle dashed cut line placed exactly at the 50.8mm dividing center
      expect(css).toContain('.dual-cut-line');
      expect(css).toContain('left: 50.8mm !important');
      expect(css).toContain('border-left: 1px dashed #a8a29e !important');
      expect(css).toContain('.cut-indicator');
    });

    it('generates Thermal Sticker 80mm high-contrast monochrome styles', () => {
      const css = PrintService.generatePrintCSS('thermal-80mm');

      // Page size 80mm continuous roll
      expect(css).toContain('@page { size: 80mm auto; margin: 0 !important; }');
      expect(css).toContain('.thermal-strip-box');
      expect(css).toContain('width: 80mm !important');

      // High contrast B&W thermal styling
      expect(css).toContain('filter: grayscale(100%) contrast(160%) brightness(102%) !important');
      expect(css).toContain('image-rendering: -webkit-optimize-contrast !important');
      expect(css).toContain('image-rendering: crisp-edges !important');
      expect(css).toContain('image-rendering: pixelated !important');
    });

    it('generates Compact Thermal Sticker 58mm high-contrast styles', () => {
      const css = PrintService.generatePrintCSS('thermal-58mm');

      expect(css).toContain('@page { size: 58mm auto; margin: 0 !important; }');
      expect(css).toContain('.thermal-strip-box');
      expect(css).toContain('width: 58mm !important');
      expect(css).toContain('filter: grayscale(100%) contrast(160%) brightness(102%) !important');
    });
  });

  describe('Print HTML Document Construction', () => {
    const mockDataUrl = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4...';

    it('constructs valid standalone HTML document for Standard 2x6', () => {
      const html = generatePrintHTML(mockDataUrl, { format: 'standard-2x6' });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('dir="rtl"');
      expect(html).toContain('lang="ar"');
      expect(html).toContain('<style>');
      expect(html).toContain('.standard-strip-box');
      expect(html).toContain(`src="${mockDataUrl}"`);
      expect(html).toContain('Standard Photobooth Strip (2x6 in)');
    });

    it('constructs valid dual-strip HTML with two images and center cut line', () => {
      const secondUrl = 'data:image/webp;base64,SECOND_STRIP...';
      const html = PrintService.generatePrintHTML(mockDataUrl, {
        format: 'dual-4x6',
        secondStripUrl: secondUrl,
      });

      expect(html).toContain('.dual-strip-box');
      expect(html).toContain('.dual-strip-column');
      expect(html).toContain(`src="${mockDataUrl}"`);
      expect(html).toContain(`src="${secondUrl}"`);
      expect(html).toContain('.dual-cut-line');
      expect(html).toContain('cut-indicator-line');
    });

    it('constructs valid thermal printer HTML with high contrast container', () => {
      const html = PrintService.generatePrintHTML(mockDataUrl, { format: 'thermal-80mm' });

      expect(html).toContain('.thermal-strip-box');
      expect(html).toContain(`src="${mockDataUrl}"`);
      expect(html).toContain('Thermal Strip 80mm');
    });
  });

  describe('Non-browser / Headless Execution Safety', () => {
    it('executes printStripImage safely without crashing when window is undefined', () => {
      expect(() => {
        PrintService.printStripImage('data:image/webp;base64,...');
      }).not.toThrow();
    });

    it('executes printDualStrip safely without crashing', () => {
      expect(() => {
        PrintService.printDualStrip('data:image/webp;base64,...');
      }).not.toThrow();
    });

    it('executes printThermal safely without crashing', () => {
      expect(() => {
        PrintService.printThermal('data:image/webp;base64,...', '80mm');
      }).not.toThrow();
    });

    it('executes printElement safely without crashing', () => {
      expect(() => {
        PrintService.printElement('non-existent-strip-id');
      }).not.toThrow();
    });

    it('executes printTableStand safely without crashing in headless environment', () => {
      expect(() => {
        PrintService.printTableStand('table-stand-print', {
          title: 'Standee Test',
          cafeName: 'Test Cafe',
        });
      }).not.toThrow();
    });
  });
});
