/**
 * STRICT 8PX GRID SPACING DESIGN SYSTEM
 * Centralized Single Source of Truth for spacing tokens and component spacing models.
 * 
 * Rules:
 * 1. All spacing must be derived from the 8px grid.
 * 2. Ad-hoc pixel values (e.g., 13px, 17px, 23px, 31px) are strictly forbidden.
 * 3. Parent controls external spacing (layout rhythm); component controls internal spacing.
 * 4. Prefer `gap` for flex/grid siblings; reserve `margin` for asymmetric document flow.
 */

export const SPACING_PIXELS = {
  space0: 0,
  space1: 8,
  space2: 16,
  space3: 24,
  space4: 32,
  space5: 40,
  space6: 48,
  space7: 56,
  space8: 64,
  space9: 72,
  space10: 80,
  space11: 88,
  space12: 96,
  space13: 104,
  space14: 112,
  space15: 120,
} as const;

export type SpacingScaleKey = keyof typeof SPACING_PIXELS;

export const SPACING_TOKENS = {
  space0: 'var(--space-0)',   // 0px
  space1: 'var(--space-1)',   // 8px
  space2: 'var(--space-2)',   // 16px
  space3: 'var(--space-3)',   // 24px
  space4: 'var(--space-4)',   // 32px
  space5: 'var(--space-5)',   // 40px
  space6: 'var(--space-6)',   // 48px
  space7: 'var(--space-7)',   // 56px
  space8: 'var(--space-8)',   // 64px
  space9: 'var(--space-9)',   // 72px
  space10: 'var(--space-10)', // 80px
  space11: 'var(--space-11)', // 88px
  space12: 'var(--space-12)', // 96px
  space13: 'var(--space-13)', // 104px
  space14: 'var(--space-14)', // 112px
  space15: 'var(--space-15)', // 120px
} as const;

/**
 * Semantic Hierarchy Tokens mapping directly to the 8px grid.
 */
export const SPACING_HIERARCHY = {
  /** 8px: tightly related elements (icon ↔ label, label ↔ input, compact metadata) */
  micro: 'var(--space-micro)',
  /** 16px: input groups, button groups, card internal content, small blocks */
  component: 'var(--space-component)',
  /** 24px: related content groups, card sections, toolbar sections */
  subsection: 'var(--space-subsection)',
  /** 32px: major card separation, dashboard blocks, section internals */
  major: 'var(--space-major)',
  /** 48px: mobile page-level section separation */
  pageSm: 'var(--space-page-sm)',
  /** 64px: desktop page-level section separation */
  pageMd: 'var(--space-page-md)',
  /** 80px+: hero sections, major transitions */
  pageLg: 'var(--space-page-lg)',
} as const;

/**
 * Component Spacing Contracts according to Section 4.
 */
export const COMPONENT_SPACING_MODELS = {
  button: {
    iconLabelGap: 8,       // 'gap-2'
    buttonGroupGap: 8,     // 'gap-2'
    actionGroupGap: 16,    // 'gap-4'
    sectionSeparation: 24, // 'mt-6' / 'mb-6'
  },
  input: {
    labelControlGap: 8,    // 'gap-2' or 'mb-2'
    controlHelperGap: 8,   // 'mt-2'
    fieldToFieldGap: 16,   // 'gap-4' / 'space-y-4'
    formSectionGap: 24,    // 'gap-6' / 'space-y-6'
  },
  card: {
    paddingDefault: 24,    // 'p-6'
    paddingCompact: 16,    // 'p-4'
    paddingGenerous: 32,   // 'p-8'
    headerGap: 8,          // 'gap-2'
    headerToBody: 16,      // 'mb-4'
    bodySections: 16,      // 'gap-4'
    bodyToFooter: 24,      // 'mt-6'
    cardToCard: 24,        // 'gap-6'
  },
  modal: {
    edgePadding: 24,       // 'p-6'
    edgePaddingLg: 32,     // 'p-8'
    titleBodyGap: 16,      // 'gap-4'
    bodyActionsGap: 24,    // 'mt-6' / 'gap-6'
    actionGroupGap: 8,     // 'gap-2'
  },
  navigation: {
    iconLabelGap: 8,       // 'gap-2'
    itemStep: 8,           // Multiples of 8px
    sectionSeparation: 24, // 'gap-6'
  },
  table: {
    cellHorizontal: 16,    // 'px-4'
    cellVertical: 16,      // 'py-4'
    cellVerticalCompact: 8,// 'py-2'
    actionGap: 8,          // 'gap-2'
    tableToToolbar: 24,    // 'mt-6'
  },
  dashboard: {
    pageHeaderBottom: 32,  // 'mb-8'
    primaryContentBottom: 24,// 'mb-6'
    secondaryContentBottom: 32,// 'mb-8'
    widgetGridGap: 24,     // 'gap-6'
    sectionGridGap: 32,    // 'gap-8'
  },
  toast: {
    containerPadding: 16,  // 'p-4'
    iconContentGap: 8,     // 'gap-2'
    contentSections: 8,    // 'gap-2'
    toastToToast: 8,       // 'gap-2'
  },
} as const;

export function isValid8pxSpacing(pixels: number, allowSubGridExceptions = false): boolean {
  if (pixels === 0) return true;
  if (pixels % 8 === 0) return true;
  if (allowSubGridExceptions && (pixels === 1 || pixels === 2 || pixels === 4)) {
    return true;
  }
  return false;
}
