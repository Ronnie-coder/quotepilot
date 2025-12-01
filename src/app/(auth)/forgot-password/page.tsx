'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Box, Button, FormControl, FormLabel, Input, Heading, Text, Link, Alert, AlertIcon, useColorModeValue, Stack, useToast, Icon } from '@chakra-ui/react';
import NextLink from 'next/link';
import { AuthLayout } from '@/components/AuthLayout';
import { ShieldCheck, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Design Tokens
  const boxBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const brandColor = 'brand.500'; // Teal Identity

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // COMMANDER FIX: HARDCODED TARGET
    // We explicitly tell Supabase: "Send them to the new HQ."
    const targetURL = 'https://quotepilot.coderon.co.za/update-password';

    console.log(`Attempting reset for ${email} -> Target: ${targetURL}`);

    const { error } = await supabase.auth.resetPasswordForEmail(email, { 
      redirectTo: targetURL 
    });

    if (error) {
      console.error('Supabase Error:', error);
      setError(error.message);
    } else {
      setIsSubmitted(true);
    }
    setIsSubmitting(false);
  };

  return (
    <AuthLayout>
      <Box rounded="2xl" bg={boxBg} boxShadow="xl" p={{ base: 6, md: 8 }} border="1px" borderColor={borderColor}>
        <Stack align="center" mb={6}>
            <Icon as={ShieldCheck} boxSize={10} color={brandColor} />
            <Heading fontSize="xl" textAlign="center" fontWeight="bold">Recover Command</Heading>
            <Text textAlign="center" fontSize="sm" color="gray.500">
            Enter your email to receive a secure reset link.
            </Text>
        </Stack>

        {isSubmitted ? (
          <Alert status="success" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" rounded="lg" p={6}>
            <AlertIcon boxSize="24px" mr={0} />
            <Text mt={4} mb={2} fontWeight="bold">Transmission Sent</Text>
            <Text fontSize="sm">Check your inbox for the reset link.</Text>
          </Alert>
        ) : (
          <form onSubmit={handleReset}>
            <Stack spacing={4}>
              {error && <Alert status="error" rounded="md"><AlertIcon />{error}</Alert>}
              
              <FormControl id="email" isRequired>
                <FormLabel fontSize="sm">Email address</FormLabel>
                <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="pilot@company.com" 
                    borderColor={borderColor}
                    focusBorderColor={brandColor}
                    size="lg"
                />
              </FormControl>
              
              <Button 
                width="full" 
                bg={brandColor} 
                color="white" 
                _hover={{ opacity: 0.9 }} 
                type="submit" 
                isLoading={isSubmitting} 
                size="lg"
                leftIcon={<Icon as={Mail} />}
              >
                Send Reset Link
              </Button>
            </Stack>
          </form>
        )}
        
        <Text mt={6} textAlign="center" fontSize="sm">
          <Link as={NextLink} href="/sign-in" color={brandColor} fontWeight="bold">Return to Login</Link>
        </Text>
      </Box>
    </AuthLayout>
  );
}