'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Heading, 
  Text, 
  Link, 
  Alert, 
  AlertIcon, 
  useColorModeValue, 
  Stack, 
  Icon, 
  VStack 
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { AuthLayout } from '@/components/AuthLayout';
import { Mail } from 'lucide-react';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Design Tokens
  const boxBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tealColor = useColorModeValue('teal.600', 'teal.400');
  const logoFilter = useColorModeValue('none', 'brightness(0) invert(1) drop-shadow(0 0 5px rgba(49, 151, 149, 0.5))');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const redirectURL = `${window.location.origin}/update-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, { 
        redirectTo: redirectURL 
      });

      if (error) throw error;
      
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Box rounded="2xl" bg={boxBg} boxShadow="xl" p={{ base: 6, md: 8 }} border="1px" borderColor={borderColor}>
        <VStack spacing={4} mb={6}>
            {/* Logo Consistency */}
            <Box filter={logoFilter} transition="all 0.3s">
                <Image src="/logo.svg" alt="QuotePilot" width={40} height={40} priority />
            </Box>
            <Stack align="center" spacing={1}>
                <Heading fontSize="xl" textAlign="center" fontWeight="bold">Reset your password</Heading>
                <Text textAlign="center" fontSize="sm" color="gray.500">
                    Enter your email to receive a secure reset link.
                </Text>
            </Stack>
        </VStack>

        {isSubmitted ? (
          <Alert status="success" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" rounded="lg" p={6}>
            <AlertIcon boxSize="24px" mr={0} />
            <Text mt={4} mb={2} fontWeight="bold">Reset link sent</Text>
            <Text fontSize="sm">Check your email for instructions to reset your password.</Text>
          </Alert>
        ) : (
          <form onSubmit={handleReset}>
            <Stack spacing={4}>
              {error && <Alert status="error" rounded="md" fontSize="sm"><AlertIcon />{error}</Alert>}
              
              <FormControl id="email" isRequired>
                <FormLabel fontSize="sm">Email address</FormLabel>
                <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="you@company.com" 
                    borderColor={borderColor}
                    focusBorderColor="teal.400"
                    size="lg"
                />
              </FormControl>
              
              <Button 
                width="full" 
                colorScheme="teal"
                type="submit" 
                isLoading={isSubmitting} 
                size="lg"
                leftIcon={<Icon as={Mail} />}
                boxShadow="md"
              >
                Send Reset Link
              </Button>
            </Stack>
          </form>
        )}
        
        <Text mt={6} textAlign="center" fontSize="sm">
          <Link as={NextLink} href="/sign-in" color={tealColor} fontWeight="bold">Return to Login</Link>
        </Text>
      </Box>
    </AuthLayout>
  );
}