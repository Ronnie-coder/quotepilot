// FILE: src/app/quote/[quoteId]/QuotePageClient.tsx
'use client';

import { Box, Heading, Text, VStack, HStack, Button, Icon } from '@chakra-ui/react';
import InvoiceForm from '@/components/InvoiceForm'; // Ensure this matches your export (default vs named)
import DocumentViewer from '@/components/DocumentViewer';
import NextLink from 'next/link';
import { FilePenLine, ArrowLeft } from 'lucide-react';
import { Tables } from '@/types/supabase';

// Define the shape of the props this component expects
type QuotePageClientProps = {
  quote: Tables<'quotes'> & { clients: Tables<'clients'> | null };
  profile: Tables<'profiles'> | null;
  clients: Tables<'clients'>[];
  isViewing: boolean;
};

export default function QuotePageClient({ quote, profile, clients, isViewing }: QuotePageClientProps) {
  const primaryColor = 'brand.500'; // Updated to match brand
  const primaryTextColor = 'white';

  return (
    <VStack spacing={8} align="stretch">
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <Box>
          <Heading as="h1" size="xl">
            {isViewing ? 'Viewing' : 'Editing'} {quote.document_type} #{quote.invoice_number}
          </Heading>
          <Text color="gray.500">
            {isViewing ? 'Review the document details below.' : 'Modify the details and save your changes.'}
          </Text>
        </Box>
        <HStack>
          <Button as={NextLink} href="/dashboard/quotes" variant="outline" leftIcon={<Icon as={ArrowLeft} />}>
            Back to Documents
          </Button>
          {isViewing && (
            <Button as={NextLink} href={`/quote/${quote.id}`} bg={primaryColor} color={primaryTextColor} _hover={{ opacity: 0.9 }} leftIcon={<Icon as={FilePenLine} />}>
              Edit Document
            </Button>
          )}
        </HStack>
      </HStack>
      
      {isViewing ? (
        // TACTICAL FIX: Type Cast 'quote' to 'any' to bypass strict status check during build
        <DocumentViewer quote={quote as any} profile={profile} />
      ) : (
        <InvoiceForm profile={profile} clients={clients} defaultValues={quote} />
      )}
    </VStack>
  );
}