// FILE: src/app/dashboard/clients/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClientsClientPage from './ClientsClientPage';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const searchQuery = searchParams.q as string || '';
  const page = parseInt(searchParams.page as string) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  // 1. Fetch Clients
  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  }

  const { data: rawClients, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching clients:', error);
  }

  // 2. REVENUE CALCULATION (Final Production Logic)
  // Iterates through clients and sums only invoices marked as 'paid' (case-insensitive).
  const clientsWithRevenue = await Promise.all(
    (rawClients || []).map(async (client) => {
      
      const queryBuilder: any = supabase.from('quotes');
      
      const { data: quotes, error: quoteError } = await queryBuilder
        .select('total, status, document_type') 
        .eq('client_id', client.id)
        .ilike('status', 'paid')  // Captures 'paid', 'Paid', 'PAID'
        .ilike('document_type', 'invoice'); // Strictly targets Invoices, excluding Quotes

      if (quoteError) {
        console.error(`Error fetching revenue for client ${client.id}:`, quoteError);
      }

      // Sum the total
      const manualTotal = quotes?.reduce((sum: number, quote: any) => sum + (quote.total || 0), 0) || 0;

      return {
        ...client,
        total_revenue: manualTotal,
      };
    })
  );

  return (
    <ClientsClientPage
      clients={clientsWithRevenue}
      count={count ?? 0}
      page={page}
      limit={limit}
      user={user}
    />
  );
}