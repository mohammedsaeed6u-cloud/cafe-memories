# Modern UI, Design System & Frontend Rules (cafe-memories)

## Design tokens over raw hex
- Brand colors live as CSS tokens in src/app/globals.css
  (`--color-primary: #c92a54`, surfaces, alabaster…). Tailwind arbitrary
  hex is legacy; prefer `bg-[var(--color-primary)]` or semantic classes.
- The berry palette (#c92a54) is the single brand hue — do not reintroduce
  old hex values in new code.

## State lifecycle (all four, always)
- Every async view handles Loading, Loaded, Empty (with a CTA), and Error
  (with retry). The loyalty card fetches server slots with a localStorage
  fallback and a live counter (`stampedCountLive`).

## Accessibility
- Interactive elements are real `<button>`/`<a>` with Arabic aria-labels
  (photo stamp slots announce "افتح صورة الختم N").
- Dialogs: `role="dialog"`, `aria-modal`, Escape/backdrop close, focus is
  moved by the browser to the first control (lightbox pattern).

## Interaction
- Destructive or external actions surface explicit UI state (saving,
  success, error message) — no silent button that "does nothing".
- Keep visuals in sync with reality: the wallet modal must never offer an
  install path the backend cannot deliver (honest fallback copy).
