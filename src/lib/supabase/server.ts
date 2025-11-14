// FILE: src/lib/supabase/server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
// --- CORRECTIVE ACTION 1: Import the base client for server-to-server operations ---
import { createClient } from '@supabase/supabase-js';

// This function is for use in Server Components, Server Actions, and Route Handlers.
// It creates a Supabase client that can read and write cookies.
// THIS FUNCTION IS CORRECT AND REMAINS UNCHANGED.
export const createSupabaseServerClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // This can happen in Server Components. The error is expected and can be ignored.
          }
        },
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

// --- CORRECTIVE ACTION 2: Reconfigure the Admin Client ---
// This function is for privileged, server-to-server operations that need to bypass RLS.
// It must use the base `createClient` with the service role key, not the SSR-specific client.
export const createSupabaseAdminClient = () => {
    // Using the correct 'createClient' function for a service role client.
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
        // The third 'cookies' argument is not required here, which resolves the build error.
    );
}