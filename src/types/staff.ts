/**
 * Staff domain types for the Quick PIN Switcher.
 *
 * Baristas share a single tablet; the modal lets staff switch the active
 * session between members without a full re-login.
 */

export type StaffRole = 'barista' | 'shift_lead' | 'manager';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  avatarUrl?: string;
}

/** A PIN credential owned by exactly one staff member. */
export interface StaffPinCredential {
  staffId: string;
  /** Plain digits only — secure POS-lite store, never render this value. */
  pin: string;
}

export interface ActiveStaffSession {
  staffId: string;
  /** Epoch ms of when this member became active. */
  switchedAt: number;
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  barista: 'Barista',
  shift_lead: 'Shift Lead',
  manager: 'Manager',
};

/**
 * Roster of staff sharing the tablet in the POS-lite workflow.
 */
export const STAFF_ROSTER: StaffMember[] = [
  { id: 'staff-1', name: 'Layla Haddad', role: 'barista', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Layla' },
  { id: 'staff-2', name: 'Omar Nasser', role: 'barista', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Omar' },
  { id: 'staff-3', name: 'Sara Khaled', role: 'shift_lead', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sara' },
  { id: 'staff-4', name: 'Yousef Amin', role: 'manager', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Yousef' },
];
