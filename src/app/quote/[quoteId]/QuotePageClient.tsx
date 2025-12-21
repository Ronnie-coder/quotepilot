'use client';

import { Box, Heading, Text, VStack, HStack, Button, Icon } from '@chakra-ui/react';
import { InvoiceForm } from '@/components/InvoiceForm'; 
import DocumentViewer from '@/components/DocumentViewer';
import ShareInvoice from '@/components/ShareInvoice'; 
import NextLink from 'next/link';
import { FilePenLine, ArrowLeft } from 'lucide-react';
import { Tables } from '@/types/supabase';

type ExtendedQuote = Tables<'quotes'> & {
  clients: Tables<'clients'> | null;
  currency?: string;
  payment_link?: string | null;
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
      {/* HEADER SECTION */}
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <Box>
          <Heading as="h1" size="xl">
            {isViewing ? 'Viewing' : 'Editing'} {quote.document_type} #{quote.invoice_number}
          </Heading>
          <Text color="gray.500">
            {isViewing ? 'Review the document details below.' : 'Modify the details and save your changes.'}
          </Text>
        </Box>
        
        <HStack spacing={3}>
           {/* 1. Share Button Integrated in Header */}
           {isViewing && (
             <ShareInvoice 
               quoteId={quote.id} 
               clientName={quote.clients?.name || "Client"} 
               invoiceNumber={quote.invoice_number || ""}
               clientEmail={quote.clients?.email || ""}
             />
           )}

          <Button as={NextLink} href="/dashboard/quotes" variant="outline" leftIcon={<Icon as={ArrowLeft} />}>
            Back
          </Button>

          {isViewing && (
            <Button as={NextLink} href={`/dashboard/quote/${quote.id}`} bg={primaryColor} color={primaryTextColor} _hover={{ opacity: 0.9 }} leftIcon={<Icon as={FilePenLine} />}>
              Edit
            </Button>
          )}
        </HStack>
      </HStack>
      
      {/* CONTENT SECTION */}
      {isViewing ? (
        <DocumentViewer quote={quote as any} profile={profile} />
      ) : (
        <InvoiceForm profile={profile} clients={clients} defaultValues={quote} />
      )}
    </VStack>
  );
}