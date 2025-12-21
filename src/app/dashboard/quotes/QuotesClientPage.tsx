'use client';

import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Badge, IconButton, Menu, MenuButton, MenuList, MenuItem, Button, Flex, Text, useToast, Container, Input, InputGroup, InputLeftElement, Select, useColorModeValue,
} from '@chakra-ui/react';
import { MoreVertical, Search, FileText, Download, Trash2, CheckCircle, Send, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
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
  };
}

interface Props {
  documents: Quote[];
  count: number;
  page: number;
  limit: number;
}

export default function QuotesClientPage({ documents, count, page, limit }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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
        documentType: quote.document_type || 'Quote',
        brandColor: quote.brand_color || '#319795', 
        invoiceNumber: quote.invoice_number,
        invoiceDate: quote.invoice_date || quote.created_at,
        dueDate: quote.due_date,
        logo: profile.logo_url,
        // 🟢 ADDED SIGNATURE MAPPING HERE
        signature: (profile as any).signature_url, 
        currency: quote.currency || 'USD',
        paymentLink: activePaymentLink, 
        from: { name: profile.company_name, email: profile.email, address: profile.company_address },
        to: { name: quote.clients?.name, email: quote.clients?.email, address: quote.clients?.address },
        lineItems: Array.isArray(quote.line_items) ? quote.line_items : [],
        notes: quote.notes,
        vatRate: quote.vat_rate,
        subtotal: 0, vatAmount: 0, total: quote.total,
        payment: { bankName: profile.bank_name, accountHolder: profile.account_holder, accNumber: profile.account_number, branchCode: profile.branch_code }
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quote.document_type}_${quote.invoice_number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ status: 'success', title: 'Downloaded' });
    } catch (error: any) {
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
    if(!confirm('Are you sure you want to delete this document?')) return;
    startTransition(async () => {
      const result = await deleteQuoteAction(id);
      if(result.success) { toast({ title: 'Deleted', status: 'success' }); router.refresh(); }
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

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
            <Text fontSize="2xl" fontWeight="bold">Documents</Text>
            <Text color="gray.500">Manage your quotes, invoices, and revenue.</Text>
        </Box>
        <Button colorScheme="teal" onClick={() => router.push('/quote/new')}>+ Create Document</Button>
      </Flex>

      <Box bg={bg} borderRadius="lg" borderWidth="1px" overflowX="auto">
        <Table variant="simple">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr><Th>Status</Th><Th>Number</Th><Th>Client</Th><Th>Date</Th><Th isNumeric>Amount</Th><Th isNumeric>Actions</Th></Tr>
          </Thead>
          <Tbody>
            {documents.map((doc) => (
              <Tr 
                key={doc.id} 
                _hover={{ bg: hoverBg, cursor: 'pointer' }}
                onClick={() => router.push(`/quote/${doc.id}`)}
              >
                <Td><Badge colorScheme={getStatusColor(doc.status)}>{doc.status}</Badge></Td>
                <Td fontWeight="medium">{doc.invoice_number}</Td>
                
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

                <Td>{new Date(doc.created_at).toLocaleDateString()}</Td>
                <Td isNumeric fontWeight="bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: doc.currency || 'USD' }).format(doc.total || 0)}</Td>
                <Td isNumeric onClick={(e) => e.stopPropagation()}>
                    <Flex justify="flex-end" gap={2}>
                        <ShareInvoice quoteId={doc.id} invoiceNumber={doc.invoice_number} clientName={doc.clients?.name} clientEmail={doc.clients?.email} isIconOnly={true} />
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
            ))}
          </Tbody>
        </Table>
      </Box>
    </Container>
  );
}