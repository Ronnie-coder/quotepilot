"use client";

import React, { useState, useEffect } from "react";
import { 
  Box, Button, Flex, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, 
  Container, Badge, useToast, Image, useColorModeValue, Stack, SimpleGrid, Icon
} from "@chakra-ui/react";
import { generatePdf, PdfData } from "@/utils/pdfGenerator";
import { ExternalLink, CreditCard, QrCode } from "lucide-react"; 
import QRCode from "qrcode"; 

// Icon for Download Button
const DownloadIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

interface PublicViewProps {
  quote: any; 
}

export default function PublicView({ quote }: PublicViewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const toast = useToast();
  const safeNum = (val: any) => Number(val) || 0;

  // --- THEME & COLORS ---
  const bgCard = useColorModeValue("white", "gray.800");
  const bgHeader = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // --- DATA MAPPING ---
  const profile = quote.profiles || {};
  const client = quote.clients || {};
  const totalAmount = safeNum(quote.total);
  const currency = quote.currency || "ZAR";
  const notes = quote.notes || ""; 

  // --- PAYMENT LINK LOGIC ---
  let activePaymentLink = quote.payment_link; 
  if (!activePaymentLink && profile.payment_settings) {
    const settings = profile.payment_settings;
    if (settings.default_provider) {
        const provider = settings.providers.find((p: any) => p.id === settings.default_provider);
        if (provider) activePaymentLink = provider.url;
    }
  }

  // Generate QR for Display
  useEffect(() => {
    if (activePaymentLink) {
        QRCode.toDataURL(activePaymentLink, { margin: 1, color: { dark: '#000000', light: '#ffffff00' } })
            .then(setQrCodeUrl)
            .catch(err => console.error("QR Generation failed", err));
    }
  }, [activePaymentLink]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const pdfData: PdfData = {
        documentType: 'Invoice',
        invoiceNumber: quote.invoice_number,
        invoiceDate: quote.created_at,
        dueDate: quote.due_date,
        currency: currency,
        logo: profile.logo_url, 
        signature: profile.signature_url, 
        paymentLink: activePaymentLink, 
        from: {
          name: profile.company_name || "Freelancer",
          address: profile.company_address,
          phone: profile.company_phone,
          email: profile.email,
        },
        to: {
          name: client.name || "Unknown Client",
          address: client.address,
          email: client.email,
        },
        lineItems: Array.isArray(quote.items) 
          ? quote.items.map((item: any) => ({
              description: item.description,
              quantity: safeNum(item.quantity),
              unitPrice: safeNum(item.unitPrice || item.price),
            }))
          : [],
        subtotal: totalAmount,
        vatAmount: 0, 
        total: totalAmount,
        notes: notes, 
        payment: {
          bankName: profile.bank_name,
          accountHolder: profile.account_holder,
          accNumber: profile.account_number,
          branchCode: profile.branch_code,
        },
        brandColor: quote.brand_color || '#319795',
      };

      const blob = await generatePdf(pdfData);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${quote.invoice_number || 'draft'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast({ title: "Download Started", status: "success", duration: 3000, isClosable: true });
    } catch (error) {
      console.error("PDF Error:", error);
      toast({ title: "Download Failed", description: "Could not generate PDF.", status: "error", duration: 3000 });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Container maxW="4xl" py={10}>
      <Flex justify="space-between" align="center" mb={6}>
         <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">Public Invoice</Badge>
         <Button 
            leftIcon={<DownloadIcon />}
            colorScheme="gray"
            variant="outline"
            isLoading={isDownloading}
            loadingText="Generating..."
            onClick={handleDownload}
            size="sm"
         >
            Download PDF
         </Button>
      </Flex>

      {/* MAIN CARD */}
      <Box bg={bgCard} shadow="xl" rounded="lg" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
        
        {/* 1. HEADER */}
        <Box bg={bgHeader} p={8} borderBottomWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="start" direction={{ base: 'column', md: 'row' }} gap={6}>
            <Box>
                {/* USER LOGO */}
                {profile.logo_url && (
                <Image src={profile.logo_url} alt="Company Logo" maxH="50px" objectFit="contain" mb={4} />
                )}
                <Heading size="md" color="brand.500" mb={1}>{profile.company_name || "Company Name"}</Heading>
                <Stack spacing={0} fontSize="sm" color={mutedColor}>
                    <Text>{profile.company_address}</Text>
                    <Text>{profile.company_phone}</Text>
                    <Text>{profile.email}</Text>
                </Stack>
            </Box>

            <Box textAlign={{ base: 'left', md: 'right' }}>
                <Heading size="2xl" color={textColor} letterSpacing="tight">INVOICE</Heading>
                <Text fontSize="xl" color={mutedColor} fontWeight="medium" mb={2}>#{quote.invoice_number}</Text>
                
                <Stack spacing={1} mt={4} fontSize="sm">
                <Flex justify={{ base: 'flex-start', md: 'flex-end' }}>
                    <Text color={mutedColor} w="80px">Date:</Text>
                    <Text fontWeight="bold">{new Date(quote.created_at).toLocaleDateString()}</Text>
                </Flex>
                {quote.due_date && (
                    <Flex justify={{ base: 'flex-start', md: 'flex-end' }}>
                        <Text color={mutedColor} w="80px">Due:</Text>
                        <Text fontWeight="bold" color="red.500">{new Date(quote.due_date).toLocaleDateString()}</Text>
                    </Flex>
                )}
                </Stack>
                {quote.status && <Badge mt={4} fontSize="0.9em" colorScheme={quote.status === 'Paid' ? 'green' : 'orange'}>{quote.status}</Badge>}
            </Box>
            </Flex>
        </Box>

        {/* 2. ADDRESS BLOCK */}
        <Box p={8}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={2}>Bill To</Text>
                    <Heading size="sm" mb={1}>{client.name || "Valued Client"}</Heading>
                    <Text fontSize="sm" color={mutedColor} whiteSpace="pre-wrap">{client.address}</Text>
                    <Text fontSize="sm" color={mutedColor}>{client.email}</Text>
                </Box>
            </SimpleGrid>
        </Box>

        {/* 3. ITEMS TABLE */}
        <Box px={8} mb={8}>
            <Table variant="simple" size="md">
                <Thead bg={useColorModeValue("gray.50", "gray.700")}>
                    <Tr>
                        <Th pl={0}>Description</Th>
                        <Th isNumeric>Price</Th>
                        <Th textAlign="center">Qty</Th>
                        <Th isNumeric pr={0}>Total</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {quote.items && quote.items.length > 0 ? (
                        quote.items.map((item: any, index: number) => (
                            <Tr key={index}>
                                <Td pl={0} fontWeight="medium">{item.description}</Td>
                                <Td isNumeric>{safeNum(item.unitPrice || item.price).toFixed(2)}</Td>
                                <Td textAlign="center">{item.quantity}</Td>
                                <Td fontWeight="bold" isNumeric pr={0}>{(safeNum(item.unitPrice || item.price) * safeNum(item.quantity)).toFixed(2)}</Td>
                            </Tr>
                        ))
                    ) : (
                        <Tr><Td colSpan={4} textAlign="center">No items found.</Td></Tr>
                    )}
                </Tbody>
            </Table>
        </Box>

        {/* 4. FOOTER (Signature & Payment) */}
        <Box bg={bgHeader} p={8} borderTopWidth="1px" borderColor={borderColor}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            
            {/* LEFT: Bank & USER SIGNATURE */}
            <Box>
                {profile.bank_name && (
                <Box bg={bgCard} p={4} rounded="md" borderWidth="1px" borderColor={borderColor} shadow="sm" mb={6}>
                    <Text fontSize="xs" fontWeight="bold" color="green.600" textTransform="uppercase" mb={3}>Payment Details</Text>
                    <Stack spacing={1} fontSize="sm">
                        <Flex justify="space-between"><Text color={mutedColor}>Bank:</Text><Text fontWeight="medium">{profile.bank_name}</Text></Flex>
                        <Flex justify="space-between"><Text color={mutedColor}>Account:</Text><Text fontWeight="medium">{profile.account_number}</Text></Flex>
                        {profile.branch_code && (
                        <Flex justify="space-between"><Text color={mutedColor}>Branch:</Text><Text fontWeight="medium">{profile.branch_code}</Text></Flex>
                        )}
                    </Stack>
                </Box>
                )}
                {notes && (
                <Box mb={6}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={2}>Notes</Text>
                    <Text fontSize="sm" color={mutedColor}>{notes}</Text>
                </Box>
                )}
                
                {/* DISPLAY USER SIGNATURE */}
                {profile.signature_url && (
                    <Box mt={8}>
                        <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={2}>Authorized Signature</Text>
                        <Image src={profile.signature_url} alt="Signature" maxH="60px" />
                    </Box>
                )}
            </Box>

            {/* RIGHT: Totals & Actions */}
            <Box textAlign="right">
                <Stack spacing={2} mb={6}>
                    <Flex justify="space-between">
                        <Text color={mutedColor}>Subtotal</Text>
                        <Text fontWeight="medium">{currency} {totalAmount.toFixed(2)}</Text>
                    </Flex>
                    <Flex justify="space-between" align="center">
                        <Text fontSize="xl" fontWeight="bold">Total</Text>
                        <Text fontSize="3xl" fontWeight="extrabold" color="brand.600">{currency} {totalAmount.toFixed(2)}</Text>
                    </Flex>
                </Stack>

                {activePaymentLink && quote.document_type === 'Invoice' && (
                <Flex direction="column" gap={4} align="flex-end">
                    
                    {/* BUTTON */}
                    <Button
                        as="a"
                        href={activePaymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        colorScheme="green"
                        size="lg"
                        width="full"
                        h="50px"
                        fontSize="md"
                        rightIcon={<Icon as={CreditCard} />}
                        shadow="md"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                    >
                        PAY INVOICE NOW
                    </Button>
                    
                    {/* QR CODE - CLEAN LAYOUT */}
                    {qrCodeUrl && (
                        <Flex align="center" justify="flex-end" gap={3} width="100%">
                             <Text fontSize="xs" color="gray.500" textAlign="right">Scan to Pay<br/>Instantly</Text>
                             <Image src={qrCodeUrl} alt="Payment QR" boxSize="50px" rounded="md" border="1px solid" borderColor="gray.100" />
                        </Flex>
                    )}
                </Flex>
                )}
            </Box>

            </SimpleGrid>
        </Box>

      </Box>
    </Container>
  );
}