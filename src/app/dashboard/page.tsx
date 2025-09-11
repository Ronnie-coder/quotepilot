// src/app/dashboard/page.tsx (FULL REPLACEMENT)
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; // <-- MODIFICATION 1: Import our unified client creator.
import { Box, Container, Heading, Text, Spinner, Flex, useColorModeValue, SimpleGrid } from '@chakra-ui/react';

const DashboardPage = () => {
  const { isLoaded } = useAuth(); // <-- MODIFICATION 2: We no longer need getToken.
  const [quoteCount, setQuoteCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const accentTextColor = useColorModeValue('brand.500', 'brand.300');

  const fetchData = useCallback(async () => {
    if (!isLoaded) return;
    setIsLoading(true);

    // MODIFICATION 3: ARCHITECTURAL SUPERIORITY
    // Our SupabaseProvider in layout.tsx has already handled the authentication handshake.
    // We simply call our browser client, which is now automatically authenticated.
    const supabase = createSupabaseBrowserClient();

    try {
      // --- ENEMY NEUTRALIZED ---
      // The manual createClient and the rogue getToken({ template: 'supabase' }) calls have been purged.
      // The rest of the logic works perfectly with the correctly authenticated client.

      const { count: quotes, error: quoteError } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true });
      if (quoteError) throw quoteError;
      setQuoteCount(quotes || 0);

      const { count: clients, error: clientError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      if (clientError) throw clientError;
      setClientCount(clients || 0);

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded]); // <-- MODIFICATION 4: getToken removed from dependency array.

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" mb={8}>Dashboard</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <Box p={6} bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg">
          <Heading size="md" color={secondaryTextColor}>Total Clients</Heading>
          <Text fontSize="4xl" fontWeight="bold" color={accentTextColor}>{clientCount}</Text>
        </Box>
        <Box p={6} bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="lg">
          <Heading size="md" color={secondaryTextColor}>Total Quotes</Heading>
          <Text fontSize="4xl" fontWeight="bold" color={accentTextColor}>{quoteCount}</Text>
        </Box>
      </SimpleGrid>
    </Container>
  );
};

export default DashboardPage;