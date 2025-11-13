'use client';

import { User } from '@supabase/supabase-js';
import { Box, Heading, SimpleGrid, Text, VStack, Link as ChakraLink, HStack, Tag, useColorModeValue, Flex, Icon, Button } from '@chakra-ui/react';
import NextLink from 'next/link';
import { Users, FileText, ShieldCheck, Inbox, DollarSign, Plus, ArrowRight } from 'lucide-react';

type DashboardClientPageProps = {
  user: User;
  clientCount: number;
  quoteCount: number;
  totalRevenue: number; // This prop is now supplied by the server
  recentDocuments: any[];
};

export default function DashboardClientPage({ user, clientCount, quoteCount, totalRevenue, recentDocuments = [] }: DashboardClientPageProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'white');
  const linkHoverBg = useColorModeValue('gray.50', 'gray.700');
  const brandGold = useColorModeValue('yellow.500', 'yellow.300');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.email;

  return (
    <VStack spacing={8} align="stretch">
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }} gap={4}>
        <Box>
          <Heading as="h1" size="xl" color={headingColor} textTransform="capitalize">
            Welcome, {userName}
          </Heading>
          <Text color={textColor}>Here is your operational summary for today.</Text>
        </Box>
        <Button
          as={NextLink}
          href="/quote/new"
          leftIcon={<Icon as={Plus} />}
          colorScheme="yellow"
          bg={brandGold}
          color={useColorModeValue('gray.800', 'gray.900')}
          _hover={{ bg: useColorModeValue('yellow.600', 'yellow.400') }}
          size="lg"
          px={8}
          shadow="md"
        >
          Create Document
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`R ${totalRevenue.toFixed(2)}`}
          accentColor={brandGold}
        />
        <StatCard
          icon={Users}
          label="Total Clients"
          value={clientCount}
          accentColor={brandGold}
        />
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={quoteCount}
          accentColor={brandGold}
        />
        <StatCard
          icon={ShieldCheck}
          label="Account Status"
          value="Active"
          accentColor="green.400"
        />
      </SimpleGrid>
      
      <Box>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h2" size="lg" color={headingColor}>Recent Activity</Heading>
          <ChakraLink 
            as={NextLink} 
            href="/dashboard/quotes" 
            color={brandGold}
            fontWeight="semibold"
            display="flex"
            alignItems="center"
            gap={1}
            _hover={{ textDecoration: 'underline' }}
          >
            View All <Icon as={ArrowRight} boxSize={4} />
          </ChakraLink>
        </Flex>
        <VStack 
          spacing={0} 
          align="stretch" 
          shadow="md" 
          borderWidth="1px" 
          borderColor={borderColor}
          borderRadius="lg" 
          bg={cardBg}
          overflow="hidden"
        >
          {recentDocuments && recentDocuments.length > 0 ? (
            recentDocuments.map((doc, index) => (
              <ChakraLink 
                as={NextLink} 
                href={`/quote/${doc.id}`} 
                key={doc.id}
                _hover={{ textDecoration: 'none', bg: linkHoverBg }}
                p={4}
                w="full"
                borderBottomWidth={index === recentDocuments.length - 1 ? '0px' : '1px'}
                borderColor={borderColor}
                transition="background-color 0.2s ease-in-out"
              >
                <Flex w="full" justify="space-between" align="center">
                  <HStack spacing={4}>
                    <Tag size="md" variant="subtle" colorScheme={doc.document_type === 'Invoice' ? 'blue' : 'purple'}>
                      {doc.document_type}
                    </Tag>
                    <Text fontWeight="medium" color={headingColor}>#{doc.invoice_number || 'N/A'}</Text>
                    <Text color={textColor}>to {doc?.clients?.name || 'Unknown'}</Text>
                  </HStack>
                  <Text fontWeight="bold" color={brandGold}>R {doc.total?.toFixed(2) || '0.00'}</Text>
                </Flex>
              </ChakraLink>
            ))
          ) : (
            <VStack py={16} spacing={4}>
              <Icon as={Inbox} boxSize={12} color={textColor} />
              <Heading as="h3" size="md" color={headingColor}>No Recent Documents</Heading>
              <Text color={textColor}>Create a new quote or invoice to see it here.</Text>
            </VStack>
          )}
        </VStack>
      </Box>
    </VStack>
  );
}

type StatCardProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accentColor: string;
}

function StatCard({ icon, label, value, accentColor }: StatCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      p={5}
      bg={cardBg}
      shadow="md"
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      transition="all 0.2s ease-in-out"
      _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
    >
      <HStack spacing={4}>
        <Icon as={icon} boxSize={8} color={accentColor} />
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" color={textColor} fontWeight="medium">{label}</Text>
          <Text fontSize="2xl" fontWeight="bold" color={valueColor}>{value}</Text>
        </VStack>
      </HStack>
    </Box>
  );
}