'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Box, Button, Flex, FormControl, FormLabel, Input, Heading, Text, Link, Alert, AlertIcon, useColorModeValue, Stack, Divider, Icon, useToast, InputGroup, InputRightElement } from '@chakra-ui/react';
import NextLink from 'next/link';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';

export default function SignUpPage() {
  const supabase = createSupabaseBrowserClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const boxBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const brandColor = useColorModeValue('brand.600', 'brand.400');

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
      setSuccess('Success! Please check your email to verify your account.');
      setEmail('');
      setPassword('');
    }
    setIsLoading(false);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/auth/callback` } });
    if (error) toast({ title: 'Error', description: error.message, status: 'error' });
  };

  return (
    <AuthLayout>
      <Box rounded="2xl" bg={boxBg} boxShadow="2xl" p={{ base: 6, md: 8 }} border="1px" borderColor={borderColor}>
        <Heading fontSize="xl" mb={6} textAlign="center" fontWeight="bold" color={useColorModeValue('gray.700', 'white')}>
          Join the Fleet
        </Heading>
        {success && (<Alert status="success" variant="subtle" mb={4} rounded="md"><AlertIcon />{success}</Alert>)}
        {error && (<Alert status="error" variant="subtle" mb={4} rounded="md"><AlertIcon />{error}</Alert>)}
        
        <Stack spacing={3} mb={6}>
          <Button variant="outline" borderColor={borderColor} leftIcon={<Icon as={FaGoogle} />} onClick={() => handleOAuthSignIn('google')}>Sign up with Google</Button>
          <Button variant="outline" borderColor={borderColor} leftIcon={<Icon as={FaGithub} />} onClick={() => handleOAuthSignIn('github')}>Sign up with GitHub</Button>
        </Stack>
        
        <Flex align="center" mb={6}>
            <Divider borderColor={borderColor} />
            <Text px={4} fontSize="xs" color="gray.500" fontWeight="bold">OR</Text>
            <Divider borderColor={borderColor} />
        </Flex>
        
        <form onSubmit={handleSignUp}>
          <Stack spacing={4}>
            <FormControl id="email-signup" isRequired>
              <FormLabel fontSize="sm">Email address</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" borderColor={borderColor} />
            </FormControl>
            
            <FormControl id="password-signup" isRequired>
              <FormLabel fontSize="sm">Password</FormLabel>
              <InputGroup size="md">
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" borderColor={borderColor} />
                <InputRightElement width="3rem">
                  <Button h="1.75rem" size="sm" onClick={() => setShowPassword(!showPassword)} variant="ghost">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            
            <Button width="full" colorScheme="brand" type="submit" isLoading={isLoading} size="lg">Create Account</Button>
          </Stack>
        </form>

        <Text mt={6} textAlign="center" fontSize="sm" color="gray.500">
          Already flying with us? <Link as={NextLink} href="/sign-in" color={brandColor} fontWeight="bold">Sign In</Link>
        </Text>
      </Box>
    </AuthLayout>
  );
}