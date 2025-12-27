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
  Select,
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
  const [phone, setPhone] = useState(''); // 🟢 RESTORED: Phone state
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('ZAR'); // 🟢 RESTORED: Currency state
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name) {
      toast({ title: 'Name is required', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    setIsLoading(true);

    const payload = {
      name,
      email,
      phone, // 🟢 RESTORED: Saving phone
      address,
      currency, // 🟢 RESTORED: Saving currency
      user_id: user.id,
    };

    // @ts-ignore: Bypassing TS check since columns are being added manually to DB
    const { data, error } = await supabase
      .from('clients')
      .insert(payload) 
      .select()
      .single();

    if (error) {
      toast({ title: 'Error creating client', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Client added successfully', status: 'success' });
      onClientAdded(data);
      onClose();
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setCurrency('ZAR');
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

            {/* 🟢 RESTORED: Phone Input */}
            <FormControl>
              <FormLabel>Phone Number</FormLabel>
              <Input
                type="tel"
                placeholder="e.g., +27 82 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormControl>
            
            {/* 🟢 RESTORED: Currency Selection */}
            <FormControl>
              <FormLabel>Billing Currency</FormLabel>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="ZAR">ZAR (R) - South Africa</option>
                <option value="USD">USD ($) - International</option>
                <option value="EUR">EUR (€) - Europe</option>
                <option value="GBP">GBP (£) - UK</option>
                <option value="NGN">NGN (₦) - Nigeria</option>
                <option value="KES">KES (KSh) - Kenya</option>
                <option value="GHS">GHS (₵) - Ghana</option>
                <option value="NAD">NAD (N$) - Namibia</option>
                <option value="BWP">BWP (P) - Botswana</option>
              </Select>
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