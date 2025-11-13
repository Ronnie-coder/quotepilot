import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuotesClientPage from './QuotesClientPage';

export default async function QuotesPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // --- MISSION CRITICAL: Fetching 'status' for each document ---
  const { data: documents, error } = await supabase
    .from('quotes')
    .select(`
      id,
      created_at,
      document_type,
      invoice_number,
      status, 
      total,
      clients ( name ) 
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
  }

  return <QuotesClientPage initialDocuments={documents || []} />;
}