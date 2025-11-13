'use client';

import { useState } from 'react';
import { 
  Box, Heading, Button, Table, Thead, Tbody, Tr, Th, Td, TableContainer, 
  HStack, IconButton, Tag, useColorModeValue, Spinner, useToast, VStack, 
  Text, Flex, Icon, Link as ChakraLink, Menu, MenuButton, MenuList, MenuItem,
} from '@chakra-ui/react';
import { Plus, Eye, FilePenLine, Download, FileX2, ChevronDown } from 'lucide-react';
import NextLink from 'next/link';
import { DeleteButton } from './DeleteButton';
import { updateDocumentStatusAction, generatePdfAction } from './actions';

// Define the shape of our document for type safety
type Document = {
  id: string;
  created_at: string;
  document_type: string;
  invoice_number: string;
  status: string | null;
  total: number;
  clients: { name: string };
};

type QuotesClientPageProps = {
  initialDocuments: Document[];
};

// --- (StatusMenu component remains unchanged) ---
const StatusMenu = ({ doc, onUpdate, isUpdating }: { doc: Document, onUpdate: (id: string, status: string) => void, isUpdating: boolean }) => {
  const statusLower = doc.status?.toLowerCase() || 'draft';
  let colorScheme = 'gray';
  switch (statusLower) {
    case 'sent': colorScheme = 'blue'; break;
    case 'paid': colorScheme = 'green'; break;
    case 'overdue': colorScheme = 'red'; break;
    default: colorScheme = 'gray'; break;
  }
  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<Icon as={ChevronDown} boxSize={4} />} size="xs" variant="outline" colorScheme={colorScheme} isLoading={isUpdating} minW="90px" textTransform="capitalize">
        {statusLower}
      </MenuButton>
      <MenuList minW="120px" zIndex={10}>
        <MenuItem onClick={() => onUpdate(doc.id, 'draft')}>Set as Draft</MenuItem>
        <MenuItem onClick={() => onUpdate(doc.id, 'sent')}>Set as Sent</MenuItem>
        <MenuItem onClick={() => onUpdate(doc.id, 'paid')}>Set as Paid</MenuItem>
      </MenuList>
    </Menu>
  );
};

export default function QuotesClientPage({ initialDocuments }: QuotesClientPageProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [loadingPdfId, setLoadingPdfId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const toast = useToast();

  const brandGold = useColorModeValue('yellow.500', 'yellow.300');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const theadBg = useColorModeValue('gray.100', 'gray.900');

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleStatusUpdate = async (documentId: string, newStatus: string) => {
    // ... (This function is correct and unchanged)
    const currentDoc = documents.find(d => d.id === documentId);
    if (currentDoc?.status === newStatus) return;
    setUpdatingStatusId(documentId);
    const result = await updateDocumentStatusAction(documentId, newStatus);
    if (result.success) {
      setDocuments(docs => docs.map(doc => doc.id === documentId ? { ...doc, status: newStatus } : doc));
      toast({ title: 'Status Updated', status: 'success', duration: 2000, isClosable: true });
    } else {
      toast({ title: 'Update Failed', description: result.error, status: 'error', duration: 5000, isClosable: true });
    }
    setUpdatingStatusId(null);
  };

  // --- MISSION CRITICAL: PDF DOWNLOAD HANDLER (Unchanged but vital) ---
  const handleDownload = async (documentId: string, documentNumber: string) => {
    setLoadingPdfId(documentId);
    try {
      const result = await generatePdfAction(documentId);
      if (result.success && result.pdfData) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${result.pdfData}`;
        link.download = result.fileName || `doc_${documentNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Download Started', status: 'success', duration: 3000, isClosable: true });
      } else {
        throw new Error(result.error || 'An unknown error occurred during PDF generation.');
      }
    } catch (error) {
      console.error("PDF Download Error:", error);
      toast({ title: 'Download Failed', description: error instanceof Error ? error.message : 'Could not download the PDF.', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setLoadingPdfId(null);
    }
  };

  const isActionDisabled = loadingPdfId !== null || updatingStatusId !== null;

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }} mb={8} gap={4}>
        <Heading as="h1" size="xl" color={headingColor}>My Documents</Heading>
        <Button as={NextLink} href="/quote/new" leftIcon={<Icon as={Plus} />} colorScheme="yellow" bg={brandGold} color={useColorModeValue('gray.800', 'gray.900')} _hover={{ bg: useColorModeValue('yellow.600', 'yellow.400') }} px={6} shadow="md">
          Create Document
        </Button>
      </Flex>
      
      <Box bg={cardBg} borderRadius="lg" shadow="md" borderWidth="1px" borderColor={borderColor}>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th bg={theadBg} borderTopLeftRadius="lg" textTransform="uppercase" fontSize="xs" letterSpacing="wider">Status</Th>
                <Th bg={theadBg} textTransform="uppercase" fontSize="xs" letterSpacing="wider">Type</Th>
                <Th bg={theadBg} textTransform="uppercase" fontSize="xs" letterSpacing="wider">Doc #</Th>
                <Th bg={theadBg} textTransform="uppercase" fontSize="xs" letterSpacing="wider">Client</Th>
                <Th bg={theadBg} textTransform="uppercase" fontSize="xs" letterSpacing="wider">Date</Th>
                <Th bg={theadBg} isNumeric textTransform="uppercase" fontSize="xs" letterSpacing="wider">Total</Th>
                <Th bg={theadBg} borderTopRightRadius="lg" textTransform="uppercase" fontSize="xs" letterSpacing="wider">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <Tr key={doc.id} _hover={{ bg: rowHoverBg }} transition="background-color 0.2s ease">
                    <Td><StatusMenu doc={doc} onUpdate={handleStatusUpdate} isUpdating={updatingStatusId === doc.id} /></Td>
                    <Td><Tag size="sm" colorScheme={doc.document_type === 'Invoice' ? 'blue' : 'purple'}>{doc.document_type}</Tag></Td>
                    <Td fontWeight="medium">#{doc.invoice_number}</Td>
                    <Td color={textColor}>{doc.clients.name}</Td>
                    <Td color={textColor}>{formatDate(doc.created_at)}</Td>
                    <Td isNumeric fontWeight="bold" color={brandGold}>R {doc.total.toFixed(2)}</Td>
                    <Td>
                      <HStack>
                        {/* --- CORRECTIVE ACTION IMPLEMENTED --- */}
                        <IconButton
                          aria-label="Download PDF"
                          icon={loadingPdfId === doc.id ? <Spinner size="sm" /> : <Icon as={Download} boxSize={4} />}
                          onClick={() => handleDownload(doc.id, doc.invoice_number)}
                          isDisabled={isActionDisabled}
                          size="sm"
                          variant="ghost"
                        />
                        <IconButton as={NextLink} href={`/quote/${doc.id}?view=true`} aria-label="View document" icon={<Icon as={Eye} boxSize={4} />} size="sm" isDisabled={isActionDisabled} variant="ghost"/>
                        <IconButton as={NextLink} href={`/quote/${doc.id}`} aria-label="Edit document" icon={<Icon as={FilePenLine} boxSize={4} />} size="sm" isDisabled={isActionDisabled} variant="ghost"/>
                        <DeleteButton quoteId={doc.id} clientName={doc.clients.name} isDisabled={isActionDisabled} />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr><Td colSpan={7} h="250px"><VStack spacing={4}><Icon as={FileX2} boxSize={12} color={textColor} /><Heading as="h3" size="md" color={headingColor}>No Documents Found</Heading><Text color={textColor}>Click <ChakraLink as={NextLink} href="/quote/new" color={brandGold} fontWeight="bold">Create Document</ChakraLink> to get started.</Text></VStack></Td></Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}