import { describe, it, expect, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/wallet/pass/route';
import {
  buildWalletWalletRequest,
  isWalletOutsourcingEnabled,
} from '@/lib/services/wallet-pass.service';
import type { DigitalWalletPassData } from '@/lib/services/digital-wallet.service';

const sample: DigitalWalletPassData = {
  cafeSlug: 'demo',
  cafeName: 'Demo',
  customerPhone: '01055512345',
  customerName: 'أحمد',
  stampedCount: 3,
  maxSlots: 5,
  giftTitle: 'قهوة مجانية',
  instagramHandle: '@demo',
};

const ENV_SNAPSHOT = { ...process.env };

describe('buildWalletWalletRequest', () => {
  it('maps loyalty data onto the WalletWallet pass schema', () => {
    const body = buildWalletWalletRequest(sample);
    expect(body.barcodeFormat).toBe('QR');
    expect(body.barcodeValue).toContain('/c/demo?action=stamp');
    expect(body.barcodeValue).toContain('customer=01055512345');
    expect(body.logoText).toBe('Demo');
    expect(body.headerFields[0].value).toBe('3/5');
    expect(body.primaryFields[0].value).toBe('قهوة مجانية');
    expect(body.colorPreset).toBe('red');
    expect(body.sharingProhibited).toBe(true);
  });

  it('marks the reward as ready when the card is complete', () => {
    const body = buildWalletWalletRequest({ ...sample, stampedCount: 5 });
    expect(body.primaryFields[0].label).toContain('جاهزة');
    expect(body.secondaryFields[1].value).toContain('مكتمل');
  });
});

describe('isWalletOutsourcingEnabled', () => {
  afterEach(() => {
    process.env = ENV_SNAPSHOT;
  });

  it('enables with the key alone — one env var, zero flags', () => {
    expect(
      isWalletOutsourcingEnabled({ NEXT_PUBLIC_WALLETWALLET_ENABLED: '1', WALLETWALLET_API_KEY: 'ww_live_x' } as NodeJS.ProcessEnv)
    ).toBe(true);
    expect(isWalletOutsourcingEnabled({ NEXT_PUBLIC_WALLETWALLET_ENABLED: '1' } as NodeJS.ProcessEnv)).toBe(false);
    expect(isWalletOutsourcingEnabled({ WALLETWALLET_API_KEY: 'ww_live_x' } as NodeJS.ProcessEnv)).toBe(false);
    expect(isWalletOutsourcingEnabled({} as NodeJS.ProcessEnv)).toBe(false);
  });
});

describe('GET /api/v1/wallet/pass', () => {
  afterEach(() => {
    process.env = ENV_SNAPSHOT;
    vi.unstubAllGlobals();
  });

  function requestFor(query: string) {
    return new NextRequest(`http://localhost/api/v1/wallet/pass?${query}`);
  }

  it('answers 503 with a reason when outsourcing is disabled', async () => {
    process.env = { ...ENV_SNAPSHOT };
    delete process.env.NEXT_PUBLIC_WALLETWALLET_ENABLED;
    delete process.env.WALLETWALLET_API_KEY;
    const res = await GET(requestFor('cafe=demo&stamps=3&slots=5'));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe('signed_pass_unavailable');
  });

  it('returns the signed pkpass binary from the upstream envelope', async () => {
    process.env = {
      ...ENV_SNAPSHOT,
      NEXT_PUBLIC_WALLETWALLET_ENABLED: '1',
      WALLETWALLET_API_KEY: 'ww_live_test',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            serialNumber: 'sn-123',
            applePass: Buffer.from('PK_FAKE_PASS').toString('base64'),
            googleSaveUrl: 'https://pay.google.com/gp/v/save/x',
            shareUrl: 'https://api.walletwallet.dev/p/sn-123',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    const res = await GET(requestFor('cafe=demo&stamps=3&slots=5&name=Demo&phone=01055512345'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/vnd.apple.pkpass');
    expect(res.headers.get('X-Serial-Number')).toBe('sn-123');
    const text = await res.text();
    expect(text).toBe('PK_FAKE_PASS');
  });

  it('answers 502 when the upstream issuance fails', async () => {
    process.env = {
      ...ENV_SNAPSHOT,
      NEXT_PUBLIC_WALLETWALLET_ENABLED: '1',
      WALLETWALLET_API_KEY: 'ww_live_test',
    };
    vi.stubGlobal('fetch', vi.fn(async () => new Response('quota exceeded', { status: 429 })));
    const res = await GET(requestFor('cafe=demo'));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe('signed_pass_failed');
    expect(json.details).toContain('429');
  });
});
