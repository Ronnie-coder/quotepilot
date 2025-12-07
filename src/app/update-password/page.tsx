'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  useToast, 
  Spinner, 
  VStack, 
  InputGroup, 
  InputRightElement 
} from '@chakra-ui/react';
import NextLink from 'next/link';
import Image from 'next/image'; // Added for Logo
import { Eye, EyeOff } from 'lucide-react';
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

  // Theme Variables
  const boxBg = useColorModeValue('white', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tealColor = useColorModeValue('teal.600', 'teal.400');
  
  // LOGO VISIBILITY LOGIC
  const logoFilter = useColorModeValue(
    'none', 
    'brightness(0) invert(1) drop-shadow(0 0 5px rgba(49, 151, 149, 0.5))'
  );

  useEffect(() => {
    const checkSession = async () => {
      // Supabase automatically creates a session when the reset link is clicked
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
      toast({ title: 'Update Failed', description: error.message, status: 'error', duration: 5000, isClosable: true });
      setError(error.message);
    } else {
      toast({ title: 'Credentials Secured', description: 'Your password has been updated. Redirecting...', status: 'success', duration: 4000, isClosable: true });
      setTimeout(() => router.push('/dashboard'), 2000); // Redirect to dashboard, they are already logged in
    }
    setIsLoading(false);
  };

  if (isVerifying) {
    return (
      <AuthLayout>
        <VStack spacing={6}>
          <Box filter={logoFilter}>
             <Image src="/logo.svg" alt="QuotePilot" width={64} height={64} priority />
          </Box>
          <Spinner size="xl" color="teal.500" thickness="4px" speed="0.65s" />
          <Text color={textColor} fontWeight="medium" fontSize="lg">Verifying security token...</Text>
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
        {/* LOGO HEADER */}
        <VStack spacing={4} mb={6}>
          <Box filter={logoFilter} transition="all 0.3s">
            <Image src="/logo.svg" alt="QuotePilot" width={48} height={48} priority />
          </Box>
          <Heading fontSize="xl" textAlign="center" color={headingColor} fontWeight="bold">
            Set New Password
          </Heading>
        </VStack>
        
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
                    focusBorderColor="teal.400"
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
                    focusBorderColor="teal.400"
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
                colorScheme="teal" 
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
          <Link as={NextLink} href="/sign-in" color={tealColor} fontWeight="bold">
            Back to Sign In
          </Link>
        </Text>
      </Box>
    </AuthLayout>
  );
}