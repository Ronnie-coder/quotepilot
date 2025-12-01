'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  IconButton,
  Tag,
  TagLabel,
  TagLeftIcon,
  useColorModeValue,
  Spinner,
  useToast,
  VStack,
  Text,
  Flex,
  Icon,
  InputGroup,
  InputLeftElement,
  Input,
  InputRightElement,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  chakra,
  Tooltip
} from '@chakra-ui/react';
import { 
  Plus, 
  Eye, 
  FilePenLine, 
  Download, 
  MoreHorizontal, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  FileText
} from 'lucide-react';
import NextLink from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DeleteButton } from './DeleteButton';
import { updateDocumentStatusAction, generatePdfAction } from './actions';
import { motion, isValidMotionProp } from 'framer-motion';

// // 1.0 TYPE DEFINITIONS
type DocumentStatus = 'draft' | 'sent' | 'paid' | 'overdue';
type DocumentType = 'Quote' | 'Invoice';

interface Document {
  id: string;
  created_at: string;
  document_type: DocumentType | string;
  invoice_number: string;
  status: DocumentStatus | string;
  total: number;
  clients: { name: string };
}

interface QuotesClientPageProps {
  initialDocuments: Document[];
  count: number;
  page: number;
  limit: number;
}

// // 2.0 ANIMATION FACTORY
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children',
});

const MotionTr = chakra(motion.tr, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children',
});

const MotionFlex = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || prop === 'children',
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

// // 3.0 HELPER FUNCTIONS
function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export default function QuotesClientPage({
  initialDocuments,
  count,
  page,
  limit,
}: QuotesClientPageProps) {
  // --- STATE ---
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [loadingPdfId, setLoadingPdfId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- HOOKS ---
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- THEME TOKENS ---
  const brandColor = 'brand.500';
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const theadBg = useColorModeValue('gray.50', 'gray.900');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');

  // --- EFFECTS ---
  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);
  
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // --- FILTERS & SEARCH ---
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    
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

  // --- ACTIONS ---
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
    const result = await generatePdfAction(documentId);
    
    if (result.success && result.pdfData) {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${result.pdfData}`;
      link.download = result.fileName || `QP-${documentNumber}.pdf`;
      link.click();
      link.remove();
      toast({ title: 'PDF Downloaded', status: 'success', duration: 2000 });
    } else {
      toast({ title: 'Download Failed', description: result.error, status: 'error' });
    }
    setLoadingPdfId(null);
  };

  const isActionDisabled = (id: string) => loadingPdfId === id || updatingStatusId === id;
  const totalPages = Math.ceil(count / limit);

  return (
    <MotionBox variants={containerVariants} initial="hidden" animate="visible">
      {/* 1. HEADER */}
      <MotionFlex 
        variants={itemVariants} 
        display="flex"
        flexDirection={{ base: 'column', md: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ base: 'start', md: 'center' }} 
        mb={8} 
        gap={4}
      >
        <Box>
          <Heading as="h1" size="xl" mb={1} letterSpacing="tight">Documents</Heading>
          <Text color={mutedText}>Manage your quotes, invoices, and revenue.</Text>
        </Box>
        <Button 
          as={NextLink} 
          href="/quote/new" 
          leftIcon={<Icon as={Plus} />} 
          bg={brandColor}
          color="white"
          _hover={{ opacity: 0.9, transform: 'translateY(-1px)' }}
          transition="all 0.2s"
          px={6} 
          shadow="md"
        >
          Create Document
        </Button>
      </MotionFlex>
      
      {/* 2. CONTROLS */}
      <VStack as={motion.div} variants={itemVariants} spacing={4} align="stretch" mb={6}>
        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          <InputGroup maxW={{ md: '350px' }}>
            <InputLeftElement pointerEvents="none"><Icon as={Search} color="gray.400" size={18} /></InputLeftElement>
            <Input 
              placeholder="Search client or doc #" 
              value={searchQuery} 
              onChange={handleSearchChange} 
              bg={cardBg}
              borderRadius="md"
              focusBorderColor={brandColor}
            />
            {searchQuery && (
              <InputRightElement>
                <IconButton 
                  aria-label="Clear search" 
                  icon={<X size={14} />} 
                  size="xs" 
                  variant="ghost" 
                  onClick={clearSearch} 
                  borderRadius="full"
                />
              </InputRightElement>
            )}
          </InputGroup>
          
          <Select 
            placeholder="All Statuses" 
            w={{ md: '200px' }}
            bg={cardBg}
            borderRadius="md"
            focusBorderColor={brandColor}
            value={searchParams.get('status') || ''} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="draft">Draft</option            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Select>
          
          <Select 
            placeholder="All Types" 
            w={{ md: '200px' }}
            bg={cardBg}
            borderRadius="md"
            focusBorderColor={brandColor}
            value={searchParams.get('type') || ''} 
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="Quote">Quote</option>
            <option value="Invoice">Invoice</option>
          </Select>
        </Flex>
      </VStack>

      {/* 3. TABLE SECTION */}
      <Box as={motion.div} variants={itemVariants} bg={cardBg} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor={borderColor} overflow="hidden">
        <TableContainer>
          <Table variant="simple">
            <Thead bg={theadBg}>
              <Tr>
                <Th>Status</Th>
                <Th>Number</Th>
                <Th>Client</Th>
                <Th>Date</Th>
                <Th isNumeric>Amount</Th>
                <Th isNumeric>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <DocumentRow 
                    key={doc.id} 
                    doc={doc} 
                    isDisabled={isActionDisabled(doc.id)} 
                    isLoadingPdf={loadingPdfId === doc.id} 
                    isUpdatingStatus={updatingStatusId === doc.id}
                    handleStatusUpdate={handleStatusUpdate} 
                    handleDownload={handleDownload} 
                    rowHoverBg={rowHoverBg}
                  />
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

const DocumentRow = ({ 
  doc, 
  isDisabled, 
  isLoadingPdf, 
  isUpdatingStatus,
  handleStatusUpdate, 
  handleDownload, 
  rowHoverBg 
}: DocumentRowProps) => {
  
  const statusLower = doc.status?.toLowerCase() || 'draft';
  let statusConfig = { color: 'gray', icon: FileText, label: 'DRAFT' };
  
  switch (statusLower) {
    case 'sent': 
      statusConfig = { color: 'blue', icon: Send, label: 'SENT' }; 
      break;
    case 'paid': 
      statusConfig = { color: 'green', icon: CheckCircle2, label: 'PAID' }; 
      break;
    case 'overdue': 
      statusConfig = { color: 'red', icon: AlertCircle, label: 'OVERDUE' }; 
      break;
    default:
      statusConfig = { color: 'gray', icon: FileText, label: 'DRAFT' };
  }

  const formattedDate = new Date(doc.created_at).toLocaleDateString('en-ZA', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });

  return (
    <MotionTr 
      variants={itemVariants} 
      _hover={{ bg: rowHoverBg }}
      /* FIXED: Removed the conflicting 'transition' prop here */
    >
      {/* STATUS */}
      <Td>
        <Tag size="sm" colorScheme={statusConfig.color} borderRadius="full" px={3} py={1}>
          <TagLeftIcon boxSize="12px" as={statusConfig.icon} />
          <TagLabel fontWeight="bold" fontSize="10px">{statusConfig.label}</TagLabel>
        </Tag>
      </Td>

      {/* DOCUMENT NUMBER */}
      <Td fontWeight="medium" fontSize="sm">
        {doc.invoice_number}
        <Tag ml={2} size="sm" variant="outline" colorScheme="gray" fontSize="xs">
          {doc.document_type === 'Invoice' ? 'INV' : 'QT'}
        </Tag>
      </Td>

      {/* CLIENT */}
      <Td fontSize="sm" color="gray.600">{doc.clients.name}</Td>

      {/* DATE */}
      <Td fontSize="sm" color="gray.500">{formattedDate}</Td>

      {/* AMOUNT (MONOSPACE) */}
      <Td isNumeric fontWeight="bold" fontFamily="mono" color="gray.700">
        R {doc.total.toFixed(2)}
      </Td>

      {/* ACTIONS */}
      <Td isNumeric>
        <Menu autoSelect={false} placement="bottom-end">
          <MenuButton 
            as={IconButton} 
            aria-label="Actions" 
            icon={<Icon as={MoreHorizontal} />} 
            variant="ghost" 
            size="sm" 
            isDisabled={isDisabled}
          />
          <MenuList fontSize="sm" shadow="lg" borderColor="gray.200">
            {/* Primary Actions */}
            <MenuItem as={NextLink} href={`/quote/${doc.id}?view=true`} icon={<Icon as={Eye} boxSize={4} />}>
              View Document
            </MenuItem>
            <MenuItem as={NextLink} href={`/quote/${doc.id}`} icon={<Icon as={FilePenLine} boxSize={4} />}>
              Edit Details
            </MenuItem>
            <MenuItem 
              onClick={() => handleDownload(doc.id, doc.invoice_number)}
              icon={isLoadingPdf ? <Spinner size="xs" /> : <Icon as={Download} boxSize={4} />}
              isDisabled={isLoadingPdf}
            >
              {isLoadingPdf ? 'Generating...' : 'Download PDF'}
            </MenuItem>

            <MenuDivider />

            {/* Quick Status Updates */}
            <MenuGroup title="Update Status">
              {statusLower !== 'sent' && (
                <MenuItem 
                  onClick={() => handleStatusUpdate(doc.id, 'sent')} 
                  icon={<Icon as={Send} boxSize={4} color="blue.500" />}
                >
                  Mark as Sent
                </MenuItem>
              )}
              {statusLower !== 'paid' && (
                <MenuItem 
                  onClick={() => handleStatusUpdate(doc.id, 'paid')} 
                  icon={<Icon as={CheckCircle2} boxSize={4} color="green.500" />}
                >
                  Mark as Paid
                </MenuItem>
              )}
              {statusLower !== 'draft' && (
                <MenuItem 
                  onClick={() => handleStatusUpdate(doc.id, 'draft')} 
                  icon={<Icon as={FileText} boxSize={4} color="gray.500" />}
                >
                  Mark as Draft
                </MenuItem>
              )}
            </MenuGroup>

            <MenuDivider />

            {/* Danger Zone */}
            <DeleteButton 
              quoteId={doc.id} 
              clientName={doc.clients.name} 
              isDisabled={isDisabled} 
            />
          </MenuList>
        </Menu>
      </Td>
    </MotionTr>
  );
};