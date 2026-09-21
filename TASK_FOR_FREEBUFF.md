# Task Specification for Freebuff: Customer Experience Luxury Integration (Dynamic Loyalty Cards & Instant Print)

## Architectural Lead: Antigravity
## Implementation Subagent: Freebuff (GLM-5.3-Flash)
## Workspace: `C:\Users\mhmd saeed\.gemini\antigravity\scratch\cafe-memories`

---

## 1. Objective
Elevate the customer photobooth experience (`src/components/customer/CustomerClient.tsx`) into a truly luxurious ("فخم ومضبوط") end-to-end journey by integrating:
1. The dynamic, tactile **`LoyaltyCardView`** engine (supporting merchant-configured slot counts: 4, 6, 8, 10, 12, dimensions, and authentic cafe themes).
2. Customer direct **"طلب طباعة فورية للكارت والشريط" (Instant Barista Print Request)** with sensory WebAudio feedback.
3. High-resolution canvas/image export for the customer to save their personalized loyalty card to their camera roll or Apple Wallet preview.

---

## 2. Requirements & Deliverables

### Requirement 1: Integrate `LoyaltyCardView` into `CustomerClient.tsx`
- In `src/components/customer/CustomerClient.tsx`:
  - Replace legacy stamp cards with the tactile `LoyaltyCardView` (`src/components/loyalty/LoyaltyCardView.tsx`).
  - Read active template settings from `src/lib/services/loyalty-card.service.ts` or merchant business settings.
  - Dynamically render the customer's active stamps based on their `visitCount` or `accumulatedPhotos.length`.
  - Display the authentic theme chosen by the merchant:
    * `espresso_pass` (Luxury dark matte + bronze foil)
    * `minimal_kraft` (Eco kraft paper + rubber stamp ink)
    * `neon_cyber_latte` (Cyberpunk glow + neon ring stamps)
    * `botanical_matcha` (Sage green + coffee blossom floral motif)
  - Ensure counter QR code is visible so the barista can scan it from the tablet or print queue.

### Requirement 2: Instant Print Request Action with Soundscape
- After taking photos and composing the strip:
  - Add a prominent, luxurious button: **"🖨️ إرسال لطابعة الكافيه الفورية"**.
  - On click:
    1. Send print job to `/api/v1/photobooth/capture` or trigger `PrintService.sendToQueue(...)`.
    2. Play `SoundEffectsService.playBaristaDing()` for sensory acoustic confirmation.
    3. Show a sleek feedback badge: `"تم إرسال الشريط لطابعة الباريستا بنجاح ✦ استلمه من الكاونتر"`.

### Requirement 3: Canvas Card Save / Export
- Allow customer to download their loyalty card as a clean PNG image directly to their phone with their name, stamp count, and cafe branding.
- Support Web Share API (`navigator.share`) where available, with automatic file download fallback.

### Requirement 4: Comprehensive Unit Tests
- Create `tests/unit/customer-loyalty-integration.test.ts`:
  - Test dynamic slot rendering for 4, 6, 8, 10, 12 slots.
  - Test print dispatch payload formatting and status callback.
  - Test theme classes mapping and WebAudio fallback handling.
- Verify that all existing 142 tests continue to pass 100%.

---

## 3. Acceptance Criteria
1. `npm test` passes **100% of all tests** (142 existing + new unit tests).
2. `npm run build` succeeds cleanly with exit code 0 and zero TypeScript errors.
3. Zero regressions in privacy consent (`liveWallConsent`) or calibrated print dimensions.
