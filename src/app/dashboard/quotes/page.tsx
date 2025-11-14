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
    // Return the client page with an empty array on error to prevent a hard crash
    return <QuotesClientPage initialDocuments={[]} />;
  }

  // --- CORRECTIVE ACTION IMPLEMENTED ---
  // Supabase returns related tables as an array (e.g., clients: [{ name: 'Test' }]).
  // Our client component expects a single object (e.g., clients: { name: 'Test' }).
  // This transformation flattens the array, ensuring data shape compatibility.
  const formattedDocuments = documents?.map(doc => {
    const clientData = Array.isArray(doc.clients) ? doc.clients[0] : doc.clients;
    return {
      ...doc,
      clients: clientData || { name: 'Unknown Client' }, // Ensure clients object is not null
    };
  }) || [];

  return <QuotesClientPage initialDocuments={formattedDocuments} />;
}