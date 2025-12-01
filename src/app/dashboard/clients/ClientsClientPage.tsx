'use client';

import { useState, useCallback } from 'react';
import {
  Box, Heading, Text, Button, useColorModeValue, useDisclosure, Flex, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  InputGroup, InputLeftElement, Input, Menu, MenuButton, MenuList, MenuItem, IconButton, Icon, VStack, HStack, InputRightElement,
  Badge
} from '@chakra-ui/react';
import { Plus, MoreHorizontal, Edit, Search, X, User as UserIcon, Mail } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import AddClientModal from '@/components/AddClientModal';
import EditClientModal from '@/components/EditClientModal'; 
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DeleteClientButton } from './DeleteClientButton';
import { motion } from 'framer-motion';

type Client = {
  id: string;
  name: string | null;
  email: string | null;
  address?: string | null; 
  total_revenue: number;
};

type ClientsClientPageProps = {
  clients: Client[];
  count: number;
  page: number;
  limit: number;
  user: User;
};

// --- ANIMATION DNA ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export default function ClientsClientPage({ clients, count, page, limit, user }: ClientsClientPageProps) {
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const theadBg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const primaryColor = useColorModeValue('brand.500', 'brand.300'); // THEME ALIGNED
  const headingColor = useColorModeValue('gray.800', 'white');

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
        params.set(key, value);
    } else {
        params.delete(key);
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const debouncedSearch = useCallback(debounce(handleFilterChange, 500), []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSearch('q', e.target.value);
  };

  // TACTICAL FIX: Clear now resets state AND URL
  const clearFilters = () => {
    setSearchQuery('');
    handleFilterChange('q', '');
  };
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleClientUpdated = () => {
    router.refresh();
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    onEditOpen();
  };
  
  const totalPages = Math.ceil(count / limit);

  return (
    <Box as={motion.div} variants={containerVariants} initial="hidden" animate="visible">
      <AddClientModal isOpen={isAddOpen} onClose={onAddClose} user={user} onClientAdded={handleClientUpdated} />
      
      {editingClient && (
        <EditClientModal 
          isOpen={isEditOpen} 
          onClose={onEditClose} 
          client={editingClient} 
          onClientUpdated={handleClientUpdated} 
        />
      )}

      {/* Header */}
      <Flex as={motion.div} variants={itemVariants} direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }} mb={8} gap={4}>
        <Box>
          <Heading as="h1" size="xl" color={headingColor} letterSpacing="tight">Client Dossier</Heading>
          <Text color={textColor} mt={1}>Manage your client roster and view key financial data.</Text>
        </Box>
        <Button onClick={onAddOpen} leftIcon={<Icon as={Plus} />} colorScheme="brand" px={6} shadow="md">
          Add New Client
        </Button>
      </Flex>

      {/* Search Bar - TACTICAL FIX: CLEANER CLEAR BUTTON */}
      <Box as={motion.div} variants={itemVariants} mb={6} maxW="md">
        <InputGroup>
          <InputLeftElement pointerEvents="none"><Icon as={Search} color="gray.400" /></InputLeftElement>
          <Input 
            placeholder="Search by name or email..." 
            value={searchQuery} 
            onChange={handleSearchChange} 
            bg={cardBg}
            borderColor={borderColor}
            _focus={{ borderColor: primaryColor, boxShadow: "none" }}
          />
          {searchQuery && (
            <InputRightElement>
                <IconButton 
                    aria-label="Clear search" 
                    icon={<Icon as={X} size={16} />} 
                    size="sm" 
                    variant="ghost" 
                    onClick={clearFilters}
                    color="gray.400"
                    _hover={{ color: "red.400" }}
                />
            </InputRightElement>
          )}
        </InputGroup>
      </Box>

      {/* Table */}
      <Box as={motion.div} variants={itemVariants} bg={cardBg} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor={borderColor} overflow="hidden">
        <TableContainer>
          <Table variant="simple">
            <Thead bg={theadBg}>
              <Tr>
                <Th py={4}>Client Name</Th>
                <Th py={4}>Email</Th>
                <Th py={4} isNumeric>Total Revenue (Paid)</Th>
                <Th py={4} isNumeric>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <Tr 
                    key={client.id} 
                    _hover={{ bg: rowHoverBg }} 
                    transition="background-color 0.2s"
                    as={motion.tr} 
                    variants={itemVariants}
                  >
                    <Td py={4}>
                        <HStack>
                            <Box p={2} bg={useColorModeValue('brand.50', 'whiteAlpha.100')} rounded="lg" color={primaryColor}>
                                <Icon as={UserIcon} size={16} />
                            </Box>
                            <Text fontWeight="bold" color={headingColor}>{client.name}</Text>
                        </HStack>
                    </Td>
                    <Td py={4} color={textColor}>
                        <HStack spacing={2}>
                            <Icon as={Mail} size={14} />
                            <Text fontSize="sm">{client.email}</Text>
                        </HStack>
                    </Td>
                    <Td py={4} isNumeric>
                        {client.total_revenue > 0 ? (
                             <Text fontWeight="bold" color={headingColor} fontFamily="mono">R {client.total_revenue.toFixed(2)}</Text>
                        ) : (
                            <Badge colorScheme="gray">NO ACTIVITY</Badge>
                        )}
                    </Td>
                    <Td py={4} isNumeric>
                      <Menu>
                        <MenuButton as={IconButton} aria-label="Actions" icon={<Icon as={MoreHorizontal} />} variant="ghost" size="sm" color="gray.500" />
                        <MenuList borderColor={borderColor} shadow="lg">
                          <MenuItem icon={<Icon as={Edit} boxSize={4} />} onClick={() => openEditModal(client)}>
                            Edit Details
                          </MenuItem>
                          <DeleteClientButton clientId={client.id} clientName={client.name || 'this client'} />
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                    <Td colSpan={4} h="300px" textAlign="center">
                        <VStack spacing={4} justify="center" h="full">
                            <Box p={4} bg="gray.50" rounded="full">
                                <Icon as={Search} boxSize={8} color="gray.400" />
                            </Box>
                            <Heading as="h3" size="md" color="gray.600">No Clients Found</Heading>
                            <Text color="gray.400" fontSize="sm">Try adjusting your search or add a new client to get started.</Text>
                        </VStack>
                    </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* Pagination */}
      {totalPages > 1 &&
        <Flex as={motion.div} variants={itemVariants} justify="space-between" align="center" mt={6}>
          <Text fontSize="sm" color={textColor}>Showing {clients.length} of {count} results</Text>
          <HStack spacing={2}>
            <Button onClick={() => handlePageChange(page - 1)} isDisabled={page <= 1} size="sm" variant="outline">Previous</Button>
            <Text fontSize="sm" fontWeight="bold" px={2}>Page {page} of {totalPages}</Text>
            <Button onClick={() => handlePageChange(page + 1)} isDisabled={page >= totalPages} size="sm" variant="outline">Next</Button>
          </HStack>
        </Flex>
      }
    </Box>
  );
}