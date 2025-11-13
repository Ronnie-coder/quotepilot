// FILE: src/app/update-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Box, Button, Flex, FormControl, FormLabel, Input, Heading, Text, Link, Alert, AlertIcon, useColorModeValue, Stack, useToast, Spinner, VStack, InputGroup, InputRightElement } from '@chakra-ui/react';
import NextLink from 'next/link';
import { FiEye, FiEyeOff } from 'react-icons/fi';

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
  const [showNewPassword, setShowNewPassword] = useState(false); // [NEW] State for new password
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // [NEW] State for confirm password

  const pageBg = useColorModeValue('gray.100', 'gray.900');
  const boxBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const brandGold = useColorModeValue('yellow.500', 'yellow.300');
  const brandGoldText = useColorModeValue('gray.800', 'gray.900');
  const brandGoldHover = useColorModeValue('yellow.600', 'yellow.400');

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
      toast({ title: 'Success!', description: 'Your password has been updated. You will be redirected to sign in.', status: 'success', duration: 5000, isClosable: true });
      setTimeout(() => router.push('/sign-in'), 2000);
    }
    setIsLoading(false);
  };

  if (isVerifying) {
    return (
      <Flex flex="1" minH="80vh" align="center" justify="center" p={4} bg={pageBg}>
        <VStack spacing={4}>
          <Spinner size="xl" color={brandGold} />
          <Text color={textColor}>Verifying your request...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex flex="1" minH="80vh" align="center" justify="center" p={4} bg={pageBg}>
      <Box rounded="xl" bg={boxBg} boxShadow="2xl" p={8} width={{ base: '90%', md: '450px' }} border="1px" borderColor={borderColor}>
        <Heading fontSize="2xl" mb={6} textAlign="center" color={headingColor}>Update Your Password</Heading>
        {error ? (
          <Alert status="error" mb={4} rounded="md"><AlertIcon />{error}</Alert>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <Stack spacing={4}>
              {/* [UPGRADE] New Password input now has a visibility toggle */}
              <FormControl id="new-password" isRequired>
                <FormLabel color={textColor}>New Password</FormLabel>
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
                      {showNewPassword ? <FiEyeOff /> : <FiEye />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              {/* [UPGRADE] Confirm Password input now has a visibility toggle */}
              <FormControl id="confirm-password" isRequired>
                <FormLabel color={textColor}>Confirm New Password</FormLabel>
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
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Button width="full" bg={brandGold} color={brandGoldText} _hover={{ bg: brandGoldHover }} type="submit" isLoading={isLoading} size="lg" mt={2} shadow="md">
                Update Password
              </Button>
            </Stack>
          </form>
        )}
         <Text mt={6} textAlign="center">
          <Link as={NextLink} href="/sign-in" color={brandGold} fontWeight="bold">
            Back to Sign In
          </Link>
        </Text>
      </Box>
    </Flex>
  );
}