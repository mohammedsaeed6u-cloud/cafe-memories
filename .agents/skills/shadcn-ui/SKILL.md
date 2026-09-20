---
name: shadcn-ui
description: Professional shadcn/ui design and component composition skill. Use when creating, customizing, or structuring UI components with shadcn/ui, Radix UI primitives, Tailwind CSS, Lucide icons, and accessible forms/dialogs/tables.
---

# shadcn/ui Component Architecture & Design Skill

## 1. CLI Usage & Component Addition
- Use pnpm dlx shadcn@latest add <component> or unx --bun shadcn@latest add <component> to add primitives.
- Never manually re-create primitives that exist in shadcn (e.g. dialog, sheet, popover, dropdown-menu, 	abs, 	able, orm, vatar, 	oast).
- Always inspect components.json to verify path aliases (@/components/ui, @/lib/utils).

## 2. Component Composition Rules
- **Slot Pattern:** Prefer sChild composition from Radix primitives to maintain semantic markup (<Button asChild><Link href="/login">Login</Link></Button>).
- **Compound Components:** Group subcomponents cleanly (e.g. <Card>, <CardHeader>, <CardTitle>, <CardDescription>, <CardContent>, <CardFooter>).
- **Styling Merging:** Always merge custom className props using cn() from @/lib/utils.

## 3. Responsive & Touch Layouts
- Mobile navigation: Use <Sheet> for slide-over sidebars on < md viewports.
- Actions: Place primary action buttons in easy thumb-reach zones on mobile.
- Minimum touch target: 44x44px on interactive elements.

## 4. Forms & Validation
- Always integrate eact-hook-form with @hookform/resolvers/zod and shadcn's <Form>, <FormField>, <FormItem>, <FormLabel>, <FormControl>, <FormMessage>.
- Client-side validation must mirror server-side Zod schemas for instant user feedback.
