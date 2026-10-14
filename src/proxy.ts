import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refresh Supabase cookies; authorization lives in layouts and route handlers. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    return NextResponse.redirect(new URL("/login", request.url));
  try {
    const db = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    const {
      data: { user },
      error,
    } = await db.auth.getUser();
    if (error || !user) {
      const redirect = new URL("/login", request.url);
      redirect.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirect);
    }
  } catch (error) {
    console.error("Session refresh failed:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/terminal/:path*",
    "/barista/:path*",
    // /brand is the merchant page; /brand/* hosts the official public logo/PWA assets.
    // The layout protects the page too. Never intercept its static descendants.
    "/brand",
    "/crm/:path*",
    "/campaigns/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
  ],
};
