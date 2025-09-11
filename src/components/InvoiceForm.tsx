// src/components/InvoiceForm.tsx (SPECTRE MODIFICATION: SSR AUTH UPGRADE)
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading, HStack, IconButton, Text,
  Switch, useColorModeValue, SimpleGrid, Card, CardBody, CardHeader, useToast, Textarea
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { generatePdf } from '../utils/pdfGenerator';
import { InvoiceFormData } from '../types/invoice';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
// SPECTRE DIRECTIVE 1: IMPORT THE NEW, CONSOLIDATED SSR CLIENT HELPER
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

type InvoiceFormProps = {
  defaultValues?: Partial<InvoiceFormData> & { id?: string; document_type?: string; client_id?: string; };
};

export const InvoiceForm = ({ defaultValues }: InvoiceFormProps) => {
  const isEditMode = !!defaultValues;
  const router = useRouter();

  const [documentType, setDocumentType] = useState<'Quote' | 'Invoice'>(
    defaultValues?.document_type === 'Quote' ? 'Quote' : 'Invoice'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userId, getToken } = useAuth();
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // SPECTRE DIRECTIVE 2: CREATE THE SUPABASE CLIENT USING THE NEW HELPER
  // This client is lightweight and can be created outside the handler.
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { register, control, handleSubmit, watch, reset } = useForm<InvoiceFormData>({
    defaultValues: defaultValues || {
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().substring(0, 10),
      dueDate: '',
      from: { name: '', address: '', email: '' },
      to: { name: '', address: '', email: '' },
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
      notes: '',
      payment: { bankName: '', accountHolder: '', accNumber: '' },
      vatRate: 15,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const lineItems = watch('lineItems');
  const vatRate = watch('vatRate');

  const { subtotal, vatAmount, total } = useMemo(() => {
    const sub = lineItems?.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0) || 0;
    const vat = sub * ((vatRate || 0) / 100);
    return { subtotal: sub, vatAmount: vat, total: sub + vat };
  }, [lineItems, vatRate]);

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    if (!userId) {
      toast({ title: "Authentication Error", description: "You must be signed in.", status: "error" });
      setIsSubmitting(false);
      return;
    }

    try {
      // SPECTRE DIRECTIVE 3: THE AUTH SYNC PROTOCOL REMAINS THE SAME
      const supabaseAccessToken = await getToken({ template: 'supabase' });
      if (!supabaseAccessToken) {
        throw new Error("Authentication sync failed: Could not retrieve Supabase token from Clerk.");
      }
      
      await supabase.auth.setSession({
        access_token: supabaseAccessToken,
        refresh_token: '', 
      });

      const quoteDataPayload = {
        document_type: documentType, user_id: userId, line_items: data.lineItems,
        notes: data.notes, total: total, invoice_number: data.invoiceNumber,
        invoice_date: data.invoiceDate, due_date: data.dueDate, vat_rate: data.vatRate,
      };

      if (isEditMode) {
        const { error: quoteError } = await supabase.from('quotes').update(quoteDataPayload).eq('id', defaultValues.id!);
        if (quoteError) throw new Error(`Failed to update quote: ${quoteError.message}`);
        toast({ title: 'Update Successful!', description: "Your document has been updated.", status: 'success' });
        router.push('/dashboard/quotes');
        router.refresh();
      } else {
        const { data: clientData, error: clientError } = await supabase.from('clients').insert([{ 
            name: data.to.name, email: data.to.email, address: data.to.address, user_id: userId 
        }]).select().single();
        if (clientError) throw new Error(`Failed to save client: ${clientError.message}`);

        const finalPayload = { ...quoteDataPayload, client_id: clientData.id };
        const { error: quoteError } = await supabase.from('quotes').insert([finalPayload]);
        if (quoteError) throw new Error(`Failed to save quote: ${quoteError.message}`);
        
        toast({ title: 'Success!', description: "Your document has been saved.", status: 'success' });
        generatePdf({ ...data, documentType, subtotal, vatAmount, total });
        router.push('/dashboard/quotes');
        router.refresh();
      }
    } catch (error: any) {
      console.error("Supabase Save/Update Error:", error);
      toast({ title: 'Operation Failed', description: error.message, status: 'error' });
    }
    setIsSubmitting(false);
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} p={{ base: 4, md: 8 }}>
      {/* ... JSX remains identical from here down ... */}
      <VStack spacing={8} maxW="container.lg" mx="auto">
        <HStack w="100%" justify="space-between">
          <Heading size="lg">{isEditMode ? `Editing ${documentType}` : `${documentType} Creator`}</Heading>
          <HStack><Text>Quote</Text><Switch isChecked={documentType === 'Invoice'} onChange={(e) => setDocumentType(e.target.checked ? 'Invoice' : 'Quote')} /><Text>Invoice</Text></HStack>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="100%">
          <FormControl>
              <FormLabel>Doc #</FormLabel>
              <Input {...register('invoiceNumber')} />
          </FormControl>
          <FormControl isRequired>
              <FormLabel>Date</FormLabel>
              <Input type="date" {...register('invoiceDate')} />
          </FormControl>
          {documentType === 'Invoice' && (
              <FormControl isRequired>
                  <FormLabel>Due Date</FormLabel>
                  <Input type="date" {...register('dueDate')} />
              </FormControl>
          )}
        </SimpleGrid>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="100%">
          <Card bg="white" borderWidth="1px" borderColor={borderColor}><CardHeader><Heading size="md">From</Heading></CardHeader><CardBody><VStack spacing={4}><FormControl isRequired><FormLabel>Your Name</FormLabel><Input {...register('from.name')} /></FormControl><FormControl isRequired><FormLabel>Your Address</FormLabel><Input {...register('from.address')} /></FormControl><FormControl isRequired><FormLabel>Your Email</FormLabel><Input type="email" {...register('from.email')} /></FormControl></VStack></CardBody></Card>
          <Card bg="white" borderWidth="1px" borderColor={borderColor}><CardHeader><Heading size="md">To (Client)</Heading></CardHeader><CardBody><VStack spacing={4}><FormControl isRequired><FormLabel>Client's Name</FormLabel><Input {...register('to.name')} /></FormControl><FormControl isRequired><FormLabel>Client's Address</FormLabel><Input {...register('to.address')} /></FormControl><FormControl isRequired><FormLabel>Client's Email</FormLabel><Input type="email" {...register('to.email')} /></FormControl></VStack></CardBody></Card>
        </SimpleGrid>

        <Card w="100%" bg="white" borderWidth="1px" borderColor={borderColor}><CardHeader><Heading size="md">Line Items</Heading></CardHeader><CardBody><VStack spacing={4}>
          {fields.map((field, index) => (
            <HStack key={field.id} w="100%"><FormControl flex={5}><Input placeholder="Description" {...register(`lineItems.${index}.description`)} /></FormControl>
            <FormControl flex={2}><Input placeholder="Quantity" type="number" {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })} /></FormControl>
            <FormControl flex={2}><Input placeholder="Unit Price" type="number" step="0.01" {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} /></FormControl>
            <IconButton aria-label="Remove" icon={<DeleteIcon />} onClick={() => remove(index)} /></HStack>
          ))}
          <Button onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })} leftIcon={<AddIcon />}>Add Item</Button>
        </VStack></CardBody></Card>

        <HStack w="100%" align="flex-start" spacing={8}>
            <VStack flex={2} spacing={4} align="stretch">
                <Card bg="white" borderWidth="1px" borderColor={borderColor}><CardHeader><Heading size="md">Notes</Heading></CardHeader><CardBody><Textarea {...register('notes')} /></CardBody></Card>
                <Card bg="white" borderWidth="1px" borderColor={borderColor}><CardHeader><Heading size="md">Payment Details</Heading></CardHeader><CardBody><VStack spacing={2}><FormControl><FormLabel fontSize="sm">Bank</FormLabel><Input {...register('payment.bankName')} /></FormControl><FormControl><FormLabel fontSize="sm">Account Holder</FormLabel><Input {...register('payment.accountHolder')} /></FormControl><FormControl><FormLabel fontSize="sm">Account Number</FormLabel><Input {...register('payment.accNumber')} /></FormControl></VStack></CardBody></Card>
            </VStack>
            <Card flex={1} bg="white" borderWidth="1px" borderColor={borderColor}><CardHeader><Heading size="md">Summary</Heading></CardHeader><CardBody><VStack spacing={3} align="stretch">
              <HStack justify="space-between"><Text>Subtotal</Text><Text>R {subtotal.toFixed(2)}</Text></HStack>
              <HStack justify="space-between"><Text>VAT ({vatRate || 0}%)</Text><Text>R {vatAmount.toFixed(2)}</Text></HStack>
              <HStack justify="space-between" fontWeight="bold" fontSize="xl"><Text>Total</Text><Text>R {total.toFixed(2)}</Text></HStack>
            </VStack></CardBody></Card>
        </HStack>

        <HStack w="100%" justify="flex-end"><Button type="submit" colorScheme="brand" size="lg" isLoading={isSubmitting}>{isEditMode ? 'Update Document' : 'Save Document'}</Button></HStack>
      </VStack>
    </Box>
  );
};