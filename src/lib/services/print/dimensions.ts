import type { PrintDimensions, PrintFormat } from './types';

export function normalizePrintFormat(raw?: string): PrintFormat {
  if (!raw) return 'standard-2x6';
  const str = raw.toLowerCase().trim();
  if (
    str === 'dual-4x6' ||
    str === '4x6' ||
    str === 'grid_4x6' ||
    str.includes('dual') ||
    str.includes('مزدوج')
  ) {
    return 'dual-4x6';
  }
  if (
    str === 'thermal-80mm' ||
    str === 'thermal-80' ||
    str === '80mm' ||
    str === '80' ||
    str.includes('80')
  ) {
    return 'thermal-80mm';
  }
  if (
    str === 'thermal-58mm' ||
    str === 'thermal-58' ||
    str === '58mm' ||
    str === '58' ||
    str.includes('58')
  ) {
    return 'thermal-58mm';
  }
  if (str.includes('thermal') || str.includes('حرار')) {
    return 'thermal-80mm';
  }
  return 'standard-2x6';
}

export function getPrintDimensions(rawFormat?: PrintFormat | string): PrintDimensions {
  const format = normalizePrintFormat(rawFormat);
  switch (format) {
    case 'standard-2x6':
      return {
        format: 'standard-2x6',
        nameAr: 'شريط فوتوبوث كلاسيكي (2×6 بوصة)',
        nameEn: 'Standard Photobooth Strip (2x6 in)',
        widthMm: 50.8,
        heightMm: 152.4,
        widthInches: 2,
        heightInches: 6,
        widthPx300Dpi: 600,
        heightPx300Dpi: 1800,
        aspectRatio: 2 / 6,
        isDualStrip: false,
        isThermal: false,
      };
    case 'dual-4x6':
      return {
        format: 'dual-4x6',
        nameAr: 'شريطان مزدوجان (4×6 بوصة مع خط قص)',
        nameEn: 'Dual Photobooth Strip (4x6 in)',
        widthMm: 101.6,
        heightMm: 152.4,
        widthInches: 4,
        heightInches: 6,
        widthPx300Dpi: 1200,
        heightPx300Dpi: 1800,
        aspectRatio: 4 / 6,
        isDualStrip: true,
        isThermal: false,
      };
    case 'thermal-80mm':
      return {
        format: 'thermal-80mm',
        nameAr: 'طابعة ملصقات وإيصالات حرارية (80 مم)',
        nameEn: 'Thermal Sticker/Receipt (80mm)',
        widthMm: 80,
        heightMm: 200,
        widthInches: 80 / 25.4,
        heightInches: 200 / 25.4,
        widthPx300Dpi: Math.round((80 / 25.4) * 300),
        heightPx300Dpi: Math.round((200 / 25.4) * 300),
        aspectRatio: 80 / 200,
        isDualStrip: false,
        isThermal: true,
        rollWidthMm: 80,
      };
    case 'thermal-58mm':
      return {
        format: 'thermal-58mm',
        nameAr: 'طابعة ملصقات حرارية مدمجة (58 مم)',
        nameEn: 'Compact Thermal Sticker (58mm)',
        widthMm: 58,
        heightMm: 150,
        widthInches: 58 / 25.4,
        heightInches: 150 / 25.4,
        widthPx300Dpi: Math.round((58 / 25.4) * 300),
        heightPx300Dpi: Math.round((150 / 25.4) * 300),
        aspectRatio: 58 / 150,
        isDualStrip: false,
        isThermal: true,
        rollWidthMm: 58,
      };
  }
}
