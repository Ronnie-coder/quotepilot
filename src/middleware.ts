import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // 1. Create response placeholder
  const res = NextResponse.next();
  
  // 2. Initialize Supabase Client
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

  // 3. Check Session
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  const publicPaths = ['/', '/sign-in', '/sign-up', '/forgot-password', '/update-password', '/callback'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // RULE A: Protect Private Routes
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // RULE B: Redirect Logged-In Users away from Auth Pages
  if (user) {
    const authPaths = ['/', '/sign-in', '/sign-up', '/forgot-password'];
    if (authPaths.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // RULE C: Onboarding Check (Only on Dashboard)
    // Prevents "My Business" placeholder issue by forcing setup
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
  // 🟢 OPTIMIZED MATCHER: Excludes static files, images, icons to reduce noise
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};