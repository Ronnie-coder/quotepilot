import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuotePageClient from './QuotePageClient';

// 🟢 FIX: Added searchParams to Props definition
interface QuotePageProps {
  params: Promise<{ quoteId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function QuotePage({ params, searchParams }: QuotePageProps) {
  // 🟢 FIX: Await Supabase
  const supabase = await createSupabaseServerClient();
  
  // 🟢 FIX: Await Params & Search Params
  const { quoteId } = await params;
  const search = await searchParams; // Next.js 15+ requires awaiting searchParams

  // Check if edit mode is active
  const isEditMode = search.edit === 'true';

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // Fetch Quote
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      clients (*)
    `)
    .eq('id', quoteId)
    .single();

  if (error || !quote) {
    redirect('/dashboard/quotes');
  }

  // Security Check
  if (quote.user_id !== user.id) {
    redirect('/dashboard');
  }

  // Fetch Metadata
  const [profileResult, clientsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('clients').select('*').eq('user_id', user.id)
  ]);

  return (
    <QuotePageClient 
      quote={quote} 
      profile={profileResult.data} 
      clients={clientsResult.data || []} 
      // 🟢 FIX: Dynamically toggle view/edit mode
      isViewing={!isEditMode} 
    />
  );
}