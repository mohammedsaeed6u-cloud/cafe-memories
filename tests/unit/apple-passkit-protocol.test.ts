import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ApplePassKitEngine } from '@/lib/services/apple-passkit-engine.service';
import { GoogleWalletEngine } from '@/lib/services/google-wallet-engine.service';
import { POST as registerDevicePOST, DELETE as unregisterDeviceDELETE } from '@/app/api/v1/apple-pass-service/v1/devices/[deviceLibraryIdentifier]/registrations/[passTypeIdentifier]/[serialNumber]/route';
import { GET as getUpdatedPassesGET } from '@/app/api/v1/apple-pass-service/v1/devices/[deviceLibraryIdentifier]/registrations/[passTypeIdentifier]/route';
import { GET as getPassGET } from '@/app/api/v1/apple-pass-service/v1/passes/[passTypeIdentifier]/[serialNumber]/route';
import { POST as logPOST } from '@/app/api/v1/apple-pass-service/v1/log/route';

describe('Apple PassKit Web Service Protocol (RFC Engine)', () => {
  const PASS_TYPE = 'pass.com.stampy.loyalty';
  const SERIAL = 'SERIAL-TEST-001';
  const AUTH_TOKEN = 'secret-auth-token-12345';
  const DEVICE_ID = 'dev-lib-xyz-987';

  beforeEach(() => {
    ApplePassKitEngine._resetForTesting();
    ApplePassKitEngine.registerPassRecord({
      serialNumber: SERIAL,
      passTypeIdentifier: PASS_TYPE,
      authenticationToken: AUTH_TOKEN,
      cafeSlug: 'espresso-lab',
      customerPhone: '0501234567',
      stampedCount: 7,
      maxSlots: 10,
      updatedAt: '2026-10-18T10:00:00.000Z',
      passData: {
        cafeSlug: 'espresso-lab',
        cafeName: 'Espresso Lab',
        customerPhone: '0501234567',
        customerName: 'سارة المهيدب',
        stampedCount: 7,
        maxSlots: 10,
        giftTitle: 'Flat White مجاني',
      },
    });
  });

  it('rejects device registration when Authorization header is missing or invalid', async () => {
    const req = new NextRequest('http://localhost/v1/devices', {
      method: 'POST',
      body: JSON.stringify({ pushToken: 'apns-device-push-token-1' }),
    });

    const res = await registerDevicePOST(req, {
      params: Promise.resolve({
        deviceLibraryIdentifier: DEVICE_ID,
        passTypeIdentifier: PASS_TYPE,
        serialNumber: SERIAL,
      }),
    });

    expect(res.status).toBe(401);
  });

  it('registers a device successfully with 201 Created on first registration', async () => {
    const req = new NextRequest('http://localhost/v1/devices', {
      method: 'POST',
      headers: {
        authorization: `ApplePass ${AUTH_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ pushToken: 'apns-device-push-token-1' }),
    });

    const res = await registerDevicePOST(req, {
      params: Promise.resolve({
        deviceLibraryIdentifier: DEVICE_ID,
        passTypeIdentifier: PASS_TYPE,
        serialNumber: SERIAL,
      }),
    });

    expect(res.status).toBe(201);
  });

  it('returns 200 OK when device is already registered and updates push token', async () => {
    const req1 = new NextRequest('http://localhost/v1/devices', {
      method: 'POST',
      headers: {
        authorization: `ApplePass ${AUTH_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ pushToken: 'apns-token-initial' }),
    });

    await registerDevicePOST(req1, {
      params: Promise.resolve({
        deviceLibraryIdentifier: DEVICE_ID,
        passTypeIdentifier: PASS_TYPE,
        serialNumber: SERIAL,
      }),
    });

    // Re-registration
    const req2 = new NextRequest('http://localhost/v1/devices', {
      method: 'POST',
      headers: {
        authorization: `ApplePass ${AUTH_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ pushToken: 'apns-token-updated' }),
    });

    const res2 = await registerDevicePOST(req2, {
      params: Promise.resolve({
        deviceLibraryIdentifier: DEVICE_ID,
        passTypeIdentifier: PASS_TYPE,
        serialNumber: SERIAL,
      }),
    });

    expect(res2.status).toBe(200);
  });

  it('queries passes registered to device and returns matching serial numbers', async () => {
    // Register device first
    ApplePassKitEngine.registerDevice(DEVICE_ID, PASS_TYPE, SERIAL, 'push-token-xyz', `ApplePass ${AUTH_TOKEN}`);

    const req = new NextRequest('http://localhost/v1/devices');
    const res = await getUpdatedPassesGET(req, {
      params: Promise.resolve({
        deviceLibraryIdentifier: DEVICE_ID,
        passTypeIdentifier: PASS_TYPE,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.serialNumbers).toContain(SERIAL);
    expect(body.lastUpdated).toBeDefined();
  });

  it('returns 204 No Content when no passes have been modified since timestamp', async () => {
    ApplePassKitEngine.registerDevice(DEVICE_ID, PASS_TYPE, SERIAL, 'push-token-xyz', `ApplePass ${AUTH_TOKEN}`);

    // Query with future timestamp
    const req = new NextRequest('http://localhost/v1/devices?passesUpdatedSince=2099-01-01T00:00:00.000Z');
    const res = await getUpdatedPassesGET(req, {
      params: Promise.resolve({
        deviceLibraryIdentifier: DEVICE_ID,
        passTypeIdentifier: PASS_TYPE,
      }),
    });

    expect(res.status).toBe(204);
  });

  it('delivers the latest .pkpass bundle with proper Apple PassKit MIME type', async () => {
    const req = new NextRequest('http://localhost/v1/passes', {
      headers: {
        authorization: `ApplePass ${AUTH_TOKEN}`,
      },
    });

    const res = await getPassGET(req, {
      params: Promise.resolve({
        passTypeIdentifier: PASS_TYPE,
        serialNumber: SERIAL,
      }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/vnd.apple.pkpass');
  });

  it('returns 304 Not Modified when pass has not changed since If-Modified-Since', async () => {
    const req = new NextRequest('http://localhost/v1/passes', {
      headers: {
        authorization: `ApplePass ${AUTH_TOKEN}`,
        'if-modified-since': '2099-01-01T00:00:00.000Z',
      },
    });

    const res = await getPassGET(req, {
      params: Promise.resolve({
        passTypeIdentifier: PASS_TYPE,
        serialNumber: SERIAL,
      }),
    });

    expect(res.status).toBe(304);
  });

  it('unregisters device successfully on DELETE', async () => {
    ApplePassKitEngine.registerDevice(DEVICE_ID, PASS_TYPE, SERIAL, 'push-token-xyz', `ApplePass ${AUTH_TOKEN}`);

    const req = new NextRequest('http://localhost/v1/devices', {
      method: 'DELETE',
      headers: {
        authorization: `ApplePass ${AUTH_TOKEN}`,
      },
    });

    const res = await unregisterDeviceDELETE(req, {
      params: Promise.resolve({
        deviceLibraryIdentifier: DEVICE_ID,
        passTypeIdentifier: PASS_TYPE,
        serialNumber: SERIAL,
      }),
    });

    expect(res.status).toBe(200);

    // Verify querying now returns 204
    const checkResult = ApplePassKitEngine.getSerialNumbersForDevice(DEVICE_ID, PASS_TYPE);
    expect(checkResult.status).toBe(204);
  });

  it('captures client diagnostic error logs on POST /v1/log', async () => {
    const req = new NextRequest('http://localhost/v1/log', {
      method: 'POST',
      body: JSON.stringify({ logs: ['[Device Error] Pass downloaded successfully'] }),
    });

    const res = await logPOST(req);
    expect(res.status).toBe(200);
  });
});

describe('Google Wallet Passes Engine (REST Architecture)', () => {
  const samplePass = {
    cafeSlug: 'espresso-lab',
    cafeName: 'Espresso Lab',
    customerPhone: '0501234567',
    customerName: 'سارة المهيدب',
    stampedCount: 6,
    maxSlots: 10,
    giftTitle: 'Flat White مجاني',
    color: '#5b2d9e',
  };

  it('generates a compliant Google Wallet LoyaltyClass schema', () => {
    const loyaltyClass = GoogleWalletEngine.buildLoyaltyClass(samplePass, 'stampy_merchant');
    expect(loyaltyClass.id).toBe('stampy_merchant.espresso-lab_loyalty_class');
    expect(loyaltyClass.issuerName).toBe('Espresso Lab');
    expect(loyaltyClass.hexBackgroundColor).toBe('#5b2d9e');
    expect(loyaltyClass.reviewStatus).toBe('APPROVED');
  });

  it('generates a compliant Google Wallet LoyaltyObject schema with points and barcode', () => {
    const loyaltyObject = GoogleWalletEngine.buildLoyaltyObject(samplePass, 'stampy_merchant');
    expect(loyaltyObject.id).toBe('stampy_merchant.espresso-lab_0501234567_obj');
    expect(loyaltyObject.classId).toBe('stampy_merchant.espresso-lab_loyalty_class');
    expect(loyaltyObject.state).toBe('ACTIVE');
    expect(loyaltyObject.loyaltyPoints.balance.string).toBe('6/10');
    expect(loyaltyObject.barcode.type).toBe('QR_CODE');
  });

  it('generates a valid Save to Google Wallet deep link', () => {
    const saveUrl = GoogleWalletEngine.generateSaveUrl(samplePass, 'stampy_merchant');
    expect(saveUrl).toContain('https://pay.google.com/gp/v/save');
    expect(saveUrl).toContain('stampy_merchant.espresso-lab_loyalty_class');
    expect(saveUrl).toContain('stampy_merchant.espresso-lab_0501234567_obj');
  });
});
