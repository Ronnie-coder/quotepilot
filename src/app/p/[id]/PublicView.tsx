"use client";

import React, { useState, useEffect } from "react";
import { 
  Box, Button, Flex, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, 
  Container, Badge, useToast, Image, useColorModeValue, Stack, SimpleGrid, Icon, Tooltip, Alert, AlertIcon
} from "@chakra-ui/react";
import { generatePdf } from "@/utils/pdfGenerator";
import { mapToPdfPayload } from "@/utils/pdfMapper"; 
import { CreditCard, ShieldCheck, CheckCircle2, Wallet, Lock, ExternalLink, Globe, AlertTriangle } from "lucide-react"; 
import QRCode from "qrcode"; 
import { markInvoicePaidAction } from "@/app/dashboard/invoices/actions";

// --- WEB3 CONSTANTS (Polygon Mainnet) ---
const POLYGON_CHAIN_ID_HEX = '0x89'; // 137
const USDT_CONTRACT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'; 

// --- HELPER: ERC-20 Data Encoder ---
const encodeTransferData = (toAddress: string, amount: number) => {
  const cleanAddress = toAddress.replace('0x', '');
  const paddedAddress = cleanAddress.padStart(64, '0');
  const rawAmount = Math.floor(amount * 1000000); 
  const hexAmount = rawAmount.toString(16).padStart(64, '0');
  return `0xa9059cbb${paddedAddress}${hexAmount}`;
};

const DownloadIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

interface PublicViewProps {
  quote: any; 
  userEmail: string; 
}

export default function PublicView({ quote, userEmail }: PublicViewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const toast = useToast();
  
  const safeNum = (val: any) => Number(val) || 0;
  
  // Normalize status to lowercase for consistent checks
  const status = (quote.status || 'draft').toLowerCase();
  
  const isQuote = (quote.document_type || 'Invoice').toLowerCase() === 'quote';
  const isPaid = status === 'paid';
  const docTitle = isQuote ? "PROPOSAL" : "INVOICE";
  const docColor = isQuote ? "purple.500" : (isPaid ? "green.500" : "brand.600"); 
  const totalLabel = isQuote ? "Estimated Total" : "Total";
  const bgCard = useColorModeValue("white", "gray.800");
  const bgHeader = useColorModeValue("gray.50", "gray.700");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const profile = quote.profiles || {};
  const items = quote.items || [];
  const subtotal = items.reduce((acc: number, item: any) => acc + (safeNum(item.unitPrice || item.price) * safeNum(item.quantity)), 0);
  const vatRate = safeNum(quote.vat_rate);
  const vatAmount = subtotal * (vatRate / 100);
  const totalAmount = subtotal + vatAmount;
  const currency = quote.currency || "ZAR";
  
  const receiverAddress = profile.wallet_address || null;

  // 🟢 VERIFICATION LOGIC
  // Logic: Must not be draft, and must have a hash.
  const invoiceHash = quote.invoice_hash;
  const isFinalized = status !== 'draft';
  const isVerified = isFinalized && !!invoiceHash;

  // 🟢 CRYPTO AVAILABILITY LOGIC
  const isCryptoAvailable = currency === 'USD' && !!receiverAddress;

  // --- Payment Link Logic ---
  let activePaymentLink = quote.payment_link; 
  let providerName = "Online";

  if (!activePaymentLink && profile.payment_settings?.default_provider) {
     const settings = profile.payment_settings;
     const provider = settings.providers.find((p: any) => p.id === settings.default_provider);
     if (provider) {
        activePaymentLink = provider.url;
        providerName = provider.name || provider.id.charAt(0).toUpperCase() + provider.id.slice(1);
     }
  }

  // 🟢 CLEAN BUTTON TEXT (COPY UPDATE)
  const payButtonText = providerName.toLowerCase() === 'online' ? 'Pay via online payment' : `Pay via ${providerName}`;

  useEffect(() => {
    if (activePaymentLink && !isQuote && !isPaid) {
        QRCode.toDataURL(activePaymentLink, { margin: 1, color: { dark: '#000000', light: '#ffffff00' } })
            .then(setQrCodeUrl)
            .catch(err => console.error("QR Generation failed", err));
    }
  }, [activePaymentLink, isQuote, isPaid]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const pdfData = mapToPdfPayload(quote, profile, quote.clients || {}, userEmail);
      const blob = await generatePdf(pdfData);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quote.document_type || 'Invoice'}-${quote.invoice_number || 'draft'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast({ title: "Download Started", status: "success", duration: 3000, isClosable: true });
    } catch (error) {
      console.error("PDF Error:", error);
      toast({ title: "Download Failed", status: "error" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCryptoPayment = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
        toast({ 
          title: "Wallet Not Found", 
          description: "Please install MetaMask or a Web3 wallet to pay with Crypto.", 
          status: "warning",
          duration: 5000,
          isClosable: true
        });
        return;
    }
    
    if (!receiverAddress) {
         toast({ title: "Configuration Error", description: "The merchant has not set a Wallet Address.", status: "error" });
         return;
    }

    setIsPaying(true);
    try {
        const ethereum = (window as any).ethereum;
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const payer = accounts[0];

        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
            });
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                toast({ title: "Network Missing", description: "Please add Polygon Mainnet to your wallet.", status: "error" });
                return;
            }
        }

        const transactionParameters = {
            to: USDT_CONTRACT_ADDRESS,
            from: payer, 
            data: encodeTransferData(receiverAddress, totalAmount), 
            chainId: POLYGON_CHAIN_ID_HEX
        };

        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });

        toast({ 
            title: "Transaction Sent!", 
            description: "Waiting for network confirmation... Do not close this page.", 
            status: "loading",
            duration: 10000
        });

        await markInvoicePaidAction(quote.id, txHash, 'USDT');
        
        toast({ 
          title: "Payment Confirmed", 
          description: "Invoice marked as paid on the blockchain.", 
          status: "success",
          duration: 5000 
        });
        
    } catch (error: any) {
        console.error(error);
        if (error.code === 4001) {
             toast({ title: "Payment Cancelled", status: "info" });
        } else {
             toast({ title: "Payment Failed", description: error.message || "Unknown error", status: "error" });
        }
    } finally {
        setIsPaying(false);
    }
  };

  return (
    <Container maxW="4xl" py={10}>
      
      {/* TOP BAR */}
      <Flex justify="space-between" align="center" mb={6} gap={4} wrap="wrap">
         <Flex gap={2} align="center">
            {isVerified && (
                <Tooltip label="This invoice is cryptographically verified and cannot be altered." fontSize="sm" hasArrow bg="green.700" color="white" p={3} rounded="md">
                    <Badge colorScheme="green" variant="solid" fontSize="xs" px={3} py={1.5} borderRadius="full" display="flex" alignItems="center" gap={2} shadow="sm" cursor="help">
                        <Icon as={ShieldCheck} boxSize={3.5} /> 
                        Verified Invoice
                        <Text as="span" fontFamily="mono" opacity={0.8} display={{ base: 'none', sm: 'inline' }} borderLeft="1px solid" borderColor="whiteAlpha.400" pl={2}>
                             {invoiceHash.substring(0, 8)}...
                        </Text>
                    </Badge>
                </Tooltip>
            )}

            {!isFinalized && (
                <Badge colorScheme="orange" variant="subtle" fontSize="xs" px={3} py={1.5} borderRadius="full" display="flex" gap={1}>
                   <Icon as={AlertTriangle} boxSize={3.5} /> DRAFT MODE
                </Badge>
            )}

            {isPaid && (
                 <Badge colorScheme="green" variant="subtle" fontSize="xs" px={3} py={1.5} borderRadius="full" display="flex" gap={1}>
                    <Icon as={CheckCircle2} boxSize={3.5} /> PAID
                 </Badge>
            )}
         </Flex>

         <Button 
            leftIcon={<DownloadIcon />}
            colorScheme="gray" variant="solid" bg="white" border="1px solid" borderColor="gray.200"
            isLoading={isDownloading} loadingText="Generating..."
            onClick={handleDownload} size="sm" shadow="sm"
         >
            Download PDF
         </Button>
      </Flex>

      <Box bg={bgCard} shadow="xl" rounded="lg" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
        
        {/* HEADER */}
        <Box bg={bgHeader} p={8} borderBottomWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="start" direction={{ base: 'column-reverse', md: 'row' }} gap={6}>
                <Box textAlign="left">
                    <Heading size="2xl" color={docColor} letterSpacing="tight">{docTitle}</Heading>
                    <Text fontSize="xl" color={mutedColor} fontWeight="medium" mb={2}>#{quote.invoice_number}</Text>
                    <Stack spacing={1} mt={4} fontSize="sm">
                         <Text><Text as="span" color={mutedColor} w="80px" display="inline-block">Date:</Text> <b>{new Date(quote.created_at).toLocaleDateString()}</b></Text>
                         {quote.due_date && <Text><Text as="span" color={mutedColor} w="80px" display="inline-block">Due:</Text> <b>{new Date(quote.due_date).toLocaleDateString()}</b></Text>}
                    </Stack>
                </Box>
                <Box textAlign={{ base: 'left', md: 'right' }}>
                    {profile.logo_url && <Image src={profile.logo_url} alt="Logo" maxH="60px" objectFit="contain" mb={4} ml={{ md: 'auto' }} />}
                    <Heading size="md" color="brand.600" mb={1}>{profile.company_name}</Heading>
                    <Text fontSize="sm" color={mutedColor}>{profile.company_address}</Text>
                    <Text fontSize="sm" color={mutedColor}>{userEmail}</Text> 
                </Box>
            </Flex>
        </Box>

        {/* ITEMS */}
        <Box p={8}>
            <Table variant="simple">
                <Thead>
                    <Tr><Th pl={0}>Description</Th><Th isNumeric>Price</Th><Th textAlign="center">Qty</Th><Th isNumeric pr={0}>Total</Th></Tr>
                </Thead>
                <Tbody>
                    {items.map((item: any, i: number) => (
                        <Tr key={i}>
                            <Td pl={0}>{item.description}</Td>
                            <Td isNumeric>{safeNum(item.unitPrice).toFixed(2)}</Td>
                            <Td textAlign="center">{item.quantity}</Td>
                            <Td isNumeric pr={0}>{(safeNum(item.unitPrice) * safeNum(item.quantity)).toFixed(2)}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>

        {/* FOOTER & PAYMENTS */}
        <Box bg={bgHeader} p={8} borderTopWidth="1px" borderColor={borderColor}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
                
                {/* Bank / Notes */}
                <Box>
                    {!isQuote && !isPaid && profile.bank_name && (
                        <Box bg={bgCard} p={4} rounded="md" borderWidth="1px" borderColor={borderColor} mb={6}>
                            <Text fontSize="xs" fontWeight="bold" color="green.600" textTransform="uppercase" mb={3}>Bank Details</Text>
                            <Stack spacing={1} fontSize="sm">
                                <Flex justify="space-between"><Text>Bank:</Text><Text fontWeight="bold">{profile.bank_name}</Text></Flex>
                                <Flex justify="space-between"><Text>Account:</Text><Text fontWeight="bold">{profile.account_number}</Text></Flex>
                            </Stack>
                        </Box>
                    )}
                    <Text fontSize="sm" color={mutedColor}>{quote.notes}</Text>
                </Box>

                {/* Totals & Actions */}
                <Box textAlign="right">
                    <Stack spacing={2} mb={6}>
                        <Flex justify="space-between"><Text>Subtotal</Text><Text>{currency} {subtotal.toFixed(2)}</Text></Flex>
                        {vatRate > 0 && <Flex justify="space-between"><Text>VAT ({vatRate}%)</Text><Text>{currency} {vatAmount.toFixed(2)}</Text></Flex>}
                        <Flex justify="space-between" fontSize="xl" fontWeight="bold"><Text>{totalLabel}</Text><Text color={docColor}>{currency} {totalAmount.toFixed(2)}</Text></Flex>
                    </Stack>

                    {/* PAYMENT BUTTONS */}
                    {!isQuote && !isPaid && (
                        <Stack spacing={3} justify="end" align="end">
                            
                            {/* 1. Crypto Payment */}
                            {isCryptoAvailable && (
                                <Button 
                                    colorScheme="purple" 
                                    rightIcon={<Icon as={Wallet} />} 
                                    width="full" 
                                    // 🟢 COPY UPDATE: Crypto Button
                                    onClick={handleCryptoPayment}
                                    isLoading={isPaying}
                                    loadingText="Confirming on Polygon..."
                                    bgGradient="linear(to-r, purple.500, blue.500)"
                                    _hover={{ bgGradient: "linear(to-r, purple.600, blue.600)" }}
                                >
                                    Pay via Crypto (USDT on Polygon)
                                </Button>
                            )}
                            
                            {/* 2. Standard Payment Link */}
                            {activePaymentLink && (
                                <Button as="a" href={activePaymentLink} target="_blank" colorScheme="green" width="full" rightIcon={<Icon as={Globe} />}>
                                    {payButtonText}
                                </Button>
                            )}
                            
                            {qrCodeUrl && <Image src={qrCodeUrl} alt="QR" boxSize="60px" border="1px solid #eee" />}
                        </Stack>
                    )}
                    
                    {isPaid && (
                        <Box p={4} bg="green.50" rounded="md" border="1px dashed" borderColor="green.300">
                             <Heading size="sm" color="green.700" mb={1}>Payment Received</Heading>
                             <Text fontSize="xs" color="green.600">
                                {quote.payment_method === 'USDT' ? 
                                    <Flex align="center" gap={1} justify="flex-end"><Icon as={Wallet} size={12}/> Paid via Crypto (Polygon)</Flex> : 
                                    'Thank you for your business.'}
                             </Text>
                             {quote.payment_tx_hash && (
                                <Button 
                                    as="a" size="xs" variant="link" colorScheme="green" mt={1}
                                    href={`https://polygonscan.com/tx/${quote.payment_tx_hash}`} 
                                    target="_blank"
                                    rightIcon={<ExternalLink size={10} />}
                                >
                                    View Transaction
                                </Button>
                             )}
                        </Box>
                    )}
                </Box>
            </SimpleGrid>
        </Box>

      </Box>
    </Container>
  );
}