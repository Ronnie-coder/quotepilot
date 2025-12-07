import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ClientDetailsClientPage from './ClientDetailsClientPage';

interface PageProps {
  params: { clientId: string };
}

export default async function ClientDetailsPage({ params }: PageProps) {
  const supabase = createSupabaseServerClient();
  const { clientId } = params;

  // 1. Security Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // 2. Fetch Client & Documents (Parallel Fetch for Speed)
  const [clientRes, documentsRes] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('quotes')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  ]);

  if (clientRes.error || !clientRes.data) {
    return notFound(); // Handle 404 nicely
  }

  const client = clientRes.data;
  const documents = documentsRes.data || [];

  // 3. Calculate Financial Intelligence
  const stats = documents.reduce(
    (acc, doc) => {
      const total = doc.total || 0;
      const status = doc.status?.toLowerCase() || 'draft';

      // Count Docs
      if (doc.document_type === 'Invoice') acc.invoiceCount++;
      else acc.quoteCount++;

      // Money Logic
      if (status === 'paid') {
        acc.lifetimeValue += total;
      } else if (status === 'sent' || status === 'overdue') {
        // Only count outstanding if it's an Invoice, not a Quote
        if (doc.document_type === 'Invoice') {
          acc.outstanding += total;
        }
      }
      return acc;
    },
    { lifetimeValue: 0, outstanding: 0, invoiceCount: 0, quoteCount: 0 }
  );

  return (
    <ClientDetailsClientPage 
      client={client} 
      documents={documents} 
      stats={stats} 
    />
  );
}