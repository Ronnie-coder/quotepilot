// 🟢 FIX: Changed to default import (no curly braces)
import InvoiceForm from '@/components/InvoiceForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';

export default async function NewQuotePage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect('/sign-in'); }

  const [profileResult, clientsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('clients').select('*').eq('user_id', user.id)
  ]);

  const { data: profile } = profileResult;
  const { data: clients } = clientsResult;

  return (
    <VStack spacing={8} align="stretch">
       <Box>
        <Heading as="h1" size="xl">Create New Document</Heading>
        <Text color="gray.500">Fill in the details below to generate a new quote or invoice.</Text>
      </Box>
      <InvoiceForm profile={profile} clients={clients || []} />
    </VStack>
  );
}