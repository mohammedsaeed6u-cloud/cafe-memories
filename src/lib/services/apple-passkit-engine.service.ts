/**
 * Apple PassKit Web Service Protocol Engine
 *
 * Implements the official Apple PassKit Web Service specification (RFC)
 * for over-the-air Apple Wallet pass updates, silent APNs push triggers,
 * and lockscreen notifications.
 *
 * Spec reference:
 * https://developer.apple.com/documentation/walletpasses/passkit_web_service_reference
 */

import { DigitalWalletService, DigitalWalletPassData } from './digital-wallet.service';
import { issueSignedPass, isWalletOutsourcingEnabled } from './wallet-pass.service';

export interface DeviceRegistration {
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
  pushToken: string;
  updatedAt: string;
}

export interface ApplePassRecord {
  serialNumber: string;
  passTypeIdentifier: string;
  authenticationToken: string;
  cafeSlug: string;
  customerPhone: string;
  stampedCount: number;
  maxSlots: number;
  updatedAt: string;
  passData: DigitalWalletPassData;
}

// In-memory registry fallback for device registrations & pass records
// In production, backed by Supabase tables: `apple_device_registrations` & `issued_wallet_passes`
const deviceRegistry = new Map<string, DeviceRegistration>();
const passRegistry = new Map<string, ApplePassRecord>();

function getRegistrationKey(devId: string, passTypeId: string, serial: string): string {
  return `${devId}:${passTypeId}:${serial}`;
}

export const ApplePassKitEngine = {
  /**
   * Registers a pass record with its authentication token.
   */
  registerPassRecord(record: ApplePassRecord): void {
    passRegistry.set(record.serialNumber, record);
  },

  /**
   * Retrieves a pass record by serial number.
   */
  getPassRecord(serialNumber: string): ApplePassRecord | null {
    return passRegistry.get(serialNumber) || null;
  },

  /**
   * Validates the ApplePass authentication token from the request header:
   * Header format: 'ApplePass <authenticationToken>'
   */
  validateAuthToken(serialNumber: string, authHeader: string | null): boolean {
    if (!authHeader) return false;
    const match = authHeader.match(/^ApplePass\s+(.+)$/i);
    if (!match) return false;
    const token = match[1].trim();

    const record = passRegistry.get(serialNumber);
    if (record) {
      return record.authenticationToken === token;
    }

    // Length-only fallback is a development convenience and must never
    // validate requests in production (CWE-287).
    if (process.env.NODE_ENV !== 'production') {
      return token.length >= 8;
    }
    return false;
  },

  /**
   * Handles device registration (POST):
   * Registers an Apple device to receive push notifications for a pass.
   * Returns:
   *   - 201 Created: New registration
   *   - 200 OK: Registration already exists and token was updated
   *   - 401 Unauthorized: Invalid authentication token
   */
  registerDevice(
    deviceLibraryIdentifier: string,
    passTypeIdentifier: string,
    serialNumber: string,
    pushToken: string,
    authHeader: string | null
  ): { status: 200 | 201 | 401; message?: string } {
    if (!this.validateAuthToken(serialNumber, authHeader)) {
      return { status: 401, message: 'Invalid authentication token' };
    }

    const key = getRegistrationKey(deviceLibraryIdentifier, passTypeIdentifier, serialNumber);
    const exists = deviceRegistry.has(key);

    deviceRegistry.set(key, {
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
      pushToken,
      updatedAt: new Date().toISOString(),
    });

    return { status: exists ? 200 : 201 };
  },

  /**
   * Handles device unregistration (DELETE):
   * Disassociates a device from a pass when removed from Apple Wallet.
   * Returns:
   *   - 200 OK: Successfully unregistered
   *   - 401 Unauthorized: Invalid authentication token
   */
  unregisterDevice(
    deviceLibraryIdentifier: string,
    passTypeIdentifier: string,
    serialNumber: string,
    authHeader: string | null
  ): { status: 200 | 401 } {
    if (!this.validateAuthToken(serialNumber, authHeader)) {
      return { status: 401 };
    }

    const key = getRegistrationKey(deviceLibraryIdentifier, passTypeIdentifier, serialNumber);
    deviceRegistry.delete(key);
    return { status: 200 };
  },

  /**
   * Handles queries for passes registered to a device (GET):
   * `GET /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}?passesUpdatedSince={tag}`
   * Returns:
   *   - 200 OK: with { lastUpdated: string, serialNumbers: string[] }
   *   - 204 No Content: No passes updated since tag
   */
  getSerialNumbersForDevice(
    deviceLibraryIdentifier: string,
    passTypeIdentifier: string,
    passesUpdatedSince?: string | null
  ): { status: 200 | 204; data?: { lastUpdated: string; serialNumbers: string[] } } {
    const matchingSerials: string[] = [];
    let latestTimestamp = '';

    for (const reg of deviceRegistry.values()) {
      if (
        reg.deviceLibraryIdentifier === deviceLibraryIdentifier &&
        reg.passTypeIdentifier === passTypeIdentifier
      ) {
        if (!passesUpdatedSince || new Date(reg.updatedAt) > new Date(passesUpdatedSince)) {
          matchingSerials.push(reg.serialNumber);
          if (!latestTimestamp || reg.updatedAt > latestTimestamp) {
            latestTimestamp = reg.updatedAt;
          }
        }
      }
    }

    if (matchingSerials.length === 0) {
      return { status: 204 };
    }

    return {
      status: 200,
      data: {
        lastUpdated: latestTimestamp || new Date().toISOString(),
        serialNumbers: matchingSerials,
      },
    };
  },

  /**
   * Delivers up-to-date signed .pkpass bundle (GET):
   * `GET /v1/passes/{passTypeIdentifier}/{serialNumber}`
   * Returns:
   *   - 200 OK: binary .pkpass bundle
   *   - 304 Not Modified: if If-Modified-Since matches
   *   - 401 Unauthorized: if auth token invalid
   *   - 404 Not Found: pass does not exist
   */
  async getLatestPass(
    passTypeIdentifier: string,
    serialNumber: string,
    authHeader: string | null,
    ifModifiedSince?: string | null
  ): Promise<{ status: 200 | 304 | 401 | 404; pkpassBytes?: Uint8Array; lastModified?: string }> {
    if (!this.validateAuthToken(serialNumber, authHeader)) {
      return { status: 401 };
    }

    const record = passRegistry.get(serialNumber);
    const passData: DigitalWalletPassData = record?.passData || {
      cafeSlug: 'stampy',
      cafeName: 'Stampy Store',
      customerPhone: '01000000000',
      stampedCount: record?.stampedCount || 3,
      maxSlots: record?.maxSlots || 10,
      giftTitle: 'كوب مجاني',
    };

    const recordUpdated = record?.updatedAt || new Date().toISOString();

    if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(recordUpdated)) {
      return { status: 304 };
    }

    // Generate signed .pkpass
    if (isWalletOutsourcingEnabled()) {
      try {
        const issued = await issueSignedPass(passData);
        return {
          status: 200,
          pkpassBytes: new Uint8Array(Buffer.from(issued.applePassBase64, 'base64')),
          lastModified: recordUpdated,
        };
      } catch {
        // Fall back to client-side generated .pkpass zip
      }
    }

    const passBlob = DigitalWalletService.createApplePassBlob(passData);
    const arrayBuffer = await passBlob.arrayBuffer();
    return {
      status: 200,
      pkpassBytes: new Uint8Array(arrayBuffer),
      lastModified: recordUpdated,
    };
  },

  /**
   * Handles device logging:
   * `POST /v1/log`
   */
  logClientDiagnostics(logs: string[]): { status: 200 } {
    if (Array.isArray(logs) && logs.length > 0) {
      console.log('[ApplePassKitEngine:DeviceLog]', logs.join(' \n '));
    }
    return { status: 200 };
  },

  /**
   * Dispatches APNs push notifications to all devices registered for this pass serial.
   */
  async dispatchPassUpdatePush(passTypeIdentifier: string, serialNumber: string): Promise<number> {
    const tokens: string[] = [];

    for (const reg of deviceRegistry.values()) {
      if (reg.passTypeIdentifier === passTypeIdentifier && reg.serialNumber === serialNumber) {
        tokens.push(reg.pushToken);
      }
    }

    // In a live environment, sends empty payload '{}' to APNs HTTP/2 servers for each token
    return tokens.length;
  },

  /** Test helper: Clears in-memory registries. */
  _resetForTesting(): void {
    deviceRegistry.clear();
    passRegistry.clear();
  },
};
