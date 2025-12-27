import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClientsClientPage from './ClientsClientPage';

export default async function ClientsPage({
  searchParams,
}: {
  // 🟢 FIX: Type definition updated to Promise
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // 🟢 FIX: Await the searchParams object
  const params = await searchParams;

  const searchQuery = typeof params.q === 'string' ? params.q : '';
  const page = parseInt(params.page as string) || 1;
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

    const paidQuotes = clientQuotes.filter((q: any) => 
      q.document_type?.toLowerCase() === 'invoice' && 
      q.status?.toLowerCase() === 'paid'
    );

    const revenueMap: Record<string, number> = {};

    paidQuotes.forEach((q: any) => {
      const currency = q.currency || 'USD';
      if (!revenueMap[currency]) {
        revenueMap[currency] = 0;
      }
      revenueMap[currency] += (q.total || 0);
    });

    const revenueBreakdown = Object.entries(revenueMap).map(([curr, amt]) => ({
      currency: curr,
      amount: amt
    }));

    revenueBreakdown.sort((a, b) => b.amount - a.amount);

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      address: client.address,
      revenueBreakdown, 
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