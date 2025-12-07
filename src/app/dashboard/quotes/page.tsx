import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuotesClientPage from './QuotesClientPage';

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // 1. GET PROFILE SETTINGS (To know the "System Default" currency)
  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', user.id)
    .single();

  const systemCurrency = profile?.currency || 'USD'; // Default to USD if profile is empty

  const searchQuery = searchParams.q as string || '';
  const statusFilter = searchParams.status as string || '';
  const typeFilter = searchParams.type as string || '';
  const page = parseInt(searchParams.page as string) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  // 2. FETCH DOCUMENTS
  let query = supabase
    .from('quotes')
    .select(
      `
      id, created_at, document_type, invoice_number, status, total, currency,
      clients ( name ) 
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
      .neq('status', 'Paid');
  } else if (statusFilter) {
    query = query.eq('status', statusFilter);
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

  // 3. FORMATTING LOGIC
  const formattedDocuments =
    (documents as any[])?.map((doc: any) => ({
      ...doc,
      // 🟢 COMMANDER FIX: Use the Doc's currency. If missing, use System Default. NEVER hardcode ZAR.
      currency: doc.currency || systemCurrency,
      clients: Array.isArray(doc.clients) ? doc.clients[0] : doc.clients || { name: 'Unknown Client' },
    })) || [];

  return (
    <QuotesClientPage
      documents={formattedDocuments}
      count={count ?? 0}
      page={page}
      limit={limit}
    />
  );
}