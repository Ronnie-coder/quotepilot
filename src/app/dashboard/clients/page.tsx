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
  if (!user) redirect('/sign-in');

  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q : '';
  const page = parseInt(searchParams.page as string) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  // 1. QUERY CLIENTS + QUOTE DATA
  let query = supabase
    .from('clients')
    .select(`
      *,
      quotes (
        total,
        status,
        document_type,
        currency,
        created_at
      )
    `, { count: 'exact' }) 
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

  // 2. REVENUE INTELLIGENCE ENGINE
  const clientsWithRevenue = (rawClients || []).map((client) => {
    const clientQuotes = client.quotes as any[] || [];

    // Filter for PAID invoices
    const paidQuotes = clientQuotes.filter((q: any) => 
      q.document_type?.toLowerCase() === 'invoice' && 
      q.status?.toLowerCase() === 'paid'
    );

    // 🟢 COMMANDER LOGIC: GROUP BY CURRENCY
    // We create a map: { "USD": 500, "ZAR": 1000 }
    const revenueMap: Record<string, number> = {};

    paidQuotes.forEach((q: any) => {
      // Default to USD if null, just to be safe
      const currency = q.currency || 'USD';
      
      if (!revenueMap[currency]) {
        revenueMap[currency] = 0;
      }
      revenueMap[currency] += (q.total || 0);
    });

    // Convert Map to Array for the Frontend: [{ currency: 'USD', amount: 500 }, ...]
    const revenueBreakdown = Object.entries(revenueMap).map(([curr, amt]) => ({
      currency: curr,
      amount: amt
    }));

    // Sort: Put the highest values first? Or maybe specific currencies first?
    // Let's sort by Amount descending for now.
    revenueBreakdown.sort((a, b) => b.amount - a.amount);

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      address: client.address,
      revenueBreakdown, // <--- Passing the array instead of a single number
      created_at: client.created_at
    };
  });

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