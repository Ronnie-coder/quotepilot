// FILE: src/app/(auth)/forgot-password/page.tsx
// MISSION: RESTORE CORRECT FILE CONTENT TO INITIATE EMAIL PROTOCOL
'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Box, Button, Flex, FormControl, FormLabel, Input, Heading, Text, Link, Alert, AlertIcon, useColorModeValue, Stack, useToast } from '@chakra-ui/react';
import NextLink from 'next/link';

export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const toast = useToast();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Color theme values
  const pageBg = useColorModeValue('gray.100', 'gray.900');
  const boxBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const brandGold = useColorModeValue('yellow.500', 'yellow.300');
  const brandGoldText = useColorModeValue('gray.800', 'gray.900');
  const brandGoldHover = useColorModeValue('yellow.600', 'yellow.400');

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setIsSubmitted(false);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000, isClosable: true });
      setError(error.message);
    } else {
      toast({ title: 'Success', description: 'Password reset link sent! Please check your email.', status: 'success', duration: 5000, isClosable: true });
      setIsSubmitted(true);
    }
    setIsSubmitting(false);
  };

  return (
    <Flex flex="1" minH="80vh" align="center" justify="center" p={4} bg={pageBg}>
      <Box rounded="xl" bg={boxBg} boxShadow="2xl" p={8} width={{ base: '90%', md: '450px' }} border="1px" borderColor={borderColor}>
        <Heading fontSize="2xl" mb={2} textAlign="center" color={headingColor}>Forgot Password</Heading>
        <Text mb={6} textAlign="center" color={textColor}>
          Enter your email and we'll send you a link to reset your password.
        </Text>

        {isSubmitted && (
          <Alert status="success" mb={4} rounded="md">
            <AlertIcon />
            If an account with this email exists, a reset link has been sent.
          </Alert>
        )}
        {error && !isSubmitted && (
          <Alert status="error" mb={4} rounded="md"><AlertIcon />{error}</Alert>
        )}

        <form onSubmit={handlePasswordReset}>
          <Stack spacing={4}>
            <FormControl id="email" isRequired>
              <FormLabel color={textColor}>Email address</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" borderColor={borderColor} />
            </FormControl>
            <Button width="full" bg={brandGold} color={brandGoldText} _hover={{ bg: brandGoldHover }} type="submit" isLoading={isSubmitting} size="lg" shadow="md">
              Send Reset Link
            </Button>
          </Stack>
        </form>
        <Text mt={6} textAlign="center">
          <Link as={NextLink} href="/sign-in" color={brandGold} fontWeight="medium">
            Back to Sign In
          </Link>
        </Text>
      </Box>
    </Flex>
  );
}