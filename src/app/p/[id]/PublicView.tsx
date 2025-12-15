"use client";

import React, { useState } from "react";
import { 
  Box, 
  Button, 
  Flex, 
  Heading, 
  Text, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Container,
  Badge,
  useToast,
  Image,
  useColorModeValue,
  Divider,
  HStack
} from "@chakra-ui/react";
import { generatePdf, PdfData } from "@/utils/pdfGenerator";

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
      {/* Top Bar */}
      <Flex justify="space-between" align="center" mb={6}>
         <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">Public Invoice</Badge>
         <Button 
            leftIcon={<DownloadIcon />}
            colorScheme="brand"
            isLoading={isDownloading}
            loadingText="Generating..."
            onClick={handleDownload}
            shadow="md"
         >
            Download PDF
         </Button>
      </Flex>

      {/* MAIN CARD */}
      <Box bg={bgCard} shadow="xl" rounded="lg" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
        
        {/* Header Section */}
        <Box bg={bgHeader} p={8} borderBottomWidth="1px" borderColor={borderColor}>
           <Flex justify="space-between" align="start" direction={{ base: 'column-reverse', md: 'row' }} gap={6}>
              <Box>
                 <Heading size="lg" color={textColor} mb={1}>INVOICE</Heading>
                 <Text color={mutedColor} fontWeight="medium">#{quote.invoice_number}</Text>
              </Box>
              <Box textAlign={{ base: 'left', md: 'right' }}>
                 {profile.logo_url && (
                   <Flex justify={{ base: 'flex-start', md: 'flex-end' }} mb={4}>
                      <Image src={profile.logo_url} alt="Company Logo" maxH="60px" objectFit="contain" />
                   </Flex>
                 )}
                 <Heading size="md" color="brand.500" mb={1}>{profile.company_name || "Company Name"}</Heading>
                 <Text fontSize="sm" color={mutedColor}>{profile.company_phone}</Text>
                 <Text fontSize="sm" color={mutedColor} whiteSpace="pre-wrap">{profile.company_address}</Text>
              </Box>
           </Flex>
        </Box>

        {/* Info Grid */}
        <Box p={8}>
            <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={8}>
                <Box flex="1">
                   <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wide" mb={2}>Billed To</Text>
                   <Text fontSize="lg" fontWeight="bold" color={textColor}>{client.name || "No Name"}</Text>
                   <Text color={mutedColor}>{client.email}</Text>
                   <Text color={mutedColor} whiteSpace="pre-wrap" mt={1}>{client.address}</Text>
                </Box>
                <Box textAlign={{ base: 'left', md: 'right' }}>
                   <Box mb={4}>
                      <Text fontSize="sm" color="gray.500">Date Issued</Text>
                      <Text fontWeight="medium" color={textColor}>{quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'N/A'}</Text>
                   </Box>
                   <Box>
                      <Text fontSize="sm" color="gray.500">Due Date</Text>
                      <Text fontWeight="medium" color="red.500">{quote.due_date ? new Date(quote.due_date).toLocaleDateString() : 'N/A'}</Text>
                   </Box>
                </Box>
            </Flex>
        </Box>

        {/* Items Table */}
        <Box px={8} pb={8}>
            <Table variant="simple" size="md">
                <Thead bg={useColorModeValue("gray.50", "gray.700")}>
                    <Tr>
                        <Th color="gray.500">Description</Th>
                        <Th color="gray.500" isNumeric>Price</Th>
                        <Th color="gray.500" textAlign="center">Qty</Th>
                        <Th color="gray.500" isNumeric>Total</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {quote.items && quote.items.length > 0 ? (
                        quote.items.map((item: any, index: number) => (
                            <Tr key={index}>
                                <Td color={textColor} fontWeight="medium">{item.description}</Td>
                                <Td color={mutedColor} isNumeric>{safeNum(item.unitPrice || item.price).toFixed(2)}</Td>
                                <Td color={mutedColor} textAlign="center">{item.quantity}</Td>
                                <Td color={textColor} fontWeight="bold" isNumeric>{(safeNum(item.unitPrice || item.price) * safeNum(item.quantity)).toFixed(2)}</Td>
                            </Tr>
                        ))
                    ) : (
                        <Tr><Td colSpan={4} textAlign="center" py={8} color="gray.400" fontStyle="italic">No items found.</Td></Tr>
                    )}
                </Tbody>
            </Table>
        </Box>

        {/* Totals Section */}
        <Box bg={bgHeader} p={8} borderTopWidth="1px" borderColor={borderColor}>
            <Flex justify="flex-end">
                <Box width="300px">
                    <Flex justify="space-between" align="center" borderTopWidth="2px" borderColor={borderColor} pt={2} mt={2}>
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>Total</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="brand.500">{currency} {totalAmount.toFixed(2)}</Text>
                    </Flex>
                </Box>
            </Flex>
        </Box>

        {/* FOOTER & BRANDING */}
        <Box p={8} borderTopWidth="1px" borderColor={borderColor}>
           
           {notes && (
             <Box mb={6}>
                <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wide" mb={2}>Notes / Terms</Text>
                <Text fontSize="sm" color={mutedColor} whiteSpace="pre-wrap">{notes}</Text>
             </Box>
           )}

           <Divider mb={6} />

           <Box textAlign="center">
             {profile.bank_name && (
                 <Text fontSize="xs" color="gray.500" mb={4}>
                     <strong>Banking Details:</strong> {profile.bank_name} | <strong>Acc:</strong> {profile.account_number}
                     {profile.branch_code && ` | Branch: ${profile.branch_code}`}
                 </Text>
             )}
             
             {/* 🟢 VISUAL BRANDING - "Powered by" */}
             <HStack justify="center" spacing={2} opacity={0.8} mt={2}>
                 <Text fontSize="xs" color="gray.400">Powered by</Text>
                 <Image 
                    src="/logo.png" // Ensure this is in /public
                    alt="QuotePilot Logo" 
                    height="16px" 
                    width="auto"
                    objectFit="contain" 
                 />
                 <Text fontSize="xs" fontWeight="bold" color="gray.500">QuotePilot</Text>
             </HStack>

           </Box>
        </Box>

      </Box>
    </Container>
  );
}