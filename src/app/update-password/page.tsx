'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Box, Button, FormControl, FormLabel, Input, Heading, Text, Link, Alert, AlertIcon, useColorModeValue, Stack, useToast, Spinner, VStack, InputGroup, InputRightElement } from '@chakra-ui/react';
import NextLink from 'next/link';
import { Eye, EyeOff } from 'lucide-react'; // FIXED: Consistent Icons
import { AuthLayout } from '@/components/AuthLayout';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const toast = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const boxBg = useColorModeValue('white', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const brandColor = useColorModeValue('brand.600', 'brand.400');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const errorParam = params.get('error_description');
      if (errorParam) {
        setError(errorParam);
      } else if (!session) {
        setError('Invalid or expired password reset link.');
      }
      setIsVerifying(false);
    };
    checkSession();
  }, [supabase, params]);

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000, isClosable: true });
      setError(error.message);
    } else {
      toast({ title: 'Success!', description: 'Your password has been updated. Redirecting...', status: 'success', duration: 5000, isClosable: true });
      setTimeout(() => router.push('/sign-in'), 2000);
    }
    setIsLoading(false);
  };

  if (isVerifying) {
    return (
      <AuthLayout>
        <VStack spacing={4}>
          <Spinner size="xl" color={brandColor} thickness="4px" />
          <Text color={textColor} fontWeight="medium">Verifying security token...</Text>
        </VStack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Box 
        rounded="2xl" 
        bg={boxBg} 
        boxShadow="2xl" 
        p={{ base: 6, md: 8 }} 
        width={{ base: 'full', md: '450px' }} 
        border="1px" 
        borderColor={borderColor}
      >
        <Heading fontSize="xl" mb={6} textAlign="center" color={headingColor} fontWeight="bold">
          Set New Password
        </Heading>
        
        {error ? (
          <Alert status="error" variant="subtle" mb={6} rounded="md"><AlertIcon />{error}</Alert>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <Stack spacing={5}>
              <FormControl id="new-password" isRequired>
                <FormLabel fontSize="sm" color={textColor}>New Password</FormLabel>
                <InputGroup size="md">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    borderColor={borderColor}
                    autoComplete="new-password"
                  />
                  <InputRightElement width="3rem">
                    <Button h="1.75rem" size="sm" onClick={() => setShowNewPassword(!showNewPassword)} variant="ghost">
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <FormControl id="confirm-password" isRequired>
                <FormLabel fontSize="sm" color={textColor}>Confirm Password</FormLabel>
                <InputGroup size="md">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    borderColor={borderColor}
                    autoComplete="new-password"
                  />
                  <InputRightElement width="3rem">
                    <Button h="1.75rem" size="sm" onClick={() => setShowConfirmPassword(!showConfirmPassword)} variant="ghost">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button 
                width="full" 
                colorScheme="brand" 
                type="submit" 
                isLoading={isLoading} 
                size="lg" 
                mt={2} 
                shadow="md"
              >
                Update Password
              </Button>
            </Stack>
          </form>
        )}
         <Text mt={6} textAlign="center" fontSize="sm">
          <Link as={NextLink} href="/sign-in" color={brandColor} fontWeight="bold">
            Back to Sign In
          </Link>
        </Text>
      </Box>
    </AuthLayout>
  );
}