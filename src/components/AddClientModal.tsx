// FILE: src/components/AddClientModal.tsx
'use client';

import { useState } from 'react';
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
import { User } from '@supabase/supabase-js';

type AddClientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onClientAdded: (newClient: any) => void;
};

export default function AddClientModal({ isOpen, onClose, user, onClientAdded }: AddClientModalProps) {
  const supabase = createSupabaseBrowserClient();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name) {
      toast({ title: 'Name is required', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    setIsLoading(true);

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name,
        email,
        address,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error creating client', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Client added successfully', status: 'success' });
      onClientAdded(data);
      onClose();
      setName('');
      setEmail('');
      setAddress('');
    }
    setIsLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <ModalHeader>Add a New Client</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Client Name</FormLabel>
              <Input
                placeholder="e.g., John Doe or Acme Inc."
                value={name}
                // --- CORRECTION IMPLEMENTED ---
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
            Save Client
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}