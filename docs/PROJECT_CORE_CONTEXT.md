# Core System Architecture & Business Loop — Café Memories

## 1. The Core Vision
**"The digital memory & loyalty layer for specialty cafés."**
Café Memories transforms physical coffee visits into emotional, shareable digital memories while building deep customer loyalty.

---

## 2. The Core Product Loop
```
[1. VISIT]       Customer sits at a table and scans the anti-fraud dynamic QR code.
       ↓
[2. CAPTURE]     Customer opens the mobile web app (/c/[cafeSlug]) and takes a photo strip in the vintage Photo Booth.
       ↓
[3. CUSTOMIZE]   Customer applies café-branded frames, polaroid aesthetics, or stickers via Frame Studio presets.
       ↓
[4. REWARD]      Customer earns digital coffee stamps with synthesized Web Audio chimes toward free rewards.
       ↓
[5. SHARE]       Customer downloads or shares a 9:16 Instagram Story card to social media.
       ↓
[6. LIVE WALL]   With customer consent, the memory streams via Supabase Realtime WebSockets to in-venue TV screens (/wall/[screenId]) with smooth Ken Burns animations.
       ↓
[7. SOCIAL PROOF] Other café guests see the live memories on screen, scan the QR code on the TV, and participate.
       ↓
[8. RETURN]      Loyalty stamp milestones bring the customer back within 7 days.
```

---

## 3. The 3 Primary Subsystems

### Subsystem A: The Mobile Customer Web App (`/c/[cafeSlug]`)
- Zero app install (Pure Web PWA).
- Anti-fraud dynamic visit verification.
- Interactive multi-frame Photobooth Canvas engine.
- Web Audio API stamp chimes.

### Subsystem B: In-Venue Live TV Wall (`/wall/[screenId]`)
- Runs on venue smart TVs, Apple TV, or Firestick.
- Supabase Realtime WebSocket listener for immediate appearance of approved memories.
- Autonomous slideshow with Ken Burns smooth pan/zoom transitions.

### Subsystem C: Merchant Operations Dashboard (`/dashboard`)
- **TV Moderation:** 1-click approve/reject queue for customer photos before they reach the public TV wall.
- **Frame Studio:** Customization of branding colors, logo watermarks, seasonal frames, and sticker packs.
- **Customer CRM & Loyalty:** Managing reward tiers and stamp redemptions.
- **Staff Shift Quick PIN Switcher:** Fast 4-digit PIN authentication for counter baristas sharing a single POS/tablet.
