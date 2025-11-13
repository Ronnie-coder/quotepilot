// FILE: src/middleware.ts
// MISSION: FINAL STABILIZATION - REFINE REDIRECT LOGIC

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return req.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { res.cookies.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { res.cookies.set({ name, value: '', ...options }) },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  const publicPaths = ['/', '/sign-in', '/sign-up', '/forgot-password', '/update-password', '/callback'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If user is not logged in and trying to access a protected route, redirect to sign-in
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  if (user) {
    // If a logged-in user tries to access auth pages, send them to the dashboard.
    const authPaths = ['/', '/sign-in', '/sign-up', '/forgot-password'];
    if (authPaths.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // [TARGET MODIFIED] The onboarding check is now scoped ONLY to dashboard routes.
    // This prevents it from interfering with other flows like password updates.
    if (pathname.startsWith('/dashboard') && pathname !== '/dashboard/settings') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('id', user.id)
        .single();
      
      if (!profile || !profile.company_name) {
        const redirectUrl = new URL('/dashboard/settings', req.url);
        redirectUrl.searchParams.set('onboarding', 'true');
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};