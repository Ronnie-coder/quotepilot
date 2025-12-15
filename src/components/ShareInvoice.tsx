'use client';

import { 
  Box, 
  Button, 
  Menu, 
  MenuButton, 
  MenuItem, 
  MenuList, 
  Text, 
  useToast, 
  Tooltip,
  IconButton
} from '@chakra-ui/react';
import { FiShare2, FiLink, FiMail, FiCheck } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useState, useTransition } from 'react';
import { sendInvoiceEmail } from '@/app/actions/sendInvoiceEmail'; 

interface ShareInvoiceProps {
  quoteId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string | null;
  size?: "sm" | "md"; // Added size prop for flexibility
  isIconOnly?: boolean; // Added for table rows
}

export default function ShareInvoice({ 
  quoteId, 
  invoiceNumber, 
  clientName, 
  clientEmail,
  size = "md",
  isIconOnly = false
}: ShareInvoiceProps) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition(); 
  const [hasCopied, setHasCopied] = useState(false);

  // 1. Logic for Copy Link
  const handleCopyLink = () => {
    // Automatically detects localhost vs production domain
    const origin = window.location.origin;
    const url = `${origin}/p/${quoteId}`;
    
    navigator.clipboard.writeText(url);
    setHasCopied(true);
    toast({
      title: "Link Copied",
      description: "Invoice link is ready to paste.",
      status: "success",
      duration: 2000,
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  // 2. Logic for WhatsApp (FIXED)
  const handleWhatsApp = () => {
    const origin = window.location.origin;
    const url = `${origin}/p/${quoteId}`;
    
    // We construct the raw string first
    const rawMessage = `Hi ${clientName},\n\nPlease find attached Invoice #${invoiceNumber}.\n\nYou can view and download it here:\n${url}\n\nThank you!`;
    
    // Then we encode the WHOLE thing properly so # and spaces work
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(rawMessage)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // 3. Logic for Smart Email
  const handleEmailSend = () => {
    if (!clientEmail) {
      toast({
        title: "Missing Email",
        description: "This client does not have an email address saved.",
        status: "warning",
      });
      return;
    }

    startTransition(async () => {
      const result = await sendInvoiceEmail(quoteId);

      if (result.success) {
        toast({
          title: "Email Sent Successfully",
          description: `Invoice sent to ${clientEmail}`,
          status: "success",
          isClosable: true,
          duration: 5000,
        });
      } else {
        toast({
          title: "Delivery Failed",
          description: result.message,
          status: "error",
          isClosable: true,
        });
      }
    });
  };

  // Render Logic: Button vs Icon
  const TriggerButton = isIconOnly ? (
    <IconButton
      as={MenuButton}
      aria-label="Share"
      icon={<FiShare2 />}
      size="sm"
      variant="ghost"
      isLoading={isPending}
      onClick={(e) => e.stopPropagation()} // Stop row click
    />
  ) : (
    <MenuButton 
      as={Button} 
      rightIcon={<FiShare2 />} 
      colorScheme="blue" 
      size={size}
      isLoading={isPending}
      loadingText="Sending..."
      onClick={(e) => e.stopPropagation()} // Stop row click
    >
      Share
    </MenuButton>
  );

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      <Menu isLazy placement="bottom-end">
        {TriggerButton}
        <MenuList>
          <Box px={3} py={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
              INVOICE #{invoiceNumber}
            </Text>
          </Box>

          {/* COPY LINK */}
          <MenuItem icon={hasCopied ? <FiCheck /> : <FiLink />} onClick={handleCopyLink}>
            {hasCopied ? "Copied!" : "Copy Public Link"}
          </MenuItem>

          {/* WHATSAPP */}
          <MenuItem icon={<FaWhatsapp />} onClick={handleWhatsApp} color="green.500">
            Send via WhatsApp
          </MenuItem>

          {/* EMAIL */}
          <Tooltip label={clientEmail ? `Send to ${clientEmail}` : "No email for this client"} hasArrow placement='left'>
            <MenuItem 
              icon={<FiMail />} 
              onClick={handleEmailSend}
              isDisabled={!clientEmail || isPending}
              color="blue.500"
            >
              Email to Client
            </MenuItem>
          </Tooltip>
        </MenuList>
      </Menu>
    </Box>
  );
}