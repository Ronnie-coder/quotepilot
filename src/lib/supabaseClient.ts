// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export const createSupabaseClient = (supabaseToken: string) => {
  // Re-initialize the client with the new token for every request
  // This is crucial for client-side operations where the user can change.
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseToken}`,
        },
      },
    }
  );
  return supabase;
};