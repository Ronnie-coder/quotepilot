import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuotesClientPage from './QuotesClientPage';

interface QuotesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }

  // 🟢 FIX: Fetch FULL profile (Company Name, Payment Settings, Currency)
  // This ensures "My Business" is replaced with the real name in the Dashboard list.
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const systemCurrency = profile?.currency || 'USD'; 

  const params = await searchParams;

  const searchQuery = (params.q as string) || '';
  const statusFilter = (params.status as string) || '';
  const typeFilter = (params.type as string) || '';
  const page = parseInt(params.page as string) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  // 2. FETCH DOCUMENTS
  let query = supabase
    .from('quotes')
    .select(
      `
      id, 
      created_at, 
      document_type, 
      invoice_number, 
      status, 
      total, 
      currency,
      payment_link,
      client_id,
      due_date,
      clients ( id, name, email ) 
    `,
      { count: 'exact' }
    )
    .eq('user_id', user.id);

  if (searchQuery) {
    query = query.ilike('invoice_number', `%${searchQuery}%`);
  }

  if (statusFilter === 'overdue') {
    query = query
      .lt('due_date', new Date().toISOString())
      .neq('status', 'Paid')
      .neq('status', 'paid');
  } else if (statusFilter) {
    query = query.ilike('status', statusFilter);
  }
  
  if (typeFilter) {
    query = query.eq('document_type', typeFilter);
  }

  const { data: documents, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching documents:', error);
    return <QuotesClientPage documents={[]} count={0} page={1} limit={limit} />;
  }

  // 3. FORMATTING
  const formattedDocuments =
    (documents as any[])?.map((doc: any) => {
      const clientData = Array.isArray(doc.clients) ? doc.clients[0] : doc.clients;
      
      return {
        ...doc,
        currency: doc.currency || systemCurrency,
        client_id: doc.client_id || clientData?.id,
        clients: clientData || { name: 'Unknown Client', email: '', id: '' },
        // 🟢 INJECT PROFILE: This passes 'company_name' to the Client Component
        profiles: profile 
      };
    }) || [];

  return (
    <QuotesClientPage
      documents={formattedDocuments}
      count={count ?? 0}
      page={page}
      limit={limit}
    />
  );
}