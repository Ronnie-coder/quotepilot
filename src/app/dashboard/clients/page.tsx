// src/app/dashboard/clients/page.tsx (FULL REPLACEMENT)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; // <-- MODIFICATION 1: Use unified client
import { Box, Heading, Text, VStack, Spinner, Alert, AlertIcon, Button, HStack, useColorModeValue } from '@chakra-ui/react';
import Link from 'next/link';
import { AddIcon } from '@chakra-ui/icons';

type Client = {
  id: string;
  name: string;
  email: string;
  address: string;
};

export default function ClientsPage() {
  const { isLoaded } = useAuth(); // <-- MODIFICATION 2: getToken no longer needed
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const fetchClients = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);

    try {
      // --- ENEMY NEUTRALIZED ---
      // The rogue getToken and createClient calls have been purged.
      // We now use the automatically authenticated client provided by our new architecture.
      const supabase = createSupabaseBrowserClient();

      const { data, error } = await supabase.from('clients').select('*');
      if (error) throw error;
      
      setClients(data || []);

    } catch (err: any) {
      setError('Failed to fetch clients.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded]); // <-- MODIFICATION 3: Dependency updated

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  // ... rest of the JSX remains the same
  if (loading) {
    return <Box textAlign="center" mt={10}><Spinner size="xl" /></Box>;
  }

  return (
    <Box p={8}>
      <HStack justifyContent="space-between" mb={6}>
        <Heading>My Clients</Heading>
        <Link href="/quote" passHref>
          <Button leftIcon={<AddIcon />} colorScheme="brand">
            Create New Quote/Invoice
          </Button>
        </Link>
      </HStack>
      
      {error && <Alert status="error"><AlertIcon />{error}</Alert>}
      
      {clients.length === 0 && !error ? (
        <Text>You haven't added any clients yet.</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {clients.map((client) => (
            <Box key={client.id} p={5} bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md">
              <Heading size="md" color={headingColor}>{client.name}</Heading>
              <Text color={textColor}>{client.email}</Text>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}