// src/components/UserSync.tsx (FINAL VERSION)
"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function UserSync() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [isSyncing, setIsSyncing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function syncUser() {
      if (isLoaded && isSignedIn) {
        try {
          const response = await fetch('/api/sync-user', { method: 'POST' });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Sync failed: ${errorText}`);
          }

          const syncedUser = await response.json();
          console.log('✅ User sync successful:', syncedUser);
          
          if (isMounted) {
            setIsSyncing(false);
          }

        } catch (e: any) {
          console.error('Error during user sync:', e);
          if (isMounted) {
            setError(e.message);
            setIsSyncing(false);
          }
        }
      } else if (isLoaded && !isSignedIn) {
        // If user is not signed in, we're done.
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    }

    syncUser();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, user?.id]); // Rerun if user ID changes

  // This is the new, robust part. We can show a loading or error state.
  if (isSyncing) {
    // Optional: Render a full-page loading spinner here
    return <div>Syncing user profile...</div>; 
  }

  if (error) {
    // Optional: Render a full-page error message
    return <div>Error syncing profile: {error}</div>;
  }
  
  // When sync is complete, render nothing and let the app proceed.
  return null;
}