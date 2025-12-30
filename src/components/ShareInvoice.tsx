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
  businessName: string; 
  type?: 'invoice' | 'quote'; 
  paymentLink?: string | null; // 🟢 NEW: Direct payment URL (PayPal/PayStack etc)
  size?: "sm" | "md";
  isIconOnly?: boolean;
}

export default function ShareInvoice({ 
  quoteId, 
  invoiceNumber, 
  clientName, 
  clientEmail,
  businessName,
  type = 'invoice', 
  paymentLink, // 🟢 Destructured
  size = "md",
  isIconOnly = false
}: ShareInvoiceProps) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition(); 
  const [hasCopied, setHasCopied] = useState(false);

  // 1. Logic for Copy Link
  const handleCopyLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/p/${quoteId}`;
    
    navigator.clipboard.writeText(url);
    setHasCopied(true);
    toast({
      title: "Link Copied",
      status: "success",
      duration: 2000,
      position: "top"
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  // 2. Logic for WhatsApp
  const handleWhatsApp = () => {
    const origin = window.location.origin;
    const viewLink = `${origin}/p/${quoteId}`;

    // 🟢 LOGIC: Use direct payment link if provided (e.g. PayPal), 
    // otherwise fallback to QuotePilot portal deep link.
    const finalPaymentLink = paymentLink || `${origin}/p/${quoteId}?action=pay`; 
    
    let rawMessage = "";

    if (type === 'quote') {
      // TEMPLATE E: QUOTE — WHATSAPP (PROPOSAL STYLE)
      // No payment links allowed.
      rawMessage = `Hi ${clientName},

I’ve sent you a proposal outlining the work and pricing.

You can review it here:
${viewLink}

If everything looks good, I’ll convert it to an invoice.

Thanks 🙏`;

    } else {
      // TEMPLATE A: INVOICE — WHATSAPP (NEW INVOICE)
      // Must include viewing AND payment links.
      rawMessage = `Hi ${clientName},

I’ve sent you invoice ${invoiceNumber} from ${businessName}.

View the invoice:
${viewLink}

Pay securely online:
${finalPaymentLink}

Thank you 🙏`;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(rawMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  // 3. Logic for Smart Email
  const handleEmailSend = () => {
    if (!clientEmail) {
      toast({ title: "Missing Email", description: "Client has no email saved.", status: "warning" });
      return;
    }

    startTransition(async () => {
      // The server action handles its own payment link logic lookup
      const result = await sendInvoiceEmail(quoteId);

      if (result.success) {
        toast({ title: "Email Sent", description: `Sent to ${clientEmail}`, status: "success" });
      } else {
        toast({ title: "Delivery Failed", description: result.message, status: "error" });
      }
    });
  };

  const TriggerButton = isIconOnly ? (
    <IconButton
      as={MenuButton}
      aria-label="Share"
      icon={<FiShare2 />}
      size="sm"
      variant="ghost"
      isLoading={isPending}
      onClick={(e) => e.stopPropagation()}
    />
  ) : (
    <MenuButton 
      as={Button} 
      rightIcon={<FiShare2 />} 
      colorScheme="blue" 
      size={size}
      isLoading={isPending}
      loadingText="Sending..."
      onClick={(e) => e.stopPropagation()}
    >
      Share
    </MenuButton>
  );

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      <Menu isLazy placement="bottom-end">
        {TriggerButton}
        <MenuList>
          <Box px={3} py={2} borderBottomWidth="1px" borderColor="gray.100" mb={1}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
              {type} #{invoiceNumber}
            </Text>
          </Box>
          <MenuItem icon={hasCopied ? <FiCheck /> : <FiLink />} onClick={handleCopyLink}>
            {hasCopied ? "Copied!" : "Copy Public Link"}
          </MenuItem>
          <MenuItem icon={<FaWhatsapp size={18} />} onClick={handleWhatsApp} color="green.500">
            Send via WhatsApp
          </MenuItem>
          <Tooltip label={clientEmail ? `Send to ${clientEmail}` : "No email"} hasArrow placement='left'>
            <MenuItem icon={<FiMail />} onClick={handleEmailSend} isDisabled={!clientEmail || isPending} color="blue.500">
              Email to Client
            </MenuItem>
          </Tooltip>
        </MenuList>
      </Menu>
    </Box>
  );
}