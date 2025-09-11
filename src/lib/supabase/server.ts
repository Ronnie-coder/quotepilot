// src/lib/supabase/server.ts (FULL REPLACEMENT)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

export const createSupabaseServerClient = async () => {
  const cookieStore = cookies();
  const { getToken } = auth();

  // CRITICAL: We get the token WITHOUT the template. This uses Clerk's default.
  const token = await getToken();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Manually set the session for this server-side instance.
  if (token) {
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // Clerk handles refresh tokens
    });
  }

  return supabase;
};