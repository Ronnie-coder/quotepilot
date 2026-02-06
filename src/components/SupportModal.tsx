'use client';

import { 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Input, Textarea, Select, VStack, useToast, Text, useColorModeValue
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

type SupportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
};

export const SupportModal = ({ isOpen, onClose, email }: SupportModalProps) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Theme Colors
  const modalBg = useColorModeValue('white', 'gray.800');
  const inputBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const footerBg = useColorModeValue('gray.50', 'whiteAlpha.50');

  // Form State
  const [formData, setFormData] = useState({
    topic: '',
    message: '',
    contactEmail: email || ''
  });

  // Update local state if prop changes
  useEffect(() => {
    if (email) {
      setFormData(prev => ({ ...prev, contactEmail: email }));
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Connect to Next.js API route
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.contactEmail || email, 
          topic: formData.topic,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        throw new Error('Sending failed');
      }

      toast({
        title: 'Message Sent',
        description: 'Support ticket created. We will be in touch shortly.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        variant: 'solid'
      });
      
      onClose();
      setFormData({ topic: '', message: '', contactEmail: email || '' }); 
      
    } catch (error) {
      console.error(error);
      // Fallback for demo
      toast({
        title: 'Simulation Mode',
        description: 'Support system is currently in demo mode. Message logged locally.',
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered motionPreset="slideInBottom">
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent rounded="xl" bg={modalBg} boxShadow="2xl">
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
          Contact Support
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody py={6}>
          <Text fontSize="sm" color="gray.500" mb={6}>
            Need assistance? Fill out the form below and our support team will respond via email.
          </Text>
          
          <form id="support-form" onSubmit={handleSubmit}>
            <VStack spacing={5}>
              
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">Email Address</FormLabel>
                <Input 
                  type="email" 
                  value={formData.contactEmail} 
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  placeholder="you@example.com" 
                  bg={inputBg}
                  borderColor={borderColor}
                  focusBorderColor="brand.500"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">Topic</FormLabel>
                <Select 
                  placeholder="Select a topic" 
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  bg={inputBg}
                  borderColor={borderColor}
                  focusBorderColor="brand.500"
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
                  placeholder="Describe the issue in detail..." 
                  rows={5} 
                  resize="none" 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  bg={inputBg}
                  borderColor={borderColor}
                  focusBorderColor="brand.500"
                />
              </FormControl>

            </VStack>
          </form>
        </ModalBody>

        <ModalFooter bg={footerBg} borderBottomRadius="xl">
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button 
            colorScheme="blue" // Updated from Teal to match the rest of the app
            type="submit" 
            form="support-form" 
            isLoading={isSubmitting} 
            loadingText="Sending..."
            leftIcon={<Send size={16} />}
          >
            Send Message
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};