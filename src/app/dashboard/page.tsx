'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Box, Heading, Text, Spinner, Button, VStack, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Tag, Flex, useColorModeValue,
} from '@chakra-ui/react';
import NextLink from 'next/link';

interface Quote {
  id: string;
  created_at: string;
  document_type: string;
  client_info: { name: string };
  total: number;
  status: string;
  invoice_number?: string;
}

const DashboardPage = () => {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.600');

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('quotes')
          .select('id, created_at, document_type, client_info, total, status, invoice_number')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setQuotes(data);
      } catch (error) {
        console.error('Error fetching quotes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && userId) {
      fetchQuotes();
    }
  }, [userId, isLoaded]);

  const handleRowClick = (quoteId: string) => {
    console.log(`Navigating to view/edit document ${quoteId}`);
    alert(`This will open document ${quoteId} in a future update!`);
  };

  if (loading || !isLoaded) {
    return (
      <Flex justify="center" align="center" minH="80vh"><Spinner size="xl" /></Flex>
    );
  }

  return (
    <Box bg={bgColor} flex="1" p={{ base: 4, md: 8 }}>
      <Box maxW="container.xl" mx="auto">
        <Flex justify="space-between" align="center" mb={6}>
          <Heading as="h1" size="lg">Your Documents</Heading>
          
          {/* --- FIX: Updated to modern NextLink syntax to remove errors --- */}
          <NextLink href="/quote">
            <Button colorScheme="brand">Create New</Button>
          </NextLink>

        </Flex>

        {quotes.length === 0 ? (
          <VStack bg={cardBgColor} p={10} borderRadius="lg" shadow="sm" spacing={4}>
            <Heading as="h2" size="md">No documents yet!</Heading>
            <Text>Click the "Create New" button to generate your first quote or invoice.</Text>
          </VStack>
        ) : (
          <TableContainer bg={cardBgColor} borderRadius="lg" shadow="sm">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Type</Th>
                  <Th>Doc #</Th>
                  <Th>Client</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th isNumeric>Total</Th>
                </Tr>
              </Thead>
              <Tbody>
                {quotes.map((quote) => (
                  <Tr 
                    key={quote.id} 
                    onClick={() => handleRowClick(quote.id)}
                    cursor="pointer"
                    _hover={{ bg: hoverBgColor }}
                  >
                    <Td>
                      <Tag colorScheme={quote.document_type === 'Invoice' ? 'blue' : 'purple'}>
                        {quote.document_type}
                      </Tag>
                    </Td>
                    <Td>{quote.invoice_number || 'N/A'}</Td>
                    <Td>{quote.client_info?.name || 'N/A'}</Td>
                    <Td>{new Date(quote.created_at).toLocaleDateString('en-ZA')}</Td>
                    <Td><Tag>{quote.status}</Tag></Td>
                    <Td isNumeric>R{quote.total.toFixed(2)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage;