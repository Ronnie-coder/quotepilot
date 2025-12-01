// FILE: src/app/dashboard/page.tsx
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

  // --- MISSION CRITICAL: Expanding data fetch for the Actionable Command Center ---
  const [
    clientCountResult,
    quoteCountResult,
    recentDocumentsResult,
    totalRevenueResult,
    overdueInvoicesResult, // Tactical Priority Alpha: Fetching overdue invoices
  ] = await Promise.all([
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
      .select(
        `
        id,
        document_type,
        invoice_number,
        total,
        created_at,
        clients ( name )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('quotes')
      .select('total')
      .eq('user_id', user.id),
    // NEW QUERY: Fetch invoices that are past their due date and are not marked as 'Paid'
    supabase
      .from('quotes')
      .select(
        `
        id,
        invoice_number,
        total,
        due_date,
        clients ( name )
      `
      )
      .eq('user_id', user.id)
      .eq('document_type', 'Invoice') // Ensure we only check invoices
      .neq('status', 'Paid') // Ensure we don't show paid invoices as overdue
      .lt('due_date', new Date().toISOString()), // Check if due_date is in the past
  ]);

  const clientCount = clientCountResult.count ?? 0;
  const quoteCount = quoteCountResult.count ?? 0;
  
  // --- DATA NORMALIZATION (THE BUILD FIX) ---
  // We explicitly map the data to handle the Supabase Array-vs-Object issue.
  
  const recentDocuments = recentDocumentsResult.data?.map((doc: any) => ({
    ...doc,
    // If clients is an array, take the first item. If it's null, provide a fallback.
    clients: Array.isArray(doc.clients) ? doc.clients[0] || { name: 'Unknown Client' } : doc.clients
  })) ?? [];

  const overdueInvoices = overdueInvoicesResult.data?.map((doc: any) => ({
    ...doc,
    // Same fix for overdue invoices
    clients: Array.isArray(doc.clients) ? doc.clients[0] || { name: 'Unknown Client' } : doc.clients
  })) ?? [];

  const totalRevenue =
    totalRevenueResult.data?.reduce(
      (sum, doc) => sum + (doc.total ?? 0),
      0
    ) ?? 0;

  // Pass all fetched and FORMATTED data to the client page for rendering
  return (
    <DashboardClientPage
      user={user}
      clientCount={clientCount}
      quoteCount={quoteCount}
      totalRevenue={totalRevenue}
      recentDocuments={recentDocuments}
      overdueInvoices={overdueInvoices}
    />
  );
}