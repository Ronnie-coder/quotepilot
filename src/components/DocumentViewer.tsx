// FILE: src/components/DocumentViewer.tsx (NEW FILE)
'use client';

import { Tables } from '@/types/supabase';
import { Box, Heading, Text, VStack, HStack, Divider, SimpleGrid, useColorModeValue, Tag } from '@chakra-ui/react';

type DocumentViewerProps = {
  quote: Tables<'quotes'> & { clients: Tables<'clients'> | null };
  profile: Tables<'profiles'> | null;
};

// --- Reusable Sub-Components for Clean Layout ---
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'white');
  return (
    <Box bg={cardBg} p={{ base: 5, md: 6 }} borderRadius="lg" shadow="md" borderWidth="1px" borderColor={borderColor}>
      <Heading as="h3" size="md" mb={6} color={headingColor}>{title}</Heading>
      {children}
    </Box>
  );
};

const DetailItem = ({ label, value }: { label: string, value: string | React.ReactNode }) => {
  const textColor = useColorModeValue('gray.500', 'gray.400');
  return (
    <Box>
      <Text fontSize="sm" color={textColor} fontWeight="bold" textTransform="uppercase">{label}</Text>
      <Text mt={1} fontSize="md" fontWeight="medium">{value}</Text>
    </Box>
  );
};

export default function DocumentViewer({ quote, profile }: DocumentViewerProps) {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const primaryColor = useColorModeValue('cyan.500', 'cyan.300');
  const lineItems = (quote.line_items as any[] || []);

  const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const vatAmount = subtotal * ((quote.vat_rate || 0) / 100);

  const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';

  return (
    <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8} alignItems="start">
      {/* Main Content Column */}
      <VStack spacing={6} align="stretch" gridColumn={{ lg: 'span 2' }}>
        <Section title="Client Details">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box>
              <Text fontSize="sm" fontWeight="bold" color={textColor}>FROM</Text>
              <Text fontWeight="bold" mt={1}>{profile?.company_name || 'N/A'}</Text>
              <Text fontSize="sm">{profile?.company_address}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="bold" color={textColor}>TO</Text>
              <Text fontWeight="bold" mt={1}>{quote.clients?.name || 'N/A'}</Text>
              <Text fontSize="sm">{quote.clients?.address}</Text>
              <Text fontSize="sm">{quote.clients?.email}</Text>
            </Box>
          </SimpleGrid>
        </Section>

        <Section title="Line Items">
          <VStack spacing={4} align="stretch">
            {/* Table Header */}
            <HStack w="100%" spacing={4} color={textColor} fontWeight="bold" display={{ base: 'none', md: 'flex' }}>
              <Text flex={5}>DESCRIPTION</Text>
              <Text flex={1.5} textAlign="right">QTY</Text>
              <Text flex={2} textAlign="right">UNIT PRICE</Text>
              <Text flex={2} textAlign="right">TOTAL</Text>
            </HStack>
            {/* Table Body */}
            {lineItems.map((item, index) => (
              <Box key={index}>
                <SimpleGrid columns={{ base: 2, md: 4}} spacing={4} alignItems="center">
                    <Box gridColumn={{ base: '1 / -1', md: 'auto' }} flex={{md: 5}}>
                        <Text fontWeight="medium">{item.description}</Text>
                    </Box>
                    <Text flex={{md: 1.5}} textAlign={{ base: 'left', md: 'right' }}><Text as="span" color={textColor} display={{md: 'none'}}>Qty: </Text>{item.quantity}</Text>
                    <Text flex={{md: 2}} textAlign={{ base: 'left', md: 'right' }}><Text as="span" color={textColor} display={{md: 'none'}}>Price: </Text>R {Number(item.unitPrice).toFixed(2)}</Text>
                    <Text flex={{md: 2}} textAlign={{ base: 'right', md: 'right' }} fontWeight="medium">R {(item.quantity * item.unitPrice).toFixed(2)}</Text>
                </SimpleGrid>
                {index < lineItems.length - 1 && <Divider my={4} />}
              </Box>
            ))}
          </VStack>
        </Section>
        {quote.notes && <Section title="Notes / Terms"><Text whiteSpace="pre-wrap">{quote.notes}</Text></Section>}
      </VStack>

      {/* Sidebar Column */}
      <VStack spacing={6} align="stretch" position={{ lg: 'sticky' }} top={8}>
        <Section title="Document Details">
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <DetailItem label="Document #" value={`#${quote.invoice_number}`} />
              <Tag colorScheme={quote.status === 'Paid' ? 'green' : quote.status === 'Overdue' ? 'red' : 'gray'} size="lg" textTransform="capitalize">{quote.status || 'Draft'}</Tag>
            </HStack>
            <DetailItem label="Date Issued" value={formatDate(quote.invoice_date)} />
            {quote.document_type === 'Invoice' && <DetailItem label="Due Date" value={formatDate(quote.due_date)} />}
          </VStack>
        </Section>
        <Section title="Summary">
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between"><Text color={textColor}>Subtotal</Text><Text>R {subtotal.toFixed(2)}</Text></HStack>
            <HStack justify="space-between"><Text color={textColor}>VAT ({quote.vat_rate || 0}%)</Text><Text>R {vatAmount.toFixed(2)}</Text></HStack>
            <Divider my={2} />
            <HStack justify="space-between" fontWeight="bold" fontSize="2xl">
              <Text>Total</Text>
              <Text color={primaryColor}>R {Number(quote.total).toFixed(2)}</Text>
            </HStack>
          </VStack>
        </Section>
      </VStack>
    </SimpleGrid>
  );
}