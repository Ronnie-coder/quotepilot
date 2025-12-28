'use client';

import { Box, Heading, Text, VStack, HStack, Button, Icon } from '@chakra-ui/react';
import { InvoiceForm } from '@/components/InvoiceForm'; 
import DocumentViewer from '@/components/DocumentViewer';
import ShareInvoice from '@/components/ShareInvoice';
import InvoiceReminder from '@/components/InvoiceReminder';
import NextLink from 'next/link';
import { FilePenLine, ArrowLeft } from 'lucide-react';
// 🟢 FIX: Import Database type directly
import { Database } from '@/types/supabase';

// 🟢 FIX: Manually define Row types
type QuoteRow = Database['public']['Tables']['quotes']['Row'];
type ClientRow = Database['public']['Tables']['clients']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

type ExtendedQuote = QuoteRow & {
  clients: ClientRow | null;
  currency?: string;
  payment_link?: string | null;
};

type QuotePageClientProps = {
  quote: ExtendedQuote;
  profile: ProfileRow | null;
  clients: ClientRow[];
  isViewing: boolean;
};

export default function QuotePageClient({ quote, profile, clients, isViewing }: QuotePageClientProps) {
  const primaryColor = 'brand.500';
  const primaryTextColor = 'white';

  // Helper to format currency for the reminder
  const formatAmount = (amt: number | null, currency: string = 'ZAR') => {
    if (amt === null) return `${currency} 0.00`;
    return `${currency} ${Number(amt).toFixed(2)}`;
  };

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
        
        <HStack spacing={2}>
           {/* 1. Share Button & Reminder Integrated in Header */}
           {isViewing && (
             <>
               <InvoiceReminder 
                  quoteId={quote.id}
                  invoiceNumber={quote.invoice_number || ""}
                  clientName={quote.clients?.name || "Client"}
                  amount={formatAmount(quote.total, quote.currency)}
                  dueDate={quote.due_date || ""}
                  clientEmail={quote.clients?.email}
               />
               
               <ShareInvoice 
                 quoteId={quote.id} 
                 clientName={quote.clients?.name || "Client"} 
                 invoiceNumber={quote.invoice_number || ""}
                 clientEmail={quote.clients?.email || ""}
               />
             </>
           )}

          <Button as={NextLink} href="/dashboard/quotes" variant="outline" leftIcon={<Icon as={ArrowLeft} />}>
            Back
          </Button>

          {isViewing && (
            <Button 
              as={NextLink} 
              href={`/quote/${quote.id}?edit=true`} 
              bg={primaryColor} 
              color={primaryTextColor} 
              _hover={{ opacity: 0.9 }} 
              leftIcon={<Icon as={FilePenLine} />}
            >
              Edit
            </Button>
          )}
        </HStack>
      </HStack>
      
      {/* CONTENT SECTION */}
      {isViewing ? (
        <DocumentViewer quote={quote as any} profile={profile} />
      ) : (
        // 🟢 FIX: Cast profile to any to bypass Json vs PaymentSettings mismatch
        <InvoiceForm profile={profile as any} clients={clients} defaultValues={quote} />
      )}
    </VStack>
  );
}