// src/components/SyncClerkWithSupabase.tsx
"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function SyncClerkWithSupabase() {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const sync = async () => {
      if (isLoaded && isSignedIn) {
        console.log("Clerk is loaded and user is signed in. Attempting Supabase sync...");
        try {
          const token = await getToken({ template: "supabase" });
          if (!token) {
            console.error("❌ CRITICAL: Supabase JWT Template token not available from Clerk.");
            return;
          }

          // THE CORRECT, MODERN WAY TO SET THE SESSION
          const { error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: token, // Clerk's token acts as both
          });

          if (error) {
            console.error("❌ ERROR: Supabase setSession Error:", error.message);
          } else {
            console.log("✅ SUCCESS: Supabase session set from Clerk token!");
          }
        } catch (e: any) {
          console.error("❌ An unexpected catch block error occurred during Supabase sync:", e.message);
        }
      }
    };

    if (isLoaded) {
      sync();
    }
  }, [isLoaded, isSignedIn, getToken, supabase]);

  return null;
}