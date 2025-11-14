// FILE: src/app/dashboard/clients/ClientsClientPage.tsx
'use client';

import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Button,
  useColorModeValue,
  useDisclosure,
  Flex,
  Spacer
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { User } from '@supabase/supabase-js'; // Keep this for the Modal
import AddClientModal from '@/components/AddClientModal';
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; // Import for user session

// This type must match the data fetched in page.tsx
type Client = {
  id: string;
  name: string | null;
  email: string | null;
  address: string | null;
  user_id: string;
  created_at: string | null;
};

// --- CORRECTION IMPLEMENTED ---
// The component now correctly expects a 'clients' prop.
type ClientsClientPageProps = {
  clients: Client[];
};

export default function ClientsClientPage({ clients: initialClients }: ClientsClientPageProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [user, setUser] = useState<User | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // --- ENHANCEMENT: Get user on the client-side for the modal ---
  useState(() => {
    const supabase = createSupabaseBrowserClient();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  const handleClientAdded = (newClient: Client) => {
    setClients(currentClients => [newClient, ...currentClients]);
  };

  return (
    <>
      {/* The modal now only renders if we have a user session */}
      {user && (
        <AddClientModal 
          isOpen={isOpen} 
          onClose={onClose} 
          user={user}
          onClientAdded={handleClientAdded}
        />
      )}

      <Box p={8} flex="1">
        <Flex direction={{ base: 'column', md: 'row' }} mb={8}>
          <Heading>My Clients</Heading>
          <Spacer />
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="brand" 
            onClick={onOpen}
            isDisabled={!user} // Disable button until user is loaded
            mt={{ base: 4, md: 0 }}
          >
            Add New Client
          </Button>
        </Flex>
        
        {clients.length === 0 ? (
          <Text color="gray.500">You haven't added any clients yet. Click "Add New Client" to get started.</Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {clients.map((client) => (
              <Box 
                key={client.id} 
                p={5} 
                bg={cardBg} 
                borderWidth="1px" 
                borderColor={borderColor} 
                borderRadius="md"
                boxShadow="sm"
              >
                <Heading size="md">{client.name}</Heading>
                <Text color="gray.500">{client.email}</Text>
                <Text color="gray.500" fontSize="sm">{client.address}</Text>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </>
  );
}