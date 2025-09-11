// src/app/dashboard/quotes/actions.ts
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function deleteQuoteAction(quoteId: string) {
  const { userId } = auth();
  if (!userId) {
    // Failsafe: Ensure user is authenticated
    return { error: 'Unauthorized: User not logged in.' };
  }

  if (!quoteId) {
    return { error: 'Invalid Quote ID provided.' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    // The core of the purge protocol:
    // We target the 'quotes' table, and delete the row where the 'id' matches
    // AND the 'user_id' matches the currently logged-in user.
    // This is a CRITICAL security measure to prevent a user from deleting another user's data.
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase Delete Error:', error);
      throw new Error('Database error: Could not delete the document.');
    }

    // After a successful deletion, we must tell Next.js to refresh the data on this page.
    revalidatePath('/dashboard/quotes');

    return { success: true };

  } catch (err: any) {
    return { error: err.message };
  }
}