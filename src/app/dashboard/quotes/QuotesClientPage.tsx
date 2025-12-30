'use client';

import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Badge, IconButton, Menu, MenuButton, MenuList, MenuItem, Button, Flex, Text, useToast, Container, Input, InputGroup, InputLeftElement, Select, useColorModeValue, VStack, Icon, HStack
} from '@chakra-ui/react';
import { MoreVertical, Search, FileText, Download, Trash2, CheckCircle, Send, ExternalLink, FileQuestion, DollarSign } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition, useCallback } from 'react';
import { deleteQuoteAction, updateDocumentStatusAction, getQuoteForPdf } from './actions';
import { generatePdf } from '@/utils/pdfGenerator';
import ShareInvoice from '@/components/ShareInvoice';
import { PaymentSettings } from '@/types/profile';

interface Quote {
  id: string;
  invoice_number: string;
  created_at: string;
  total: number;
  status: string;
  document_type: string;
  currency: string;
  payment_link?: string;
  client_id?: string;
  clients: {
    name: string;
    email?: string;
    phone?: string;
  };
  // Updated to include payment_settings for link extraction
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
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const handleFilterType = (type: string) => {
    router.push(`${pathname}?${createQueryString('type', type)}`);
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

  // 🟢 NEW: Logic to extract the specific Payment Provider URL (e.g. PayPal)
  const getActivePaymentLink = (doc: Quote) => {
    // 1. Quote specific override
    if (doc.payment_link) return doc.payment_link;

    // 2. Profile default provider
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

      // Determine Payment Link
      let activePaymentLink = quote.payment_link;
      if (!activePaymentLink && profile.payment_settings) {
         const settings = profile.payment_settings as unknown as PaymentSettings;
         if (settings.default_provider) {
            const provider = settings.providers.find(p => p.id === settings.default_provider);
            if (provider?.url) activePaymentLink = provider.url;
         }
      }

      // Generate PDF
      const blob = await generatePdf({
        documentType: (quote.document_type as 'Invoice' | 'Quote') || 'Quote',
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
      link.download = `${quote.document_type}_${quote.invoice_number}.pdf`;
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
    startTransition(async () => {
      const result = await updateDocumentStatusAction(id, newStatus);
      if (result.success) {
        toast({ title: 'Status Updated', status: 'success' });
        router.refresh();
      } else {
        toast({ title: 'Error', description: result.error, status: 'error' });
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteQuoteAction(id);
      if(result.success) { 
          toast({ title: 'Document Deleted', status: 'success', duration: 3000 }); 
          router.refresh(); 
      } else {
          toast({ title: 'Could not delete', description: result.message, status: 'error' });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'green';
      case 'sent': return 'blue';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  const bg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
            <Text fontSize="2xl" fontWeight="bold">Documents</Text>
            <Text color="gray.500">Track payments and manage client agreements.</Text>
        </Box>
        <Button leftIcon={<Icon as={FileText} />} colorScheme="teal" onClick={() => router.push('/quote/new')}>Create Document</Button>
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
                placeholder="All Types" 
                defaultValue={searchParams.get('type')?.toString()}
                onChange={(e) => handleFilterType(e.target.value)}
            >
                <option value="Invoice">Invoices</option>
                <option value="Quote">Quotes</option>
            </Select>

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

      {/* DOCUMENT TABLE */}
      <Box bg={bg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflowX="auto" shadow="sm">
        <Table variant="simple">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr>
                <Th w="50px">Type</Th>
                <Th>Number</Th>
                <Th>Client</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th isNumeric>Amount</Th>
                <Th isNumeric>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {documents && documents.length > 0 ? (
              documents.map((doc) => {
                const isInvoice = doc.document_type?.toLowerCase() === 'invoice';
                const isPaid = doc.status?.toLowerCase() === 'paid';
                const docType = isInvoice ? 'invoice' : 'quote';

                let IconComp = FileText;
                let colorScheme = 'purple';

                if (isInvoice) {
                    if (isPaid) {
                        IconComp = DollarSign;
                        colorScheme = 'green';
                    } else {
                        IconComp = FileText;
                        colorScheme = 'blue';
                    }
                } else {
                    IconComp = FileText;
                    colorScheme = 'purple';
                }

                return (
                    <Tr 
                    key={doc.id} 
                    _hover={{ bg: hoverBg, cursor: 'pointer' }}
                    onClick={() => router.push(`/quote/${doc.id}`)}
                    transition="background-color 0.2s"
                    >
                    <Td>
                        <Box p={2} bg={`${colorScheme}.50`} borderRadius="md" color={`${colorScheme}.500`} w="fit-content">
                            <Icon as={IconComp} boxSize={4} />
                        </Box>
                    </Td>
                    <Td fontWeight="bold" fontSize="sm">
                        #{doc.invoice_number}
                    </Td>
                    
                    <Td 
                        color="blue.400" 
                        fontWeight="bold"
                        cursor="pointer"
                        onClick={(e) => {
                          e.stopPropagation(); 
                          if (doc.client_id) {
                              router.push(`/dashboard/clients/${doc.client_id}`);
                          }
                        }}
                        _hover={{ textDecoration: 'underline', color: 'blue.300' }}
                    >
                        <Flex align="center" gap={2}>
                          {doc.clients?.name}
                          <ExternalLink size={14} />
                        </Flex>
                    </Td>

                    <Td><Badge colorScheme={getStatusColor(doc.status)}>{doc.status}</Badge></Td>
                    <Td fontSize="sm" color="gray.600">{new Date(doc.created_at).toLocaleDateString('en-GB')}</Td>
                    <Td isNumeric fontWeight="bold" fontFamily="mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: doc.currency || 'USD' }).format(doc.total || 0)}</Td>
                    <Td isNumeric onClick={(e) => e.stopPropagation()}>
                        <Flex justify="flex-end" gap={2}>
                            <ShareInvoice 
                              quoteId={doc.id} 
                              invoiceNumber={doc.invoice_number} 
                              clientName={doc.clients?.name} 
                              clientEmail={doc.clients?.email} 
                              isIconOnly={true} 
                              businessName={getBusinessName(doc)}
                              type={docType}
                              paymentLink={getActivePaymentLink(doc)} // 🟢 PASSING DIRECT LINK
                            />
                            
                            <Menu>
                                <MenuButton as={IconButton} icon={<MoreVertical size={16} />} variant="ghost" size="sm" isLoading={downloadingId === doc.id} />
                                <MenuList>
                                    <MenuItem icon={<FileText size={16} />} onClick={() => router.push(`/quote/${doc.id}`)}>Edit / View</MenuItem>
                                    <MenuItem icon={<Download size={16} />} onClick={() => handleDownload(doc.id)}>Download PDF</MenuItem>
                                    <MenuItem icon={<CheckCircle size={16} />} onClick={() => handleStatusUpdate(doc.id, 'Paid')}>Mark as Paid</MenuItem>
                                    <MenuItem icon={<Send size={16} />} onClick={() => handleStatusUpdate(doc.id, 'Sent')}>Mark as Sent</MenuItem>
                                    <MenuItem icon={<Trash2 size={16} />} color="red.500" onClick={() => handleDelete(doc.id)}>Delete</MenuItem>
                                </MenuList>
                            </Menu>
                        </Flex>
                    </Td>
                    </Tr>
                );
              })
            ) : (
                <Tr>
                    <Td colSpan={7} h="300px" textAlign="center">
                        <VStack spacing={4} justify="center" h="full">
                            <Box p={4} bg="gray.50" rounded="full">
                                <Icon as={FileQuestion} boxSize={8} color="gray.400" />
                            </Box>
                            <Text fontSize="lg" fontWeight="medium" color="gray.600">No documents found</Text>
                            <Text color="gray.400" fontSize="sm">Try adjusting your filters or create a new one.</Text>
                            <Button size="sm" colorScheme="teal" onClick={() => router.push('/quote/new')}>Create Document</Button>
                        </VStack>
                    </Td>
                </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}