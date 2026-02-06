'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  VStack,
  Text,
  Input,
  InputGroup,
  InputRightElement,
  useClipboard,
  Icon,
  HStack,
  Box,
  useToast,
  IconButton,
  Tooltip,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { Share2, Copy, Check, MessageCircle, Send, Mail } from 'lucide-react';
import { updateDocumentStatusAction } from '@/app/dashboard/invoices/actions';
import { useTransition } from 'react';
import { sendInvoiceEmail } from '@/app/actions/sendInvoiceEmail';

interface ShareInvoiceProps {
  quoteId: string;
  invoiceNumber: string;
  clientName?: string;
  clientEmail?: string | null; 
  businessName?: string;
  amount?: number;
  currency?: string;
  type?: string; 
  paymentLink?: string | null; 
  isIconOnly?: boolean;
}

export default function ShareInvoice({ 
  quoteId, 
  invoiceNumber, 
  clientName = 'Valued Client', 
  clientEmail,
  businessName = 'Us',
  paymentLink,
  currency, 
  isIconOnly = false
}: ShareInvoiceProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [isEmailPending, startEmailTransition] = useTransition();

  // Dark Mode colors
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const inputText = useColorModeValue('gray.600', 'gray.100');
  const infoBoxBg = useColorModeValue('blue.50', 'blue.900');
  const infoBoxBorder = useColorModeValue('blue.100', 'blue.700');
  const infoTitle = useColorModeValue('blue.700', 'blue.200');
  const infoText = useColorModeValue('blue.600', 'blue.300');

  // 1. Construct the Public URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = `${origin}/p/${quoteId}`;

  // 2. Clipboard Logic
  const { hasCopied, onCopy } = useClipboard(publicUrl);

  const handleCopy = () => {
    onCopy();
    toast({ title: 'Link copied', status: 'success', duration: 2000 });
  };

  // 3. WhatsApp Logic
  const handleWhatsAppShare = async () => {
    // Base Message
    let text = `Hi ${clientName}, Invoice *#${invoiceNumber}* from ${businessName} is ready.\n\nView Invoice:\n${publicUrl}`;

    // Smart Payment Logic
    if (paymentLink) {
        text += `\n\nPay securely online:\n${paymentLink}`;
    } 
    
    // Add Crypto note for USD
    if (currency === 'USD') {
        const prefix = paymentLink ? "Or pay" : "Pay";
        text += `\n\n${prefix} via Crypto (USDT) securely on the invoice page.`;
    }

    const encodedText = encodeURIComponent(text);
    
    // Open WhatsApp
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');

    // Auto-mark as Sent
    updateDocumentStatusAction(quoteId, 'Sent');
    
    toast({
        title: 'Opened WhatsApp',
        description: 'Marked invoice as sent.',
        status: 'success',
        duration: 3000
    });
    
    onClose();
  };

  // 4. Email Logic
  const handleEmailSend = () => {
    if (!clientEmail) {
      toast({ title: "No Email Found", description: "This client does not have an email address saved.", status: "warning" });
      return;
    }

    startEmailTransition(async () => {
      const result = await sendInvoiceEmail(quoteId);
      if (result.success) {
        toast({ title: "Email Sent", description: `Sent to ${clientEmail}`, status: "success" });
        updateDocumentStatusAction(quoteId, 'Sent');
      } else {
        toast({ title: "Delivery Failed", description: result.message, status: "error" });
      }
    });
  };

  // --- 🟢 DYNAMIC COPY LOGIC ---
  const didYouKnowText = currency === 'USD'
    ? "Sharing this link lets clients see the Verified Badge and pay via online payment or Crypto (USDT) instantly."
    : "Sharing this link lets clients see the Verified Badge and pay via online payment instantly.";

  // --- RENDER TRIGGER ---
  const Trigger = isIconOnly ? (
    <Tooltip label="Share Invoice">
        <IconButton 
            aria-label="Share" 
            icon={<Share2 size={16} />} 
            size="sm" 
            variant="ghost" 
            colorScheme="blue"
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
        />
    </Tooltip>
  ) : (
    <Button leftIcon={<Share2 size={16} />} colorScheme="blue" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
      Share
    </Button>
  );

  return (
    <>
      {Trigger}

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="xl" onClick={(e) => e.stopPropagation()}>
          <ModalHeader fontSize="lg" fontWeight="bold">Share Invoice</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              
              <Button 
                colorScheme="whatsapp" 
                size="lg" 
                h="56px"
                leftIcon={<MessageCircle size={24} />}
                onClick={handleWhatsAppShare}
                bg="#25D366" 
                _hover={{ bg: "#128C7E" }}
                color="white"
                shadow="md"
              >
                Send via WhatsApp
              </Button>

              <Button 
                colorScheme="blue" 
                variant="outline"
                size="lg" 
                h="56px"
                leftIcon={<Mail size={24} />}
                onClick={handleEmailSend}
                isLoading={isEmailPending}
                loadingText="Sending..."
                isDisabled={!clientEmail}
              >
                {clientEmail ? `Email to ${clientEmail}` : 'No Email for Client'}
              </Button>

              <HStack>
                <Divider />
                <Text fontSize="xs" color="gray.400" fontWeight="bold" whiteSpace="nowrap">OR COPY LINK</Text>
                <Divider />
              </HStack>

              <InputGroup size="md">
                <Input 
                    value={publicUrl} 
                    isReadOnly 
                    bg={inputBg} 
                    fontSize="sm" 
                    color={inputText}
                    pr="4.5rem"
                    borderColor="transparent"
                    _focus={{ borderColor: 'blue.500' }}
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    onClick={handleCopy}
                    icon={hasCopied ? <Check size={16} /> : <Copy size={16} />}
                    aria-label="Copy link"
                    colorScheme={hasCopied ? "green" : "gray"}
                  />
                </InputRightElement>
              </InputGroup>

              <Box bg={infoBoxBg} p={3} borderRadius="md" border="1px solid" borderColor={infoBoxBorder}>
                <HStack align="start">
                    <Icon as={Send} color="blue.500" mt={1} size={16} />
                    <Box>
                        <Text fontSize="xs" fontWeight="bold" color={infoTitle}>Did you know?</Text>
                        <Text fontSize="xs" color={infoText}>
                            {/* 🟢 Render Dynamic Text */}
                            <b>{didYouKnowText}</b>
                        </Text>
                    </Box>
                </HStack>
              </Box>

            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}