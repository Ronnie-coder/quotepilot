'use client';

import React, { useEffect } from 'react';
import {
  Box, VStack, Button, useToast, FormControl, FormLabel
} from '@chakra-ui/react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { uploadLogoAction } from './actions';
import LogoUploader from '@/components/LogoUploader';

// Tactical Unit 1: The Submit Button
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" colorScheme="blue" isLoading={pending} alignSelf="flex-start">
      Save Settings
    </Button>
  );
}

// Props interface for our new component
interface SettingsFormProps {
  initialLogoUrl: string | null;
}

// Tactical Unit 2: The Interactive Client Form
export default function SettingsForm({ initialLogoUrl }: SettingsFormProps) {
  const toast = useToast();
  
  // No more client-side fetching. We use the prop passed from the server.
  const [currentLogoUrl, setCurrentLogoUrl] = useState(initialLogoUrl);

  const initialState: { success: boolean, message: string } = { success: false, message: '' };
  const [formState, formAction] = useActionState(uploadLogoAction, initialState);

  // This effect now only serves to show success/error toasts after the form is submitted.
  useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.success ? "Success" : "Error",
        description: formState.message,
        status: formState.success ? "success" : "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [formState, toast]);

  return (
    <Box as="form" action={formAction}>
      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel>Company Logo</FormLabel>
          <LogoUploader currentLogoUrl={currentLogoUrl} />
        </FormControl>
        <SubmitButton />
      </VStack>
    </Box>
  );
}