// FILE: src/app/dashboard/quotes/page.tsx
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

  const searchQuery = searchParams.q as string || '';
  const statusFilter = searchParams.status as string || '';
  const typeFilter = searchParams.type as string || '';
  const page = parseInt(searchParams.page as string) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  let query;
  let documents, error, count;

  // --- TACTICAL SHIFT: Search Logic ---
  // We use standard ilike for reliability if RPC is not set up, 
  // or fall back to standard queries.
  
  // 1. Base Selection
  query = supabase
    .from('quotes')
    .select(
      `
      id, created_at, document_type, invoice_number, status, total,
      clients ( name ) 
    `,
      { count: 'exact' }
    )
    .eq('user_id', user.id);

  // 2. Search Handling
  if (searchQuery) {
    // Using ilike on invoice_number for standard search
    query = query.ilike('invoice_number', `%${searchQuery}%`);
  }

  // 3. Status Filtering
  // If filter is 'overdue', we use date logic. Otherwise, we filter by the status column.
  if (statusFilter === 'overdue') {
    query = query
      .lt('due_date', new Date().toISOString())
      .neq('status', 'Paid');
  } else if (statusFilter) {
    query = query.eq('status', statusFilter);
  }
  
  // 4. Type Filtering
  if (typeFilter) {
    query = query.eq('document_type', typeFilter);
  }

  // 5. Execute Query with Pagination
  ({ data: documents, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  );

  if (error) {
    console.error('Error fetching documents:', error);
    return <QuotesClientPage initialDocuments={[]} count={0} page={1} limit={limit} />;
  }

  // --- THE TYPE FIX ---
  // We explicitly cast 'documents' to 'any[]' so the build passes.
  const formattedDocuments =
    (documents as any[])?.map((doc: any) => ({
      ...doc,
      clients: Array.isArray(doc.clients) ? doc.clients[0] : doc.clients || { name: 'Unknown Client' },
    })) || [];

  return (
    <QuotesClientPage
      initialDocuments={formattedDocuments}
      count={count ?? 0}
      page={page}
      limit={limit}
    />
  );
}