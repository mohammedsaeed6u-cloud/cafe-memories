/**
 * Compatibility barrel.
 *
 * The presets used to live in this one 1,500-line file. They now live in
 * `./photobooth/*` grouped by concern; this path stays so existing imports do
 * not churn. New code should import from `@/lib/constants/photobooth`.
 */

export * from './photobooth';
