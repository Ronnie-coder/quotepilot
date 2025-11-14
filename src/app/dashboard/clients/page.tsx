// FILE: src/app/dashboard/clients/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClientsClientPage from './ClientsClientPage'; // This import is now correct for this location

export default async function ClientsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // This page's only mission: Fetch all clients for the current user.
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
  }

  // Pass the fetched clients to the client-side component for display.
  return (
    <ClientsClientPage clients={clients || []} />
  );
}