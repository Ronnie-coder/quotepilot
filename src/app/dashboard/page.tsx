import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClientPage from './DashboardClientPage';

export default async function DashboardPage() {
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
  // We fetch everything to perform strict filtering in memory
  const { data: allDocs, error } = await supabase
    .from('quotes')
    .select('id, invoice_number, total, status, document_type, currency, created_at, due_date, client_id, clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) console.error("Dashboard Data Error:", error);

  const safeDocs = allDocs || [];
  const quoteCount = safeDocs.length;

  // --- BUSINESS LOGIC HELPERS ---
  // STRICT: Quotes NEVER count as revenue. Only 'invoice' type counts.
  const isInvoice = (doc: any) => doc.document_type?.toLowerCase() === 'invoice';
  
  // STRICT: Only 'paid' status counts as realized revenue.
  const isPaid = (status: string) => status?.toLowerCase() === 'paid';
  
  // STRICT: Outstanding = Sent (or Overdue) Invoices. Never Drafts or Quotes.
  const isOutstanding = (status: string) => {
    const s = status?.toLowerCase();
    return s === 'sent' || s === 'overdue';
  };

  // 4. Calculate Financials
  
  // RULE 1: Total Revenue = Sum of PAID INVOICES only.
  const totalRevenue = safeDocs
    .filter(d => isInvoice(d) && isPaid(d.status))
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  // RULE 2: Outstanding Revenue = Sum of SENT/OVERDUE INVOICES only.
  const outstandingRevenue = safeDocs
    .filter(d => isInvoice(d) && isOutstanding(d.status)) 
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  // 5. Prepare Lists
  const getClientName = (clientData: any) => {
    if (!clientData) return 'Unknown';
    if (Array.isArray(clientData)) return clientData[0]?.name || 'Unknown';
    return clientData?.name || 'Unknown';
  };

  // Recent Documents (Includes Quotes for visibility, UI handles icons)
  const recentDocuments = safeDocs.slice(0, 5).map((doc) => ({
    ...doc,
    clients: { name: getClientName(doc.clients) }
  }));

  // Overdue Invoices (Strictly Invoices, strictly Overdue)
  const overdueInvoices = safeDocs
    .filter(doc => {
        const isOverdue = doc.due_date && new Date(doc.due_date) < new Date();
        // Ensure we only count Invoices as overdue, not Quotes
        return isInvoice(doc) && isOverdue && !isPaid(doc.status) && doc.status?.toLowerCase() !== 'draft';
    })
    .slice(0, 10)
    .map((inv) => ({
      ...inv,
      clients: { name: getClientName(inv.clients) }
    }));

  // 6. Chart Data (Revenue Velocity)
  // Only include PAID INVOICES in the revenue chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = new Array(6).fill(0).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { name: months[d.getMonth()], value: 0, sortDate: d.toISOString().slice(0, 7) };
  });

  safeDocs.filter(d => isInvoice(d) && isPaid(d.status)).forEach((inv) => {
    const dateStr = inv.created_at.slice(0, 7);
    const point = revenueData.find(d => d.sortDate === dateStr);
    if (point) point.value += inv.total;
  });

  // 7. Status Data (Invoice Health Pie Chart)
  // Only include INVOICES. Quotes should not skew "Paid %" or "Overdue %".
  const statusCounts = { Paid: 0, Overdue: 0, Sent: 0, Draft: 0 };
  const now = new Date();

  safeDocs.filter(isInvoice).forEach((doc) => {
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