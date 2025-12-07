import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClientPage from './DashboardClientPage';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }

  // 1. Fetch Profile
  const { data: profile } = await supabase.from('profiles').select('currency').eq('id', user.id).single();
  const systemCurrency = profile?.currency || 'USD';

  // 2. Fetch Counts
  const { count: clientCount } = await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  const { count: quoteCount } = await supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', user.id);

  // 3. Fetch Recent Activity
  const { data: recentDocuments } = await supabase
    .from('quotes')
    .select('id, invoice_number, total, status, document_type, currency, created_at, clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // 4. Fetch Overdue List (Action Required)
  const { data: overdueInvoices } = await supabase
    .from('quotes')
    .select('id, invoice_number, total, due_date, currency, clients(name)')
    .eq('user_id', user.id)
    .lt('due_date', new Date().toISOString()) // Past due
    .neq('status', 'paid') 
    .neq('status', 'draft') 
    .limit(10);

  // 5. Total Revenue
  const { data: paidInvoices } = await supabase
    .from('quotes')
    .select('total, created_at')
    .eq('user_id', user.id)
    .eq('status', 'paid');

  const totalRevenue = paidInvoices?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

  // 6. Chart Data (Revenue Velocity)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = new Array(6).fill(0).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { name: months[d.getMonth()], value: 0, sortDate: d.toISOString().slice(0, 7) };
  });

  paidInvoices?.forEach((inv) => {
    const dateStr = inv.created_at.slice(0, 7);
    const point = revenueData.find(d => d.sortDate === dateStr);
    if (point) point.value += inv.total;
  });

  // 7. Invoice Health (🟢 COMMANDER FIX: LOGIC UPGRADE)
  // We now fetch status AND due_date to determine true health
  const { data: allDocs } = await supabase
    .from('quotes')
    .select('status, due_date')
    .eq('user_id', user.id);
  
  const statusCounts = { Paid: 0, Overdue: 0, Sent: 0, Draft: 0 };
  const now = new Date();

  allDocs?.forEach((doc) => {
    let s = doc.status ? doc.status.toLowerCase() : 'draft';

    // LOGIC CHECK:
    // If it's NOT paid, and NOT draft, and the Date is passed... it is OVERDUE.
    if (s !== 'paid' && s !== 'draft' && doc.due_date && new Date(doc.due_date) < now) {
      s = 'overdue';
    }

    // Capitalize for the chart key
    const key = s.charAt(0).toUpperCase() + s.slice(1);
    
    // Add to tally if key exists, otherwise ignore (or map to Draft)
    if (key in statusCounts) {
        statusCounts[key as keyof typeof statusCounts]++;
    }
  });

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <DashboardClientPage
      user={user}
      clientCount={clientCount || 0}
      quoteCount={quoteCount || 0}
      totalRevenue={totalRevenue}
      recentDocuments={recentDocuments || []}
      overdueInvoices={overdueInvoices || []}
      revenueData={revenueData}
      statusData={statusData}
      currency={systemCurrency}
    />
  );
}