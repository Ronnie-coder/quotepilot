'use client';

import { 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Input, Textarea, Select, VStack, useToast, Text, useColorModeValue
} from '@chakra-ui/react';
import { useState } from 'react';

type SupportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
};

export const SupportModal = ({ isOpen, onClose, email }: SupportModalProps) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bg = useColorModeValue('white', 'gray.800');

  // Form State
  const [formData, setFormData] = useState({
    topic: '',
    message: '',
    pilotEmail: email || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Connect to our new Next.js API route
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.pilotEmail || email, // Fallback to prop if state is empty
          topic: formData.topic,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transmission failed');
      }

      toast({
        title: 'Transmission Successful',
        description: 'Support ticket created. Check your email for updates.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        variant: 'solid'
      });
      
      onClose();
      setFormData({ topic: '', message: '', pilotEmail: '' }); // Reset form
      
    } catch (error) {
      console.error(error);
      toast({
        title: 'Transmission Failed',
        description: 'Could not reach command. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered motionPreset="slideInBottom">
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent rounded="xl" bg={bg} boxShadow="2xl">
        <ModalHeader borderBottomWidth="1px" borderColor={useColorModeValue('gray.100', 'gray.700')}>
          Contact Command
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6}>
          <Text fontSize="sm" color="gray.500" mb={6}>
            Encountering turbulence? Fill out the log below and our ground crew will respond via email.
          </Text>
          <form id="support-form" onSubmit={handleSubmit}>
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">Pilot Email</FormLabel>
                <Input 
                  type="email" 
                  value={formData.pilotEmail} 
                  onChange={(e) => setFormData({...formData, pilotEmail: e.target.value})}
                  placeholder="you@example.com" 
                  borderColor={useColorModeValue('gray.300', 'gray.600')}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">Topic</FormLabel>
                <Select 
                  placeholder="Select flight parameter" 
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  borderColor={useColorModeValue('gray.300', 'gray.600')}
                >
                  <option value="Bug Report">Report a Bug 🪲</option>
                  <option value="Feature Request">Feature Request 🚀</option>
                  <option value="Billing">Billing Inquiry 💳</option>
                  <option value="General">Other / General 💬</option>
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">Message</FormLabel>
                <Textarea 
                  placeholder="Describe the situation in detail..." 
                  rows={5} 
                  resize="none" 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  borderColor={useColorModeValue('gray.300', 'gray.600')}
                />
              </FormControl>
            </VStack>
          </form>
        </ModalBody>
        <ModalFooter bg={useColorModeValue('gray.50', 'whiteAlpha.50')} borderBottomRadius="xl">
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="brand" type="submit" form="support-form" isLoading={isSubmitting} loadingText="Transmitting">
            Transmit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};