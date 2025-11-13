import { createSupabaseServerClient } from '@/lib/supabase/server';
import { InvoiceForm } from '@/components/InvoiceForm';
import { notFound, redirect } from 'next/navigation';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';

type EditQuotePageProps = { params: { quoteId: string; } };

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect('/sign-in'); }

  const [quoteResult, profileResult, clientsResult] = await Promise.all([
    supabase.from('quotes').select('*').eq('id', params.quoteId).eq('user_id', user.id).single(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('clients').select('*').eq('user_id', user.id)
  ]);

  const { data: quote, error: quoteError } = quoteResult;
  const { data: profile } = profileResult;
  const { data: clients } = clientsResult;

  if (quoteError || !quote) {
    console.error('Error fetching quote for edit:', quoteError);
    notFound();
  }

  return (
    <VStack spacing={8} align="stretch">
       <Box>
        <Heading as="h1" size="xl">Edit {quote.document_type} #{quote.invoice_number}</Heading>
        <Text color="gray.500">Modify the details below and save your changes.</Text>
      </Box>
      <InvoiceForm 
        profile={profile} 
        clients={clients || []} 
        defaultValues={quote}
      />
    </VStack>
  );
}