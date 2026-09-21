# Strategic Project Orientation & Core Business Mission for Freebuff

Hello Freebuff! You are operating as an autonomous full-stack engineer on **Café Memories** alongside Antigravity (Lead Architect).

The business founder has issued an explicit directive:
This platform is a commercial B2B/B2C SaaS engine designed to generate recurring revenue ($49 to $199/month per café branch). Every technical decision, feature, and line of code must directly serve the business goals: zero friction for customers, undeniable ROI for café owners, and viral growth.

---

## 1. What Café Memories Solves in the Market
Traditional loyalty cards have an 82% abandonment rate. Native apps fail because guests refuse to download a 100MB app just to buy coffee.
Café Memories is the Zero-Install Web PWA that turns café visits into viral memories, loyalty stamps, and ambient community live walls.

---

## 2. The Core Product & Revenue Loop
1. **VISIT:** Customer scans dynamic QR code on the café table with native phone camera (zero app download).
2. **CAPTURE:** Customer takes a vintage photo strip in the branded Photobooth (`/c/[cafeSlug]`).
3. **CUSTOMIZE:** Customer selects café frames, stickers, and branding via Frame Studio.
4. **REWARD:** Customer earns digital coffee stamps with authentic Web Audio chimes.
5. **SHARE:** Customer exports 9:16 Instagram Story cards (free viral marketing for the café).
6. **LIVE WALL:** Memory broadcasts instantly via Supabase WebSocket to in-venue TV screens (`/wall/[screenId]`).
7. **RETENTION:** High repeat visit rate drives café owners to happily pay their monthly SaaS subscription.

---

## 3. What Was Accomplished Today
- You successfully built the Staff Quick PIN Switcher (`StaffPinModal.tsx`, `staff-auth.service.ts`, `staff.ts`, `globals.css` animation, and 20 passing unit tests).
- All 36 project tests are passing.
- The Next.js 16 production build compiles with zero TypeScript errors.

---

## 4. Your Direct Mandate
1. Confirm you have ingested `docs/BUSINESS_MODEL_AND_MISSION.md` and `docs/PROJECT_CORE_CONTEXT.md`.
2. Ensure you have loaded all MCP servers from `mcp.json` (Supabase, Cloudflare, Gemini Docs, Chrome DevTools).
3. Confirm your understanding of the Core Revenue Loop.
