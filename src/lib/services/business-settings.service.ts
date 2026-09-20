import { BusinessSettings, PhotoboothFrame, ShotCount, StripOrientation } from '@/types/photobooth';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/constants/photobooth-presets';

const STORAGE_PREFIX = 'memories_business_settings_';

export class BusinessSettingsService {
  private static getStorageKey(cafeSlug: string): string {
    return `${STORAGE_PREFIX}${cafeSlug}`;
  }

  static getSettings(cafeSlug: string = 'espresso-lab'): BusinessSettings {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_BUSINESS_SETTINGS, cafeSlug };
    }

    try {
      const stored = localStorage.getItem(this.getStorageKey(cafeSlug));
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_BUSINESS_SETTINGS,
          ...parsed,
          branding: { ...DEFAULT_BUSINESS_SETTINGS.branding, ...(parsed.branding || {}) },
          freeGiftOffer: { ...DEFAULT_BUSINESS_SETTINGS.freeGiftOffer, ...(parsed.freeGiftOffer || {}) },
          frames: parsed.frames && parsed.frames.length > 0 ? parsed.frames : DEFAULT_BUSINESS_SETTINGS.frames,
        };
      }
    } catch (err) {
      console.warn('Failed to read settings from localStorage', err);
    }

    return { ...DEFAULT_BUSINESS_SETTINGS, cafeSlug };
  }

  static saveSettings(settings: BusinessSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey(settings.cafeSlug), JSON.stringify(settings));
      window.dispatchEvent(
        new CustomEvent('memories-settings-updated', {
          detail: settings,
        })
      );
    } catch (err) {
      console.error('Failed to save settings to localStorage', err);
    }
  }

  static updateBranding(
    cafeSlug: string,
    branding: { name?: string; logoUrl?: string; tagline?: string }
  ): BusinessSettings {
    const current = this.getSettings(cafeSlug);
    const updated: BusinessSettings = {
      ...current,
      branding: {
        ...current.branding,
        ...branding,
      },
      cafeName: branding.name ? `Memories • ${branding.name}` : current.cafeName,
    };
    this.saveSettings(updated);
    return updated;
  }

  static updateShotCount(cafeSlug: string, shotCount: ShotCount): BusinessSettings {
    const current = this.getSettings(cafeSlug);
    const updated: BusinessSettings = {
      ...current,
      defaultShotCount: shotCount,
      frames: current.frames.map((f) => ({ ...f, shotCount })),
    };
    this.saveSettings(updated);
    return updated;
  }

  static updateOrientation(cafeSlug: string, orientation: StripOrientation): BusinessSettings {
    const current = this.getSettings(cafeSlug);
    const updated: BusinessSettings = {
      ...current,
      defaultOrientation: orientation,
      frames: current.frames.map((f) => ({ ...f, orientation })),
    };
    this.saveSettings(updated);
    return updated;
  }

  static saveCustomFrame(cafeSlug: string, frame: PhotoboothFrame): BusinessSettings {
    const current = this.getSettings(cafeSlug);
    const existingIndex = current.frames.findIndex((f) => f.id === frame.id);
    let newFrames = [...current.frames];

    if (existingIndex >= 0) {
      newFrames[existingIndex] = frame;
    } else {
      newFrames.push({ ...frame, isCustom: true });
    }

    const updated: BusinessSettings = {
      ...current,
      frames: newFrames,
      activeFrameId: frame.id,
    };
    this.saveSettings(updated);
    return updated;
  }

  static setActiveFrame(cafeSlug: string, frameId: string): BusinessSettings {
    const current = this.getSettings(cafeSlug);
    const updated: BusinessSettings = {
      ...current,
      activeFrameId: frameId,
    };
    this.saveSettings(updated);
    return updated;
  }
}
