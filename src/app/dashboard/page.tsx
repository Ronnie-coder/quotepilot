import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClientPage from './DashboardClientPage';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }

  // 1. Fetch Profile for Currency
  const { data: profile } = await supabase.from('profiles').select('currency').eq('id', user.id).single();
  const systemCurrency = profile?.currency || 'USD';

  // 2. Fetch Counts
  const { count: clientCount } = await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  const { count: quoteCount } = await supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', user.id);

  // 3. Fetch Recent Activity
  const { data: rawRecentDocuments } = await supabase
    .from('quotes')
    .select('id, invoice_number, total, status, document_type, currency, created_at, clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const getClientName = (clientData: any) => {
    if (!clientData) return 'Unknown';
    if (Array.isArray(clientData)) {
        return clientData[0]?.name || 'Unknown';
    }
    return clientData?.name || 'Unknown';
  };

  const recentDocuments = rawRecentDocuments?.map((doc) => ({
    ...doc,
    clients: { name: getClientName(doc.clients) }
  })) || [];

  // 4. Fetch Overdue List
  const { data: rawOverdueInvoices } = await supabase
    .from('quotes')
    .select('id, invoice_number, total, due_date, currency, clients(name)')
    .eq('user_id', user.id)
    .lt('due_date', new Date().toISOString()) // Past due
    .neq('status', 'paid') 
    .neq('status', 'draft') 
    .limit(10);

  const overdueInvoices = rawOverdueInvoices?.map((inv) => ({
    ...inv,
    clients: { name: getClientName(inv.clients) }
  })) || [];

  // 5. FINANCIALS: Total Revenue (PAID)
  const { data: paidInvoices } = await supabase
    .from('quotes')
    .select('total, created_at')
    .eq('user_id', user.id)
    .eq('status', 'paid');

  const totalRevenue = paidInvoices?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

  // 🟢 6. FINANCIALS: Outstanding Revenue (SENT + OVERDUE)
  // Logic: Anything that is NOT 'draft' and NOT 'paid' is money we are waiting for.
  const { data: outstandingDocs } = await supabase
    .from('quotes')
    .select('total')
    .eq('user_id', user.id)
    .neq('status', 'draft')
    .neq('status', 'paid');

  const outstandingRevenue = outstandingDocs?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

  // 7. Chart Data (Revenue Velocity)
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

  // 8. Invoice Health Logic
  const { data: allDocs } = await supabase
    .from('quotes')
    .select('status, due_date')
    .eq('user_id', user.id);
  
  const statusCounts = { Paid: 0, Overdue: 0, Sent: 0, Draft: 0 };
  const now = new Date();

  allDocs?.forEach((doc) => {
    let s = doc.status ? doc.status.toLowerCase() : 'draft';
    if (s !== 'paid' && s !== 'draft' && doc.due_date && new Date(doc.due_date) < now) {
      s = 'overdue';
    }
    const key = s.charAt(0).toUpperCase() + s.slice(1);
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
      outstandingRevenue={outstandingRevenue} // 🟢 Passing the new data
      recentDocuments={recentDocuments}
      overdueInvoices={overdueInvoices}
      revenueData={revenueData}
      statusData={statusData}
      currency={systemCurrency}
    />
  );
}