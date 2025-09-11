// src/providers/SupabaseProvider.tsx (FULL REPLACEMENT)
'use client';

import { useEffect, ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@clerk/nextjs';

export default function SupabaseProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const syncSession = async () => {
      // CORRECTED: No template specified. This requests the default, standards-compliant token.
      const token = await getToken(); 

      // This is the direct, simplified handshake. It sets the session for all subsequent client-side Supabase calls.
      await supabase.auth.setSession({ access_token: token!, refresh_token: '' });
    };

    // We must sync the session on initial load and whenever the token changes.
    syncSession();
  }, [getToken]);

  return <>{children}</>;
}