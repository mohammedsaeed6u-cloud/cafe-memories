import 'server-only';
import { z } from 'zod';

const BASE = 'https://www.passstudio.online/api/v1';

const instanceIdSchema = z.string().min(6).max(128);
const apiKeySchema = z.string().regex(/^ps_live_[A-Za-z0-9_-]+$/);

const issueResponseSchema = z.object({
  instanceId: instanceIdSchema,
  addToWalletUrl: z.string().url(),
  shareUrl: z.string().url().optional().nullable(),
  alreadyExisted: z.boolean().optional(),
});

const meResponseSchema = z.object({
  id: z.string(),
  displayName: z.string().optional().nullable(),
  billing: z.object({
    credits: z.number().int(),
    plan: z.string(),
  }),
});

export function validatePassStudioLink(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.host !== 'www.thepassstudio.com') {
      return null;
    }
    if (!parsed.pathname.startsWith('/i/') && !parsed.pathname.startsWith('/share/')) {
      return null;
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function passStudioRequest(
  apiKey: string,
  path: string,
  method: 'GET' | 'POST' | 'PATCH',
  payload?: object
): Promise<unknown> {
  if (!apiKeySchema.safeParse(apiKey).success) {
    throw new Error('Pass Studio key unavailable');
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'Pass Studio credentials rejected'
        : response.status === 429
          ? 'Pass Studio quota reached'
          : `Pass Studio returned ${response.status}`
    );
  }

  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > 16 * 1024 * 1024) {
    throw new Error('Pass Studio response too large');
  }

  return response.json();
}

export async function checkPassStudioUsage(apiKey: string) {
  const result = await passStudioRequest(apiKey, '/me', 'GET');
  const parsed = meResponseSchema.safeParse(result);
  if (!parsed.success) throw new Error('Unexpected Pass Studio usage response');
  return {
    plan: parsed.data.billing.plan,
    remaining: parsed.data.billing.credits,
    limit: parsed.data.billing.credits,
    count: 0,
  };
}

export async function issuePassStudioPass(
  apiKey: string,
  passId: string,
  payload: {
    barcodeValue: string;
    memberName?: string;
    memberId?: string;
    points?: string;
    tier?: string;
  }
) {
  const body = {
    sendEmail: false,
    barcodeValue: payload.barcodeValue,
    fields: {
      ...(payload.memberName ? { memberName: payload.memberName } : {}),
      ...(payload.memberId ? { memberId: payload.memberId } : {}),
      ...(payload.points ? { points: payload.points } : {}),
      ...(payload.tier ? { tier: payload.tier } : {}),
    },
  };

  const result = await passStudioRequest(apiKey, `/passes/${encodeURIComponent(passId)}/issue`, 'POST', body);
  const parsed = issueResponseSchema.safeParse(result);
  if (!parsed.success) throw new Error('Unexpected Pass Studio issue response');

  const safeUrl = validatePassStudioLink(parsed.data.addToWalletUrl);
  if (!safeUrl) throw new Error('Unexpected Pass Studio install URL');

  return {
    serialNumber: parsed.data.instanceId,
    shareUrl: safeUrl,
    reused: parsed.data.alreadyExisted === true,
  };
}

export async function updatePassStudioPass(
  apiKey: string,
  instanceId: string,
  fields: Record<string, string>,
  message?: string
) {
  if (!instanceIdSchema.safeParse(instanceId).success) {
    throw new Error('Invalid Pass Studio instance ID');
  }

  const body = {
    instanceId,
    fields,
    ...(message ? { message } : {}),
  };

  const result = await passStudioRequest(apiKey, '/instances/fields', 'PATCH', body);
  const parsed = z.object({ ok: z.boolean(), pushed: z.boolean().optional() }).safeParse(result);
  if (!parsed.success || !parsed.data.ok) {
    throw new Error('Unexpected Pass Studio update response');
  }

  return { ok: true, pushed: parsed.data.pushed === true };
}

export async function revokePassStudioPass(apiKey: string, instanceId: string) {
  if (!instanceIdSchema.safeParse(instanceId).success) {
    throw new Error('Invalid Pass Studio instance ID');
  }

  const result = await passStudioRequest(apiKey, '/instances/revoke', 'POST', { instanceId });
  const parsed = z.object({ ok: z.boolean().optional() }).safeParse(result);
  if (!parsed.success) throw new Error('Pass Studio revocation not confirmed');
  return { ok: true };
}
