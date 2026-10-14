import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyStaffSessionValue } from '@/lib/staff-session';
import { TenantSubdomainService } from '@/lib/services/tenant-subdomain.service';

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://api.dicebear.com https://api.qrserver.com https://*.supabase.co https://api.walletwallet.dev https://*.walletwallet.dev https://*.cloudflare.com https://*.cloudflareinsights.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.walletwallet.dev https://*.walletwallet.dev https://cloudflareinsights.com https://api.dicebear.com https://images.unsplash.com",
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

// Super Admin portal allowlist (server-side gate, CWE-862).
// Comma-separated emails; empty list = portal locked until configured.
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ALLOWED_ORIGINS = [
  'https://memories-c9w.pages.dev',
  'http://localhost:3000',
  'http://localhost:3001',
];

function resolveAllowedOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return '*';
  if (ALLOWED_ORIGINS.includes(requestOrigin) || requestOrigin.endsWith('.pages.dev')) {
    return requestOrigin;
  }
  return 'https://memories-c9w.pages.dev';
}

function applySecurityHeaders(res: NextResponse, isApi: boolean, requestOrigin?: string | null): NextResponse {
  res.headers.set('Content-Security-Policy', CSP_DIRECTIVES);
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  if (isApi) {
    const origin = resolveAllowedOrigin(requestOrigin || null);
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, apikey');
  }

  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');
  const origin = request.headers.get('origin');

  // Handle CORS preflight OPTIONS for API routes
  if (request.method === 'OPTIONS' && isApi) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': resolveAllowedOrigin(origin),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, apikey',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const code = searchParams.get('code');

  // If OAuth provider redirected to / or any page with a code, forward to callback handler
  // API routes may legitimately carry a "code" query param (voucher lookup);
  // only page navigation is forwarded to the OAuth callback handler.
  if (code && pathname !== '/auth/callback' && !isApi) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = '/auth/callback';
    return applySecurityHeaders(NextResponse.redirect(callbackUrl), isApi, origin);
  }

  // --- MULTI-TENANT SUBDOMAIN REWRITE ENGINE (Vercel Platforms & Dub.co Open-Source Pattern) ---
  const host = request.headers.get('host');
  const parsedHost = TenantSubdomainService.parseHostname(host);

  // If request arrives via a tenant subdomain (e.g. "barns.runtappy.com" or "barns.localhost:3000")
  if (parsedHost.type === 'tenant' && parsedHost.tenantSlug && !isApi) {
    const slug = parsedHost.tenantSlug;
    if (!pathname.startsWith('/c/') && !pathname.startsWith('/kiosk/') && !pathname.startsWith('/wall/')) {
      if (pathname === '/') {
        const rewrittenUrl = request.nextUrl.clone();
        rewrittenUrl.pathname = `/c/${slug}`;
        return applySecurityHeaders(NextResponse.rewrite(rewrittenUrl), isApi, origin);
      }
      if (pathname === '/kiosk') {
        const rewrittenUrl = request.nextUrl.clone();
        rewrittenUrl.pathname = `/kiosk/${slug}`;
        return applySecurityHeaders(NextResponse.rewrite(rewrittenUrl), isApi, origin);
      }
      if (pathname === '/wall' || pathname.startsWith('/wall/')) {
        const rewrittenUrl = request.nextUrl.clone();
        if (pathname === '/wall') {
          rewrittenUrl.pathname = '/wall/screen-1';
        }
        rewrittenUrl.searchParams.set('cafe', slug);
        return applySecurityHeaders(NextResponse.rewrite(rewrittenUrl), isApi, origin);
      }
    }
  }

  // If request is on app/dashboard subdomain (e.g. "app.runtappy.com")
  if (parsedHost.type === 'app' && !isApi && pathname === '/') {
    const rewrittenUrl = request.nextUrl.clone();
    rewrittenUrl.pathname = '/dashboard';
    return applySecurityHeaders(NextResponse.rewrite(rewrittenUrl), isApi, origin);
  }

  // If request is on wall signage subdomain (e.g. "wall.runtappy.com")
  if (parsedHost.type === 'wall' && !isApi && (pathname === '/' || !pathname.startsWith('/wall/'))) {
    const rewrittenUrl = request.nextUrl.clone();
    rewrittenUrl.pathname = pathname === '/' ? '/wall/screen-1' : `/wall${pathname}`;
    return applySecurityHeaders(NextResponse.rewrite(rewrittenUrl), isApi, origin);
  }

  const isPublicRoute = 
    pathname === '/' ||
    pathname.startsWith('/c/') ||
    pathname.startsWith('/kiosk/') ||
    pathname.startsWith('/go/') ||
    pathname.startsWith('/wall/') ||
    pathname === '/login' ||
    pathname === '/auth/callback';

  // Signed staff terminal cookie (httpOnly, HMAC-verified) grants dashboard access
  // for PIN-only shifts; replaces the forgeable memories_staff_session=1 check.
  const staffClaims = await verifyStaffSessionValue(
    request.cookies.get('stampy_staff_session')?.value
  );
  if (staffClaims) {
    if (pathname.startsWith('/admin')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return applySecurityHeaders(NextResponse.redirect(url), isApi, origin);
    }
    return applySecurityHeaders(supabaseResponse, isApi, origin);
  }

  // Better Auth Session token verification (supports local-first, dev, and production cookies)
  const hasBetterAuthSession = Boolean(
    request.cookies.get('stampy.session_token')?.value ||
    request.cookies.get('__Secure-stampy.session_token')?.value ||
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value
  );
  if (hasBetterAuthSession && !pathname.startsWith('/admin')) {
    return applySecurityHeaders(supabaseResponse, isApi, origin);
  }

  if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
    if (!isPublicRoute && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return applySecurityHeaders(NextResponse.redirect(url), isApi, origin);
    }
    return applySecurityHeaders(supabaseResponse, isApi, origin);
  }

  let user = null;
  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error('Middleware auth check error:', error);
  }

  if (!user && !isPublicRoute) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return applySecurityHeaders(NextResponse.redirect(url), isApi, origin);
    }
  }

  // Super Admin portal: authenticated user must also be on the server allowlist.
  // Staff cookies never unlock /admin; an empty allowlist locks it entirely.
  if (pathname.startsWith('/admin')) {
    const email = user?.email?.toLowerCase() || '';
    if (SUPER_ADMIN_EMAILS.length === 0 || !SUPER_ADMIN_EMAILS.includes(email)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return applySecurityHeaders(NextResponse.redirect(url), isApi, origin);
    }
  }

  return applySecurityHeaders(supabaseResponse, isApi, origin);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
