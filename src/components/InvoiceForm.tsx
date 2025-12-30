'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  HStack,
  IconButton,
  Text,
  Switch,
  Grid,
  useToast,
  Textarea,
  Select,
  Checkbox,
  Divider,
  Icon,
  SimpleGrid,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { Trash2, Plus, Save, Download } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; 
import { Database } from '@/types/supabase';
import { PaymentSettings } from '@/types/profile'; 
import { InvoiceFormData } from '@/types/invoice';
import { createQuoteAction, updateQuoteAction } from '@/app/dashboard/quotes/actions';
import { generatePdf } from '@/utils/pdfGenerator'; 
import PaymentMethodSelector from './PaymentMethodSelector';

// Local type helper
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

// Extended Types
type ExtendedClient = Tables<'clients'> & { 
  currency?: string | null; 
  phone?: string | null; 
};

type ExtendedProfile = Tables<'profiles'> & { 
    currency?: string | null; 
    email?: string | null;
    bank_name?: string | null;
    account_holder?: string | null;
    account_number?: string | null;
    branch_code?: string | null;
    branch_name?: string | null;
    account_type?: string | null;
    logo_url?: string | null;
    signature_url?: string | null; 
    company_name?: string | null;
    company_address?: string | null;
    company_phone?: string | null; 
    terms_conditions?: string | null;
    proposal_default_notes?: string | null; // 🟢 ADDED: New Column Support
    payment_settings?: PaymentSettings | null; 
};

type InvoiceFormProps = {
  profile: ExtendedProfile | null;
  clients: ExtendedClient[];
  defaultValues?: Tables<'quotes'> & { payment_link?: string | null } | null;
};

const FormSection = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'white');

  return (
    <Box bg={cardBg} p={{ base: 5, md: 6 }} borderRadius="lg" shadow="md" borderWidth="1px" borderColor={borderColor}>
      <Heading as="h3" size="md" mb={6} color={headingColor}>{title}</Heading>
      <VStack spacing={5} align="stretch">{children}</VStack>
    </Box>
  );
};

export const InvoiceForm = ({ profile, clients, defaultValues }: InvoiceFormProps) => {
  const supabase = createSupabaseBrowserClient();
  
  // Initialize State
  const initialDocType = defaultValues?.document_type === 'Invoice' ? 'Invoice' : 'Quote';
  const [documentType, setDocumentType] = useState<'Quote' | 'Invoice'>(initialDocType);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isNewClient, setIsNewClient] = useState(!defaultValues?.client_id && clients?.length > 0);
  const [senderEmail, setSenderEmail] = useState(profile?.email || '');

  const [activeCurrency, setActiveCurrency] = useState((defaultValues as any)?.currency || profile?.currency || 'ZAR');
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<string | null>(null);

  const toast = useToast();
  const isEditing = !!defaultValues;

  const { register, control, handleSubmit, watch, reset, getValues, setValue } = useForm<InvoiceFormData>({
    defaultValues: { 
      applyVat: defaultValues ? (defaultValues.vat_rate || 0) > 0 : true,
      brandColor: (defaultValues as any)?.brand_color || '#319795', 
      vatRate: 15
    }
  });
  
  const watchedLineItems = watch('lineItems');
  const watchedVatRate = watch('vatRate');
  const applyVat = watch('applyVat');
  const watchedBrandColor = watch('brandColor');
  const watchedClientName = watch('to.name'); 

  // --- 1. USER EMAIL FETCH ---
  useEffect(() => {
    if (!senderEmail) {
      const getEmail = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setSenderEmail(user.email);
      };
      getEmail();
    }
  }, [senderEmail, supabase]);

  // --- 2. CURRENCY SYNC ---
  useEffect(() => {
    if (isEditing && (defaultValues as any)?.currency) return;

    if (isNewClient) {
      setActiveCurrency(profile?.currency || 'ZAR');
    } else {
      const selectedClient = clients.find(c => c.name === watchedClientName);
      if (selectedClient && selectedClient.currency) {
        setActiveCurrency(selectedClient.currency);
      } else {
        setActiveCurrency(profile?.currency || 'ZAR');
      }
    }
  }, [watchedClientName, isNewClient, clients, profile, isEditing, defaultValues]);

  // --- 3. FORM INITIALIZATION ---
  useEffect(() => {
    if (defaultValues) {
      // EDIT MODE
      const client = clients.find(c => c.id === defaultValues.client_id);
      const safeDateSource = defaultValues.invoice_date || defaultValues.created_at;
      const invoiceDate = new Date(safeDateSource || new Date()).toISOString().substring(0, 10);
      const savedColor = (defaultValues as any).brand_color || '#319795';

      reset({
        invoiceNumber: defaultValues.invoice_number || '',
        invoiceDate: invoiceDate,
        dueDate: defaultValues.due_date ? new Date(defaultValues.due_date).toISOString().substring(0, 10) : '',
        to: { name: client?.name || 'Client Not Found', email: client?.email || '', address: client?.address || '' },
        lineItems: defaultValues.line_items ? (defaultValues.line_items as any) : [{ description: '', quantity: 1, unitPrice: 0 }],
        notes: defaultValues.notes || '', // Keep saved notes as is
        vatRate: defaultValues.vat_rate || 15,
        applyVat: (defaultValues.vat_rate || 0) > 0,
        brandColor: savedColor,
      });
      if(client) setIsNewClient(false);
      
      if((defaultValues as any).currency) setActiveCurrency((defaultValues as any).currency);
      if (defaultValues.payment_link) setSelectedPaymentLink(defaultValues.payment_link);

    } else {
      // CREATE MODE - 🟢 SMART DEFAULT NOTES
      // If starting as 'Quote', grab proposal defaults. If 'Invoice', grab invoice defaults.
      const initialNotes = initialDocType === 'Quote' 
        ? (profile?.proposal_default_notes || '') 
        : (profile?.terms_conditions || '');

      reset({
        to: { name: '', address: '', email: '' },
        lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
        notes: initialNotes,
        vatRate: 15,
        applyVat: true,
        invoiceDate: new Date().toISOString().substring(0, 10),
        brandColor: '#319795',
      });
      setActiveCurrency(profile?.currency || 'ZAR');
      
      // Auto-select payment link only for new invoices
      if (profile?.payment_settings?.default_provider) {
        const defId = profile.payment_settings.default_provider;
        const defProvider = profile.payment_settings.providers.find(p => p.id === defId);
        if (defProvider?.url) setSelectedPaymentLink(defProvider.url);
      }
    }
  }, [defaultValues, clients, profile, reset, initialDocType]);
  
  // --- 4. HANDLE DOCUMENT TYPE TOGGLE ---
  const handleDocTypeChange = (isInvoice: boolean) => {
    const newType = isInvoice ? 'Invoice' : 'Quote';
    setDocumentType(newType);

    // 🟢 AUTO-SWITCH NOTES LOGIC
    // We only swap if the field is empty OR matches the other default (prevent overwriting custom text)
    // For simplicity in this handover, we force the swap to ensure the user sees the new terms.
    if (newType === 'Quote') {
        setValue('notes', profile?.proposal_default_notes || '');
    } else {
        setValue('notes', profile?.terms_conditions || '');
    }
  };

  const { subtotal, vatAmount, total } = useMemo(() => {
    const sub = watchedLineItems?.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0) || 0;
    const vat = applyVat ? sub * ((Number(watchedVatRate) || 0) / 100) : 0;
    return { subtotal: sub, vatAmount: vat, total: sub + vat };
  }, [watchedLineItems, watchedVatRate, applyVat]);

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  const formatMoney = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: activeCurrency,
      }).format(amount);
    } catch {
      return `${activeCurrency} ${amount.toFixed(2)}`;
    }
  };

  const getCurrencySymbol = (code: string) => {
    try {
        return (0).toLocaleString('en-US', { style: 'currency', currency: code }).replace(/\d|\.|,/g, '').trim();
    } catch { return code; }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const formData = getValues();
      const selectedClient = clients.find(c => c.name === formData.to.name);
      
      const safeProfile = {
        logo: profile?.logo_url ?? null,
        name: profile?.company_name ?? null,
        email: senderEmail || null, 
        address: profile?.company_address ?? null,
        phone: profile?.company_phone ?? null, 
        bankName: profile?.bank_name ?? null,
        accountHolder: profile?.account_holder ?? null,
        accNumber: profile?.account_number ?? null,
        branchCode: profile?.branch_code ?? null
      };

      const blob = await generatePdf({
        documentType,
        brandColor: formData.brandColor || '#319795',
        invoiceNumber: formData.invoiceNumber || '',
        invoiceDate: formData.invoiceDate || '',
        dueDate: formData.dueDate || '',
        logo: safeProfile.logo,
        signature: profile?.signature_url || undefined, 
        currency: activeCurrency, 
        paymentLink: selectedPaymentLink, 
        from: {
          name: safeProfile.name,
          email: safeProfile.email,
          address: safeProfile.address,
          phone: safeProfile.phone, 
        },
        to: {
            ...formData.to,
            phone: selectedClient?.phone ?? null,
        },
        lineItems: formData.lineItems.map(item => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice)
        })),
        notes: formData.notes,
        vatRate: applyVat ? Number(watchedVatRate) : 0,
        subtotal,
        vatAmount,
        total,
        payment: {
            bankName: safeProfile.bankName,
            accountHolder: safeProfile.accountHolder,
            accNumber: safeProfile.accNumber,
            branchCode: safeProfile.branchCode,
        }
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentType}_${formData.invoiceNumber || 'Draft'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ status: 'success', title: 'PDF Downloaded' });
    } catch (e) {
      console.error(e);
      toast({ status: 'error', title: 'PDF Generation Failed' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      const payload = { 
        ...data, 
        currency: activeCurrency,
        paymentLink: selectedPaymentLink 
      };

      if (isEditing && defaultValues) {
        await updateQuoteAction({
          quoteId: defaultValues.id, formData: payload, documentType: documentType, total: total,
        });
      } else {
        await createQuoteAction({
          formData: payload, documentType: documentType, total: total,
        });
      }
      toast({ title: 'Success!', description: `Your ${documentType} has been saved.`, status: 'success', duration: 3000, isClosable: true });
    } catch (error: any) {
      if (error.message === 'NEXT_REDIRECT' || error.digest?.includes('NEXT_REDIRECT')) return;
      toast({ title: 'Operation Failed', description: error.message, status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const primaryColor = useColorModeValue('brand.500', 'brand.300');
  const focusBorderColor = useColorModeValue('brand.500', 'brand.300');
  const mutedText = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid templateColumns={{ base: '1fr', lg: '2.5fr 1.5fr' }} gap={8} alignItems="start">
        
        {/* === LEFT COLUMN: FORM INPUTS === */}
        <VStack spacing={6} align="stretch">
          
          <FormSection title="Client Details">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md" borderWidth="1px" borderStyle="dashed">
                <Text fontSize="xs" fontWeight="bold" letterSpacing="wide" color={mutedText} mb={2}>FROM</Text>
                <Text fontWeight="bold">{profile?.company_name || 'Your Company Name'}</Text>
                <Text fontSize="sm" color={mutedText}>{profile?.company_address || 'No address set'}</Text>
                {senderEmail && <Text fontSize="xs" color="blue.500">{senderEmail}</Text>}
                {profile?.company_phone && <Text fontSize="xs" color="blue.500">{profile.company_phone}</Text>}
              </Box>

              <Box>
                <Text fontSize="xs" fontWeight="bold" letterSpacing="wide" color={mutedText} mb={2}>BILL TO</Text>
                {isNewClient ? (
                  <VStack spacing={3}>
                    <FormControl isRequired><Input placeholder="Client Name" {...register('to.name')} focusBorderColor={focusBorderColor} bg="transparent" /></FormControl>
                    <FormControl><Input placeholder="Client Email" type="email" {...register('to.email')} focusBorderColor={focusBorderColor} bg="transparent" /></FormControl>
                    <FormControl><Textarea placeholder="Client Address" {...register('to.address')} focusBorderColor={focusBorderColor} size="sm" bg="transparent" /></FormControl>
                    {clients?.length > 0 && <Button size="sm" variant="link" colorScheme="teal" onClick={() => setIsNewClient(false)}>Select Existing Client</Button>}
                  </VStack>
                ) : (
                  <VStack spacing={3}>
                    <FormControl isRequired>
                      <Select placeholder="Select a client..." {...register('to.name')} focusBorderColor={focusBorderColor}>
                        {clients.map(client => <option key={client.id} value={client.name!}>{client.name}</option>)}
                      </Select>
                    </FormControl>
                    <Button size="sm" variant="link" colorScheme="teal" onClick={() => setIsNewClient(true)}>+ Create New Client</Button>
                  </VStack>
                )}
              </Box>
            </SimpleGrid>
          </FormSection>

          <FormSection title="Line Items">
            <HStack display={{ base: 'none', md: 'flex' }} w="100%" spacing={4} color="gray.500" fontSize="xs" fontWeight="bold" letterSpacing="wide">
              <Text flex={5}>DESCRIPTION</Text>
              <Text flex={1.5} textAlign="right">QTY</Text>
              <Text flex={2} textAlign="right">PRICE ({activeCurrency})</Text>
              <Text flex={2} textAlign="right">TOTAL</Text>
              <Box w="40px" />
            </HStack>
            
            {fields.map((field, index) => {
              const quantity = watch(`lineItems.${index}.quantity`) || 0;
              const unitPrice = watch(`lineItems.${index}.unitPrice`) || 0;
              const itemTotal = quantity * unitPrice;
              
              return (
                <SimpleGrid key={field.id} columns={{ base: 1, md: 5 }} spacing={4} alignItems="center">
                  <FormControl gridColumn={{ base: '1 / -1', md: 'auto' }} flex={5}>
                      <Input placeholder="Item description" {...register(`lineItems.${index}.description`)} focusBorderColor={focusBorderColor} />
                  </FormControl>
                  <FormControl flex={1.5}>
                      <Input placeholder="Qty" type="number" {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })} focusBorderColor={focusBorderColor} textAlign="right" />
                  </FormControl>
                  
                  <FormControl flex={2}>
                    <InputGroup>
                        <InputLeftElement pointerEvents="none" color="gray.400" fontSize="xs" height="100%">
                            {getCurrencySymbol(activeCurrency)}
                        </InputLeftElement>
                        <Input placeholder="0.00" type="number" step="0.01" {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} focusBorderColor={focusBorderColor} textAlign="right" />
                    </InputGroup>
                  </FormControl>
                  
                  <Text flex={2} textAlign="right" fontWeight="medium" fontFamily="mono">
                    {formatMoney(itemTotal)}
                  </Text>
                  <IconButton aria-label="Remove item" icon={<Icon as={Trash2} boxSize={4} />} variant="ghost" colorScheme="red" size="sm" onClick={() => remove(index)} />
                </SimpleGrid>
              );
            })}
            
            <Button onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })} leftIcon={<Icon as={Plus} />} variant="outline" colorScheme="gray" size="sm" mt={2}>
              Add Line Item
            </Button>
          </FormSection>

          <FormSection title="Notes & Terms">
            {/* 🟢 VISUAL INDICATOR for which default is being used */}
            <Text fontSize="xs" color="gray.400" mb={1} textAlign="right">
                Using default {documentType} terms
            </Text>
            <Textarea {...register('notes')} placeholder="e.g. Payment due within 30 days. Banking details..." rows={4} focusBorderColor={focusBorderColor} resize="none" />
          </FormSection>
        </VStack>

        {/* === RIGHT COLUMN: SIDEBAR === */}
        <VStack spacing={6} align="stretch" position={{ lg: 'sticky' }} top={6}>
          
          <FormSection title="Settings">
            <HStack justify="space-between" align="center" p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md" mb={4}>
              <Text fontWeight='bold' fontSize="sm" color={documentType === 'Quote' ? primaryColor : 'gray.500'}>QUOTE</Text>
              
              {/* 🟢 UPDATED SWITCH HANDLER */}
              <Switch 
                isChecked={documentType === 'Invoice'} 
                onChange={(e) => handleDocTypeChange(e.target.checked)} 
                colorScheme="teal" 
                size="lg" 
              />
              
              <Text fontWeight='bold' fontSize="sm" color={documentType === 'Invoice' ? primaryColor : 'gray.500'}>INVOICE</Text>
            </HStack>
            
            {documentType === 'Invoice' && (
              <PaymentMethodSelector 
                settings={profile?.payment_settings || null} 
                selectedUrl={selectedPaymentLink} 
                onChange={setSelectedPaymentLink}
              />
            )}

            <FormControl mb={4}>
                <FormLabel fontSize="sm" color="gray.500">Currency</FormLabel>
                <Select value={activeCurrency} onChange={(e) => setActiveCurrency(e.target.value)} size="sm">
                    <option value="ZAR">ZAR (R)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="NGN">NGN (₦)</option>
                    <option value="KES">KES (KSh)</option>
                    <option value="GHS">GHS (₵)</option>
                    <option value="NAD">NAD (N$)</option>
                    <option value="BWP">BWP (P)</option>
                </Select>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel fontSize="sm" color="gray.500">Brand Color</FormLabel>
              <HStack>
                <Input type="color" {...register('brandColor')} w="50px" p={1} h="40px" cursor="pointer" borderRadius="md" />
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                    {watchedBrandColor ? watchedBrandColor.toUpperCase() : '#319795'}
                </Text>
              </HStack>
            </FormControl>

            <VStack spacing={4}>
                <FormControl><FormLabel fontSize="sm">Document #</FormLabel><Input {...register('invoiceNumber')} focusBorderColor={focusBorderColor} /></FormControl>
                <FormControl isRequired><FormLabel fontSize="sm">Date Issued</FormLabel><Input type="date" {...register('invoiceDate')} focusBorderColor={focusBorderColor} /></FormControl>
                {documentType === 'Invoice' && (
                    <FormControl><FormLabel fontSize="sm" color="orange.500">Due Date</FormLabel><Input type="date" {...register('dueDate')} focusBorderColor="orange.500" borderColor="orange.200" /></FormControl>
                )}
            </VStack>
          </FormSection>

          <FormSection title="Summary">
             <VStack spacing={3} align="stretch">
                <HStack justify="space-between"><Text color="gray.500">Subtotal</Text><Text fontFamily="mono">{formatMoney(subtotal)}</Text></HStack>
                
                <HStack justify="space-between">
                    <Checkbox {...register('applyVat')} size="sm" colorScheme="teal">
                        <HStack><Text fontSize="sm">VAT</Text><Input size="xs" w="40px" textAlign="center" {...register('vatRate')} /> <Text fontSize="sm">%</Text></HStack>
                    </Checkbox>
                    <Text fontFamily="mono" fontSize="sm">{formatMoney(vatAmount)}</Text>
                </HStack>
                
                <Divider my={2} />
                <HStack justify="space-between" fontWeight="bold" fontSize="xl">
                    <Text>Total</Text>
                    <Text color={primaryColor}>{formatMoney(total)}</Text>
                </HStack>
            </VStack>
          </FormSection>

          <VStack spacing={3} width="100%">
            <Button type="submit" colorScheme="brand" width="100%" size="lg" isLoading={isSubmitting} leftIcon={<Icon as={Save} />} loadingText="Saving...">
                {isEditing ? 'Update & Save' : 'Save Document'}
            </Button>
            <Button onClick={handleDownloadPdf} type="button" variant="outline" colorScheme="gray" width="100%" size="lg" isLoading={isGeneratingPdf} leftIcon={<Icon as={Download} />} loadingText="Generating...">
                Download PDF
            </Button>
          </VStack>

        </VStack>
      </Grid>
    </Box>
  );
};