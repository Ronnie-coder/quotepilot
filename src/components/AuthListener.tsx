// FILE: src/components/AuthListener.tsx
// MISSION: MAKE LISTENER CONTEXT-AWARE TO PREVENT REFRESH ON SENSITIVE ROUTES
'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@chakra-ui/react';

export default function AuthListener() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const pathname = usePathname(); // Get the current path
  const toast = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      
      // [TARGET MODIFIED] Define routes where a refresh would be destructive.
      const noRefreshPaths = ['/update-password', '/forgot-password'];

      if (event === 'SIGNED_IN' && !noRefreshPaths.includes(pathname)) {
        router.refresh();

        if (!hasShownToast.current) {
          toast({
            title: 'Successfully signed in.',
            description: 'Welcome back!',
            status: 'success',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
          });
          hasShownToast.current = true;
        }
      }

    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, toast, pathname]);

  return null;
}