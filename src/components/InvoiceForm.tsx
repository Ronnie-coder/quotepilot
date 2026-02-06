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
  Flex,
  Badge,
  Card,
  CardBody,
  StackDivider,
  ButtonGroup,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { 
  Trash2, Plus, Save, Download, 
  ArrowRight, ArrowLeft, CheckCircle2, 
  User, List, Settings, FileCheck, Send, Wallet
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; 
import { Database } from '@/types/supabase';
import { PaymentSettings } from '@/types/profile'; 
import { InvoiceFormData } from '@/types/invoice';
import { createQuoteAction, updateQuoteAction } from '@/app/dashboard/invoices/actions';
import { generatePdf } from '@/utils/pdfGenerator'; 
import PaymentMethodSelector from './PaymentMethodSelector';

// --- TYPES ---
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

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
    payment_settings?: PaymentSettings | null; 
    wallet_address?: string | null;
};

type InvoiceFormProps = {
  profile: ExtendedProfile | null;
  clients: ExtendedClient[];
  defaultValues?: Tables<'quotes'> & { payment_link?: string | null } | null;
};

// --- WIZARD COMPONENTS ---

const WizardProgress = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { icon: User, label: 'Client' },
    { icon: List, label: 'Items' }, // 🟢 COPY UPDATE: Work -> Items
    { icon: Settings, label: 'Payment' },
    { icon: FileCheck, label: 'Review' }
  ];

  const barBg = useColorModeValue('gray.200', 'gray.700');
  const bgActive = useColorModeValue('brand.500', 'brand.400');
  const bgInactive = useColorModeValue('white', 'gray.800');
  const bgCompleted = useColorModeValue('brand.50', 'brand.900');

  return (
    <Box mb={8}>
      <Flex justify="space-between" align="center" position="relative">
        <Box position="absolute" top="16px" left="0" right="0" h="2px" bg={barBg} zIndex={0} />
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const color = isCompleted || isCurrent ? 'brand.500' : 'gray.400';
          const bg = isCurrent ? bgActive : (isCompleted ? bgCompleted : bgInactive);
          const iconColor = isCurrent ? 'white' : (isCompleted ? 'brand.500' : 'gray.400');
          const borderColor = isCompleted || isCurrent ? 'brand.500' : 'gray.300';

          return (
            <VStack key={index} zIndex={1} spacing={2} bg="transparent">
              <Flex 
                align="center" justify="center" 
                w={8} h={8} rounded="full" 
                bg={bg} border="2px solid" borderColor={borderColor}
                transition="all 0.3s"
              >
                {isCompleted ? <Icon as={CheckCircle2} size={16} color="brand.500" /> : <Icon as={step.icon} size={14} color={iconColor} />}
              </Flex>
              <Text fontSize="xs" fontWeight="bold" color={isCurrent ? 'brand.500' : 'gray.500'}>{step.label}</Text>
            </VStack>
          );
        })}
      </Flex>
    </Box>
  );
};

const InvoiceForm = ({ profile, clients, defaultValues }: InvoiceFormProps) => {
  const supabase = createSupabaseBrowserClient();
  const toast = useToast();
  
  // --- STATE ---
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isNewClient, setIsNewClient] = useState(!defaultValues?.client_id && clients?.length > 0);
  const [senderEmail, setSenderEmail] = useState(profile?.email || '');
  const [activeCurrency, setActiveCurrency] = useState((defaultValues as any)?.currency || profile?.currency || 'ZAR');
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<string | null>(null);

  const isEditing = !!defaultValues;
  const documentType = 'Invoice';

  // --- DARK MODE COLORS ---
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorder = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const focusColor = useColorModeValue('brand.500', 'brand.300');
  const infoBoxBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const infoBoxBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const reviewBoxBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  // --- FORM ---
  const { register, control, handleSubmit, watch, reset, getValues, setValue, trigger } = useForm<InvoiceFormData>({
    defaultValues: { 
      applyVat: defaultValues ? (defaultValues.vat_rate || 0) > 0 : false,
      brandColor: (defaultValues as any)?.brand_color || '#319795', 
      vatRate: 15
    }
  });

  const watchedLineItems = watch('lineItems');
  const watchedVatRate = watch('vatRate');
  const applyVat = watch('applyVat');
  const watchedClientName = watch('to.name'); 

  // --- CALCULATIONS ---
  const { subtotal, vatAmount, total } = useMemo(() => {
    const sub = watchedLineItems?.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0) || 0;
    const vat = applyVat ? sub * ((Number(watchedVatRate) || 0) / 100) : 0;
    return { subtotal: sub, vatAmount: vat, total: sub + vat };
  }, [watchedLineItems, watchedVatRate, applyVat]);

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  // --- EFFECTS ---
  useEffect(() => {
    if (!senderEmail) {
      const getEmail = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setSenderEmail(user.email);
      };
      getEmail();
    }
  }, [senderEmail, supabase]);

  useEffect(() => {
    if (isEditing && (defaultValues as any)?.currency) return;
    if (isNewClient) {
      setActiveCurrency(profile?.currency || 'ZAR');
    } else {
      const selectedClient = clients.find(c => c.name === watchedClientName);
      if (selectedClient?.currency) setActiveCurrency(selectedClient.currency);
      else setActiveCurrency(profile?.currency || 'ZAR');
    }
  }, [watchedClientName, isNewClient, clients, profile, isEditing, defaultValues]);

  useEffect(() => {
    if (defaultValues) {
      const client = clients.find(c => c.id === defaultValues.client_id);
      const safeDateSource = defaultValues.invoice_date || defaultValues.created_at;
      reset({
        invoiceNumber: defaultValues.invoice_number || '',
        invoiceDate: new Date(safeDateSource || new Date()).toISOString().substring(0, 10),
        dueDate: defaultValues.due_date ? new Date(defaultValues.due_date).toISOString().substring(0, 10) : '',
        to: { name: client?.name || 'Client Not Found', email: client?.email || '', address: client?.address || '' },
        lineItems: defaultValues.line_items ? (defaultValues.line_items as any) : [{ description: '', quantity: 1, unitPrice: 0 }],
        notes: defaultValues.notes || profile?.terms_conditions || '',
        vatRate: defaultValues.vat_rate || 15,
        applyVat: (defaultValues.vat_rate || 0) > 0,
        brandColor: (defaultValues as any).brand_color || '#319795',
      });
      if(client) setIsNewClient(false);
      if((defaultValues as any).currency) setActiveCurrency((defaultValues as any).currency);
      if (defaultValues.payment_link) setSelectedPaymentLink(defaultValues.payment_link);
    } else {
      reset({
        to: { name: '', address: '', email: '' },
        lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
        notes: profile?.terms_conditions || '',
        vatRate: 15,
        applyVat: false,
        invoiceDate: new Date().toISOString().substring(0, 10),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        brandColor: '#319795',
      });
      setActiveCurrency(profile?.currency || 'ZAR');
      if (profile?.payment_settings?.default_provider) {
        const defId = profile.payment_settings.default_provider;
        const defProvider = profile.payment_settings.providers.find(p => p.id === defId);
        if (defProvider?.url) setSelectedPaymentLink(defProvider.url);
      }
    }
  }, [defaultValues, clients, profile, reset]);

  const formatMoney = (amount: number) => {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: activeCurrency }).format(amount); }
    catch { return `${activeCurrency} ${amount.toFixed(2)}`; }
  };

  const getCurrencySymbol = (code: string) => {
    try { return (0).toLocaleString('en-US', { style: 'currency', currency: code }).replace(/\d|\.|,/g, '').trim(); }
    catch { return code; }
  };

  const handleNext = async () => {
    let isValid = false;
    if (step === 0) isValid = await trigger(['to.name', 'to.email']);
    else if (step === 1) {
      isValid = await trigger(['lineItems']);
      if (watchedLineItems.length === 0 || !watchedLineItems[0].description) {
        toast({ title: "Add at least one item", status: "warning" });
        isValid = false;
      }
    } else if (step === 2) isValid = await trigger(['invoiceNumber', 'invoiceDate', 'dueDate']);
    
    if (isValid) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        from: { name: safeProfile.name, email: safeProfile.email, address: safeProfile.address, phone: safeProfile.phone },
        to: { ...formData.to, phone: selectedClient?.phone ?? null },
        lineItems: formData.lineItems.map(item => ({ description: item.description, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })),
        notes: formData.notes,
        vatRate: applyVat ? Number(watchedVatRate) : 0,
        subtotal,
        vatAmount,
        total,
        payment: { bankName: safeProfile.bankName, accountHolder: safeProfile.accountHolder, accNumber: safeProfile.accNumber, branchCode: safeProfile.branchCode }
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${formData.invoiceNumber || 'Draft'}.pdf`;
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

  const onSubmit = async (data: InvoiceFormData, status: 'Draft' | 'Sent') => {
    setIsSubmitting(true);
    try {
      const payload = { 
        ...data, 
        currency: activeCurrency,
        paymentLink: selectedPaymentLink 
      };

      if (isEditing && defaultValues) {
        await updateQuoteAction({ quoteId: defaultValues.id, formData: payload, documentType, total, status });
      } else {
        await createQuoteAction({ formData: payload, documentType, total, status });
      }
      toast({ title: status === 'Draft' ? 'Draft Saved!' : 'Invoice Issued!', status: 'success', duration: 3000, isClosable: true });
    } catch (error: any) {
      if (error.message === 'NEXT_REDIRECT' || error.digest?.includes('NEXT_REDIRECT')) return;
      toast({ title: 'Error', description: error.message, status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box maxW="container.lg" mx="auto">
      <WizardProgress currentStep={step} />

      {/* ✅ FIXED: Added explicit type to 'e' to satisfy strict mode */}
      <Box as="form" onSubmit={(e: React.FormEvent) => e.preventDefault()}>
        <Card bg={cardBg} borderRadius="xl" borderColor={cardBorder} borderWidth="1px" shadow="sm">
          <CardBody p={{ base: 6, md: 8 }}>
            
            {/* === STEP 1: CLIENT === */}
            {step === 0 && (
              <VStack spacing={6} align="stretch" animation="fadeIn 0.3s">
                {/* 🟢 COPY UPDATE: Professional Heading */}
                <Heading size="md" color={textColor}>Client Details</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box p={4} bg={infoBoxBg} rounded="md" border="1px dashed" borderColor={infoBoxBorder}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2}>FROM</Text>
                    <Text fontWeight="bold" color={textColor}>{profile?.company_name || 'Your Company Name'}</Text>
                    <Text fontSize="sm" color="gray.500">{senderEmail}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2}>BILL TO</Text>
                    {isNewClient ? (
                      <VStack spacing={3}>
                         <FormControl isRequired><Input placeholder="Client Name" {...register('to.name', { required: true })} bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor} /></FormControl>
                         <FormControl><Input placeholder="Client Email" type="email" {...register('to.email')} bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor} /></FormControl>
                         <FormControl><Textarea placeholder="Address (Optional)" {...register('to.address')} bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor} size="sm" resize="none" /></FormControl>
                         {clients?.length > 0 && <Button size="sm" variant="link" colorScheme="blue" onClick={() => setIsNewClient(false)}>Select Existing Client</Button>}
                      </VStack>
                    ) : (
                      <VStack spacing={3}>
                        <FormControl isRequired>
                          <Select placeholder="Select a client..." {...register('to.name', { required: true })} bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor}>
                            {clients.map(client => <option key={client.id} value={client.name!}>{client.name}</option>)}
                          </Select>
                        </FormControl>
                        <Button size="sm" variant="link" colorScheme="blue" onClick={() => setIsNewClient(true)}>+ Create New Client</Button>
                      </VStack>
                    )}
                  </Box>
                </SimpleGrid>
              </VStack>
            )}

            {/* === STEP 2: LINE ITEMS === */}
            {step === 1 && (
              <VStack spacing={6} align="stretch" animation="fadeIn 0.3s">
                <Flex justify="space-between" align="center">
                    {/* 🟢 COPY UPDATE: Professional Heading */}
                    <Heading size="md" color={textColor}>Line Items</Heading>
                    <Badge colorScheme="blue" variant="subtle">{activeCurrency}</Badge>
                </Flex>
                <StackDivider borderColor={infoBoxBorder} />
                <Box overflowX="auto">
                  {fields.map((field, index) => (
                    <SimpleGrid key={field.id} columns={{ base: 1, md: 12 }} spacing={4} mb={4} alignItems="center">
                      <FormControl gridColumn={{ base: 'span 1', md: 'span 6' }}>
                          {index === 0 && <FormLabel fontSize="xs" color="gray.500">DESCRIPTION</FormLabel>}
                          <Input placeholder="Item description" {...register(`lineItems.${index}.description`, { required: true })} bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor} />
                      </FormControl>
                      <FormControl gridColumn={{ base: 'span 1', md: 'span 2' }}>
                          {index === 0 && <FormLabel fontSize="xs" color="gray.500">QTY</FormLabel>}
                          <Input type="number" {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })} bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor} />
                      </FormControl>
                      <FormControl gridColumn={{ base: 'span 1', md: 'span 3' }}>
                        {index === 0 && <FormLabel fontSize="xs" color="gray.500">PRICE</FormLabel>}
                        <InputGroup>
                            <InputLeftElement pointerEvents="none" color="gray.400" fontSize="xs" h="full">{getCurrencySymbol(activeCurrency)}</InputLeftElement>
                            <Input type="number" step="0.01" {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor} pl={8} />
                        </InputGroup>
                      </FormControl>
                      <Box gridColumn={{ base: 'span 1', md: 'span 1' }} textAlign="center">
                         {index === 0 && <Text fontSize="xs" color="transparent" mb={2}>X</Text>}
                         <IconButton aria-label="Remove" icon={<Trash2 size={16} />} size="sm" colorScheme="red" variant="ghost" onClick={() => remove(index)} isDisabled={fields.length === 1} />
                      </Box>
                    </SimpleGrid>
                  ))}
                </Box>
                <Button leftIcon={<Plus size={16} />} onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })} variant="outline" size="sm" alignSelf="start">Add Item</Button>
                <Divider borderColor={infoBoxBorder} />
                <HStack justify="flex-end">
                  <Text fontWeight="bold" fontSize="lg" color={textColor}>Total: {formatMoney(total)}</Text>
                </HStack>
              </VStack>
            )}

            {/* === STEP 3: TERMS & META === */}
            {step === 2 && (
              <VStack spacing={6} align="stretch" animation="fadeIn 0.3s">
                <Heading size="md" color={textColor}>Invoice Details & Payment</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <VStack spacing={4}>
                         <FormControl isRequired><FormLabel fontSize="sm" color={textColor}>Invoice Number</FormLabel><Input {...register('invoiceNumber', { required: true })} bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor} placeholder="e.g. INV-001" /></FormControl>
                         <FormControl isRequired><FormLabel fontSize="sm" color={textColor}>Issued Date</FormLabel><Input type="date" {...register('invoiceDate', { required: true })} bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor} /></FormControl>
                         <FormControl isRequired><FormLabel fontSize="sm" color={textColor}>Due Date</FormLabel><Input type="date" {...register('dueDate', { required: true })} bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor} /></FormControl>
                    </VStack>
                    <VStack spacing={4}>
                         <FormControl>
                            <FormLabel fontSize="sm" color={textColor}>Currency</FormLabel>
                            <Select value={activeCurrency} onChange={(e) => setActiveCurrency(e.target.value)} size="md" bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor}>
                                <option value="ZAR">ZAR (South African Rand)</option>
                                <option value="USD">USD (United States Dollar)</option>
                                <option value="EUR">EUR (Euro)</option>
                                <option value="GBP">GBP (British Pound)</option>
                                <option value="NGN">NGN (Nigerian Naira)</option>
                                <option value="KES">KES (Kenyan Shilling)</option>
                            </Select>
                         </FormControl>

                         {/* 🟢 USDT CHECK: Shows only for USD */}
                         {activeCurrency === 'USD' && (
                             <Alert status={profile?.wallet_address ? 'success' : 'warning'} variant="left-accent" fontSize="xs" rounded="md">
                                <AlertIcon boxSize="16px" />
                                <Box>
                                    <Text fontWeight="bold">Crypto (USDT on Polygon) {profile?.wallet_address ? 'Active' : 'Missing'}</Text>
                                    <Text>{profile?.wallet_address ? 'Clients can pay via Crypto (USDT on Polygon).' : 'Required to receive crypto payments (USDT on Polygon).'}</Text>
                                </Box>
                             </Alert>
                         )}

                         <FormControl>
                           <FormLabel fontSize="sm" color={textColor}>Brand Color</FormLabel>
                           <HStack>
                             <Input type="color" {...register('brandColor')} w="50px" h="40px" p={1} rounded="md" cursor="pointer" bg={inputBg} borderColor={inputBorder} />
                             <Text fontSize="xs" color="gray.500">{watch('brandColor')}</Text>
                           </HStack>
                         </FormControl>
                    </VStack>
                </SimpleGrid>

                <Box pt={4}>
                    <PaymentMethodSelector settings={profile?.payment_settings || null} selectedUrl={selectedPaymentLink} onChange={setSelectedPaymentLink} />
                </Box>

                <FormControl>
                    <FormLabel fontSize="sm" color={textColor}>VAT Settings</FormLabel>
                    <HStack>
                        <Checkbox {...register('applyVat')} colorScheme="brand" size="lg">
                            <Text fontSize="sm" fontWeight="bold" color={textColor}>Apply VAT</Text>
                        </Checkbox>
                        {applyVat && (
                           <InputGroup size="sm" maxW="120px">
                             <Input type="number" {...register('vatRate')} bg={inputBg} borderColor={inputBorder} />
                             <InputLeftElement children="%" pointerEvents="none" color="gray.400" />
                           </InputGroup>
                        )}
                    </HStack>
                </FormControl>

                <FormControl>
                    <FormLabel fontSize="sm" color={textColor}>Notes / Terms</FormLabel>
                    <Textarea {...register('notes')} placeholder="Thank you for your business. Payment is due within 7 days of the invoice date." rows={3} bg={inputBg} borderColor={inputBorder} focusBorderColor={focusColor} />
                </FormControl>
              </VStack>
            )}

            {/* === STEP 4: REVIEW === */}
            {step === 3 && (
              <VStack spacing={6} align="stretch" animation="fadeIn 0.3s">
                 <Heading size="md" textAlign="center" color={textColor}>Review Invoice</Heading>
                 <Text textAlign="center" color="gray.500" fontSize="sm">Ensure everything is correct before finalizing.</Text>

                 {/* 🟢 FIX: Dark Mode adaptive review box */}
                 <Box bg={reviewBoxBg} p={6} rounded="lg" border="1px solid" borderColor={infoBoxBorder}>
                    <Flex justify="space-between" mb={4}>
                        <Box>
                            <Text fontWeight="bold" fontSize="lg" color={textColor}>{watch('to.name')}</Text>
                            <Text fontSize="sm" color="gray.500">Invoice #{watch('invoiceNumber')}</Text>
                        </Box>
                        <Text fontWeight="bold" fontSize="xl" color="brand.500">{formatMoney(total)}</Text>
                    </Flex>
                    <StackDivider borderColor={infoBoxBorder} mb={4} />
                    <VStack align="stretch" spacing={2} mb={6}>
                        {watchedLineItems.map((item, i) => (
                            <Flex key={i} justify="space-between" fontSize="sm" color={textColor}>
                                <Text>{item.quantity} x {item.description}</Text>
                                <Text>{formatMoney(item.quantity * item.unitPrice)}</Text>
                            </Flex>
                        ))}
                    </VStack>
                    <HStack justify="space-between" pt={4} borderTop="1px dashed" borderColor={infoBoxBorder}>
                        <Text fontSize="sm" color="gray.500">VAT ({applyVat ? watchedVatRate : 0}%)</Text>
                        <VStack align="end" spacing={0}>
                            {applyVat && <Text fontSize="xs" color="gray.500">VAT: {formatMoney(vatAmount)}</Text>}
                            <Text fontWeight="bold" color={textColor}>Total Due: {formatMoney(total)}</Text>
                        </VStack>
                    </HStack>
                 </Box>

                 <Button 
                    type="button"
                    variant="outline" 
                    size="lg" 
                    w="full" 
                    leftIcon={<Download size={18} />} 
                    onClick={handleDownloadPdf} 
                    isLoading={isGeneratingPdf} 
                    loadingText="Generating PDF..."
                    colorScheme="gray"
                    borderColor={inputBorder}
                    _hover={{ bg: infoBoxBg }}
                 >
                    Preview PDF
                 </Button>
              </VStack>
            )}
          </CardBody>
        </Card>

        {/* === WIZARD CONTROLS === */}
        <Flex mt={8} justify="space-between">
            <Button onClick={handleBack} isDisabled={step === 0 || isSubmitting} variant="ghost" leftIcon={<ArrowLeft size={18} />}>Back</Button>
            
            {step < 3 ? (
                <Button onClick={handleNext} colorScheme="brand" rightIcon={<ArrowRight size={18} />} px={8}>Next Step</Button>
            ) : (
                <ButtonGroup spacing={4}>
                    <Button 
                        onClick={handleSubmit((data) => onSubmit(data, 'Draft'))} 
                        variant="outline" 
                        size="lg" 
                        isLoading={isSubmitting}
                        leftIcon={<Save size={18} />}
                    >
                        Save as Draft
                    </Button>
                    <Button 
                        onClick={handleSubmit((data) => onSubmit(data, 'Sent'))} 
                        colorScheme="green" 
                        size="lg" 
                        isLoading={isSubmitting}
                        leftIcon={<Send size={18} />}
                        shadow="lg"
                    >
                        {/* 🟢 COPY UPDATE: Simplified Action */}
                        Issue Invoice
                    </Button>
                </ButtonGroup>
            )}
        </Flex>
      </Box>
    </Box>
  );
};

export default InvoiceForm;