---
name: stampy-ui-review
description: Use when implementing or reviewing STAMPY screens. Preserve approved identity while checking responsive RTL behavior, accessibility, async states and truthful user feedback.
---
# UI review
1. Read current approved tokens and the target component. Do not generate a new palette from a design skill when a brand exists. Escalate conflicting color approvals.
2. Reuse the installed accessible primitives and semantic components. This repository has Ark UI; do not assume Radix or shadcn components exist.
3. Cover loading, success, empty, error/retry and mutation-pending states. A failed query must not look like an empty list.
4. Match feedback to server truth: no success animation before commit, no claim that push arrived without evidence, no invented metrics.
5. Arabic RTL overall; explicit LTR for keypad, URLs, serials and ordered stamp slots where required. Test truncation, long venue names and mixed-direction text.
6. Check 360px mobile, tablet and desktop widths, keyboard navigation, visible focus, accessible labels, dialog focus/return, reduced motion and touch targets. Values are review targets, not a claim of device testing.
7. Distinguish brand ink/burgundy accents from accidental legacy dark surfaces. Do not blindly replace modal scrims or official wallet badge colors.
8. Use venue/space/guest language. Do not rename internal cafeSlug identifiers as a copy-edit without compatibility analysis.
9. Check media permission denial, upload failure, offline behavior and download limitations where relevant.
10. If browser tooling is available: record URL, viewport, scenario, screenshot and observed result. If unavailable: say visual review is blocked; static class inspection is not visual approval.
