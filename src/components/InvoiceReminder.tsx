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
  useToast,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiMail, FiBell } from 'react-icons/fi';
import { useState, useTransition, useEffect } from 'react';
import { sendInvoiceEmail } from '@/app/actions/sendInvoiceEmail';

interface InvoiceReminderProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  invoiceNumber: string;
  clientName: string;
  amount: string;
  dueDate: string;
  clientEmail?: string | null;
  paymentLink?: string | null;
}

export default function InvoiceReminder({
  isOpen,
  onClose,
  quoteId,
  invoiceNumber,
  clientName,
  amount,
  dueDate,
  clientEmail,
  paymentLink,
}: InvoiceReminderProps) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  // UI Colors
  const textareaBg = useColorModeValue('gray.50', 'gray.700');
  const textareaTextColor = useColorModeValue('gray.800', 'white');
  const textareaBorder = useColorModeValue('gray.200', 'gray.600');
  const footerBg = useColorModeValue('gray.50', 'gray.700');
  const helperTextColor = useColorModeValue('gray.600', 'gray.400');
  const warningBg = useColorModeValue('orange.50', 'rgba(237, 137, 54, 0.1)');
  const warningText = useColorModeValue('orange.700', 'orange.200');

  // Generate Message on Open
  useEffect(() => {
    if (isOpen) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const viewLink = `${origin}/p/${quoteId}`;
        
        // Payment Logic
        let paymentSection = "";
        if (paymentLink) {
          paymentSection = `Pay securely online:\n${paymentLink}`;
        } else {
          const fallbackLink = `${origin}/p/${quoteId}?action=pay`;
          paymentSection = `View payment details:\n${fallbackLink}`;
        }
        
        // Date Logic
        let formattedDate = dueDate;
        try {
          formattedDate = new Date(dueDate).toLocaleDateString();
        } catch (e) { /* ignore */ }
    
        // REMINDER TEMPLATE
        const template = `Hi ${clientName},

This is a reminder that invoice ${invoiceNumber} for ${amount} was due on ${formattedDate}.

View invoice:
${viewLink}

${paymentSection}

Thank you.`;
        
        setMessage(template);
    }
  }, [isOpen, quoteId, invoiceNumber, clientName, amount, dueDate, paymentLink]);

  const handleWhatsApp = () => {
    if (!message.trim()) return;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
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
      const result = await sendInvoiceEmail(quoteId, true);
      
      if (result.success) {
        toast({ title: "Reminder Sent", description: `Sent to ${clientEmail}`, status: "success" });
        onClose();
      } else {
        toast({ title: "Error", description: result.message, status: "error" });
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Send Invoice Reminder</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color={helperTextColor}>
              Review the message below.
            </Text>
            
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minHeight="240px" 
              size="sm"
              bg={textareaBg}
              color={textareaTextColor}
              borderColor={textareaBorder}
              _focus={{ borderColor: 'orange.400' }}
              fontFamily="monospace"
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
              Open WhatsApp
            </Button>
            
            <Button 
              leftIcon={<FiMail />} 
              colorScheme="blue" 
              onClick={handleEmail}
              isLoading={isPending}
              isDisabled={!clientEmail}
              variant="outline"
              flex={1}
            >
              Send Email
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}