'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Box, Button, FormControl, FormLabel, Input, VStack, Heading, HStack, IconButton, Text, Switch, Grid, useToast, Textarea, Select, Checkbox, Divider, Flex, Icon, SimpleGrid, useColorModeValue } from '@chakra-ui/react';
import { Trash2, Plus, Save, Download } from 'lucide-react';
import { Tables } from '@/types/supabase';
import { InvoiceFormData } from '@/types/invoice';
import { createQuoteAction, generatePdfAction, updateQuoteAction } from '@/app/dashboard/quotes/actions';

type InvoiceFormProps = {
  profile: Tables<'profiles'> | null;
  clients: Tables<'clients'>[];
  defaultValues?: Tables<'quotes'> | null;
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
  const [documentType, setDocumentType] = useState<'Quote' | 'Invoice'>(defaultValues?.document_type === 'Invoice' ? 'Invoice' : 'Quote');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isNewClient, setIsNewClient] = useState(!defaultValues?.client_id && clients?.length > 0);
  const toast = useToast();
  const isEditing = !!defaultValues;

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<InvoiceFormData>({
    defaultValues: { applyVat: defaultValues ? (defaultValues.vat_rate || 0) > 0 : true }
  });
  
  const watchedLineItems = watch('lineItems');
  const watchedVatRate = watch('vatRate');
  const applyVat = watch('applyVat');

  useEffect(() => {
    if (defaultValues) {
      const client = clients.find(c => c.id === defaultValues.client_id);
      reset({
        invoiceNumber: defaultValues.invoice_number || '',
        invoiceDate: defaultValues.invoice_date ? new Date(defaultValues.invoice_date).toISOString().substring(0, 10) : new Date(defaultValues.created_at).toISOString().substring(0, 10),
        dueDate: defaultValues.due_date ? new Date(defaultValues.due_date).toISOString().substring(0, 10) : '',
        to: { name: client?.name || 'Client Not Found', email: client?.email || '', address: client?.address || '' },
        lineItems: defaultValues.line_items ? (defaultValues.line_items as any) : [{ description: '', quantity: 1, unitPrice: 0 }],
        notes: defaultValues.notes || profile?.terms_conditions || '',
        vatRate: defaultValues.vat_rate || 15,
        applyVat: (defaultValues.vat_rate || 0) > 0,
      });
      if(client) setIsNewClient(false);
    } else {
      reset({
        to: { name: '', address: '', email: '' },
        lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
        notes: profile?.terms_conditions || '',
        vatRate: 15,
        applyVat: true,
        invoiceDate: new Date().toISOString().substring(0, 10),
      });
    }
  }, [defaultValues, clients, profile, reset]);
  
  const { subtotal, vatAmount, total } = useMemo(() => {
    const sub = watchedLineItems?.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0) || 0;
    const vat = applyVat ? sub * ((Number(watchedVatRate) || 0) / 100) : 0;
    return { subtotal: sub, vatAmount: vat, total: sub + vat };
  }, [watchedLineItems, watchedVatRate, applyVat]);

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  // --- MISSION CRITICAL: Re-integration of your original, functional logic ---
  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      let result;
      if (isEditing) {
        result = await updateQuoteAction({
          quoteId: defaultValues.id, formData: data, documentType: documentType, total: total,
        });
      } else {
        result = await createQuoteAction({
          formData: data, documentType: documentType, total: total,
        });
      }
      if (result?.success === false) { throw new Error(result.message); }
      toast({ title: 'Success!', description: `Your ${documentType} has been saved.`, status: 'success' });
    } catch (error: any) {
      toast({ title: 'Operation Failed', description: error.message || `There was an error saving your ${documentType}.`, status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!defaultValues?.id) {
      toast({
        title: 'Cannot Download',
        description: 'Document must be saved before a PDF can be generated.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    
    setIsDownloading(true);
    try {
      const result = await generatePdfAction(defaultValues.id);
      if (result.success && result.pdfData) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${result.pdfData}`;
        link.download = result.fileName || `document_${defaultValues.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Download Started', status: 'success', duration: 3000, isClosable: true });
      } else {
        throw new Error(result.error || 'An unknown error occurred during PDF generation.');
      }
    } catch (error) {
      console.error("PDF Download Error:", error);
      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'Could not generate the PDF.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  const brandGold = useColorModeValue('yellow.500', 'yellow.300');
  const buttonTextColor = useColorModeValue('gray.800', 'gray.900');
  const focusBorderColor = useColorModeValue('yellow.500', 'yellow.300');

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid templateColumns={{ base: '1fr', lg: '2.5fr 1.5fr' }} gap={8} alignItems="start">
        {/* === MAIN CONTENT COLUMN === */}
        <VStack spacing={6} align="stretch">
          <FormSection title="Client Details">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
                <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('gray.600', 'gray.400')}>FROM</Text>
                <Text fontWeight="bold" mt={1}>{profile?.company_name || 'Set company name in settings'}</Text>
                <Text fontSize="sm" color="gray.500">{profile?.company_address}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('gray.600', 'gray.400')}>TO</Text>
                {isNewClient ? (
                  <VStack spacing={3} mt={1}>
                    <FormControl isRequired><Input placeholder="Client Name" {...register('to.name')} focusBorderColor={focusBorderColor} /></FormControl>
                    <FormControl><Input placeholder="Client Email" type="email" {...register('to.email')} focusBorderColor={focusBorderColor} /></FormControl>
                    <FormControl><Textarea placeholder="Client Address" {...register('to.address')} focusBorderColor={focusBorderColor} size="sm" /></FormControl>
                    {clients?.length > 0 && <Button size="sm" variant="link" colorScheme="yellow" onClick={() => setIsNewClient(false)}>Select Existing</Button>}
                  </VStack>
                ) : (
                  <VStack spacing={3} mt={1}>
                    <FormControl isRequired>
                      <Select placeholder="Select client" {...register('to.name')} focusBorderColor={focusBorderColor}>
                        {clients.map(client => <option key={client.id} value={client.name!}>{client.name}</option>)}
                      </Select>
                    </FormControl>
                    <Button size="sm" variant="link" colorScheme="yellow" onClick={() => setIsNewClient(true)}>+ Add New Client</Button>
                  </VStack>
                )}
              </Box>
            </SimpleGrid>
          </FormSection>

          <FormSection title="Line Items">
            <HStack display={{ base: 'none', md: 'flex' }} w="100%" spacing={4} color="gray.500" fontSize="sm">
              <Text flex={5}>DESCRIPTION</Text>
              <Text flex={1.5} textAlign="right">QTY</Text>
              <Text flex={2} textAlign="right">UNIT PRICE</Text>
              <Text flex={2} textAlign="right">TOTAL</Text>
              <Box w="40px" />
            </HStack>
            {fields.map((field, index) => {
              const quantity = watch(`lineItems.${index}.quantity`) || 0;
              const unitPrice = watch(`lineItems.${index}.unitPrice`) || 0;
              const itemTotal = (quantity * unitPrice).toFixed(2);
              return (
                <SimpleGrid key={field.id} columns={{ base: 1, md: 5 }} spacing={4} alignItems="center">
                  <FormControl gridColumn={{ base: '1 / -1', md: 'auto' }} flex={5}><Input placeholder="Item description" {...register(`lineItems.${index}.description`)} focusBorderColor={focusBorderColor} /></FormControl>
                  <FormControl flex={1.5}><Input placeholder="Qty" type="number" {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })} focusBorderColor={focusBorderColor} textAlign="right" /></FormControl>
                  <FormControl flex={2}><Input placeholder="Price" type="number" step="0.01" {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} focusBorderColor={focusBorderColor} textAlign="right" /></FormControl>
                  <Text flex={2} textAlign="right" fontWeight="medium" color={useColorModeValue('gray.600', 'gray.300')}>R {itemTotal}</Text>
                  <IconButton aria-label="Remove item" icon={<Icon as={Trash2} />} variant="ghost" colorScheme="red" onClick={() => remove(index)} />
                </SimpleGrid>
              );
            })}
            <Button onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })} leftIcon={<Icon as={Plus} />} variant="outline" colorScheme="yellow" alignSelf="flex-start">Add Item</Button>
          </FormSection>

          <FormSection title="Notes / Terms">
            <Textarea {...register('notes')} placeholder="e.g. Payment due within 30 days" rows={4} focusBorderColor={focusBorderColor} />
          </FormSection>
        </VStack>

        {/* === SIDEBAR COLUMN === */}
        <VStack spacing={6} align="stretch" position={{ lg: 'sticky' }} top={8}>
          <FormSection title="Document Details">
            <HStack justify="space-between" align="center" p={2} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
              <Text fontWeight='bold'>Quote</Text>
              <Switch isChecked={documentType === 'Invoice'} onChange={(e) => setDocumentType(e.target.checked ? 'Invoice' : 'Quote')} colorScheme="yellow" size="lg" />
              <Text fontWeight='bold'>Invoice</Text>
            </HStack>
            <FormControl><FormLabel>Doc #</FormLabel><Input {...register('invoiceNumber')} focusBorderColor={focusBorderColor} /></FormControl>
            <FormControl isRequired><FormLabel>Date Issued</FormLabel><Input type="date" {...register('invoiceDate')} focusBorderColor={focusBorderColor} /></FormControl>
            {documentType === 'Invoice' && (<FormControl><FormLabel>Due Date</FormLabel><Input type="date" {...register('dueDate')} focusBorderColor={focusBorderColor} /></FormControl>)}
          </FormSection>

          <FormSection title="Summary">
             <VStack spacing={3} align="stretch">
                <HStack justify="space-between"><Text color="gray.500">Subtotal</Text><Text>R {subtotal.toFixed(2)}</Text></HStack>
                <HStack justify="space-between">
                    <Checkbox {...register('applyVat')} size="md" colorScheme="yellow">
                        <HStack><Text color="gray.500">VAT</Text><Input size="xs" w="50px" textAlign="center" {...register('vatRate')} focusBorderColor={focusBorderColor} /> <Text color="gray.500">%</Text></HStack>
                    </Checkbox>
                    <Text>R {vatAmount.toFixed(2)}</Text>
                </HStack>
                <Divider my={2} />
                <HStack justify="space-between" fontWeight="bold" fontSize="2xl"><Text>Total</Text><Text color={brandGold}>R {total.toFixed(2)}</Text></HStack>
            </VStack>
          </FormSection>

          <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify="flex-end" gap={4}>
            {isEditing && (<Button onClick={handleDownloadPdf} variant="outline" colorScheme="yellow" size="lg" leftIcon={<Icon as={Download}/>} isLoading={isDownloading}>Download</Button>)}
            <Button type="submit" bg={brandGold} color={buttonTextColor} _hover={{ bg: useColorModeValue('yellow.600', 'yellow.400') }} size="lg" isLoading={isSubmitting} leftIcon={<Icon as={Save} />}>{isEditing ? 'Update' : 'Save'}</Button>
          </Flex>
        </VStack>
      </Grid>
    </Box>
  );
};