import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // "next" defaults to /dashboard if not provided
  let next = searchParams.get('next') ?? '/dashboard';

  // Security Check: Ensure redirect is relative
  if (!next.startsWith('/')) {
    next = '/dashboard';
  }

  if (code) {
    // 🟢 FIX: Added 'await' here.
    // The client creation is now async in Next.js 15+ / 16
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host'); // Original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        // Localhost: Direct redirect
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // Production/Vercel: Use the forwarded host to prevent mismatch errors
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        // Fallback
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
        console.error('Auth Code Exchange Error:', error);
    }
  }

  // Error State: Redirect to sign-in with a visible error
  return NextResponse.redirect(`${origin}/sign-in?error=Authentication Failed`);
}