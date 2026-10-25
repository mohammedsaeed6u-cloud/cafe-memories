/**
 * Photobooth presets, split by concern.
 *
 * Each module is pure data plus its own types. Import from this barrel (or from
 * the legacy `photobooth-presets` path, which re-exports it) so a change to
 * frames never touches palettes, dimensions, or industry defaults.
 */

export * from './personas';
export * from './palettes';
export * from './frames';
export * from './frame-templates';
export * from './stickers';
export * from './industries';
export * from './settings';
export * from './dimensions';
export * from './modes';
