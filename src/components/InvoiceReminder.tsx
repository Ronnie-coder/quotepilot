'use client';

import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  Text,
  VStack,
  HStack,
  useDisclosure,
  useToast,
  Icon,
  useColorModeValue // 🟢 Added for Dark Mode support
} from '@chakra-ui/react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiMail, FiBell } from 'react-icons/fi';
import { useState, useTransition } from 'react';
// 🟢 FIX: Ensure this path matches the file location exactly
import { sendInvoiceEmail } from '@/app/actions/sendInvoiceEmail';

interface InvoiceReminderProps {
  quoteId: string;
  invoiceNumber: string;
  clientName: string;
  amount: string;
  dueDate: string;
  clientEmail?: string | null;
}

export default function InvoiceReminder({
  quoteId,
  invoiceNumber,
  clientName,
  amount,
  dueDate,
  clientEmail
}: InvoiceReminderProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  // 🟢 FIX: Dynamic Colors for Light/Dark Mode
  const textareaBg = useColorModeValue('gray.50', 'gray.700');
  const textareaTextColor = useColorModeValue('gray.800', 'white');
  const textareaBorder = useColorModeValue('gray.200', 'gray.600');
  const footerBg = useColorModeValue('gray.50', 'gray.700');
  const helperTextColor = useColorModeValue('gray.600', 'gray.400');
  const warningBg = useColorModeValue('orange.50', 'rgba(237, 137, 54, 0.1)');
  const warningText = useColorModeValue('orange.700', 'orange.200');
  const emailButtonBg = useColorModeValue('white', 'gray.800');
  const emailButtonHover = useColorModeValue('gray.100', 'gray.700');

  const handleOpen = () => {
    // Construct the deep link and message template on open
    // Check for window existence to prevent SSR hydration mismatches
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const paymentLink = `${origin}/p/${quoteId}`;
    
    // Formatting date if possible, otherwise use raw string
    let formattedDate = dueDate;
    try {
      formattedDate = new Date(dueDate).toLocaleDateString();
    } catch (e) { /* ignore invalid dates */ }

    // UPDATED COPY: Professional, clear, and directs to secure payment
    const template = `Hi ${clientName}, this is a friendly reminder regarding invoice ${invoiceNumber} for ${amount}, due on ${formattedDate}.

You can pay securely online here: ${paymentLink}

Thank you!`;
    
    setMessage(template);
    onOpen();
  };

  const handleWhatsApp = () => {
    if (!message.trim()) return;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    // Only open window on client side
    if (typeof window !== 'undefined') {
        window.open(whatsappUrl, '_blank');
    }
    
    toast({
      title: "WhatsApp Opened",
      description: "Click send in WhatsApp to finish.",
      status: "info",
      duration: 3000,
    });
    onClose();
  };

  const handleEmail = () => {
    if (!clientEmail) {
      toast({ title: "No Email", description: "Client has no email on file.", status: "warning" });
      return;
    }

    startTransition(async () => {
      // Calls the Server Action
      const result = await sendInvoiceEmail(quoteId);
      
      if (result.success) {
        toast({ title: "Reminder Sent", description: "Email copy sent successfully.", status: "success" });
        onClose();
      } else {
        toast({ title: "Error", description: result.message, status: "error" });
      }
    });
  };

  return (
    <>
      <Button 
        leftIcon={<Icon as={FiBell} />} 
        variant="ghost" 
        colorScheme="orange"
        size="md"
        onClick={handleOpen}
      >
        Remind
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Invoice Reminder</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={helperTextColor}>
                Customize your message below. The payment link is automatically included.
              </Text>
              
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                minHeight="150px"
                placeholder="Write your reminder message..."
                size="md"
                bg={textareaBg}
                color={textareaTextColor}
                borderColor={textareaBorder}
                _focus={{ borderColor: 'orange.400', boxShadow: '0 0 0 1px var(--chakra-colors-orange-400)' }}
              />

              {!clientEmail && (
                <HStack bg={warningBg} p={2} borderRadius="md">
                  <Icon as={FiBell} color="orange.500" />
                  <Text fontSize="xs" color={warningText}>
                    This client does not have an email address saved.
                  </Text>
                </HStack>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter bg={footerBg} borderBottomRadius="md">
            <HStack spacing={3} width="100%">
              <Button 
                leftIcon={<FaWhatsapp />} 
                colorScheme="green" 
                onClick={handleWhatsApp}
                flex={1}
              >
                WhatsApp
              </Button>
              
              <Button 
                leftIcon={<FiMail />} 
                colorScheme="blue" 
                onClick={handleEmail}
                isLoading={isPending}
                isDisabled={!clientEmail}
                variant="outline"
                flex={1}
                bg={emailButtonBg}
                _hover={{ bg: emailButtonHover }}
              >
                Email
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}