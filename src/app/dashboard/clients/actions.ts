// FILE: src/app/dashboard/clients/actions.ts (REPLACEMENT)
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// --- CORRECTIVE ACTION IMPLEMENTED: 'export' keyword added ---
export async function deleteClientAction(clientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  // First, check if the client has any associated documents.
  const { count, error: checkError } = await supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('user_id', user.id);

  if (checkError) {
    console.error('Error checking for documents:', checkError);
    return { success: false, error: 'Could not verify client status.' };
  }

  if (count !== null && count > 0) {
    return { success: false, error: `Cannot delete: Client is associated with ${count} document(s).` };
  }

  // If no documents, proceed with deletion.
  const { error: deleteError } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Error deleting client:', deleteError);
    return { success: false, error: 'Database error: Could not delete client.' };
  }

  revalidatePath('/dashboard/clients');
  return { success: true };
}