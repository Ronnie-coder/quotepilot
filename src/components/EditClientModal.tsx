'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type EditClientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  client: any; // Using 'any' to bypass strict type check for now, matching AddModal strategy
  onClientUpdated: (updatedClient: any) => void;
};

export default function EditClientModal({ isOpen, onClose, client, onClientUpdated }: EditClientModalProps) {
  const supabase = createSupabaseBrowserClient();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load client data when the modal opens or client changes
  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setEmail(client.email || '');
      setAddress(client.address || '');
    }
  }, [client, isOpen]);

  const handleSubmit = async () => {
    if (!name) {
      toast({ title: 'Name is required', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    setIsLoading(true);

    const payload = {
      name,
      email,
      address,
    };

    // FIX APPLIED: Cast the table selection to 'any' to bypass the 'never' type restriction on update()
    const { data, error } = await (supabase.from('clients') as any)
      .update(payload)
      .eq('id', client.id)
      .select()
      .single();

    if (error) {
      toast({ title: 'Error updating client', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Client updated successfully', status: 'success' });
      onClientUpdated(data);
      onClose();
    }
    setIsLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <ModalHeader>Edit Client</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Client Name</FormLabel>
              <Input
                placeholder="e.g., John Doe or Acme Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Client Email</FormLabel>
              <Input
                type="email"
                placeholder="e.g., contact@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Client Address</FormLabel>
              <Input
                placeholder="e.g., 123 Main St, Anytown"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="brand" type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}