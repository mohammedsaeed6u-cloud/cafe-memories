# Task Specification for Freebuff: Staff Shift Quick PIN Authentication

## Objective
Implement a 4-digit Quick PIN Switcher for baristas sharing a tablet in the café (`cafe-memories`), allowing rapid staff switching between orders without full re-login.

## Requirements

### 1. Types & Validation (`src/types/staff.ts` & `src/lib/validations/staff.ts`)
- Define `StaffMember` interface: `{ id: string; name: string; role: 'barista' | 'shift_lead' | 'manager'; avatarUrl?: string; }`
- Zod schema for validating a 4-digit numeric string PIN (`/^[0-9]{4}$/`).

### 2. Service Logic (`src/lib/services/staff-auth.service.ts`)
- Maintain in-memory or localStorage active staff session with switch timestamp.
- Function `verifyStaffPin(staffId: string, pin: string): Promise<{ success: boolean; staff?: StaffMember; error?: string }>`
- Add simulated lockout protection (e.g. after 3 failed attempts, 30-second cooldown).

### 3. UI Component (`src/components/dashboard/StaffPinModal.tsx`)
- Sleek modal with:
  - Staff selection (avatars/names).
  - Virtual 4-digit Touch Numpad (designed for iPad/tablet baristas: buttons 0-9, Backspace, Clear).
  - PIN dots indicator (masked 4 circles with active/error shake animation).
  - Keyboard listeners (allowing typing 0-9 directly on physical keyboard or numpad).
- Accessible and responsive with Tailwind CSS v4 & Lucide icons.

### 4. Unit Tests (`tests/unit/staff-pin.test.ts`)
- Test 4-digit PIN validation (valid vs invalid lengths, non-numeric).
- Test lockout counter on repeated failed attempts.
- Test successful verification returns the staff member.

## Acceptance Criteria
1. `npm run build` must succeed with zero TypeScript or Lint errors.
2. `npm test` must pass all existing tests + new unit tests in `tests/unit/staff-pin.test.ts`.
