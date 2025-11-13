// FILE: src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Box, Button, Flex, FormControl, FormLabel, Input, Heading, Text, Link, Alert, AlertIcon, useColorModeValue, Stack, Divider, Icon, useToast, InputGroup, InputRightElement } from '@chakra-ui/react';
import NextLink from 'next/link';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function SignUpPage() {
  const supabase = createSupabaseBrowserClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // [NEW] State for password visibility

  const pageBg = useColorModeValue('gray.100', 'gray.900');
  const boxBg = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const brandGold = useColorModeValue('yellow.500', 'yellow.300');
  const brandGoldText = useColorModeValue('gray.800', 'gray.900');
  const brandGoldHover = useColorModeValue('yellow.600', 'yellow.400');

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast({ title: 'Sign-up Failed', description: error.message, status: 'error', duration: 5000, isClosable: true });
      setError(error.message);
    } else {
      toast({ title: 'Account Created', description: 'Please check your email to verify your account.', status: 'success', duration: 7000, isClosable: true });
      setSuccess('Success! Please check your email to verify your account.');
      setEmail('');
      setPassword('');
    }
    setIsLoading(false);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      toast({ title: 'Authentication Error', description: error.message, status: 'error', duration: 5000, isClosable: true });
      setIsLoading(false);
    }
  };

  return (
    <Flex flex="1" minH="80vh" align="center" justify="center" p={4} bg={pageBg}>
      <Box rounded="xl" bg={boxBg} boxShadow="2xl" p={8} width={{ base: '90%', md: '450px' }} border="1px" borderColor={borderColor}>
        <Heading fontSize="2xl" mb={6} textAlign="center" color={headingColor}>Create Your Account</Heading>
        {success && (<Alert status="success" mb={4} rounded="md"><AlertIcon />{success}</Alert>)}
        {error && (<Alert status="error" mb={4} rounded="md"><AlertIcon />{error}</Alert>)}
        <Stack spacing={4}>
          <Button width="full" variant="outline" borderColor={borderColor} leftIcon={<Icon as={FaGoogle} />} onClick={() => handleOAuthSignIn('google')} isLoading={isLoading}>Sign up with Google</Button>
          <Button width="full" variant="outline" borderColor={borderColor} leftIcon={<Icon as={FaGithub} />} onClick={() => handleOAuthSignIn('github')} isLoading={isLoading}>Sign up with GitHub</Button>
        </Stack>
        <Flex align="center" my={6}><Divider borderColor={borderColor} /><Text px={4} fontSize="sm" color={textColor}>OR</Text><Divider borderColor={borderColor} /></Flex>
        <form onSubmit={handleSignUp}>
          <Stack spacing={4}>
            <FormControl id="email-signup" isRequired><FormLabel color={textColor}>Email address</FormLabel><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" borderColor={borderColor} _hover={{ borderColor: useColorModeValue('gray.400', 'gray.500') }} /></FormControl>
            
            {/* [UPGRADE] Password input now has a visibility toggle */}
            <FormControl id="password-signup" isRequired>
              <FormLabel color={textColor}>Password</FormLabel>
              <InputGroup size="md">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Must be at least 6 characters"
                  borderColor={borderColor}
                  _hover={{ borderColor: useColorModeValue('gray.400', 'gray.500') }}
                />
                <InputRightElement width="3rem">
                  <Button h="1.75rem" size="sm" onClick={() => setShowPassword(!showPassword)} variant="ghost">
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            
            <Button width="full" bg={brandGold} color={brandGoldText} _hover={{ bg: brandGoldHover }} type="submit" isLoading={isLoading} size="lg" mt={2} shadow="md">Create Account with Email</Button>
          </Stack>
        </form>
        <Text mt={6} textAlign="center" color={textColor}>Already have an account?{' '}<Link as={NextLink} href="/sign-in" color={brandGold} fontWeight="bold">Sign In</Link></Text>
      </Box>
    </Flex>
  );
}