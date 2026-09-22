import { describe, it, expect } from 'vitest';
import {
  PHOTOBOOTH_FRAME_TEMPLATES,
  PHOTOBOOTH_CARD_MODES,
  DIMENSION_PRESETS,
  SHOT_COUNT_OPTIONS,
  PRESET_COLOR_PALETTES,
  DEFAULT_PHOTOBOOTH_FRAMES,
  DEFAULT_BUSINESS_SETTINGS,
} from '@/lib/constants/photobooth-presets';
import { BusinessSettingsService } from '@/lib/services/business-settings.service';
import { PhotoboothFrame, BusinessSettings } from '@/types/photobooth';

describe('Photobooth Frames Template System', () => {
  describe('Deliverable 2: Core Frame Visual Identities', () => {
    it('provides distinctive korean_noir template (Seoul vintage photobooth, dark contrast, clean typography)', () => {
      const template = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'korean_noir_2x6');
      expect(template).toBeDefined();
      expect(template?.cardMode).toBe('korean_noir');
      expect(template?.badge).toBe('SEOUL 4-CUTS');
      expect(template?.defaultBg).toBe('#121214');
      expect(template?.defaultBorder).toBe('#27272A');
      expect(template?.defaultText).toBe('#F4F4F5');

      const mode = PHOTOBOOTH_CARD_MODES.find((m) => m.id === 'korean_noir');
      expect(mode).toBeDefined();
      expect(mode?.filmBadge).toContain('SEOUL');
    });

    it('provides distinctive tokyo_pastel template (Harajuku pastel gradients, cute borders, date stamp)', () => {
      const template = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'tokyo_pastel_2x6');
      expect(template).toBeDefined();
      expect(template?.cardMode).toBe('tokyo_pastel');
      expect(template?.badge).toBe('TOKYO EDITION');
      expect(template?.defaultBg).toBe('#FDF2F5');
      expect(template?.defaultBorder).toBe('#FBCFE8');
      expect(template?.defaultText).toBe('#831843');
      expect(template?.defaultAccent).toBe('#F43F5E');

      const mode = PHOTOBOOTH_CARD_MODES.find((m) => m.id === 'tokyo_pastel');
      expect(mode).toBeDefined();
      expect(mode?.filmBadge).toContain('TOKYO');
    });

    it('provides distinctive kinfolk_minimal template (Editorial luxury, wide negative space, serif typography)', () => {
      const template = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'kinfolk_minimal_2x6');
      expect(template).toBeDefined();
      expect(template?.cardMode).toBe('kinfolk_minimal');
      expect(template?.badge).toBe('KINFOLK EDITION');
      expect(template?.defaultBg).toBe('#FCFBF9');
      expect(template?.defaultBorder).toBe('#E7E5E0');
      expect(template?.defaultText).toBe('#18181B');

      const mode = PHOTOBOOTH_CARD_MODES.find((m) => m.id === 'kinfolk_minimal');
      expect(mode).toBeDefined();
      expect(mode?.filmBadge).toContain('KINFOLK');
    });

    it('provides distinctive film_35mm template (35mm analogue roll with sprocket holes and frame numbers)', () => {
      const template = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'film_35mm_2x6');
      expect(template).toBeDefined();
      expect(template?.cardMode).toBe('film_35mm');
      expect(template?.badge).toBe('KODAK 400TX');
      expect(template?.defaultBg).toBe('#1A1715');
      expect(template?.defaultText).toBe('#FEF08A');
      expect(template?.defaultAccent).toBe('#F97316');

      const mode = PHOTOBOOTH_CARD_MODES.find((m) => m.id === 'film_35mm');
      expect(mode).toBeDefined();
      expect(mode?.filmBadge).toContain('35MM');
    });

    it('provides distinctive arabica_luxury_gold template (Dark espresso matte with gold foil border and luxury aesthetic)', () => {
      const template = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'arabica_luxury_gold_2x6');
      expect(template).toBeDefined();
      expect(template?.cardMode).toBe('arabica_luxury_gold');
      expect(template?.badge).toBe('% ARABICA GOLD');
      expect(template?.defaultBg).toBe('#14110F');
      expect(template?.defaultBorder).toBe('#D4AF37');
      expect(template?.defaultAccent).toBe('#C5A059');

      const mode = PHOTOBOOTH_CARD_MODES.find((m) => m.id === 'arabica_luxury_gold');
      expect(mode).toBeDefined();
      expect(mode?.filmBadge).toContain('% ARABICA');
    });

    it('provides distinctive polaroid_vintage template (Classic polaroid with bottom chin)', () => {
      const template = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'polaroid_vintage');
      expect(template).toBeDefined();
      expect(template?.cardMode).toBe('polaroid_vintage');
      expect(template?.badge).toBe('POLAROID 600');
      expect(template?.defaultBg).toBe('#F7F5EE');
      expect(template?.defaultBorder).toBe('#E5E0D2');

      const mode = PHOTOBOOTH_CARD_MODES.find((m) => m.id === 'polaroid_vintage');
      expect(mode).toBeDefined();
      expect(mode?.filmBadge).toContain('POLAROID');
    });
  });

  describe('Deliverable 3: Dimensions and Slot Count Configurability', () => {
    it('supports standard and custom dimensions presets (2x6 strip, 4x6 grid, 4x3 wide, polaroid, cinema, custom)', () => {
      const presetIds = DIMENSION_PRESETS.map((p) => p.id);
      expect(presetIds).toContain('strip_2x6');
      expect(presetIds).toContain('grid_4x6');
      expect(presetIds).toContain('wide_4x3');
      expect(presetIds).toContain('polaroid_vintage');
      expect(presetIds).toContain('cinema_6x2');
      expect(presetIds).toContain('custom');

      const strip2x6 = DIMENSION_PRESETS.find((p) => p.id === 'strip_2x6');
      expect(strip2x6?.widthCm).toBe(5);
      expect(strip2x6?.heightCm).toBe(15.2);
      expect(strip2x6?.orientation).toBe('vertical');

      const grid4x6 = DIMENSION_PRESETS.find((p) => p.id === 'grid_4x6');
      expect(grid4x6?.widthCm).toBe(10);
      expect(grid4x6?.heightCm).toBe(15.2);

      const wide4x3 = DIMENSION_PRESETS.find((p) => p.id === 'wide_4x3');
      expect(wide4x3?.widthCm).toBe(10);
      expect(wide4x3?.heightCm).toBe(7.6);
      expect(wide4x3?.orientation).toBe('horizontal');

      const polaroid = DIMENSION_PRESETS.find((p) => p.id === 'polaroid_vintage');
      expect(polaroid?.widthCm).toBe(8.8);
      expect(polaroid?.heightCm).toBe(10.7);
    });

    it('supports arbitrary shot counts (1, 2, 3, 4, 6 cuts)', () => {
      const counts = SHOT_COUNT_OPTIONS.map((o) => o.count);
      expect(counts).toEqual([1, 2, 3, 4, 6]);

      // Templates coverage for various cut counts
      const shotCounts = PHOTOBOOTH_FRAME_TEMPLATES.map((t) => t.shotCount);
      expect(shotCounts).toContain(1);
      expect(shotCounts).toContain(2);
      expect(shotCounts).toContain(3);
      expect(shotCounts).toContain(4);
      expect(shotCounts).toContain(6);
    });

    it('includes matching color palettes for all core visual themes', () => {
      const paletteIds = PRESET_COLOR_PALETTES.map((p) => p.id);
      expect(paletteIds).toContain('noir-korean');
      expect(paletteIds).toContain('tokyo-pastel');
      expect(paletteIds).toContain('kinfolk-ivory');
      expect(paletteIds).toContain('arabica-gold');
      expect(paletteIds).toContain('analog-35mm');
      expect(paletteIds).toContain('polaroid-cream');
    });
  });

  describe('Deliverable 4: Business Settings Normalization & Persistence', () => {
    it('normalizes frames with merchant-enforced shotCount, orientation, and dimensions', () => {
      const customFrame: PhotoboothFrame = {
        id: 'test-custom-frame',
        name: 'Custom Studio Frame',
        nameAr: 'إطار مخصص للاختبار',
        bgColor: '#000000',
        textColor: '#FFFFFF',
        borderColor: '#333333',
        cornerEmojis: { topRight: '☕', bottomLeft: '✨', enabled: true },
        orientation: 'horizontal',
        shotCount: 6,
        borderRadius: 20,
        widthCm: 10,
        heightCm: 15.2,
        cardMode: 'arabica_luxury_gold',
        customText: 'Special Batch 2026',
      };

      expect(customFrame.shotCount).toBe(6);
      expect(customFrame.borderRadius).toBe(20);
      expect(customFrame.widthCm).toBe(10);
      expect(customFrame.heightCm).toBe(15.2);
      expect(customFrame.cardMode).toBe('arabica_luxury_gold');
      expect(customFrame.customText).toBe('Special Batch 2026');
    });

    it('maintains backwards compatibility for legacy aliases', () => {
      const retroFilm = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'retro_film_35mm');
      expect(retroFilm).toBeDefined();
      expect(retroFilm?.cardMode).toBe('film_35mm');

      const polaroidClassic = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'polaroid_classic');
      expect(polaroidClassic).toBeDefined();
      expect(polaroidClassic?.cardMode).toBe('polaroid_vintage');
    });

    it('default business settings include all allowed modes and active frame configurations', () => {
      expect(DEFAULT_BUSINESS_SETTINGS.allowedModes).toContain('korean_noir');
      expect(DEFAULT_BUSINESS_SETTINGS.allowedModes).toContain('tokyo_pastel');
      expect(DEFAULT_BUSINESS_SETTINGS.allowedModes).toContain('kinfolk_minimal');
      expect(DEFAULT_BUSINESS_SETTINGS.allowedModes).toContain('film_35mm');
      expect(DEFAULT_BUSINESS_SETTINGS.allowedModes).toContain('arabica_luxury_gold');
      expect(DEFAULT_BUSINESS_SETTINGS.allowedModes).toContain('polaroid_vintage');

      expect(DEFAULT_PHOTOBOOTH_FRAMES.some((f) => f.id === 'arabica-gold')).toBe(true);
      expect(DEFAULT_PHOTOBOOTH_FRAMES.some((f) => f.id === 'tokyo-pastel')).toBe(true);
      expect(DEFAULT_PHOTOBOOTH_FRAMES.some((f) => f.id === 'kinfolk-minimal')).toBe(true);
      expect(DEFAULT_PHOTOBOOTH_FRAMES.some((f) => f.id === 'film-35mm')).toBe(true);
      expect(DEFAULT_PHOTOBOOTH_FRAMES.some((f) => f.id === 'polaroid-vintage')).toBe(true);
    });

    it('provides viral Gen-Z & Korean frame suites (Snap Express, Spotify, iPhone Gallery, Camera, iMessage)', () => {
      // 1. The Snap Express vintage train ticket
      const snapTemplate = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'snap_express_ticket_2x6');
      expect(snapTemplate).toBeDefined();
      expect(snapTemplate?.cardMode).toBe('ticket_express');
      expect(snapTemplate?.defaultBg).toBe('#FAF5EC');
      expect(snapTemplate?.defaultBorder).toBe('#4A121A');
      expect(snapTemplate?.shotCount).toBe(3);

      const snapFrame = DEFAULT_PHOTOBOOTH_FRAMES.find((f) => f.id === 'snap-express');
      expect(snapFrame).toBeDefined();
      expect(snapFrame?.ticketSeat).toBe('ROW 15 • SEAT A33');

      // 2. Spotify Photostrip with colorways
      const spotifyTemplate = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'spotify_photostrip_2x6');
      expect(spotifyTemplate).toBeDefined();
      expect(spotifyTemplate?.cardMode).toBe('spotify_player');
      expect(spotifyTemplate?.defaultAccent).toBe('#1DB954');

      const spotifyFrame = DEFAULT_PHOTOBOOTH_FRAMES.find((f) => f.id === 'spotify-player');
      expect(spotifyFrame).toBeDefined();
      expect(spotifyFrame?.songTitle).toBe('Nobody Gets Me');

      // Spotify 4 colorways
      const paletteIds = PRESET_COLOR_PALETTES.map((p) => p.id);
      expect(paletteIds).toContain('spotify-slate-blue');
      expect(paletteIds).toContain('spotify-warm-taupe');
      expect(paletteIds).toContain('spotify-charcoal-oled');
      expect(paletteIds).toContain('spotify-burnt-terracotta');

      // 3. Apple Photos Gallery Bright & Dark
      const iosLight = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'iphone_gallery_light_2x6');
      const iosDark = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'iphone_gallery_dark_2x6');
      expect(iosLight).toBeDefined();
      expect(iosDark).toBeDefined();
      expect(iosLight?.cardMode).toBe('ios_gallery_light');
      expect(iosDark?.cardMode).toBe('ios_gallery_dark');

      // 4. iOS Camera & iMessage MMS
      const iosCamera = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'iphone_camera_strip_2x6');
      const iosMessage = PHOTOBOOTH_FRAME_TEMPLATES.find((t) => t.id === 'iphone_imessage_strip_2x6');
      expect(iosCamera).toBeDefined();
      expect(iosMessage).toBeDefined();
      expect(iosCamera?.cardMode).toBe('ios_camera');
      expect(iosMessage?.cardMode).toBe('ios_imessage');
    });
  });
});
