'use client';

import { User } from '@supabase/supabase-js';
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  Link as ChakraLink,
  HStack,
  Tag,
  useColorModeValue,
  Flex,
  Icon,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Badge,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import {
  Users,
  FileText,
  ShieldCheck,
  Inbox,
  DollarSign,
  Plus,
  ArrowRight,
  ChevronDown,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import AddClientModal from '@/components/AddClientModal';

// --- Type Definitions ---
type OverdueInvoice = {
  id: string;
  invoice_number: string;
  total: number;
  due_date: string;
  clients: {
    name: string;
  } | null;
};

type DashboardClientPageProps = {
  user: User;
  clientCount: number;
  quoteCount: number;
  totalRevenue: number;
  recentDocuments: any[];
  overdueInvoices: OverdueInvoice[];
};

// --- Framer Motion Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// --- Main Dashboard Component ---
export default function DashboardClientPage({
  user,
  clientCount,
  quoteCount,
  totalRevenue,
  recentDocuments = [],
  overdueInvoices = [],
}: DashboardClientPageProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'white');
  const linkHoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const primaryColor = useColorModeValue('brand.500', 'brand.300'); // ALIGNED WITH THEME

  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.email;

  const handleClientAdded = () => {
    router.refresh();
  };

  return (
    <>
      <VStack
        as={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        spacing={8}
        align="stretch"
      >
        {/* Header Section */}
        <Flex
          as={motion.div}
          variants={itemVariants}
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'start', md: 'center' }}
          gap={4}
        >
          <Box>
            <Heading as="h1" size="xl" color={headingColor} textTransform="capitalize" letterSpacing="tight">
              Welcome, {userName}
            </Heading>
            <Text color={textColor} mt={1}>
              Command Center Status: <Badge colorScheme="green" variant="subtle">ONLINE</Badge>
            </Text>
          </Box>
          
          {/* TACTICAL UPGRADE: Button Color Alignment */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<Icon as={ChevronDown} />}
              colorScheme="brand" // FIXED: Uses brand theme color
              size="lg"
              px={8}
              shadow="md"
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              transition="all 0.2s"
            >
              Quick Actions
            </MenuButton>
            <MenuList shadow="xl" borderColor={borderColor}>
              <MenuItem as={NextLink} href="/quote/new" icon={<Icon as={Plus} />} py={3}>
                New Document
              </MenuItem>
              <MenuItem onClick={onOpen} icon={<Icon as={UserPlus} />} py={3}>
                Add New Client
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>

        {/* Stats Grid */}
        <SimpleGrid
          as={motion.div}
          variants={itemVariants}
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={6}
        >
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`R ${totalRevenue.toFixed(2)}`}
            accentColor={primaryColor}
            isCurrency
          />
          <StatCard
            icon={Users}
            label="Total Clients"
            value={clientCount}
            accentColor="blue.400"
          />
          <StatCard
            icon={FileText}
            label="Total Documents"
            value={quoteCount}
            accentColor="purple.400"
          />
          <StatCard
            icon={ShieldCheck}
            label="Account Status"
            value="Active"
            accentColor="green.400"
          />
        </SimpleGrid>

        {/* Action Required Intelligence */}
        {overdueInvoices.length > 0 && (
          <Box as={motion.div} variants={itemVariants}>
            <ActionRequiredCard overdueInvoices={overdueInvoices} />
          </Box>
        )}

        {/* Recent Activity Section */}
        <Box as={motion.div} variants={itemVariants}>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading as="h2" size="lg" color={headingColor} letterSpacing="tight">
              Recent Activity
            </Heading>
            <ChakraLink
              as={NextLink}
              href="/dashboard/quotes"
              color={primaryColor}
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
            shadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="xl"
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
                  p={5} // More padding for "Warmth"
                  w="full"
                  borderBottomWidth={index === recentDocuments.length - 1 ? '0px' : '1px'}
                  borderColor={borderColor}
                  transition="background-color 0.2s ease-in-out"
                >
                  <Flex w="full" justify="space-between" align="center">
                    <HStack spacing={4}>
                      {/* TACTICAL UPGRADE: Better Badges */}
                      <Tag
                        size="md"
                        variant="subtle"
                        colorScheme={doc.document_type === 'Invoice' ? 'green' : 'purple'}
                        borderRadius="full"
                        px={3}
                      >
                         <Icon as={doc.document_type === 'Invoice' ? DollarSign : FileText} size={12} mr={1} />
                        {doc.document_type}
                      </Tag>
                      
                      <VStack align="start" spacing={0}>
                         <Text fontWeight="bold" color={headingColor} fontSize="sm">
                            #{doc.invoice_number || 'DRAFT'}
                         </Text>
                         <Text color={textColor} fontSize="xs">
                            to {doc?.clients?.name || 'Unknown Client'}
                         </Text>
                      </VStack>
                    </HStack>
                    
                    <Text fontWeight="bold" color={headingColor} fontFamily="mono">
                      R {doc.total?.toFixed(2) || '0.00'}
                    </Text>
                  </Flex>
                </ChakraLink>
              ))
            ) : (
              <VStack py={16} spacing={4}>
                <Icon as={Inbox} boxSize={12} color={textColor} opacity={0.5} />
                <Heading as="h3" size="md" color={headingColor}>
                  No Recent Documents
                </Heading>
                <Text color={textColor}>
                  Create a new quote or invoice to see it here.
                </Text>
              </VStack>
            )}
          </VStack>
        </Box>
      </VStack>

      <AddClientModal
        isOpen={isOpen}
        onClose={onClose}
        user={user}
        onClientAdded={handleClientAdded}
      />
    </>
  );
}

// --- Sub-Components ---

type StatCardProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accentColor: string;
  isCurrency?: boolean;
};

function StatCard({ icon, label, value, accentColor, isCurrency = false }: StatCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      p={6}
      bg={cardBg}
      shadow="sm"
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      transition="all 0.2s ease-in-out"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md', borderColor: accentColor }}
      role="group"
    >
      <HStack spacing={4}>
        <Flex
          w={12}
          h={12}
          align={'center'}
          justify={'center'}
          rounded={'full'}
          bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
          _groupHover={{ bg: accentColor, color: 'white' }}
          transition="all 0.2s"
          color={accentColor}
        >
          <Icon as={icon} boxSize={6} />
        </Flex>
        <VStack align="start" spacing={0}>
          <Text fontSize="xs" color={textColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={valueColor} fontFamily={isCurrency ? "mono" : "inherit"}>
            {value}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}

function ActionRequiredCard({ overdueInvoices }: { overdueInvoices: OverdueInvoice[] }) {
  const headingColor = useColorModeValue('gray.800', 'white');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const bg = useColorModeValue('orange.50', 'rgba(237, 137, 54, 0.1)');
  const borderColor = useColorModeValue('orange.200', 'orange.900');

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <HStack>
          <Icon as={AlertTriangle} color={warningColor} />
          <Heading as="h2" size="lg" color={headingColor} letterSpacing="tight">
            Action Required
          </Heading>
        </HStack>
      </Flex>
      <Alert
        status="warning"
        variant="subtle"
        flexDirection="column"
        alignItems="stretch"
        p={0} // Padding handled by children
        borderRadius="xl"
        borderWidth="1px"
        borderColor={borderColor}
        bg={bg}
        shadow="sm"
        overflow="hidden"
      >
        {/* TACTICAL FIX: Added Padding here so it breathes */}
        <Box p={6}>
          <HStack spacing={3}>
            <AlertIcon boxSize={5} color={warningColor} />
            <AlertTitle fontSize="md" fontWeight="bold">
              You have {overdueInvoices.length} overdue invoice(s).
            </AlertTitle>
          </HStack>
          <AlertDescription mt={2} ml={8} fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
            These require your immediate attention to maintain healthy cash flow.
          </AlertDescription>
        </Box>
        
        <VStack
          spacing={0}
          align="stretch"
          borderTopWidth="1px"
          borderColor={borderColor}
        >
          {overdueInvoices.map((invoice, index) => (
            <ChakraLink
              as={NextLink}
              href={`/quote/${invoice.id}`}
              key={invoice.id}
              _hover={{
                textDecoration: 'none',
                bg: useColorModeValue('orange.100', 'whiteAlpha.200'),
              }}
              p={4}
              px={6} // Consistent padding
              w="full"
              borderBottomWidth={index === overdueInvoices.length - 1 ? '0px' : '1px'}
              borderColor={borderColor}
              transition="background-color 0.2s"
            >
              <Flex w="full" justify="space-between" align="center">
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" color={headingColor} fontSize="sm">
                    #{invoice.invoice_number || 'N/A'} — {invoice?.clients?.name}
                  </Text>
                  <HStack spacing={1} mt={1}>
                     <Icon as={Clock} size={12} color={warningColor} />
                     <Text color={warningColor} fontSize="xs" fontWeight="bold">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                     </Text>
                  </HStack>
                </VStack>
                <Text fontWeight="bold" color={warningColor} fontFamily="mono">
                  R {invoice.total?.toFixed(2) || '0.00'}
                </Text>
              </Flex>
            </ChakraLink>
          ))}
        </VStack>
      </Alert>
    </Box>
  );
}