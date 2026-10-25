export interface ApiErrorBody {
  error?: string;
  message?: string;
  code?: string;
}

export interface GrowthResponse<T> {
  ok: boolean;
  status: number;
  body: T & ApiErrorBody;
}

export async function growthFetch<T>(
  url: string,
  init?: RequestInit
): Promise<GrowthResponse<T>> {
  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  return { ok: response.ok, status: response.status, body };
}

export function growthErrorMessage(body: ApiErrorBody, fallback: string): string {
  return body.error || body.message || fallback;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ar-EG').format(value);
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 1 }).format(value)}%`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function toLocalInput(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(
    value.getHours()
  )}:${pad(value.getMinutes())}`;
}
