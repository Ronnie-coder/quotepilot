// FILE: src/lib/supabase/server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// This function is for use in Server Components, Server Actions, and Route Handlers.
// It creates a Supabase client that can read and write cookies.
export const createSupabaseServerClient = () => {
  // Get the cookie store from the Next.js headers
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // The get method is used to read cookies
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // The set method is used to write cookies (in Server Actions/Route Handlers)
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // This can happen in Server Components. The error is expected and can be ignored.
            // The library will still work in read-only mode.
          }
        },
        // The remove method is used to delete cookies (in Server Actions/Route Handlers)
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // This can happen in Server Components. The error is expected and can be ignored.
          }
        },
      },
    }
  );
};

// This function is a legacy or alternative pattern. For now, we will rely on the single, robust
// function above. You can remove this if it's not being used elsewhere.
export const createSupabaseAdminClient = () => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}