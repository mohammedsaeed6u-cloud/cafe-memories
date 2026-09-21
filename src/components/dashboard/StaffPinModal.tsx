'use client';

/**
 * StaffPinModal — Quick PIN Switcher for shared barista tablets.
 *
 * Flow: pick a staff member → key in their 4-digit PIN via the touch
 * numpad (or a physical keyboard) → session switches to that member.
 *
 * Features: staff roster with avatars, 4-dot PIN indicator with shake
 * animation on error, lockout countdown messaging, keyboard input
 * (0-9, Backspace, Enter, Escape), large touch targets, and visible
 * focus rings. Lockout state is derived from a countdown, so the numpad
 * re-enables itself the moment the cooldown expires.
 */

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  X,
  Delete,
  Eraser,
  Loader2,
  Lock,
  Check,
  UserRound,
} from 'lucide-react';

import {
  getRemainingLockoutSeconds,
  verifyStaffPin,
} from '@/lib/services/staff-auth.service';
import {
  STAFF_ROSTER,
  STAFF_ROLE_LABELS,
  type StaffMember,
} from '@/types/staff';
import { cn } from '@/lib/utils';

const PIN_LENGTH = 4;

interface StaffPinModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful PIN verification with the active staff member. */
  onSuccess?: (staff: StaffMember) => void;
  /** Roster override (mainly for tests/storybook); defaults to STAFF_ROSTER. */
  staffList?: StaffMember[];
}

interface RosterEntry extends StaffMember {
  lockedOutSeconds: number;
}

type Status = 'idle' | 'verifying' | 'error';

/**
 * Stateful body of the modal. Remounted fresh on every open by the
 * parent wrapper, so transient state (PIN, errors, lockout) resets
 * without a reset-on-open effect.
 */
const StaffPinModalBody: React.FC<{
  onClose: () => void;
  onSuccess?: (staff: StaffMember) => void;
  roster: StaffMember[];
}> = ({ onClose, onSuccess, roster }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const isLocked = lockoutRemaining > 0;

  // Countdown ticker while a lockout is active (async callback, not sync setState).
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(
      () => setLockoutRemaining((s) => Math.max(0, s - 1)),
      1000
    );
    return () => clearInterval(interval);
  }, [lockoutRemaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = useCallback(
    async (pinValue: string) => {
      if (!selectedId || status === 'verifying' || pinValue.length !== PIN_LENGTH) return;
      setStatus('verifying');
      setErrorMessage(null);

      const result = await verifyStaffPin(selectedId, pinValue);
      if (result.success && result.staff) {
        onSuccess?.(result.staff);
        onClose();
        return;
      }

      setErrorMessage(result.error ?? 'Verification failed.');
      const remaining = getRemainingLockoutSeconds(selectedId);
      if (remaining > 0) {
        setLockoutRemaining(remaining);
      } else {
        setStatus('error');
        setShakeKey((k) => k + 1);
      }
      setPin('');
    },
    [selectedId, status, onSuccess, onClose]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (isLocked || status === 'verifying') return;
      if (pin.length >= PIN_LENGTH) return;
      const next = pin + digit;
      setPin(next);
      if (status === 'error') setStatus('idle');
      // Auto-verify as soon as the 4th digit lands (touch or keyboard).
      if (next.length === PIN_LENGTH) void submit(next);
    },
    [isLocked, status, pin, submit]
  );

  const handleBackspace = useCallback(() => {
    if (isLocked) return;
    setPin((prev) => prev.slice(0, -1));
  }, [isLocked]);

  const handleClear = useCallback(() => {
    if (isLocked) return;
    setPin('');
    setStatus('idle');
  }, [isLocked]);

  // Physical keyboard support: 0-9 on main row or numpad.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === PIN_LENGTH) void submit(pin);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDigit, handleBackspace, onClose, submit, pin]);

  const selectedStaff = roster.find((m) => m.id === selectedId) ?? null;
  const inputDisabled = isLocked || status === 'verifying';

  const rosterEntries: RosterEntry[] = roster.map((member) => ({
    ...member,
    lockedOutSeconds: member.id === selectedId ? lockoutRemaining : 0,
  }));

  const numpadButtonClass = cn(
    'h-14 rounded-2xl bg-stone-100 text-xl font-black text-stone-800',
    'active:scale-95 active:bg-stone-200 transition',
    'disabled:opacity-40 disabled:active:scale-100',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600'
  );
  const utilityButtonClass = cn(
    'h-14 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center',
    'active:scale-95 transition disabled:opacity-40',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600'
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Staff quick PIN switcher"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-stone-900 shadow-2xl border border-stone-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close staff switcher"
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-black tracking-tight">Quick PIN Switcher</h2>
        <p className="text-xs text-stone-500 mt-1">
          {selectedStaff
            ? `Enter PIN for ${selectedStaff.name}`
            : 'Select a staff member to continue'}
        </p>

        {/* Staff selection */}
        <div className="mt-5 grid grid-cols-2 gap-2" role="listbox" aria-label="Staff members">
          {rosterEntries.map((member) => {
            const isSelected = member.id === selectedId;
            const isMemberLocked = member.lockedOutSeconds > 0;
            return (
              <button
                key={member.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={status === 'verifying'}
                onClick={() => {
                  setSelectedId(member.id);
                  setPin('');
                  setStatus('idle');
                  setErrorMessage(null);
                }}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600',
                  isSelected
                    ? 'border-amber-600 bg-amber-50 shadow-sm'
                    : 'border-stone-200 hover:bg-stone-50',
                  isMemberLocked && 'opacity-50'
                )}
              >
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-stone-200"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center">
                    <UserRound className="w-5 h-5 text-stone-400" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-xs font-bold truncate">{member.name}</span>
                  <span className="block text-[10px] text-stone-500">
                    {isMemberLocked
                      ? `Locked ${member.lockedOutSeconds}s`
                      : STAFF_ROLE_LABELS[member.role]}
                  </span>
                </span>
                {isSelected && <Check className="w-4 h-4 text-amber-600 ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* PIN dots */}
        <div
          key={shakeKey}
          className={cn(
            'mt-6 flex items-center justify-center gap-3',
            status === 'error' && 'animate-shake'
          )}
          data-testid="pin-dots"
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                'w-3.5 h-3.5 rounded-full border-2 transition-colors',
                i < pin.length
                  ? status === 'error'
                    ? 'bg-red-500 border-red-500'
                    : 'bg-amber-600 border-amber-600'
                  : 'border-stone-300 bg-transparent'
              )}
            />
          ))}
          <span className="sr-only" aria-live="polite">
            {pin.length} of {PIN_LENGTH} digits entered
          </span>
        </div>

        {/* Status / error message */}
        <div className="mt-3 min-h-[1.5rem] text-center text-xs font-bold" aria-live="assertive">
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 text-red-600">
              <Lock className="w-3.5 h-3.5" />
              Locked — retry in {lockoutRemaining}s
            </span>
          ) : status === 'verifying' ? (
            <span className="inline-flex items-center gap-1.5 text-stone-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying…
            </span>
          ) : status === 'error' && errorMessage ? (
            <span className="text-red-600">{errorMessage}</span>
          ) : null}
        </div>

        {/* Virtual numpad: 1-9, then Clear / 0 / Backspace */}
        <div className="mt-2 grid grid-cols-3 gap-2" aria-label="PIN numpad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              disabled={inputDisabled || !selectedId}
              className={numpadButtonClass}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            disabled={inputDisabled || !selectedId}
            aria-label="Clear PIN"
            className={utilityButtonClass}
          >
            <Eraser className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            disabled={inputDisabled || !selectedId}
            className={numpadButtonClass}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            disabled={inputDisabled || !selectedId}
            aria-label="Backspace"
            className={utilityButtonClass}
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const StaffPinModal: React.FC<StaffPinModalProps> = ({
  open,
  onClose,
  onSuccess,
  staffList,
}) => {
  if (!open) return null;
  return (
    <StaffPinModalBody
      key="staff-pin-modal"
      onClose={onClose}
      onSuccess={onSuccess}
      roster={staffList ?? STAFF_ROSTER}
    />
  );
};

export default StaffPinModal;
