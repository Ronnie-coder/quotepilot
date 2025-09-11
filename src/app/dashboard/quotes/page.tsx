// src/app/dashboard/quotes/page.tsx (REFRACTORED AS CLIENT COMPONENT)
'use client'; // VANGUARD DIRECTIVE: Re-designate this as a Client Component.

import { useState, useEffect, useCallback } from 'react';
import { DeleteButton } from './DeleteButton';
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; // Use the browser client
import {
  Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, HStack, IconButton, Text, VStack, Spinner, Flex,
} from '@chakra-ui/react';
import { AddIcon, EditIcon } from '@chakra-ui/icons';
import Link from 'next/link';

// VANGUARD DIRECTIVE: Define the shape of our document data for TypeScript
type Document = {
  id: string;
  document_type: string;
  invoice_date: string;
  total: number | null;
  clients: { name: string } | null;
};

// Helper to format currency
const formatCurrency = (amount: number | null) => {
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

export default function QuotesPage() {
  // VANGUARD DIRECTIVE: Use state to manage data and loading status in a Client Component
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    
    const { data, error: fetchError } = await supabase
      .from('quotes')
      .select('id, document_type, invoice_date, total, clients(name)')
      .order('invoice_date', { ascending: false });

    if (fetchError) {
      console.error('Error fetching documents:', fetchError);
      setError('Could not load your documents. Please try again later.');
    } else {
      setDocuments(data || []);
    }
    setIsLoading(false);
  }, []);

  // VANGUARD DIRECTIVE: Use useEffect to fetch data when the component mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <Flex justify="center" align="center" height="50vh"><Spinner size="xl" /></Flex>;
  }

  if (error) {
    return <Text color="red.500" p={{ base: 4, md: 8 }}>{error}</Text>;
  }

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Command Roster</Heading>
          <Button as={Link} href="/quote/new" leftIcon={<AddIcon />} colorScheme="brand">
            Create New
          </Button>
        </HStack>

        {documents.length === 0 ? (
          <Text>You have not created any documents yet. Click "Create New" to begin.</Text>
        ) : (
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr><Th>Client Name</Th><Th>Type</Th><Th>Date</Th><Th isNumeric>Total</Th><Th>Actions</Th></Tr>
              </Thead>
              <Tbody>
                {documents.map((doc) => (
                  <Tr key={doc.id}>
                    <Td>{doc.clients?.name || 'N/A'}</Td>
                    <Td>{doc.document_type}</Td>
                    <Td>{new Date(doc.invoice_date).toLocaleDateString()}</Td>
                    <Td isNumeric>{formatCurrency(doc.total)}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton as={Link} href={`/quote/${doc.id}`} aria-label="Edit document" icon={<EditIcon />} size="sm" colorScheme="yellow" />
                        <DeleteButton quoteId={doc.id} clientName={doc.clients?.name || 'this client'} />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </VStack>
    </Box>
  );
}