/**
 * Staff Quick PIN authentication service.
 *
 * POS-lite flow: baristas share one tablet, so the "active staff" session
 * switches between members without a full re-login. Session + lockout
 * state lives in localStorage (browser) or in-memory (Node/tests).
 *
 * This is a client-side convenience gate for a shared tablet, NOT a
 * security boundary — real authorization stays server-side.
 */
import { staffPinSchema } from '@/lib/validations/staff';
import {
  STAFF_ROSTER,
  type ActiveStaffSession,
  type StaffMember,
} from '@/types/staff';

const SESSION_STORAGE_KEY = 'memories_active_staff_session_v1';
const LOCKOUT_STORAGE_KEY = 'memories_staff_lockout_v1';

/** Failed attempts allowed per staff member before lockout kicks in. */
export const MAX_FAILED_ATTEMPTS = 3;
/** Cooldown window once the attempt limit is hit. */
export const LOCKOUT_DURATION_MS = 30_000;

/**
 * Default PIN credentials, one per roster member. In backend sync, these
 * are salted hashes fetched securely.
 * Keys are staff IDs, values are 4-digit PINs.
 */
export const STAFF_PIN_CREDENTIALS: Record<string, string> = {
  'staff-1': '1234',
  'staff-2': '2345',
  'staff-3': '3456',
  'staff-4': '4567',
};

export interface StaffAuthResult {
  success: boolean;
  staff?: StaffMember;
  error?: string;
  /** Epoch ms when the active session switched (success only). */
  switchedAt?: number;
}

interface AttemptEntry {
  failedAttempts: number;
  lockoutUntil?: number;
}

type LockoutStore = Record<string, AttemptEntry>;

// --- storage plumbing (localStorage in browser, memory in Node/tests) ----

const memoryLockouts = new Map<string, AttemptEntry>();
const memorySession: { current: ActiveStaffSession | null } = { current: null };

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    console.error(`[staff-auth] Failed to read ${key}`, err);
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[staff-auth] Failed to write ${key}`, err);
  }
}

function removeFromStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.error(`[staff-auth] Failed to remove ${key}`, err);
  }
}

function getLockoutStore(): LockoutStore {
  if (!hasLocalStorage()) {
    return Object.fromEntries(memoryLockouts);
  }
  return readJson<LockoutStore>(LOCKOUT_STORAGE_KEY, {});
}

function setLockoutStore(store: LockoutStore): void {
  if (!hasLocalStorage()) {
    memoryLockouts.clear();
    for (const [key, entry] of Object.entries(store)) {
      memoryLockouts.set(key, entry);
    }
    return;
  }
  writeJson(LOCKOUT_STORAGE_KEY, store);
}

function emitSessionChanged(session: ActiveStaffSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent('memories-active-staff-changed', { detail: session })
    );
  } catch (err) {
    console.error('[staff-auth] Failed to emit session event', err);
  }
}

// --- lockout helpers ------------------------------------------------------

function getAttemptEntry(staffId: string): AttemptEntry {
  return getLockoutStore()[staffId] ?? { failedAttempts: 0 };
}

/** Seconds left in the lockout window, 0 when not locked out. */
export function getRemainingLockoutSeconds(staffId: string): number {
  const { lockoutUntil } = getAttemptEntry(staffId);
  if (!lockoutUntil) return 0;
  const remainingMs = lockoutUntil - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

export function isStaffLockedOut(staffId: string): boolean {
  return getRemainingLockoutSeconds(staffId) > 0;
}

function recordFailure(staffId: string): { lockedOut: boolean; failedAttempts: number } {
  const store = getLockoutStore();
  const entry = store[staffId] ?? { failedAttempts: 0 };
  const failedAttempts = entry.failedAttempts + 1;

  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    store[staffId] = { failedAttempts, lockoutUntil: Date.now() + LOCKOUT_DURATION_MS };
  } else {
    store[staffId] = { ...entry, failedAttempts };
  }
  setLockoutStore(store);

  return { lockedOut: failedAttempts >= MAX_FAILED_ATTEMPTS, failedAttempts };
}

function clearFailures(staffId: string): void {
  const store = getLockoutStore();
  if (store[staffId]) {
    delete store[staffId];
    setLockoutStore(store);
  }
}

// --- session management ---------------------------------------------------

/** Points the tablet's active session at the given staff member. */
export function switchActiveStaff(staffId: string): ActiveStaffSession | null {
  const staff = STAFF_ROSTER.find((member) => member.id === staffId);
  if (!staff) return null;

  const session: ActiveStaffSession = { staffId: staff.id, switchedAt: Date.now() };
  if (hasLocalStorage()) {
    writeJson(SESSION_STORAGE_KEY, session);
  } else {
    memorySession.current = session;
  }
  emitSessionChanged(session);
  return session;
}

export const setActiveStaffMember = switchActiveStaff;

export function getActiveStaffSession(): ActiveStaffSession | null {
  if (hasLocalStorage()) {
    return readJson<ActiveStaffSession | null>(SESSION_STORAGE_KEY, null);
  }
  return memorySession.current;
}

export function getActiveStaff(): StaffMember | null {
  const session = getActiveStaffSession();
  if (!session) return null;
  return STAFF_ROSTER.find((member) => member.id === session.staffId) ?? null;
}

export function clearActiveStaffSession(): void {
  if (hasLocalStorage()) {
    removeFromStorage(SESSION_STORAGE_KEY);
  }
  memorySession.current = null;
  emitSessionChanged(null);
}

/** Clears session AND lockout counters (used by tests / debug reset). */
export function resetStaffAuthState(): void {
  clearActiveStaffSession();
  if (hasLocalStorage()) {
    removeFromStorage(LOCKOUT_STORAGE_KEY);
  }
  memoryLockouts.clear();
}

// --- verification ---------------------------------------------------------

/**
 * Verifies a 4-digit Quick PIN for the given staff member.
 * Side effects: on success, activates the staff session and resets the
 * failure counter; on failure, increments the counter and triggers a
 * 30-second lockout after 3 consecutive failures.
 */
export async function verifyStaffPin(
  staffId: string,
  pin: string
): Promise<StaffAuthResult> {
  if (!staffId) {
    return { success: false, error: 'Select a staff member first.' };
  }

  const remainingLockout = getRemainingLockoutSeconds(staffId);
  if (remainingLockout > 0) {
    return {
      success: false,
      error: `Too many failed attempts. Try again in ${remainingLockout}s.`,
    };
  }

  const parsedPin = staffPinSchema.safeParse(pin);
  if (!parsedPin.success) {
    return { success: false, error: 'PIN must be exactly 4 digits.' };
  }

  const staff = STAFF_ROSTER.find((member) => member.id === staffId);
  if (!staff) {
    const { lockedOut } = recordFailure(staffId);
    return {
      success: false,
      error: lockedOut
        ? `Too many failed attempts. Locked for ${Math.ceil(LOCKOUT_DURATION_MS / 1000)}s.`
        : 'Unknown staff member.',
    };
  }

  const expectedPin = STAFF_PIN_CREDENTIALS[staffId];
  if (!expectedPin || pin !== expectedPin) {
    const { lockedOut, failedAttempts } = recordFailure(staffId);
    if (lockedOut) {
      return {
        success: false,
        error: `Too many failed attempts. Locked for ${Math.ceil(LOCKOUT_DURATION_MS / 1000)}s.`,
      };
    }
    const attemptsLeft = MAX_FAILED_ATTEMPTS - failedAttempts;
    return {
      success: false,
      error: `Incorrect PIN. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
    };
  }

  clearFailures(staffId);
  const session = switchActiveStaff(staff.id);
  return { success: true, staff, switchedAt: session?.switchedAt };
}
