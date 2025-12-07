'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box, Heading, Button, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  HStack, IconButton, Tag, TagLabel, TagLeftIcon, useColorModeValue,
  Spinner, useToast, VStack, Text, Flex, Icon, InputGroup, InputLeftElement,
  Input, InputRightElement, Select, Menu, MenuButton, MenuList, MenuItem,
  MenuDivider, MenuGroup, chakra,
} from '@chakra-ui/react';
import { 
  Plus, Eye, Download, MoreHorizontal, Search, X, CheckCircle2, AlertCircle, Send, FileText
} from 'lucide-react';
import NextLink from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DeleteButton } from './DeleteButton';
import { updateDocumentStatusAction, getQuoteForPdf } from './actions';
import { generatePdf } from '@/utils/pdfGenerator';
import { formatCurrency } from '@/utils/formatCurrency';
import { motion, isValidMotionProp } from 'framer-motion';

// --- TYPE DEFINITIONS ---
type DocumentStatus = 'draft' | 'sent' | 'paid' | 'overdue';
type DocumentType = 'Quote' | 'Invoice';

interface Document {
  id: string;
  created_at: string;
  document_type: DocumentType | string;
  invoice_number: string;
  status: DocumentStatus | string;
  total: number;
  currency?: string; 
  clients: { name: string };
}

// 🟢 COMMANDER FIX: Interface now expects 'documents', not 'initialDocuments'
interface QuotesClientPageProps {
  documents: Document[]; 
  count: number;
  page: number;
  limit: number;
}

// --- ANIMATION WRAPPERS ---
const MotionBox = chakra(motion.div, { shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children' });
const MotionTr = chakra(motion.tr, { shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children' });
const MotionFlex = chakra(motion.div, { shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children' });

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } } };

// --- HELPER ---
function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// --- MAIN COMPONENT ---
// 🟢 COMMANDER FIX: We alias 'documents' to 'serverDocuments' and default it to [] 
export default function QuotesClientPage({ documents: serverDocuments = [], count, page, limit }: QuotesClientPageProps) {
  
  // Initialize state with the incoming server data
  const [documents, setDocuments] = useState<Document[]>(serverDocuments);
  
  const [loadingPdfId, setLoadingPdfId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const brandColor = 'brand.500';
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const theadBg = useColorModeValue('gray.50', 'gray.900');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  // 🟢 COMMANDER FIX: Sync state if server data changes
  useEffect(() => { setDocuments(serverDocuments); }, [serverDocuments]);
  
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const debouncedSearch = useCallback(debounce(handleFilterChange, 500), [searchParams, pathname]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSearch('q', e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    handleFilterChange('q', '');
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusUpdate = async (documentId: string, newStatus: string) => {
    const currentDoc = documents.find(d => d.id === documentId);
    if (currentDoc?.status === newStatus) return;

    setUpdatingStatusId(documentId);
    setDocuments(docs => docs.map(doc => doc.id === documentId ? { ...doc, status: newStatus } : doc));

    const result = await updateDocumentStatusAction(documentId, newStatus);
    if (result.success) {
      toast({ title: 'Status Updated', status: 'success', duration: 2000, isClosable: true });
    } else {
      setDocuments(docs => docs.map(doc => doc.id === documentId ? { ...doc, status: currentDoc?.status || 'draft' } : doc));
      toast({ title: 'Update Failed', description: result.error, status: 'error', isClosable: true });
    }
    setUpdatingStatusId(null);
  };

  const handleDownload = async (documentId: string, documentNumber: string) => {
    setLoadingPdfId(documentId);
    try {
      const result = await getQuoteForPdf(documentId);
      if (result.error || !result.quote || !result.profile) throw new Error(result.error || 'Could not retrieve document data.');
      const { quote, profile } = result;

      const blob = await generatePdf({
        documentType: quote.document_type as any || 'Quote',
        brandColor: quote.brand_color || '#319795', 
        invoiceNumber: quote.invoice_number,
        invoiceDate: quote.invoice_date || quote.created_at,
        dueDate: quote.due_date,
        logo: profile.logo_url || profile.avatar_url || null, 
        from: { name: profile.company_name, email: profile.email, address: profile.company_address },
        to: { name: quote.clients?.name, email: quote.clients?.email, address: quote.clients?.address },
        lineItems: (quote.line_items as any) || [],
        notes: quote.notes,
        vatRate: quote.vat_rate,
        subtotal: 0,
        vatAmount: 0,
        total: quote.total,
        currency: quote.currency, 
        payment: { bankName: profile.bank_name, accountHolder: profile.account_holder, accNumber: profile.account_number, branchCode: profile.branch_code }
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quote.document_type}_${documentNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ title: 'PDF Downloaded', status: 'success', duration: 2000 });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Download Failed', description: 'Ensure settings are saved.', status: 'error' });
    } finally {
      setLoadingPdfId(null);
    }
  };

  const isActionDisabled = (id: string) => loadingPdfId === id || updatingStatusId === id;
  const totalPages = Math.ceil(count / limit);
    return (
    <MotionBox variants={containerVariants} initial="hidden" animate="visible">
      {/* 1. HEADER */}
      <MotionFlex variants={itemVariants} display="flex" flexDirection={{ base: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ base: 'start', md: 'center' }} mb={8} gap={4}>
        <Box>
          <Heading as="h1" size="xl" mb={1} letterSpacing="tight">Documents</Heading>
          <Text color={mutedText}>Manage your quotes, invoices, and revenue.</Text>
        </Box>
        <Button as={NextLink} href="/quote/new" leftIcon={<Icon as={Plus} />} bg={brandColor} color="white" _hover={{ opacity: 0.9, transform: 'translateY(-1px)' }} transition="all 0.2s" px={6} shadow="md">Create Document</Button>
      </MotionFlex>
      
      {/* 2. CONTROLS */}
      <VStack as={motion.div} variants={itemVariants} spacing={4} align="stretch" mb={6}>
        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          <InputGroup maxW={{ md: '350px' }}>
            <InputLeftElement pointerEvents="none"><Icon as={Search} color="gray.400" size={18} /></InputLeftElement>
            <Input placeholder="Search client or doc #" value={searchQuery} onChange={handleSearchChange} bg={cardBg} borderRadius="md" focusBorderColor={brandColor} />
            {searchQuery && (<InputRightElement><IconButton aria-label="Clear search" icon={<X size={14} />} size="xs" variant="ghost" onClick={clearSearch} borderRadius="full" /></InputRightElement>)}
          </InputGroup>
          <Select placeholder="All Statuses" w={{ md: '200px' }} bg={cardBg} borderRadius="md" focusBorderColor={brandColor} value={searchParams.get('status') || ''} onChange={(e) => handleFilterChange('status', e.target.value)}><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option></Select>
          <Select placeholder="All Types" w={{ md: '200px' }} bg={cardBg} borderRadius="md" focusBorderColor={brandColor} value={searchParams.get('type') || ''} onChange={(e) => handleFilterChange('type', e.target.value)}><option value="Quote">Quote</option><option value="Invoice">Invoice</option></Select>
        </Flex>
      </VStack>

      {/* 3. TABLE */}
      <Box as={motion.div} variants={itemVariants} bg={cardBg} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor={borderColor} overflow="hidden">
        <TableContainer>
          <Table variant="simple">
            <Thead bg={theadBg}>
              <Tr><Th>Status</Th><Th>Number</Th><Th>Client</Th><Th>Date</Th><Th isNumeric>Amount</Th><Th isNumeric>Actions</Th></Tr>
            </Thead>
            <Tbody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} isDisabled={isActionDisabled(doc.id)} isLoadingPdf={loadingPdfId === doc.id} isUpdatingStatus={updatingStatusId === doc.id} handleStatusUpdate={handleStatusUpdate} handleDownload={handleDownload} rowHoverBg={rowHoverBg} />
                ))
              ) : (
                <Tr>
                  <Td colSpan={6} h="300px">
                    <Flex direction="column" align="center" justify="center" h="full" gap={4}>
                      <Box p={4} bg="gray.50" borderRadius="full">
                        <Icon as={Search} boxSize={8} color="gray.400" />
                      </Box>
                      <VStack spacing={1}>
                        <Heading size="md" color="gray.600">No Documents Found</Heading>
                        <Text color="gray.400">Try adjusting your filters or create a new quote.</Text>
                      </VStack>
                    </Flex>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      {/* 4. PAGINATION */}
      {totalPages > 1 &&
        <Flex as={motion.div} variants={itemVariants} justify="space-between" align="center" mt={6}>
          <Text fontSize="sm" color={mutedText}>Showing {documents.length} of {count} results</Text>
          <HStack>
            <Button onClick={() => handlePageChange(page - 1)} isDisabled={page <= 1} size="sm" variant="outline">Previous</Button>
            <Text fontSize="sm" fontWeight="bold">Page {page} of {totalPages}</Text>
            <Button onClick={() => handlePageChange(page + 1)} isDisabled={page >= totalPages} size="sm" variant="outline">Next</Button>
          </HStack>
        </Flex>
      }
    </MotionBox>
  );
}

// --- SUB-COMPONENT: DOCUMENT ROW ---
interface DocumentRowProps {
  doc: Document;
  isDisabled: boolean;
  isLoadingPdf: boolean;
  isUpdatingStatus: boolean;
  handleStatusUpdate: (id: string, status: string) => void;
  handleDownload: (id: string, num: string) => void;
  rowHoverBg: string;
}

const DocumentRow = ({ doc, isDisabled, isLoadingPdf, isUpdatingStatus, handleStatusUpdate, handleDownload, rowHoverBg }: DocumentRowProps) => {
  const statusLower = doc.status?.toLowerCase() || 'draft';
  let statusConfig = { color: 'gray', icon: FileText, label: 'DRAFT' };
  
  switch (statusLower) {
    case 'sent': statusConfig = { color: 'blue', icon: Send, label: 'SENT' }; break;
    case 'paid': statusConfig = { color: 'green', icon: CheckCircle2, label: 'PAID' }; break;
    case 'overdue': statusConfig = { color: 'red', icon: AlertCircle, label: 'OVERDUE' }; break;
    default: statusConfig = { color: 'gray', icon: FileText, label: 'DRAFT' };
  }

  const formattedDate = new Date(doc.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <MotionTr variants={itemVariants} _hover={{ bg: rowHoverBg }}>
      <Td>
        <Tag size="sm" colorScheme={statusConfig.color} borderRadius="full" px={3} py={1}>
          <TagLeftIcon boxSize="12px" as={statusConfig.icon} />
          <TagLabel fontWeight="bold" fontSize="10px">{statusConfig.label}</TagLabel>
        </Tag>
      </Td>
      <Td fontWeight="medium" fontSize="sm">{doc.invoice_number}<Tag ml={2} size="sm" variant="outline" colorScheme="gray" fontSize="xs">{doc.document_type === 'Invoice' ? 'INV' : 'QT'}</Tag></Td>
      <Td fontSize="sm" color="gray.600">{doc.clients.name}</Td>
      <Td fontSize="sm" color="gray.500">{formattedDate}</Td>
      <Td isNumeric fontWeight="bold" fontFamily="mono" color="gray.700">
        {formatCurrency(doc.total, doc.currency)}
      </Td>
      <Td isNumeric>
        <Menu autoSelect={false} placement="bottom-end">
          <MenuButton as={IconButton} aria-label="Actions" icon={<Icon as={MoreHorizontal} />} variant="ghost" size="sm" isDisabled={isDisabled} />
          <MenuList fontSize="sm" shadow="lg" borderColor="gray.200">
            <MenuItem as={NextLink} href={`/quote/${doc.id}`} icon={<Icon as={Eye} boxSize={4} />}>View / Edit</MenuItem>
            <MenuItem onClick={() => handleDownload(doc.id, doc.invoice_number)} icon={isLoadingPdf ? <Spinner size="xs" /> : <Icon as={Download} boxSize={4} />} isDisabled={isLoadingPdf}>
              {isLoadingPdf ? 'Generating...' : 'Download PDF'}
            </MenuItem>
            <MenuDivider />
            <MenuGroup title="Update Status">
              {statusLower !== 'sent' && (<MenuItem onClick={() => handleStatusUpdate(doc.id, 'sent')} icon={<Icon as={Send} boxSize={4} color="blue.500" />}>Mark as Sent</MenuItem>)}
              {statusLower !== 'paid' && (<MenuItem onClick={() => handleStatusUpdate(doc.id, 'paid')} icon={<Icon as={CheckCircle2} boxSize={4} color="green.500" />}>Mark as Paid</MenuItem>)}
              {statusLower !== 'draft' && (<MenuItem onClick={() => handleStatusUpdate(doc.id, 'draft')} icon={<Icon as={FileText} boxSize={4} color="gray.500" />}>Mark as Draft</MenuItem>)}
            </MenuGroup>
            <MenuDivider />
            <DeleteButton quoteId={doc.id} clientName={doc.clients.name} isDisabled={isDisabled} />
          </MenuList>
        </Menu>
      </Td>
    </MotionTr>
  );
};