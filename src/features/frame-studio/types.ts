import {
  BusinessSettings,
  PhotoboothFrame,
  StripOrientation,
  FrameShapeStyle,
  CardColorPalette,
  BusinessType,
  PhotoboothCardMode,
  PlacedSticker,
  BusinessBranding,
  FreeGiftOffer,
} from '@/types/photobooth';

export interface FrameStudioTabProps {
  settings: BusinessSettings;
  onSettingsUpdated: (newSettings: BusinessSettings) => void;
}

export interface UseFrameStudioReturn {
  activeFrame: PhotoboothFrame;
  setActiveFrame: React.Dispatch<React.SetStateAction<PhotoboothFrame>>;
  branding: BusinessBranding;
  setBranding: React.Dispatch<React.SetStateAction<BusinessBranding>>;
  isCardFlipped: boolean;
  setIsCardFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  freeGift: FreeGiftOffer;
  setFreeGift: React.Dispatch<React.SetStateAction<FreeGiftOffer>>;
  activePaletteId: string;
  setActivePaletteId: React.Dispatch<React.SetStateAction<string>>;
  allowCustomerColors: boolean;
  setAllowCustomerColors: React.Dispatch<React.SetStateAction<boolean>>;
  allowedColorIds: string[];
  setAllowedColorIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTemplateId: string;
  setSelectedTemplateId: React.Dispatch<React.SetStateAction<string>>;
  cardMode: PhotoboothCardMode;
  setCardMode: React.Dispatch<React.SetStateAction<PhotoboothCardMode>>;
  allowCustomerStickers: boolean;
  setAllowCustomerStickers: React.Dispatch<React.SetStateAction<boolean>>;
  lockFrameForCustomers: boolean;
  setLockFrameForCustomers: React.Dispatch<React.SetStateAction<boolean>>;
  businessType: BusinessType;
  setBusinessType: React.Dispatch<React.SetStateAction<BusinessType>>;
  dimensionsPreset: string;
  setDimensionsPreset: React.Dispatch<React.SetStateAction<string>>;
  widthCm: number;
  setWidthCm: React.Dispatch<React.SetStateAction<number>>;
  heightCm: number;
  setHeightCm: React.Dispatch<React.SetStateAction<number>>;
  frameShape: FrameShapeStyle;
  setFrameShape: React.Dispatch<React.SetStateAction<FrameShapeStyle>>;
  borderRadius: number;
  setBorderRadius: React.Dispatch<React.SetStateAction<number>>;
  badgeText: string;
  setBadgeText: React.Dispatch<React.SetStateAction<string>>;
  customText: string;
  setCustomText: React.Dispatch<React.SetStateAction<string>>;
  previewStickers: PlacedSticker[];
  setPreviewStickers: React.Dispatch<React.SetStateAction<PlacedSticker[]>>;
  isSavedNotice: boolean;
  isCustomColorMode: boolean;
  setIsCustomColorMode: React.Dispatch<React.SetStateAction<boolean>>;
  customBg: string;
  setCustomBg: React.Dispatch<React.SetStateAction<string>>;
  customBorder: string;
  setCustomBorder: React.Dispatch<React.SetStateAction<string>>;
  customTextColor: string;
  setCustomTextColor: React.Dispatch<React.SetStateAction<string>>;
  customAccent: string;
  setCustomAccent: React.Dispatch<React.SetStateAction<string>>;
  samplePhotos: string[];
  handlePreviewAddSticker: (emoji: string) => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleShotCountChange: (count: number) => void;
  handleOrientationChange: (orientation: StripOrientation) => void;
  handleSelectDimensionPreset: (presetId: string) => void;
  handleCustomDimensionChange: (newWidth: number, newHeight: number) => void;
  handleBorderRadiusChange: (radius: number) => void;
  handleSelectFrameShape: (shape: FrameShapeStyle) => void;
  handleSelectTemplate: (templateId: string) => void;
  handleSelectPalette: (palette: CardColorPalette) => void;
  handleToggleAllowedColor: (paletteId: string) => void;
  handleSelectEmojiPair: (topRight: string, bottomLeft: string) => void;
  handleSaveAll: () => void;
}
