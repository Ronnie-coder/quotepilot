'use client';

import { Box, Heading, Text, VStack, HStack, Button, Icon } from '@chakra-ui/react';
import { InvoiceForm } from '@/components/InvoiceForm'; 
import DocumentViewer from '@/components/DocumentViewer';
import ShareInvoice from '@/components/ShareInvoice'; // <--- 1. NEW IMPORT
import NextLink from 'next/link';
import { FilePenLine, ArrowLeft } from 'lucide-react';
import { Tables } from '@/types/supabase';

// Extended type to ensure TS knows 'currency' exists on the quote
type ExtendedQuote = Tables<'quotes'> & {
  clients: Tables<'clients'> | null;
  currency?: string;
};

type QuotePageClientProps = {
  quote: ExtendedQuote;
  profile: Tables<'profiles'> | null;
  clients: Tables<'clients'>[];
  isViewing: boolean;
};

export default function QuotePageClient({ quote, profile, clients, isViewing }: QuotePageClientProps) {
  const primaryColor = 'brand.500';
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
            <Button as={NextLink} href={`/dashboard/quote/${quote.id}`} bg={primaryColor} color={primaryTextColor} _hover={{ opacity: 0.9 }} leftIcon={<Icon as={FilePenLine} />}>
              Edit Document
            </Button>
          )}
        </HStack>
      </HStack>
      
      {/* 2. INSERT SHARE MODULE HERE */}
      <ShareInvoice 
        quoteId={quote.id} 
        clientName={quote.clients?.name || "Client"} 
        invoiceNumber={quote.invoice_number || ""}
          clientEmail={quote.clients?.email || ""}
      />
      {/* ------------------------- */}

      {isViewing ? (
        // The DocumentViewer will now receive the currency inside the 'quote' object
        <DocumentViewer quote={quote as any} profile={profile} />
      ) : (
        // The InvoiceForm will receive the currency in defaultValues
        <InvoiceForm profile={profile} clients={clients} defaultValues={quote} />
      )}
    </VStack>
  );
}