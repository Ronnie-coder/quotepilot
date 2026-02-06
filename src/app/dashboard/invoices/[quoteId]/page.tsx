import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuotePageClient from './QuotePageClient';

interface QuotePageProps {
  params: Promise<{ quoteId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function QuotePage({ params, searchParams }: QuotePageProps) {
  const supabase = await createSupabaseServerClient();
  
  const { quoteId } = await params;
  const search = await searchParams;

  const isEditMode = search.edit === 'true';

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  // Fetch Quote with clients relationship
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      clients (*)
    `)
    .eq('id', quoteId)
    .single();

  // 🟢 FIX: Redirect to correct invoices path if not found
  if (error || !quote) {
    redirect('/dashboard/invoices');
  }

  // Security Check
  if (quote.user_id !== user.id) {
    redirect('/dashboard/invoices');
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
      isViewing={!isEditMode} 
    />
  );
}