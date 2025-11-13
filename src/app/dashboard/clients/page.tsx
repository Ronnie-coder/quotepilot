// FILE: src/app/dashboard/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClientPage from './DashboardClientPage';
import { User } from '@supabase/supabase-js';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // --- MISSION UPDATE: Fetch all required data in parallel ---
  const [clientCountResult, quoteCountResult, recentDocumentsResult] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    // --- RECONNAISSANCE PAYLOAD ---
    supabase.from('quotes')
      .select(`id, document_type, total, invoice_number, clients ( name )`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);
  
  const clientCount = clientCountResult.count ?? 0;
  const quoteCount = quoteCountResult.count ?? 0;
  const recentDocuments = recentDocumentsResult.data || [];

  return (
    <DashboardClientPage 
      user={user} 
      clientCount={clientCount} 
      quoteCount={quoteCount}
      recentDocuments={recentDocuments} // Pass the new data to the client
    />
  );
}