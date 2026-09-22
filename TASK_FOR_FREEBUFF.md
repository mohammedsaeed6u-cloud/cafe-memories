# Task Specification for Freebuff: Canvas Card Image Export Service & Test Suite

## Architectural Lead: Antigravity
## Implementation Subagent: Freebuff (GLM-5.3-Flash)
## Workspace: `C:\Users\mhmd saeed\.gemini\antigravity\scratch\cafe-memories`

---

## 1. Objective
Build the client-side **Card Canvas Export Service** (`src/lib/services/card-canvas-export.service.ts`) that allows customers and baristas to export luxury loyalty cards as crisp, high-resolution PNG images (retina 2x/3x) for saving to photos or sharing via the Web Share API (`navigator.share`).

---

## 2. Requirements & Deliverables

### Requirement 1: Create `src/lib/services/card-canvas-export.service.ts`
Implement:
1. `exportCardToDataUrl(options: CardExportOptions): Promise<string>`
   - Options interface:
     - `customerName: string`
     - `cafeName: string`
     - `stampsCount: number`
     - `totalSlots: number`
     - `theme: string` ('espresso_pass' | 'minimal_kraft' | 'neon_cyber_latte' | 'botanical_matcha')
     - `qrCodeDataUrl?: string`
   - Renders a card canvas with standard Apple Wallet aspect ratio (approx 600x380px or 1200x760px at 2x):
     - Background theme styling (dark matte for espresso_pass, sage green for botanical_matcha, kraft warm for minimal_kraft, dark neon for neon_cyber_latte)
     - Luxury typography for cafe name and customer name
     - Stamp indicators showing active stamps vs empty slots
     - Counter scan QR placeholder or image
   - Gracefully handles headless/SSR environment (checks if `typeof document === 'undefined'` or mockable).
   - Returns a `data:image/png;base64,...` string.

2. `downloadCardImage(dataUrl: string, filename?: string): void`
   - Creates a temporary `<a>` element, sets `download = filename || 'cafe-loyalty-card.png'`, clicks it, and revokes/removes the element.

3. `shareCardImage(dataUrl: string, title?: string): Promise<boolean>`
   - Checks if `navigator.share` and `navigator.canShare` are available.
   - If available, converts dataUrl to a Blob/File and calls `navigator.share`.
   - If not available or if sharing fails, falls back to `downloadCardImage` and returns true.

### Requirement 2: Unit Tests `tests/unit/card-canvas-export.test.ts`
Create comprehensive tests covering:
- Correct options handling and theme selection.
- Graceful behavior when document / HTMLCanvasElement is mocked or in Node.
- `downloadCardImage` triggering anchor click.
- `shareCardImage` calling `navigator.share` or falling back to download.

### Requirement 3: Quality Gates
1. Run `pnpm test` - all tests must pass 100% (165 existing + new tests).
2. Run `pnpm build` - must compile with zero errors.

---

## 3. Freebuff Action Required
1. Read this specification.
2. Implement `src/lib/services/card-canvas-export.service.ts`.
3. Implement `tests/unit/card-canvas-export.test.ts`.
4. Run `pnpm test` and verify that all test suites pass.
5. Provide a summary of your changes.
