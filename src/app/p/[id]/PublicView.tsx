"use client";

import React, { useState, useEffect } from "react";
import { 
  Box, Button, Flex, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, 
  Container, Badge, useToast, Image, useColorModeValue, Stack, SimpleGrid, Icon
} from "@chakra-ui/react";
import { generatePdf } from "@/utils/pdfGenerator";
import { mapToPdfPayload } from "@/utils/pdfMapper"; 
import { CreditCard, ShieldCheck } from "lucide-react"; 
import QRCode from "qrcode"; 

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
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const toast = useToast();
  const safeNum = (val: any) => Number(val) || 0;

  // Document Type Logic
  const isQuote = (quote.document_type || 'Invoice').toLowerCase() === 'quote';
  
  // STRICT IDENTITY LOGIC
  const docTitle = isQuote ? "PROPOSAL" : "INVOICE";
  const docColor = isQuote ? "purple.500" : "brand.500"; 
  const totalLabel = isQuote ? "Estimated Total" : "Total";
  const termsHeader = isQuote ? "Terms & Conditions" : "Notes";

  // Theme
  const bgCard = useColorModeValue("white", "gray.800");
  const bgHeader = useColorModeValue("gray.50", "gray.700");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const profile = quote.profiles || {};
  const client = quote.clients || {};
  
  // Visual Totals
  const items = quote.items || [];
  const subtotal = items.reduce((acc: number, item: any) => acc + (safeNum(item.unitPrice || item.price) * safeNum(item.quantity)), 0);
  const vatRate = safeNum(quote.vat_rate);
  const vatAmount = subtotal * (vatRate / 100);
  const totalAmount = subtotal + vatAmount;

  const currency = quote.currency || "ZAR";
  const notes = quote.notes || ""; 

  let activePaymentLink = quote.payment_link; 
  if (!activePaymentLink && profile.payment_settings) {
    const settings = profile.payment_settings;
    if (settings.default_provider) {
        const provider = settings.providers.find((p: any) => p.id === settings.default_provider);
        if (provider) activePaymentLink = provider.url;
    }
  }

  useEffect(() => {
    if (activePaymentLink && !isQuote) {
        QRCode.toDataURL(activePaymentLink, { margin: 1, color: { dark: '#000000', light: '#ffffff00' } })
            .then(setQrCodeUrl)
            .catch(err => console.error("QR Generation failed", err));
    }
  }, [activePaymentLink, isQuote]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const pdfData = mapToPdfPayload(quote, profile, client, userEmail);
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
      toast({ title: "Download Failed", description: "Could not generate PDF.", status: "error", duration: 3000 });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Container maxW="4xl" py={10}>
      <Flex justify="space-between" align="center" mb={6}>
         <Badge colorScheme={isQuote ? "purple" : "green"} variant="subtle" fontSize="sm" px={3} py={1} borderRadius="full" display="flex" alignItems="center" gap={1}>
            <Icon as={ShieldCheck} boxSize={3} /> {isQuote ? "Official Proposal" : "Secure Payment Portal"}
         </Badge>
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

      <Box bg={bgCard} shadow="xl" rounded="lg" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
        
        {/* HEADER - 🟢 LAYOUT FLIPPED */}
        <Box bg={bgHeader} p={8} borderBottomWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="start" direction={{ base: 'column-reverse', md: 'row' }} gap={6}>
            
            {/* LEFT SIDE: Document Details */}
            <Box textAlign="left">
                <Heading size="2xl" color={docColor} letterSpacing="tight">{docTitle}</Heading>
                <Text fontSize="xl" color={mutedColor} fontWeight="medium" mb={2}>#{quote.invoice_number}</Text>
                
                <Stack spacing={1} mt={4} fontSize="sm">
                  <Flex justify="flex-start">
                      <Text color={mutedColor} w="80px">Date:</Text>
                      <Text fontWeight="bold">{new Date(quote.created_at).toLocaleDateString()}</Text>
                  </Flex>
                  {quote.due_date && (
                      <Flex justify="flex-start">
                          <Text color={mutedColor} w="80px">{isQuote ? "Valid Until:" : "Due:"}</Text>
                          <Text fontWeight="bold" color={isQuote ? "gray.700" : "red.500"}>
                              {new Date(quote.due_date).toLocaleDateString()}
                          </Text>
                      </Flex>
                  )}
                </Stack>
                {quote.status && <Badge mt={4} fontSize="0.9em" colorScheme={quote.status === 'Paid' ? 'green' : 'orange'}>{quote.status}</Badge>}
            </Box>

            {/* RIGHT SIDE: Logo & Company Info */}
            <Box textAlign={{ base: 'left', md: 'right' }}>
                {profile.logo_url && (
                  <Flex justify={{ base: 'flex-start', md: 'flex-end' }} mb={4}>
                     <Image src={profile.logo_url} alt="Company Logo" maxH="60px" objectFit="contain" />
                  </Flex>
                )}
                <Heading size="md" color="brand.500" mb={1}>{profile.company_name || "Company Name"}</Heading>
                <Stack spacing={0} fontSize="sm" color={mutedColor}>
                    <Text>{profile.company_address}</Text>
                    <Text>{profile.company_phone}</Text>
                    <Text>{userEmail}</Text> 
                </Stack>
            </Box>

            </Flex>
        </Box>

        {/* ADDRESS BLOCK */}
        <Box p={8}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={2}>
                        {isQuote ? "Prepared For" : "Billed To"}
                    </Text>
                    <Heading size="sm" mb={1}>{client.name || "Valued Client"}</Heading>
                    <Text fontSize="sm" color={mutedColor} whiteSpace="pre-wrap">{client.address}</Text>
                    <Text fontSize="sm" color={mutedColor}>{client.email}</Text>
                    <Text fontSize="sm" color={mutedColor}>{client.phone}</Text>
                </Box>
            </SimpleGrid>
        </Box>

        {/* ITEMS */}
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
                    {items.length > 0 ? (
                        items.map((item: any, index: number) => (
                            <Tr key={index}>
                                <Td pl={0} fontWeight="medium">{item.description}</Td>
                                <Td isNumeric>{safeNum(item.unitPrice || item.price).toFixed(2)}</Td>
                                <Td textAlign="center">{item.quantity}</Td>
                                <Td fontWeight="bold" isNumeric pr={0}>{(safeNum(item.unitPrice || item.price) * safeNum(item.quantity)).toFixed(2)}</Td>
                            </Tr>
                        ))
                    ) : (
                        <Tr><Td colSpan={4} textAlign="center">No items listed.</Td></Tr>
                    )}
                </Tbody>
            </Table>
        </Box>

        {/* FOOTER */}
        <Box bg={bgHeader} p={8} borderTopWidth="1px" borderColor={borderColor}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            
            <Box>
                {!isQuote && profile.bank_name && (
                <Box bg={bgCard} p={4} rounded="md" borderWidth="1px" borderColor={borderColor} shadow="sm" mb={6}>
                    <Text fontSize="xs" fontWeight="bold" color="green.600" textTransform="uppercase" mb={3}>Bank Transfer Details</Text>
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
                    <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={2}>{termsHeader}</Text>
                    <Text fontSize="sm" color={mutedColor}>{notes}</Text>
                </Box>
                )}
                {profile.signature_url && (
                    <Box mt={8}>
                        <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={2}>Authorized By</Text>
                        <Image src={profile.signature_url} alt="Signature" maxH="60px" />
                    </Box>
                )}
            </Box>

            <Box textAlign="right">
                <Stack spacing={2} mb={6}>
                    <Flex justify="space-between">
                        <Text color={mutedColor}>Subtotal</Text>
                        <Text fontWeight="medium">{currency} {subtotal.toFixed(2)}</Text>
                    </Flex>
                    {vatRate > 0 && (
                        <Flex justify="space-between">
                            <Text color={mutedColor}>VAT ({vatRate}%)</Text>
                            <Text fontWeight="medium">{currency} {vatAmount.toFixed(2)}</Text>
                        </Flex>
                    )}
                    <Flex justify="space-between" align="center">
                        <Text fontSize="xl" fontWeight="bold">{totalLabel}</Text>
                        <Text fontSize="3xl" fontWeight="extrabold" color={isQuote ? "purple.600" : "brand.600"}>{currency} {totalAmount.toFixed(2)}</Text>
                    </Flex>
                </Stack>

                {!isQuote && activePaymentLink && (
                <Flex direction="column" gap={4} align="flex-end">
                    <Button as="a" href={activePaymentLink} target="_blank" rel="noopener noreferrer" colorScheme="green" size="lg" width="full" h="50px" fontSize="md" rightIcon={<Icon as={CreditCard} />} shadow="md" _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}>
                        Pay Invoice Now
                    </Button>
                    {qrCodeUrl && (
                        <Flex align="center" justify="flex-end" gap={3} width="100%">
                             <Text fontSize="xs" color="gray.500" textAlign="right">Scan to Pay<br/>Securely</Text>
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