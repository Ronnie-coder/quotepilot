// src/app/quote/[quoteId]/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { InvoiceForm } from '@/components/InvoiceForm'; // Confirm this path is correct
import { notFound } from 'next/navigation';

// This type definition tells TypeScript what to expect in our page's props.
// Next.js automatically provides 'params' for dynamic routes.
type EditQuotePageProps = {
  params: {
    quoteId: string; // The 'quoteId' here must match the folder name '[quoteId]'
  }
}

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const supabase = await createSupabaseServerClient();

  // Fetch a single quote record where the 'id' matches the ID from the URL.
  const { data: quote, error } = await supabase
    .from('quotes') // Or your table name for quotes/invoices
    .select('*')
    .eq('id', params.quoteId)
    .single(); // .single() is critical. It returns one object, or an error if not found.

  // If there was an error or the quote doesn't exist, engage the 'Not Found' protocol.
  if (error || !quote) {
    console.error('Error fetching quote for edit:', error);
    notFound(); // This will render the nearest not-found.tsx page
  }

  // The mission is a success. We pass the fetched data as 'defaultValues' to the form.
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Refit Bay: Editing Quote #{quote.id}</h1>
      <InvoiceForm defaultValues={quote} />
    </div>
  );
}