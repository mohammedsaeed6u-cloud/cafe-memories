import { BusinessSettings, PhotoboothFrame, ShotCount, StripOrientation } from '@/types/photobooth';
import { DEFAULT_BUSINESS_SETTINGS } from '@/lib/constants/photobooth-presets';

const STORAGE_PREFIX = 'memories_business_settings_';

export class BusinessSettingsService {
  private static memoryStore = new Map<string, string>();

  private static getStorageKey(cafeSlug: string): string {
    return `${STORAGE_PREFIX}${cafeSlug}`;
  }

  static getSettings(cafeSlug: string = 'espresso-lab'): BusinessSettings {
    const defaultShotCount = DEFAULT_BUSINESS_SETTINGS.defaultShotCount || 3;
    const defaultOrientation = DEFAULT_BUSINESS_SETTINGS.defaultOrientation || 'vertical';

    let stored: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        stored = localStorage.getItem(this.getStorageKey(cafeSlug));
      } catch (e) {
        console.warn('Failed to read localStorage:', e);
      }
    }
    if (!stored) {
      stored = this.memoryStore.get(this.getStorageKey(cafeSlug)) || null;
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const defaultShotCount = Math.max(
          Number(parsed.defaultShotCount) || DEFAULT_BUSINESS_SETTINGS.defaultShotCount,
          1
        );
        const defaultOrientation =
          parsed.defaultOrientation || DEFAULT_BUSINESS_SETTINGS.defaultOrientation;
        const defaultFrameShape =
          parsed.defaultFrameShape || DEFAULT_BUSINESS_SETTINGS.defaultFrameShape || 'rounded';
        const defaultBorderRadius =
          parsed.defaultBorderRadius ?? DEFAULT_BUSINESS_SETTINGS.defaultBorderRadius ?? 16;
        const defaultWidthCm =
          parsed.defaultWidthCm ?? DEFAULT_BUSINESS_SETTINGS.defaultWidthCm ?? 5;
        const defaultHeightCm =
          parsed.defaultHeightCm ?? DEFAULT_BUSINESS_SETTINGS.defaultHeightCm ?? 15.2;
        const defaultCardMode =
          parsed.defaultCardMode || DEFAULT_BUSINESS_SETTINGS.defaultCardMode || 'ticket_express';

        const rawFrames =
          parsed.frames && parsed.frames.length > 0
            ? parsed.frames
            : DEFAULT_BUSINESS_SETTINGS.frames;

        // Strictly normalize all frames to have the merchant's authoritative properties
        const normalizedFrames = rawFrames.map((f: PhotoboothFrame) => ({
          ...f,
          shotCount: defaultShotCount,
          orientation: defaultOrientation,
          frameShape: defaultFrameShape,
          borderRadius: f.borderRadius ?? defaultBorderRadius,
          widthCm: f.widthCm ?? defaultWidthCm,
          heightCm: f.heightCm ?? defaultHeightCm,
          cardMode: f.cardMode || defaultCardMode,
        }));

        return {
          ...DEFAULT_BUSINESS_SETTINGS,
          ...parsed,
          cafeSlug: cafeSlug || parsed.cafeSlug || DEFAULT_BUSINESS_SETTINGS.cafeSlug,
          branding: { ...DEFAULT_BUSINESS_SETTINGS.branding, ...(parsed.branding || {}) },
          freeGiftOffer: { ...DEFAULT_BUSINESS_SETTINGS.freeGiftOffer, ...(parsed.freeGiftOffer || {}) },
          defaultShotCount,
          defaultOrientation,
          defaultFrameShape,
          defaultBorderRadius,
          defaultDimensionsPreset: parsed.defaultDimensionsPreset || 'strip_2x6',
          defaultWidthCm,
          defaultHeightCm,
          defaultCardMode,
          frames: normalizedFrames,
          activeColorPaletteId:
            parsed.activeColorPaletteId || DEFAULT_BUSINESS_SETTINGS.activeColorPaletteId,
          allowCustomerColorChoice:
            parsed.allowCustomerColorChoice ?? DEFAULT_BUSINESS_SETTINGS.allowCustomerColorChoice,
          allowedColorIds:
            parsed.allowedColorIds || DEFAULT_BUSINESS_SETTINGS.allowedColorIds,
          lockFrameForCustomers:
            parsed.lockFrameForCustomers ?? DEFAULT_BUSINESS_SETTINGS.lockFrameForCustomers ?? true,
        };
      } catch (err) {
        console.warn('Failed to read settings from localStorage', err);
      }
    }

    return {
      ...DEFAULT_BUSINESS_SETTINGS,
      cafeSlug,
      frames: (DEFAULT_BUSINESS_SETTINGS.frames || []).map((f) => ({
        ...f,
        shotCount: defaultShotCount,
        orientation: defaultOrientation,
      })),
    };
  }

  static saveSettings(settings: BusinessSettings): void {
    const key = this.getStorageKey(settings.cafeSlug);
    const serialized = JSON.stringify(settings);
    this.memoryStore.set(key, serialized);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, serialized);
        window.dispatchEvent(
          new CustomEvent('memories-settings-updated', {
            detail: settings,
          })
        );
      } catch (err) {
        console.error('Failed to save settings to localStorage', err);
      }
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

  static updateShotCount(cafeSlug: string, shotCount: number): BusinessSettings {
    const current = this.getSettings(cafeSlug);
    const validCount = Math.max(Number(shotCount) || 1, 1);
    const updated: BusinessSettings = {
      ...current,
      defaultShotCount: validCount,
      frames: current.frames.map((f) => ({ ...f, shotCount: validCount })),
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

  static updateFrameShape(cafeSlug: string, frameShape: any): BusinessSettings {
    const current = this.getSettings(cafeSlug);
    const updated: BusinessSettings = {
      ...current,
      defaultFrameShape: frameShape,
      frames: current.frames.map((f) => ({ ...f, frameShape })),
    };
    this.saveSettings(updated);
    return updated;
  }

  static updateColorSettings(
    cafeSlug: string,
    data: {
      activeColorPaletteId?: string;
      allowCustomerColorChoice?: boolean;
      allowedColorIds?: string[];
      customPalette?: any;
    }
  ): BusinessSettings {
    const current = this.getSettings(cafeSlug);
    const updated: BusinessSettings = {
      ...current,
      ...data,
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
    const frameExists = current.frames.some((f) => f.id === frameId);
    const activeFrameId = frameExists ? frameId : current.activeFrameId;
    const updated: BusinessSettings = {
      ...current,
      activeFrameId,
    };
    this.saveSettings(updated);
    return updated;
  }
}
