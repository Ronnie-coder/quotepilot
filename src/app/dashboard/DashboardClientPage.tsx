'use client';

import { User } from '@supabase/supabase-js';
import {
  Box, Heading, SimpleGrid, Text, VStack, Link as ChakraLink, HStack,
  useColorModeValue, Flex, Icon, Button, Menu, MenuButton, MenuList,
  MenuItem, Alert, AlertIcon, AlertTitle, AlertDescription, useDisclosure,
  Badge, useToken, Divider,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import {
  Users, FileText, Inbox, DollarSign, Plus, ChevronDown, ChevronUp,
  UserPlus, AlertTriangle, Clock, TrendingUp, PieChart as PieChartIcon,
  Hourglass
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AddClientModal from '@/components/AddClientModal';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { formatCurrency } from '@/utils/formatCurrency';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

type OverdueInvoice = {
  id: string;
  invoice_number: string;
  total: number;
  due_date: string;
  currency?: string; 
  clients: { name: string } | null;
};

type StatusMetric = { name: string; value: number };

type DashboardClientPageProps = {
  user: User;
  clientCount: number;
  quoteCount: number;
  totalRevenue: number;
  outstandingRevenue: number; 
  recentDocuments: any[];
  overdueInvoices: OverdueInvoice[];
  revenueData: { name: string; value: number }[];
  statusData: StatusMetric[];
  currency: string; 
};

// --- VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

function StatCard({ icon, label, value, accentColor, isCurrency = false }: any) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      p={6} bg={cardBg} shadow="sm" borderWidth="1px" borderColor={borderColor}
      borderRadius="xl" transition="all 0.2s ease-in-out"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md', borderColor: accentColor }}
      role="group"
    >
      <HStack spacing={4}>
        <Flex
          w={12} h={12} align={'center'} justify={'center'} rounded={'full'}
          bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
          _groupHover={{ bg: accentColor, color: 'white' }}
          transition="all 0.2s" color={accentColor}
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

function ActionRequiredCard({ overdueInvoices, defaultCurrency }: { overdueInvoices: OverdueInvoice[], defaultCurrency: string }) {
  const headingColor = useColorModeValue('gray.800', 'white');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const bg = useColorModeValue('orange.50', 'rgba(237, 137, 54, 0.1)');
  const borderColor = useColorModeValue('orange.200', 'orange.900');
  const [showAll, setShowAll] = useState(false);
  const displayedInvoices = showAll ? overdueInvoices : overdueInvoices.slice(0, 3);
  const hiddenCount = overdueInvoices.length - 3;
  const hasHiddenItems = overdueInvoices.length > 3;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <HStack>
          <Icon as={AlertTriangle} color={warningColor} boxSize={5} />
          <Heading as="h2" size="lg" color={headingColor} letterSpacing="tight">Overdue Payments</Heading>
        </HStack>
      </Flex>
      <Alert status="warning" variant="subtle" flexDirection="column" alignItems="stretch" p={0} borderRadius="xl" borderWidth="1px" borderColor={borderColor} bg={bg} shadow="sm" overflow="hidden">
        <Box p={6}>
          <HStack spacing={3}>
            <AlertIcon boxSize={5} color={warningColor} />
            <AlertTitle fontSize="md" fontWeight="bold">You have {overdueInvoices.length} overdue invoice(s).</AlertTitle>
          </HStack>
          <AlertDescription mt={2} ml={8} fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
            Send a friendly reminder to these clients to get paid faster.
          </AlertDescription>
        </Box>
        <VStack spacing={0} align="stretch" borderTopWidth="1px" borderColor={borderColor}>
          {displayedInvoices.map((invoice, index) => (
            <ChakraLink as={NextLink} href={`/quote/${invoice.id}`} key={invoice.id} _hover={{ textDecoration: 'none', bg: useColorModeValue('orange.100', 'whiteAlpha.200') }} p={4} px={6} w="full" borderBottomWidth={index === displayedInvoices.length - 1 && !hasHiddenItems ? '0px' : '1px'} borderColor={borderColor} transition="background-color 0.2s">
              <Flex w="full" justify="space-between" align="center">
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" color={headingColor} fontSize="sm">#{invoice.invoice_number || 'N/A'} — {invoice?.clients?.name}</Text>
                  <HStack spacing={1} mt={1}><Icon as={Clock} boxSize={3} color={warningColor} /><Text color={warningColor} fontSize="xs" fontWeight="bold">Due: {new Date(invoice.due_date).toLocaleDateString()}</Text></HStack>
                </VStack>
                <Text fontWeight="bold" color={warningColor} fontFamily="mono">{formatCurrency(invoice.total || 0, invoice.currency || defaultCurrency)}</Text>
              </Flex>
            </ChakraLink>
          ))}
        </VStack>
        {hasHiddenItems && (<Button onClick={() => setShowAll(!showAll)} variant="ghost" colorScheme="orange" size="sm" width="full" rounded="none" py={6} rightIcon={<Icon as={showAll ? ChevronUp : ChevronDown} />} _hover={{ bg: useColorModeValue('orange.100', 'whiteAlpha.200') }}>{showAll ? 'Show Less' : `View ${hiddenCount} More Overdue Invoices`}</Button>)}
      </Alert>
    </Box>
  );
}

// --- MAIN PAGE ---
export default function DashboardClientPage({
  user, clientCount, quoteCount, totalRevenue, outstandingRevenue, 
  recentDocuments = [], overdueInvoices = [], revenueData = [], statusData = [], currency, 
}: DashboardClientPageProps) {
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'white');
  const linkHoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const primaryColor = useColorModeValue('brand.500', 'brand.300');
  
  const tooltipBg = useColorModeValue('#ffffff', '#2D3748');
  const tooltipBorder = useColorModeValue('#E2E8F0', '#4A5568');
  const tooltipText = useColorModeValue('#1A202C', '#F7FAFC');
  const [brand500, green400, orange400, gray300, blue400] = useToken('colors', ['brand.500', 'green.400', 'orange.400', 'gray.300', 'blue.400']);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.email;

  const handleClientAdded = () => router.refresh();
  
  const getStatusColor = (status: string) => {
    const s = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '';
    switch (s) {
      case 'Paid': return green400;
      case 'Overdue': return orange400;
      case 'Draft': return gray300;
      case 'Sent': return blue400;
      case 'Pending': return blue400;
      default: return gray300;
    }
  };

  const totalInvoices = statusData.reduce((acc, curr) => acc + curr.value, 0);
  const paidCount = statusData.find(s => s.name === 'Paid')?.value || 0;
  const overdueCount = statusData.find(s => s.name === 'Overdue')?.value || 0;
  
  const hasSent = statusData.some(s => s.name === 'Sent' || s.name === 'Paid');

  return (
    <>
      <VStack spacing={8} align="stretch" pb={12}>
        
        {/* Header */}
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }} gap={4}>
          <Box>
            <Heading as="h1" size="lg" color={headingColor} letterSpacing="tight">Welcome back, {userName}</Heading>
            <HStack mt={1}>
              <Box w={2} h={2} borderRadius="full" bg="green.400" boxShadow={`0 0 10px var(--chakra-colors-green-400)`} />
              <Text color={textColor} fontSize="sm">Ready for business</Text>
            </HStack>
          </Box>
          <Menu>
            <MenuButton as={Button} rightIcon={<Icon as={ChevronDown} boxSize={4} />} colorScheme="brand" size="md" shadow="md" _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}>
              Quick Actions
            </MenuButton>
            <MenuList shadow="xl" borderColor={borderColor}>
              <MenuItem as={NextLink} href="/quote/new" icon={<Icon as={Plus} boxSize={4} />}>New Document</MenuItem>
              <MenuItem onClick={onOpen} icon={<Icon as={UserPlus} boxSize={4} />}>Add New Client</MenuItem>
            </MenuList>
          </Menu>
        </Flex>

        {/* Checklist */}
        <Box>
           <OnboardingChecklist 
               hasClients={clientCount > 0} 
               hasInvoices={quoteCount > 0} 
               hasSent={hasSent} 
           />
        </Box>

        {/* Stats */}
        <VStack as={motion.div} variants={containerVariants} initial="hidden" animate="visible" spacing={8} align="stretch">
            
            {overdueInvoices.length > 0 && (
              <Box as={motion.div} variants={itemVariants}>
                <ActionRequiredCard overdueInvoices={overdueInvoices} defaultCurrency={currency} />
              </Box>
            )}

            <SimpleGrid as={motion.div} variants={itemVariants} columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(totalRevenue, currency)} accentColor={primaryColor} isCurrency />
              <StatCard icon={Users} label="Total Clients" value={clientCount} accentColor="blue.400" />
              <StatCard icon={FileText} label="Total Documents" value={quoteCount} accentColor="purple.400" />
              <StatCard icon={Hourglass} label="Outstanding" value={formatCurrency(outstandingRevenue, currency)} accentColor="orange.400" isCurrency />
            </SimpleGrid>

            {/* Charts Section */}
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} as={motion.div} variants={itemVariants}>
              
              {/* Revenue Chart with FIX */}
              <Box gridColumn={{ lg: 'span 2' }} bg={cardBg} p={6} borderRadius="xl" borderWidth="1px" borderColor={borderColor} shadow="sm" position="relative" minWidth={0}>
                <Flex justify="space-between" align="center" mb={6}>
                    <HStack>
                      <Icon as={TrendingUp} color={primaryColor} boxSize={5} />
                      <Heading size="md" color={headingColor}>Revenue Velocity</Heading>
                    </HStack>
                    <Badge colorScheme="brand" variant="subtle">Last 6 Months</Badge>
                </Flex>
                <Box h="300px" w="100%">
                  {revenueData && revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={brand500} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={brand500} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor === 'gray.700' ? '#2D3748' : '#E2E8F0'} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor === 'gray.400' ? '#A0AEC0' : '#718096', fontSize: 12 }} dy={10} />
                        <YAxis hide />
                        {/* 🟢 FIX: Updated formatter type to satisfy Recharts strict typing */}
                        <Tooltip 
                            contentStyle={{ backgroundColor: tooltipBg, borderRadius: '8px', border: `1px solid ${tooltipBorder}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                            labelStyle={{ color: headingColor, fontWeight: 'bold' }} 
                            itemStyle={{ color: tooltipText }} 
                            formatter={(value: any) => [formatCurrency(Number(value) || 0, currency), 'Revenue']} 
                            cursor={{ stroke: brand500, strokeWidth: 1 }} 
                        />
                        <Area type="monotone" dataKey="value" stroke={brand500} fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <Flex h="100%" align="center" justify="center" direction="column" color="gray.400"><Text fontSize="sm">Not enough data to display chart.</Text></Flex>
                  )}
                </Box>
              </Box>

              {/* Pie Chart with FIX */}
              <Flex direction="column" bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} shadow="sm" p={6} h="full" minH="400px" minWidth={0}>
                <HStack mb={4}><Icon as={PieChartIcon} color="orange.400" boxSize={5} /><Heading size="md" color={headingColor}>Invoice Health</Heading></HStack>
                <Box h="300px" w="100%" position="relative">
                  {totalInvoices > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} stroke="none" />))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderRadius: '8px', border: `1px solid ${tooltipBorder}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} itemStyle={{ color: tooltipText }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Flex h="100%" align="center" justify="center" direction="column" color="gray.400"><Text fontSize="sm">No invoice data available.</Text></Flex>
                  )}
                </Box>
                <HStack justify="space-around" mt={4} pt={4} borderTopWidth="1px" borderColor={borderColor}>
                  <VStack spacing={0}><Text fontSize="xs" color="gray.500">Paid</Text><Text fontWeight="bold" color="green.500">{totalInvoices ? Math.round((paidCount / totalInvoices) * 100) : 0}%</Text></VStack>
                  <VStack spacing={0}><Text fontSize="xs" color="gray.500">Overdue</Text><Text fontWeight="bold" color="orange.500">{totalInvoices ? Math.round((overdueCount / totalInvoices) * 100) : 0}%</Text></VStack>
                </HStack>
              </Flex>
            </SimpleGrid>

            {/* Recent Activity Table */}
            <Box as={motion.div} variants={itemVariants} bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} shadow="sm" overflow="hidden">
                <Flex p={6} pb={4} justify="space-between" align="center">
                  <Heading size="md" color={headingColor}>Recent Activity</Heading>
                  <ChakraLink as={NextLink} href="/dashboard/quotes" color={primaryColor} fontSize="sm" fontWeight="semibold" _hover={{ textDecoration: 'underline' }}>View All</ChakraLink>
                </Flex>
                <Divider color={borderColor} />
                <VStack spacing={0} align="stretch">
                  {recentDocuments && recentDocuments.length > 0 ? (
                    recentDocuments.map((doc, index) => (
                      <ChakraLink as={NextLink} href={`/quote/${doc.id}`} key={doc.id} _hover={{ textDecoration: 'none', bg: linkHoverBg }} p={4} borderBottomWidth={index === recentDocuments.length - 1 ? '0px' : '1px'} borderColor={borderColor} transition="all 0.2s">
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <Box p={2} borderRadius="md" bg={doc.document_type === 'Invoice' ? 'green.100' : 'purple.100'} color={doc.document_type === 'Invoice' ? 'green.600' : 'purple.600'}>
                              <Icon as={doc.document_type === 'Invoice' ? DollarSign : FileText} boxSize={4} />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" fontSize="sm" color={headingColor}>{doc.clients?.name || 'Unknown Client'}</Text>
                              <Text fontSize="xs" color={textColor}>#{doc.invoice_number || 'DRAFT'}</Text>
                            </VStack>
                          </HStack>
                          <Text fontWeight="bold" fontSize="sm" color={headingColor} fontFamily="mono">{formatCurrency(doc.total || 0, doc.currency || currency)}</Text>
                        </HStack>
                      </ChakraLink>
                    ))
                  ) : (
                    <Flex direction="column" align="center" justify="center" p={10}>
                      <Icon as={Inbox} boxSize={10} color={textColor} opacity={0.5} mb={3} /><Text color={textColor} fontSize="sm">No recent activity.</Text>
                    </Flex>
                  )}
                </VStack>
            </Box>
            <AddClientModal isOpen={isOpen} onClose={onClose} user={user} onClientAdded={handleClientAdded} />
        </VStack>
      </VStack>
    </>
  );
}