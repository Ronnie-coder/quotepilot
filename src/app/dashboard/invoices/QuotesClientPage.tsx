'use client';

import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Badge, IconButton, Menu, MenuButton, MenuList, MenuItem, Button, Flex, Text, useToast, Container, Input, InputGroup, InputLeftElement, Select, useColorModeValue, VStack, Icon,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Tooltip
} from '@chakra-ui/react';
import { MoreVertical, Search, FileText, Download, CheckCircle, Send, ExternalLink, FileQuestion, DollarSign, Trash2, ShieldCheck, Plus, Bell } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition, useCallback, useRef } from 'react';
import { updateDocumentStatusAction, getQuoteForPdf, deleteQuoteAction } from './actions';
import { generatePdf } from '@/utils/pdfGenerator';
import ShareInvoice from '@/components/ShareInvoice';
import InvoiceReminder from '@/components/InvoiceReminder'; 
import { PaymentSettings } from '@/types/profile';

// --- INTERNAL COMPONENT: DELETE DIALOG ---
type DeleteQuoteDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string | null;
  clientName: string;
};

function DeleteQuoteDialog({ isOpen, onClose, quoteId, clientName }: DeleteQuoteDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!quoteId) return;

    startTransition(async () => {
      const result = await deleteQuoteAction(quoteId);

      if (result.success) {
        toast({
          title: 'Invoice Deleted',
          description: `The invoice for ${clientName} has been permanently removed.`,
          status: 'success',
          duration: 3000,
        });
        router.refresh();
        onClose();
      } else {
        toast({
          title: 'Delete Failed',
          description: result.error,
          status: 'error',
        });
      }
    });
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay bg="blackAlpha.300" backdropFilter="blur(2px)">
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold" color="red.600">
            Delete Invoice
          </AlertDialogHeader>

          <AlertDialogBody>
            Are you sure you want to delete this invoice for <strong>{clientName}</strong>?
            <br /><br />
            This action creates a permanent gap in your records and cannot be undone.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose} isDisabled={isPending} variant="ghost">
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              ml={3}
              isLoading={isPending}
            >
              Delete Permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

// --- MAIN PAGE COMPONENT ---

interface Quote {
  id: string;
  invoice_number: string;
  created_at: string;
  total: number;
  status: string;
  document_type: string;
  currency: string;
  payment_link?: string;
  invoice_hash?: string; 
  client_id?: string;
  due_date?: string; 
  clients: {
    name: string;
    email?: string;
    phone?: string;
  };
  profiles?: {
    company_name: string;
    payment_settings?: any; 
  } | { company_name: string; payment_settings?: any }[]; 
}

interface Props {
  documents: Quote[];
  count: number;
  page: number;
  limit: number;
}

export default function QuotesClientPage({ documents, count, page, limit }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const toast = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // State: Track which invoice is being deleted or reminded
  const [quoteToDelete, setQuoteToDelete] = useState<{ id: string, name: string } | null>(null);
  const [reminderQuote, setReminderQuote] = useState<Quote | null>(null);

  // --- FILTER LOGIC ---
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = (term: string) => {
    router.push(`${pathname}?${createQueryString('q', term)}`);
  };

  const handleFilterStatus = (status: string) => {
    router.push(`${pathname}?${createQueryString('status', status)}`);
  };

  // --- HELPERS ---
  const getBusinessName = (doc: Quote) => {
    if (!doc.profiles) return "My Business";
    const profile = Array.isArray(doc.profiles) ? doc.profiles[0] : doc.profiles;
    return profile?.company_name || "My Business";
  };

  const getActivePaymentLink = (doc: Quote) => {
    if (doc.payment_link) return doc.payment_link;
    const profile = Array.isArray(doc.profiles) ? doc.profiles[0] : doc.profiles;
    if (profile?.payment_settings) {
       const settings = profile.payment_settings as unknown as PaymentSettings;
       if (settings.default_provider && Array.isArray(settings.providers)) {
          const provider = settings.providers.find(p => p.id === settings.default_provider);
          return provider?.url;
       }
    }
    return undefined;
  };

  // --- ACTIONS ---
  const handleDownload = async (quoteId: string) => {
    setDownloadingId(quoteId);
    try {
      const result = await getQuoteForPdf(quoteId);
      if (result.error || !result.quote || !result.profile) throw new Error(result.error || 'Data missing');

      const { quote, profile } = result;

      let activePaymentLink = quote.payment_link;
      if (!activePaymentLink && profile.payment_settings) {
         const settings = profile.payment_settings as unknown as PaymentSettings;
         if (settings.default_provider) {
            const provider = settings.providers.find(p => p.id === settings.default_provider);
            if (provider?.url) activePaymentLink = provider.url;
         }
      }

      const blob = await generatePdf({
        documentType: 'Invoice',
        brandColor: quote.brand_color || '#319795', 
        invoiceNumber: quote.invoice_number,
        invoiceDate: quote.invoice_date || quote.created_at,
        dueDate: quote.due_date,
        logo: profile.logo_url,
        signature: (profile as any).signature_url, 
        currency: quote.currency || 'USD',
        paymentLink: activePaymentLink, 
        from: { 
            name: profile.company_name, 
            email: profile.email, 
            address: profile.company_address,
            phone: (profile as any).company_phone
        },
        to: { 
            name: quote.clients?.name, 
            email: quote.clients?.email, 
            address: (quote.clients as any)?.address,
            phone: (quote.clients as any)?.phone
        },
        lineItems: Array.isArray(quote.line_items) ? (quote.line_items as any[]) : [],
        notes: quote.notes,
        vatRate: quote.vat_rate,
        subtotal: 0, 
        vatAmount: 0, 
        total: quote.total,
        payment: { 
            bankName: profile.bank_name, 
            accountHolder: profile.account_holder, 
            accNumber: profile.account_number, 
            branchCode: profile.branch_code 
        }
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${quote.invoice_number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ status: 'success', title: 'Downloaded' });
    } catch (error: any) {
      console.error(error);
      toast({ status: 'error', title: 'Download Failed', description: error.message });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const result = await updateDocumentStatusAction(id, newStatus);
    if (result.success) {
      toast({ title: 'Status Updated', status: 'success' });
      router.refresh();
    } else {
      toast({ title: 'Error', description: result.error, status: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'green';
      case 'sent': return 'blue';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  // Dark Mode Colors
  const bg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>Invoices</Text>
            <Text color="gray.500">Track payments and manage client billing.</Text>
        </Box>
        <Button leftIcon={<Plus size={20} />} colorScheme="brand" onClick={() => router.push('/dashboard/invoices/new')}>Create Invoice</Button>
      </Flex>

      {/* FILTER TOOLBAR */}
      <Box mb={6} bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} shadow="sm">
        <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
            <InputGroup maxW={{ base: 'full', md: '300px' }}>
                <InputLeftElement pointerEvents="none"><Search size={18} color="gray" /></InputLeftElement>
                <Input 
                    placeholder="Search by Invoice #..." 
                    defaultValue={searchParams.get('q')?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </InputGroup>
            
            <Select 
                maxW={{ base: 'full', md: '200px' }} 
                placeholder="All Statuses" 
                defaultValue={searchParams.get('status')?.toString()}
                onChange={(e) => handleFilterStatus(e.target.value)}
            >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
            </Select>
        </Flex>
      </Box>

      {/* INVOICE TABLE */}
      <Box bg={bg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflowX="auto" shadow="sm">
        <Table variant="simple">
          <Thead bg={tableHeaderBg}>
            <Tr>
                <Th color="gray.500">Number</Th>
                <Th color="gray.500">Client</Th>
                <Th color="gray.500">Status</Th>
                <Th color="gray.500">Date</Th>
                <Th isNumeric color="gray.500">Amount</Th>
                <Th isNumeric color="gray.500">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {documents && documents.length > 0 ? (
              documents.map((doc) => {
                const isVerified = !!doc.invoice_hash;
                const canRemind = ['sent', 'overdue'].includes(doc.status?.toLowerCase());

                return (
                    <Tr 
                    key={doc.id} 
                    _hover={{ bg: hoverBg, cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/invoices/${doc.id}`)}
                    transition="background-color 0.2s"
                    >
                    <Td fontWeight="bold" fontSize="sm" color={textColor}>
                        <Flex align="center" gap={2}>
                            #{doc.invoice_number}
                            {isVerified && (
                                <Tooltip label="Verified on Blockchain">
                                    <Icon as={ShieldCheck} size={14} color="green.500" />
                                </Tooltip>
                            )}
                        </Flex>
                    </Td>
                    
                    <Td 
                        color="brand.500" 
                        fontWeight="bold"
                        cursor="pointer"
                        onClick={(e) => {
                          e.stopPropagation(); 
                          if (doc.client_id) {
                              router.push(`/dashboard/clients/${doc.client_id}`);
                          }
                        }}
                        _hover={{ textDecoration: 'underline' }}
                    >
                        {doc.clients?.name}
                    </Td>

                    <Td><Badge colorScheme={getStatusColor(doc.status)}>{doc.status}</Badge></Td>
                    <Td fontSize="sm" color="gray.500">{new Date(doc.created_at).toLocaleDateString('en-GB')}</Td>
                    <Td isNumeric fontWeight="bold" fontFamily="mono" color={textColor}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: doc.currency || 'USD' }).format(doc.total || 0)}</Td>
                    <Td isNumeric onClick={(e) => e.stopPropagation()}>
                        <Flex justify="flex-end" gap={2}>
                            <ShareInvoice 
                              quoteId={doc.id} 
                              invoiceNumber={doc.invoice_number} 
                              clientName={doc.clients?.name} 
                              clientEmail={doc.clients?.email} 
                              isIconOnly={true} 
                              businessName={getBusinessName(doc)}
                              type="invoice"
                              paymentLink={getActivePaymentLink(doc)}
                              currency={doc.currency} // ✅ ADDED: Ensures ShareInvoice receives the correct currency prop
                            />
                            
                            <Menu isLazy>
                                <MenuButton as={IconButton} icon={<MoreVertical size={16} />} variant="ghost" size="sm" isLoading={downloadingId === doc.id} />
                                <MenuList>
                                    <MenuItem icon={<FileText size={16} />} onClick={() => router.push(`/dashboard/invoices/${doc.id}`)}>Edit / View</MenuItem>
                                    
                                    {/* 🟢 REMINDER BUTTON (Fixed: Sets state instead of unmounting) */}
                                    {canRemind && (
                                       <MenuItem icon={<Bell size={16} />} onClick={() => setReminderQuote(doc)}>
                                         Send Reminder
                                       </MenuItem>
                                    )}

                                    <MenuItem icon={<Download size={16} />} onClick={() => handleDownload(doc.id)}>Download PDF</MenuItem>
                                    <MenuItem icon={<CheckCircle size={16} />} onClick={() => handleStatusUpdate(doc.id, 'Paid')}>Mark as Paid</MenuItem>
                                    <MenuItem icon={<Send size={16} />} onClick={() => handleStatusUpdate(doc.id, 'Sent')}>Mark as Sent</MenuItem>
                                    
                                    <MenuItem 
                                        icon={<Trash2 size={16} />} 
                                        color="red.500" 
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            setQuoteToDelete({ id: doc.id, name: doc.clients?.name || 'this invoice' });
                                        }}
                                    >
                                        Delete
                                    </MenuItem>
                                </MenuList>
                            </Menu>
                        </Flex>
                    </Td>
                    </Tr>
                );
              })
            ) : (
                <Tr>
                    <Td colSpan={6} h="300px" textAlign="center">
                        <VStack spacing={4} justify="center" h="full">
                            <Box p={4} bg="gray.50" rounded="full">
                                <Icon as={FileQuestion} boxSize={8} color="gray.400" />
                            </Box>
                            <Text fontSize="lg" fontWeight="medium" color="gray.600">No invoices found</Text>
                            <Text color="gray.400" fontSize="sm">Create your first invoice to get started.</Text>
                            <Button size="sm" colorScheme="brand" onClick={() => router.push('/dashboard/invoices/new')}>Create Invoice</Button>
                        </VStack>
                    </Td>
                </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* DELETE DIALOG */}
      <DeleteQuoteDialog 
        isOpen={!!quoteToDelete} 
        onClose={() => setQuoteToDelete(null)} 
        quoteId={quoteToDelete?.id || null} 
        clientName={quoteToDelete?.name || ''} 
      />

      {/* 🟢 REMINDER MODAL (Now sits outside the table/menu) */}
      {reminderQuote && (
        <InvoiceReminder
          isOpen={!!reminderQuote}
          onClose={() => setReminderQuote(null)}
          quoteId={reminderQuote.id}
          invoiceNumber={reminderQuote.invoice_number}
          clientName={reminderQuote.clients?.name}
          amount={new Intl.NumberFormat('en-US', { style: 'currency', currency: reminderQuote.currency || 'USD' }).format(reminderQuote.total || 0)}
          dueDate={reminderQuote.due_date || new Date().toISOString()}
          clientEmail={reminderQuote.clients?.email}
          paymentLink={getActivePaymentLink(reminderQuote)}
        />
      )}

    </Container>
  );
}