export type PrintFormat =
  | 'standard-2x6'
  | 'dual-4x6'
  | 'thermal-80mm'
  | 'thermal-58mm';

export interface PrintDimensions {
  format: PrintFormat;
  nameAr: string;
  nameEn: string;
  widthMm: number;
  heightMm: number;
  widthInches: number;
  heightInches: number;
  widthPx300Dpi: number;
  heightPx300Dpi: number;
  aspectRatio: number;
  isDualStrip: boolean;
  isThermal: boolean;
  rollWidthMm?: number;
}

export interface PrintCSSOptions {
  format?: PrintFormat | string;
  highContrast?: boolean;
  showCutLine?: boolean;
  cutLineStyle?: 'dashed' | 'dotted' | 'solid';
}

export interface PrintJobOptions {
  format?: PrintFormat | string;
  secondStripUrl?: string;
  highContrast?: boolean;
  showCutLine?: boolean;
  cutLineStyle?: 'dashed' | 'dotted' | 'solid';
  title?: string;
}
