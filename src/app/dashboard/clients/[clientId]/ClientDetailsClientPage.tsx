'use client';

import { 
  Box, Heading, Text, Flex, Button, Icon, 
  SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, 
  Table, Thead, Tbody, Tr, Th, Td, Badge, 
  useColorModeValue, Card, CardBody, Avatar, Divider, HStack,
  IconButton, Tooltip, VStack
} from '@chakra-ui/react';
import { 
  ArrowLeft, Plus, Mail, Phone, MapPin, 
  FileText, CheckCircle2, AlertCircle, Clock 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Note: Ensure this path is correct based on your project structure
import { DeleteClientButton } from '../../clients/DeleteClientButton'; 
import { formatCurrency } from '@/utils/formatCurrency'; // <--- NEW IMPORT

interface Props {
  client: any;
  documents: any[];
  stats: {
    lifetimeValue: number;
    outstanding: number;
    invoiceCount: number;
    quoteCount: number;
  };
}

export default function ClientDetailsClientPage({ client, documents, stats }: Props) {
  const router = useRouter();
  
  // Theme
  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const headingColor = useColorModeValue('gray.700', 'white');

  return (
    <Box>
      {/* 1. NAVIGATION HEADER */}
      <Flex mb={6} align="center" gap={4}>
        <IconButton 
          aria-label="Back" 
          icon={<ArrowLeft size={20} />} 
          onClick={() => router.back()} 
          variant="ghost"
        />
        <Box>
          <Heading size="lg" color={headingColor}>{client.name}</Heading>
          <HStack spacing={2} color={mutedText} fontSize="sm">
            <Icon as={Clock} size={14} />
            <Text>Added on {new Date(client.created_at).toLocaleDateString()}</Text>
          </HStack>
        </Box>
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6} mb={8}>
        
        {/* 2. CLIENT INFO CARD */}
        <Card bg={bgCard} shadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Flex align="center" gap={4} mb={4}>
              <Avatar name={client.name} bg="teal.500" color="white" size="md" />
              <Box>
                <Heading size="sm">Contact Details</Heading>
                <Text fontSize="xs" color="gray.500">PRIMARY CONTACT</Text>
              </Box>
            </Flex>
            <Divider mb={4} />
            <VStack align="start" spacing={3}>
              <HStack>
                <Icon as={Mail} size={16} color="gray.400" />
                <Text fontSize="sm">{client.email || 'No email provided'}</Text>
              </HStack>
              <HStack>
                <Icon as={Phone} size={16} color="gray.400" />
                <Text fontSize="sm">{client.phone || 'No phone provided'}</Text>
              </HStack>
              <HStack align="start">
                <Icon as={MapPin} size={16} color="gray.400" mt={1} />
                <Text fontSize="sm">{client.address || 'No address provided'}</Text>
              </HStack>
            </VStack>
            <Box mt={6}>
                 <Flex justify="flex-end">
                     {/* Placeholder Edit Button */}
                     <Button size="sm" variant="outline" leftIcon={<Icon as={FileText} />}>
                        Edit Client
                     </Button>
                 </Flex>
            </Box>
          </CardBody>
        </Card>

        {/* 3. FINANCIAL INTELLIGENCE */}
        <Box gridColumn={{ lg: 'span 2' }}>
           <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={6}>
              <StatCard 
                label="Lifetime Value" 
                // 🟢 UPDATED: Uses client's preferred currency
                value={formatCurrency(stats.lifetimeValue, client.currency)} 
                icon={CheckCircle2} 
                color="green.500" 
                helpText="Total Paid Invoices"
              />
              <StatCard 
                label="Outstanding" 
                // 🟢 UPDATED: Uses client's preferred currency
                value={formatCurrency(stats.outstanding, client.currency)} 
                icon={AlertCircle} 
                color="orange.500" 
                helpText="Unpaid Sent Invoices"
              />
              <StatCard 
                label="Total Documents" 
                value={(stats.invoiceCount + stats.quoteCount).toString()} 
                icon={FileText} 
                color="blue.500" 
                helpText={`${stats.invoiceCount} Invoices, ${stats.quoteCount} Quotes`}
              />
           </SimpleGrid>

           {/* 4. DOCUMENT HISTORY */}
           <Box bg={bgCard} borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflow="hidden">
             <Flex p={4} justify="space-between" align="center" bg={useColorModeValue('gray.50', 'gray.900')}>
               <Heading size="sm">Document History</Heading>
               <Button as={Link} href="/quote/new" size="sm" colorScheme="brand" leftIcon={<Icon as={Plus} />}>
                 New Document
               </Button>
             </Flex>
             <Table variant="simple" size="sm">
               <Thead>
                 <Tr>
                   <Th>Date</Th>
                   <Th>Number</Th>
                   <Th>Type</Th>
                   <Th>Status</Th>
                   <Th isNumeric>Amount</Th>
                 </Tr>
               </Thead>
               <Tbody>
                 {documents.length > 0 ? (
                   documents.map((doc: any) => (
                     <Tr key={doc.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }} cursor="pointer" onClick={() => router.push(`/quote/${doc.id}`)}>
                       <Td>{new Date(doc.created_at).toLocaleDateString()}</Td>
                       <Td fontWeight="medium">#{doc.invoice_number}</Td>
                       <Td>{doc.document_type}</Td>
                       <Td>
                         <Badge 
                           colorScheme={
                             doc.status === 'paid' ? 'green' : 
                             doc.status === 'overdue' ? 'red' : 
                             doc.status === 'sent' ? 'blue' : 'gray'
                           }
                         >
                           {doc.status}
                         </Badge>
                       </Td>
                       {/* 🟢 UPDATED: Uses individual document currency */}
                       <Td isNumeric>{formatCurrency(doc.total, doc.currency)}</Td>
                     </Tr>
                   ))
                 ) : (
                   <Tr>
                     <Td colSpan={5} textAlign="center" py={8} color="gray.500">
                       No documents found for this client.
                     </Td>
                   </Tr>
                 )}
               </Tbody>
             </Table>
           </Box>
        </Box>

      </SimpleGrid>
    </Box>
  );
}

// Sub-component for Stats
const StatCard = ({ label, value, icon, color, helpText }: any) => {
    const bg = useColorModeValue('white', 'gray.800');
    return (
        <Card bg={bg} shadow="sm" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
            <CardBody>
                <Stat>
                    <Flex align="center" gap={2} mb={1}>
                        <Icon as={icon} color={color} />
                        <StatLabel color="gray.500">{label}</StatLabel>
                    </Flex>
                    <StatNumber fontSize="2xl">{value}</StatNumber>
                    <StatHelpText fontSize="xs">{helpText}</StatHelpText>
                </Stat>
            </CardBody>
        </Card>
    );
};