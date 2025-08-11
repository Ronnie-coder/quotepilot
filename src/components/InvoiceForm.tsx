// /src/components/InvoiceForm.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Box, Button, FormControl, FormLabel, FormHelperText, Input, VStack, Heading, HStack, IconButton, Text,
  Switch, useColorModeValue, SimpleGrid, Card, CardBody, CardHeader, useToast, InputGroup, InputRightAddon
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { generatePdf } from '../utils/pdfGenerator';
import LogoUploader from './LogoUploader';
import { InvoiceFormData } from '../types/invoice';

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseClient';

const InvoiceForm = () => {
  const [documentType, setDocumentType] = useState<'Quote' | 'Invoice'>('Invoice');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userId } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      from: { name: '', address: '', email: '' },
      to: { name: '', address: '', email: '' },
      payment: { bankName: '', accountHolder: '', accNumber: '' },
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
      notes: '',
      logo: null,
      invoiceNumber: '001',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      vatRate: 15,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  const lineItems = watch('lineItems');
  const vatRate = watch('vatRate');

  const { subtotal, vatAmount, total } = useMemo(() => {
    const sub = lineItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
    const vat = sub * ((vatRate || 0) / 100);
    const grandTotal = sub + vat;
    return { subtotal: sub, vatAmount: vat, total: grandTotal };
  }, [lineItems, vatRate]);

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    
    // --- FIX: Explicitly adding calculated totals to the data object for the PDF ---
    const pdfData = {
      ...data,
      documentType: documentType,
      subtotal, // Now included
      vatAmount, // Now included
      total,     // Now included
      // Mapping form data to PDF generator's expected field names for consistency
      invoiceType: documentType,
      businessName: data.from.name,
      businessAddress: data.from.address,
      businessEmail: data.from.email,
      clientName: data.to.name,
      clientAddress: data.to.address,
      clientEmail: data.to.email,
      bankName: data.payment.bankName,
      accountHolder: data.payment.accountHolder,
      accountNumber: data.payment.accNumber
    };
    
    if (userId) {
      try {
        const dbData = {
          user_id: userId,
          document_type: documentType,
          client_info: data.to,
          payment_info: data.payment,
          line_items: data.lineItems,
          notes: data.notes,
          total: total, // Save the final, correct total
          invoice_number: data.invoiceNumber,
          invoice_date: data.invoiceDate,
          due_date: data.dueDate,
          vat_rate: data.vatRate,
        };
        const { error } = await supabase.from('quotes').insert([dbData]);
        if (error) throw error;
        toast({
          title: 'Document Saved.',
          description: "A copy has been saved to your dashboard.",
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Save Failed',
          description: 'Could not save to the database. The PDF will still be generated.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }

    generatePdf(pdfData as any);
    setIsSubmitting(false);
  };

  // The rest of the return statement is identical to the previous version
  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} p={{ base: 4, md: 8 }}>
      <VStack spacing={8} maxW="container.lg" mx="auto">
        
        <HStack w="100%" justify="space-between" align="center">
          <Heading as="h1" size="lg" color={useColorModeValue('gray.700', 'white')}>
            {documentType} Creator
          </Heading>
          <HStack>
            <Text>Quote</Text>
            <Switch
              colorScheme="brand"
              isChecked={documentType === 'Invoice'}
              onChange={(e) => setDocumentType(e.target.checked ? 'Invoice' : 'Quote')}
              size="lg"
            />
            <Text>Invoice</Text>
          </HStack>
        </HStack>

        <Card w="100%" bg={cardBg} shadow="sm">
          <CardHeader><Heading size="md">Document Details</Heading></CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel>Invoice #</FormLabel>
                <Input {...register('invoiceNumber')} />
              </FormControl>
              <FormControl>
                <FormLabel>Invoice Date</FormLabel>
                <Input type="date" {...register('invoiceDate')} />
              </FormControl>
              <FormControl>
                <FormLabel>Due Date</FormLabel>
                <Input type="date" {...register('dueDate')} />
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="100%">
          <Card bg={cardBg} shadow="sm">
            <CardHeader><Heading size="md">Your Details (From)</Heading></CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <LogoUploader onLogoUpload={() => {}} control={control} />
                <FormControl isRequired>
                  <FormLabel>Company Name</FormLabel>
                  <Input {...register('from.name', { required: true })} />
                </FormControl>
                <FormControl>
                  <FormLabel>Address</FormLabel>
                  <Input {...register('from.address')} />
                </FormControl>
                 <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" {...register('from.email')} />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="sm">
            <CardHeader><Heading size="md">Client Details (To)</Heading></CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <FormControl isRequired isInvalid={!!errors.to?.name}>
                  <FormLabel>Client's Name</FormLabel>
                  <Input {...register('to.name', { required: 'Client name is required' })} />
                </FormControl>
                <FormControl>
                  <FormLabel>Client's Address</FormLabel>
                  <Input {...register('to.address')} />
                </FormControl>
                 <FormControl>
                  <FormLabel>Client's Email</FormLabel>
                  <Input type="email" {...register('to.email')} />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card w="100%" bg={cardBg} shadow="sm">
          <CardHeader><Heading size="md">Items</Heading></CardHeader>
          <CardBody>
            <VStack spacing={4}>
              {fields.map((field, index) => (
                <HStack key={field.id} w="100%" spacing={{ base: 2, md: 4}} alignItems="flex-end">
                  <FormControl>
                    {index === 0 && <FormLabel>Description</FormLabel>}
                    <Input {...register(`lineItems.${index}.description`)} placeholder="Service or product" />
                  </FormControl>
                  <FormControl w={{ base: '70px', md: '100px' }}>
                    {index === 0 && <FormLabel>Qty</FormLabel>}
                    <Input type="number" {...register(`lineItems.${index}.quantity`, { valueAsNumber: true, min: 1 })} />
                  </FormControl>
                  <FormControl w={{ base: '100px', md: '150px' }}>
                    {index === 0 && <FormLabel>Unit Price (R)</FormLabel>}
                    <Input type="number" step="0.01" {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} />
                  </FormControl>
                  <IconButton aria-label="Delete item" icon={<DeleteIcon />} onClick={() => remove(index)} colorScheme="red" variant="ghost" />
                </HStack>
              ))}
              <Button onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })} leftIcon={<AddIcon />} variant="outline" alignSelf="flex-start">
                Add Item
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="100%">
          <Card bg={cardBg} shadow="sm">
              <CardHeader><Heading size="md">Payment & Notes</Heading></CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                      <FormLabel>Bank Name</FormLabel>
                      <Input {...register('payment.bankName')} />
                  </FormControl>
                   <FormControl>
                      <FormLabel>Account Holder</FormLabel>
                      <Input {...register('payment.accountHolder')} />
                  </FormControl>
                  <FormControl>
                      <FormLabel>Account Number</FormLabel>
                      <Input {...register('payment.accNumber')} />
                  </FormControl>
                  <FormControl>
                      <FormLabel>Notes</FormLabel>
                      <Input as="textarea" {...register('notes')} placeholder="e.g., Thank you for your business!" h="80px" />
                  </FormControl>
                </VStack>
              </CardBody>
          </Card>
          <Card bg={cardBg} shadow="sm">
              <CardHeader><Heading size="md">Totals</Heading></CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>VAT Rate</FormLabel>
                    <InputGroup>
                      <Input type="number" {...register('vatRate', { valueAsNumber: true })} />
                      <InputRightAddon>%</InputRightAddon>
                    </InputGroup>
                  </FormControl>
                  <HStack justify="space-between">
                    <Text>Subtotal:</Text>
                    <Text>R {subtotal.toFixed(2)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>VAT ({vatRate || 0}%):</Text>
                    <Text>R {vatAmount.toFixed(2)}</Text>
                  </HStack>
                   <HStack justify="space-between" fontWeight="bold" fontSize="lg">
                    <Text>TOTAL:</Text>
                    <Text>R {total.toFixed(2)}</Text>
                  </HStack>
                </VStack>
              </CardBody>
          </Card>
        </SimpleGrid>

        <HStack w="100%" justify="flex-end" p={4} bg={useColorModeValue('gray.100', 'gray.800')} borderRadius="lg">
          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            isLoading={isSubmitting}
            loadingText={userId ? 'Saving & Generating...' : 'Generating...'}
          >
            {userId ? 'Save & Generate PDF' : 'Generate PDF'}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default InvoiceForm;