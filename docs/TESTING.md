# Testing Strategy & Verification Guide — Café Memories

**Framework:** Vitest 5.0.1 + React Testing Library + Native Node Mocking  
**Testing Philosophy:** Behavior-Driven, Zero AI-Bloat, High-Leverage Verification  
**Standard:** Clean Code Guard & Test Guard Imperatives  

---

## 1. Testing Pyramid & Objectives

```
          /\
         /  \      E2E Verification (Playwright / Chrome DevTools)
        /────\
       /      \    Integration & Multi-Tenant RLS Security Tests
      /────────\
     /          \  Unit Tests (Anti-Fraud, Reward Rules, Validation Schemas)
    /────────────\
```

1. **Unit Tests:** Fast, in-memory execution (< 2s total). Exercises pure business logic: anti-fraud 60-minute visit cooldown calculations, reward tier thresholds, and Zod input boundary guards.
2. **Integration Tests:** Verifies API contracts, idempotency handling, and multi-tenant isolation rules.
3. **Security & RLS Tests:** Validates that tenant boundaries cannot be breached, ensuring Customer A cannot read Customer B's records and Org X cannot access Org Y's data.

---

## 2. Test Guard Rules Compliance

Every test in this repository adheres to the **Nine Sacred Rules of Test Guard**:

- **Rule 1 (Behavior, Not Implementation):** Tests assert observable state changes (e.g. visit status set to `verified` or `cooldown_rejected`), never whether an internal helper was invoked.
- **Rule 2 (Justified Mocks Only):** Mocks exist solely at external network boundaries (Supabase API network calls). Internal domain calculators run with 100% real code.
- **Rule 3 (Data-Driven Scenarios):** Boundary matrices (e.g., test visit timestamps at 59 min vs 61 min) run via `it.each` or parameterized tables.
- **Rule 8 (Real State Objects):** Customer entities, visit payloads, and reward rules are constructed as real TypeScript records, never mocked interfaces.

---

## 3. Test Suite Inventory

### Unit & Domain Services (`tests/unit/`)
- `anti-fraud.test.ts`:
  - Enforces 60-minute cooldown per device.
  - Flags high-velocity IP bursts as `suspicious`.
  - Grants instant approval for legitimate spaced visits.
- `rewards.test.ts`:
  - Correctly calculates reward unlock at exact threshold (e.g. visit 5).
  - Handles streak increments and streak breaks.
  - Prevents negative balances or double redemptions.
- `validation.test.ts`:
  - Validates UUID formatting, string bounds, and enum invariants.
  - Rejects malicious payload injections and oversized inputs.

### Integration & Security (`tests/integration/`)
- `tenant-isolation.test.ts`:
  - Asserts that queries parameterized with `org_a` never return entities belonging to `org_b`.
- `idempotency.test.ts`:
  - Validates that repeating an identical reward redemption request with the same `idempotency_key` returns the original receipt without double-deduction.

---

## 4. Execution Commands

```bash
# Run entire test suite once
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with code coverage report
npx vitest run --coverage
```
