// FILE: src/app/quote/[quoteId]/page.tsx (REPLACEMENT)
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import QuotePageClient from './QuotePageClient'; // Import the new dedicated client component

type QuotePageProps = {
  params: { quoteId: string; };
  searchParams: { view?: string };
};

// The Server Component now focuses purely on data fetching and delegation.
// It is clean and has no direct knowledge of icons or complex UI.
export default async function EditQuotePage({ params, searchParams }: QuotePageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect('/sign-in'); }

  const isViewing = searchParams.view === 'true';

  const [quoteResult, profileResult, clientsResult] = await Promise.all([
    supabase.from('quotes').select('*, clients(*)').eq('id', params.quoteId).eq('user_id', user.id).single(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('clients').select('*').eq('user_id', user.id)
  ]);

  const { data: quote, error: quoteError } = quoteResult;
  const { data: profile } = profileResult;
  const { data: clients } = clientsResult;

  if (quoteError || !quote) {
    console.error('Error fetching quote for edit/view:', quoteError);
    notFound();
  }
  
  const quoteWithClient = {
    ...quote,
    clients: Array.isArray(quote.clients) ? quote.clients[0] : quote.clients,
  };

  // Pass the clean, serializable data as props to the Client Component
  return (
    <QuotePageClient 
      quote={quoteWithClient as any} 
      profile={profile} 
      clients={clients || []} 
      isViewing={isViewing}
    />
  );
}