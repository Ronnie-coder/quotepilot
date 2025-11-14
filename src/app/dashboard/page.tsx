import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClientPage from './DashboardClientPage';

// This is a protected Server Component
export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }

  // --- MISSION CRITICAL: Expanding data fetch to include Total Revenue ---
  const [clientCountResult, quoteCountResult, recentDocumentsResult, totalRevenueResult] = await Promise.all([
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('quotes')
      .select(`
        id,
        document_type,
        invoice_number,
        total,
        created_at,
        clients ( name )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    // NEW QUERY: Fetch the 'total' of all documents for the user
    supabase
      .from('quotes')
      .select('total')
      .eq('user_id', user.id),
  ]);
  
  const clientCount = clientCountResult.count ?? 0;
  const quoteCount = quoteCountResult.count ?? 0;
  const recentDocuments = recentDocumentsResult.data ?? [];

  // --- COMMANDER'S NOTE: Calculate total revenue from the fetched data ---
  const totalRevenue = totalRevenueResult.data?.reduce((sum, doc) => sum + (doc.total ?? 0), 0) ?? 0;

  // Pass all fetched data to the client page for rendering
  return (
    <DashboardClientPage 
      user={user} 
      clientCount={clientCount} 
      quoteCount={quoteCount}
      totalRevenue={totalRevenue} // Pass the newly calculated total revenue
      recentDocuments={recentDocuments}
    />
  );
}