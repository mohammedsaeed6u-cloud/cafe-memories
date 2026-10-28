import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import {
  validatePassStudioLink,
  issuePassStudioPass,
  updatePassStudioPass,
  checkPassStudioUsage,
  revokePassStudioPass,
} from '@/lib/server/passstudio';

const key = 'ps_live_testkey1234567890abcdef';
const passId = 'pass-template-123';
const instanceId = 'instance-uuid-456';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Pass Studio validation & link security', () => {
  it('validates authentic passstudio.com install links', () => {
    expect(validatePassStudioLink('https://www.thepassstudio.com/i/abc123token')).toBe(
      'https://www.thepassstudio.com/i/abc123token'
    );
    expect(validatePassStudioLink('https://www.thepassstudio.com/share/abc123token')).toBe(
      'https://www.thepassstudio.com/share/abc123token'
    );
    expect(validatePassStudioLink('http://www.thepassstudio.com/i/insecure')).toBeNull();
    expect(validatePassStudioLink('https://evil.com/i/token')).toBeNull();
    expect(validatePassStudioLink('https://www.thepassstudio.com/i/token?redirect=evil')).toBeNull();
  });
});

describe('Pass Studio API operations', () => {
  it('issues pass with proper body and returns serial & share URL', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          instanceId,
          addToWalletUrl: `https://www.thepassstudio.com/i/${instanceId}`,
          alreadyExisted: false,
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal('fetch', fetcher);

    const res = await issuePassStudioPass(key, passId, {
      barcodeValue: 'CUST-100',
      memberName: 'Test Member',
      points: '3 أختام',
      tier: 'Gold',
    });

    expect(res).toEqual({
      serialNumber: instanceId,
      shareUrl: `https://www.thepassstudio.com/i/${instanceId}`,
      reused: false,
    });
    expect(fetcher).toHaveBeenCalledWith(
      `https://www.passstudio.online/api/v1/passes/${passId}/issue`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: `Bearer ${key}` }),
      })
    );
  });

  it('updates pass fields with push notification', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, pushed: true }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetcher);

    const res = await updatePassStudioPass(
      key,
      instanceId,
      { points: '4 أختام' },
      'تم ختم زيارة جديدة!'
    );

    expect(res).toEqual({ ok: true, pushed: true });
    expect(fetcher).toHaveBeenCalledWith(
      'https://www.passstudio.online/api/v1/instances/fields',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ Authorization: `Bearer ${key}` }),
      })
    );
  });

  it('checks usage and remaining credits', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'user-1',
          billing: { credits: 50, plan: 'free' },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal('fetch', fetcher);

    const usage = await checkPassStudioUsage(key);
    expect(usage.remaining).toBe(50);
    expect(usage.plan).toBe('free');
  });

  it('revokes an instance safely', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetcher);

    const res = await revokePassStudioPass(key, instanceId);
    expect(res).toEqual({ ok: true });
  });
});
