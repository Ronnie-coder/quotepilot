'use client';

import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Button,
  HStack,
  useColorModeValue,
  useDisclosure,
  Flex,
  Spacer
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { User } from '@supabase/supabase-js';
import AddClientModal from '@/components/AddClientModal'; // We will create this next

// Define the Client type based on your supabase.ts
type Client = {
  id: string;
  name: string | null;
  email: string | null;
  address: string | null;
  user_id: string;
  created_at: string | null;
};

type ClientsClientPageProps = {
  initialClients: Client[];
  user: User;
};

export default function ClientsClientPage({ initialClients, user }: ClientsClientPageProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const { isOpen, onOpen, onClose } = useDisclosure(); // Hook to control the modal

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // This function will be passed to the modal to refresh the client list
  const handleClientAdded = (newClient: Client) => {
    setClients(currentClients => [newClient, ...currentClients]);
  };

  return (
    <>
      <AddClientModal 
        isOpen={isOpen} 
        onClose={onClose} 
        user={user}
        onClientAdded={handleClientAdded}
      />

      <Box p={8} flex="1">
        <Flex direction={{ base: 'column', md: 'row' }} mb={8}>
          <Heading>My Clients</Heading>
          <Spacer />
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="brand" 
            onClick={onOpen} // This button now opens the modal
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