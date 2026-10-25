/**
 * Next.js 16 Proxy (formerly Middleware).
 *
 * Responsibilities:
 *   * attach CSP / HSTS / frame / sniffing headers to every response
 *   * answer CORS preflight for API routes
 *   * redirect unauthenticated page requests to /login
 *   * verify the signed staff cookie instead of the old forgeable
 *     `memories_staff_session` flag
 *   * restrict /admin to SUPER_ADMIN_EMAILS
 *
 * This is an optimistic gate for pages. Authorization for data always happens
 * again in the route handler / server context.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { STAFF_SESSION_COOKIE, verifyStaffSessionValue } from '@/lib/staff-session';

const isProduction = process.env.NODE_ENV === 'production';

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://api.dicebear.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.walletwallet.dev https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' blob: https://*.supabase.co",
].join('; ');

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP,
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self), payment=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-DNS-Prefetch-Control': 'off',
};

const PUBLIC_EXACT = new Set([
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/api/health',
  '/api/v1/staff-session',
  '/api/v1/customer/session',
]);

const PUBLIC_PREFIXES = ['/c/', '/go/', '/wall/'];
const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/barista', '/terminal'];

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|woff2?)$/i.test(pathname)
  );
}

function isPublic(pathname: string): boolean {
  return PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(key, value);
  return response;
}

function preflight(): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  response.headers.set('Access-Control-Max-Age', '86400');
  return withSecurityHeaders(response);
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (next.startsWith('/') && !next.startsWith('//')) url.searchParams.set('next', next);
  return withSecurityHeaders(NextResponse.redirect(url));
}

async function supabaseUser(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === 'OPTIONS') return preflight();
  if (isStaticAsset(pathname)) return NextResponse.next();

  // A provider may land on / or /login with ?code=; forward it to the PKCE handler.
  const code = request.nextUrl.searchParams.get('code');
  if (code && (pathname === '/' || pathname === '/login')) {
    const callback = request.nextUrl.clone();
    callback.pathname = '/auth/callback';
    return withSecurityHeaders(NextResponse.redirect(callback));
  }

  if (isPublic(pathname)) {
    return withSecurityHeaders(NextResponse.next({ request }));
  }

  if (!PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    // API routes enforce their own identity; public pages and unknown paths
    // only need the headers.
    return withSecurityHeaders(NextResponse.next({ request }));
  }

  const response = NextResponse.next({ request });
  const staffClaims = await verifyStaffSessionValue(request.cookies.get(STAFF_SESSION_COOKIE)?.value);
  const user = await supabaseUser(request, response);

  if (!user && !staffClaims) return redirectToLogin(request);

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!user) return redirectToLogin(request);
    const allowed = (process.env.SUPER_ADMIN_EMAILS ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
    if (!user.email || !allowed.includes(user.email.toLowerCase())) {
      const dashboard = request.nextUrl.clone();
      dashboard.pathname = '/dashboard';
      dashboard.search = '';
      return withSecurityHeaders(NextResponse.redirect(dashboard));
    }
  }

  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|woff2?)$).*)',
  ],
};
