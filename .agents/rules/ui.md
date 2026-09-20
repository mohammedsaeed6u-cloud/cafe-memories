# Modern UI, Frontend & Design System Rules (قواعد تصميم وبناء الواجهات المتقدمة)

## 1. Design System & Component Architecture
- **Component Primitives (shadcn/ui & Radix):** Build on unstyled, accessible primitives (`@radix-ui/*`). Never invent custom dropdowns, dialogs, or popovers from scratch when battle-tested accessible primitives exist.
- **Composition over Inheritance:** Design components with slot composition (`asChild`, compound components like `<Card>`, `<CardHeader>`, `<CardContent>`) rather than massive prop-heavy god-components.
- **Icon Consistency:** Use a single, unified icon set throughout the application (e.g. `lucide-react`). Standardize icon sizing (`size-4`, `size-5`, `size-6`).

## 2. Tailwind CSS Discipline
- **Utility Order & Merging:** Always use `cn()` (`clsx` + `tailwind-merge`) when combining conditional classes or accepting `className` overrides in components.
- **Semantic Color Tokens:** Never hardcode raw hex values or arbitrary color values (`bg-[#123456]`). Use design tokens configured in CSS variables / Tailwind theme (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`).
- **Responsive Mobile-First:** Write styles mobile-first (`p-4 md:p-8 lg:p-12`). Ensure touch targets are at least 44x44px (`min-h-[44px] min-w-[44px]`) on mobile viewports.

## 3. Accessibility (a11y) & Focus States
- **Keyboard Navigation:** Every interactive element MUST be navigable and actionable via `Tab`, `Enter`, and `Space`. Modals and drawers must trap focus and close on `Escape`.
- **Focus Indicators:** Never remove focus outlines (`outline-none`) without providing an explicit replacement. Use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- **Semantic HTML:** Use `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`, `<aside>`, and `<header>` for page structure. Include `aria-label` on all icon-only buttons.

## 4. State, Loading & Micro-Interactions
- **Skeleton Loaders:** Use skeleton placeholders (`<Skeleton className="..." />`) that mirror the exact layout of the incoming data to eliminate Cumulative Layout Shift (CLS). Avoid generic center spinners where possible.
- **Empty & Error States:** Every data-driven view MUST implement 4 distinct states: Loading, Loaded with data, Empty state (with a clear call to action), and Error state (with a retry button).
- **Subtle Micro-Interactions:** Enhance interactive components with subtle hover, active, and focus transitions (`transition-all duration-200 ease-in-out`, `active:scale-95`).

## 5. Theme Support & Hydration
- **Dark Mode:** Implement dark mode via CSS class strategy (`next-themes` or Tailwind `dark:` variant).
- **Hydration Safe:** Avoid layout flash during hydration by suppressing hydration warnings on `<html>` where theme classes are applied (`suppressHydrationWarning`).
