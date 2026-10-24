import { describe, it, expect } from 'vitest';
import {
  LOCKSCREEN_MESSAGE_PRESETS,
  WALLET_BROADCAST_TEMPLATES,
  STAFF_NOTIFICATION_PRESETS,
} from '@/lib/constants/wallet-notification-presets';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Contract: all wallet-notification surfaces draw their message presets from
 * the shared constants module — no divergent local copies in components.
 * (Guards brand voice consistency across the merchant command center and the
 * staff notification modal.)
 */

const ROOT = path.resolve(__dirname, '../..');
const readSrc = (rel: string) =>
  readFileSync(path.join(ROOT, rel), 'utf8');

describe('wallet notification presets (shared module)', () => {
  it('lockscreen presets are concise (<= 128 chars, Apple Wallet relevantText limit)', () => {
    for (const msg of LOCKSCREEN_MESSAGE_PRESETS) {
      expect(msg.length).toBeLessThanOrEqual(128);
    }
    expect(LOCKSCREEN_MESSAGE_PRESETS.length).toBeGreaterThanOrEqual(3);
  });

  it('broadcast and staff templates are non-empty and emoji-led (brand voice)', () => {
    for (const list of [WALLET_BROADCAST_TEMPLATES, STAFF_NOTIFICATION_PRESETS]) {
      expect(list.length).toBeGreaterThanOrEqual(3);
      for (const msg of list) {
        expect(msg.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('command center imports from the shared module (no local template copies)', () => {
    const src = readSrc('src/components/dashboard/DashboardWalletCommandCenter.tsx');
    expect(src).toContain("from '@/lib/constants/wallet-notification-presets'");
    expect(src).toMatch(/const NOTIF_BROADCAST_TEMPLATES(: string[])? = WALLET_BROADCAST_TEMPLATES;/);
    expect(src).not.toMatch(/const NOTIF_BROADCAST_TEMPLATES = \[\n/);
  });

  it('staff notification modal imports from the shared module (no local copies)', () => {
    const src = readSrc('src/features/notifications/WalletNotificationModal.tsx');
    expect(src).toContain("from '@/lib/constants/wallet-notification-presets'");
    expect(src).toMatch(/const PRESET_MESSAGES(: string[])? = STAFF_NOTIFICATION_PRESETS;/);
    expect(src).not.toMatch(/const PRESET_MESSAGES = \[\n/);
  });
});
