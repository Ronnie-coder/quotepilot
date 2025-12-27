import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClientPage from './DashboardClientPage';

export default async function DashboardPage() {
  // 🟢 FIX: Added await here
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }

  // 1. Fetch Profile for Currency
  const { data: profile } = await supabase.from('profiles').select('currency').eq('id', user.id).single();
  const systemCurrency = profile?.currency || 'USD';

  // 2. Fetch Client Count
  const { count: clientCount } = await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id);

  // 3. FETCH ALL DOCUMENTS
  const { data: allDocs, error } = await supabase
    .from('quotes')
    .select('id, invoice_number, total, status, document_type, currency, created_at, due_date, client_id, clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) console.error("Dashboard Data Error:", error);

  const safeDocs = allDocs || [];
  const quoteCount = safeDocs.length;

  // --- HELPER: Case-Insensitive Status Check ---
  const isPaid = (status: string) => status?.toLowerCase() === 'paid';
  const isDraft = (status: string) => status?.toLowerCase() === 'draft';

  // 4. Calculate Financials
  const totalRevenue = safeDocs
    .filter(d => isPaid(d.status))
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  const outstandingRevenue = safeDocs
    .filter(d => !isPaid(d.status) && !isDraft(d.status)) 
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  // 5. Prepare Lists
  const getClientName = (clientData: any) => {
    if (!clientData) return 'Unknown';
    if (Array.isArray(clientData)) return clientData[0]?.name || 'Unknown';
    return clientData?.name || 'Unknown';
  };

  const recentDocuments = safeDocs.slice(0, 5).map((doc) => ({
    ...doc,
    clients: { name: getClientName(doc.clients) }
  }));

  const overdueInvoices = safeDocs
    .filter(doc => {
        const isOverdue = doc.due_date && new Date(doc.due_date) < new Date();
        return isOverdue && !isPaid(doc.status) && !isDraft(doc.status);
    })
    .slice(0, 10)
    .map((inv) => ({
      ...inv,
      clients: { name: getClientName(inv.clients) }
    }));

  // 6. Chart Data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = new Array(6).fill(0).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { name: months[d.getMonth()], value: 0, sortDate: d.toISOString().slice(0, 7) };
  });

  safeDocs.filter(d => isPaid(d.status)).forEach((inv) => {
    const dateStr = inv.created_at.slice(0, 7);
    const point = revenueData.find(d => d.sortDate === dateStr);
    if (point) point.value += inv.total;
  });

  // 7. Status Data (USED FOR CHECKLIST LOGIC)
  const statusCounts = { Paid: 0, Overdue: 0, Sent: 0, Draft: 0 };
  const now = new Date();

  safeDocs.forEach((doc) => {
    let s = doc.status ? doc.status.toLowerCase() : 'draft';
    if (s === 'paid') statusCounts.Paid++;
    else if (s === 'draft') statusCounts.Draft++;
    else if (doc.due_date && new Date(doc.due_date) < now) statusCounts.Overdue++;
    else statusCounts.Sent++;
  });

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <DashboardClientPage
      user={user}
      clientCount={clientCount || 0}
      quoteCount={quoteCount}
      totalRevenue={totalRevenue}
      outstandingRevenue={outstandingRevenue}
      recentDocuments={recentDocuments}
      overdueInvoices={overdueInvoices}
      revenueData={revenueData}
      statusData={statusData}
      currency={systemCurrency}
    />
  );
}