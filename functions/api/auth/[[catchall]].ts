import { auth } from '@/lib/auth/auth';

const ALLOWED_ORIGINS = [
  'https://memories-c9w.pages.dev',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8788',
];

function resolveAllowedOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return 'https://memories-c9w.pages.dev';
  if (ALLOWED_ORIGINS.includes(requestOrigin) || requestOrigin.endsWith('.pages.dev')) {
    return requestOrigin;
  }
  return 'https://memories-c9w.pages.dev';
}

function corsHeaders(origin: string = 'https://memories-c9w.pages.dev') {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(origin),
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, apikey',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Cloudflare Pages Function catchall for /api/auth/*
 * Delegates incoming Cloudflare Pages HTTP requests directly to Better Auth handler
 */
export async function onRequest(context: any) {
  const { request } = context;
  const origin = request.headers.get('origin') || 'https://memories-c9w.pages.dev';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  try {
    const response = await auth.handler(request);

    // Clone headers to ensure CORS is present
    const newHeaders = new Headers(response.headers);
    const cors = corsHeaders(origin);
    Object.entries(cors).forEach(([k, v]) => {
      newHeaders.set(k, v);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Auth Error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      }
    );
  }
}
