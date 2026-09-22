import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get('code');

  // If OAuth provider redirected to / or any page with a code, forward to callback handler
  if (code && pathname !== '/auth/callback') {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = '/auth/callback';
    return NextResponse.redirect(callbackUrl);
  }

  const isPublicRoute = 
    pathname === '/' ||
    pathname.startsWith('/c/') ||
    pathname.startsWith('/go/') ||
    pathname.startsWith('/wall/') ||
    pathname === '/login' ||
    pathname === '/auth/callback';

  const hasStaffSession = request.cookies.has('memories_staff_session');
  if (hasStaffSession) {
    return supabaseResponse;
  }

  if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
    if (!isPublicRoute && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
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
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
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
