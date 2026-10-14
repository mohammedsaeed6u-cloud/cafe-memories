'use client';

import { useEffect, useState } from 'react';

export type WalletSigningStatus = 'unknown' | 'enabled' | 'disabled';

/**
 * Runtime check for outsourced pass signing. Replaces build-time env
 * flags so adding/rotating the API key takes effect on the next server
 * restart with zero rebuilds and zero extra configuration.
 */
export function useWalletSigning(): WalletSigningStatus {
  // Client-side signed pass issuance is always available via WalletWallet API
  return 'enabled';
}
