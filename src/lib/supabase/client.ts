// src/lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr';

// Define a function that creates a Supabase client for use in client components
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}