'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
  Box, 
  Button, 
  Flex, 
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
  Divider, 
  Icon, 
  useToast, 
  InputGroup, 
  InputRightElement,
  SimpleGrid,
  VStack
} from '@chakra-ui/react';
import Image from 'next/image';
import NextLink from 'next/link';
import { FaGoogle, FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { SiNotion } from 'react-icons/si'; 
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';

export default function SignInPage() {
  const supabase = createSupabaseBrowserClient();
  const toast = useToast();
  
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Theme Variables
  const boxBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.300', 'gray.600'); // Improved contrast
  const tealColor = useColorModeValue('teal.600', 'teal.400');
  const labelColor = useColorModeValue('gray.700', 'gray.300');

  // LOGO VISIBILITY LOGIC
  const logoFilter = useColorModeValue(
    'none', 
    'brightness(0) invert(1) drop-shadow(0 0 5px rgba(49, 151, 149, 0.5))'
  );

  // Sign In Logic (Email/Pass)
  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: 'Sign-in Failed', description: error.message, status: 'error', duration: 5000, isClosable: true });
      setError(error.message);
    }
    // Auth Listener handles redirect
    setIsLoading(false);
  };

  // OAuth Logic
  const handleOAuthSignIn = async (provider: any) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider, 
      options: { redirectTo: `${location.origin}/auth/callback` } 
    });
    if (error) {
      toast({ title: 'Connection Error', description: error.message, status: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Box 
        rounded="2xl" 
        bg={boxBg} 
        boxShadow="xl" 
        p={{ base: 6, md: 8 }} 
        border="1px" 
        borderColor={borderColor}
        maxW="md"
        w="full"
        mx="auto"
      >
        {/* LOGO HEADER */}
        <VStack spacing={4} mb={6}>
          <Box filter={logoFilter} transition="all 0.3s">
             <Image src="/logo.svg" alt="QuotePilot" width={48} height={48} priority />
          </Box>
          <Heading as="h1" fontSize="xl" textAlign="center" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
            Sign in to QuotePilot
          </Heading>
        </VStack>
        
        {error && (<Alert status="error" variant="subtle" mb={4} rounded="md" fontSize="sm"><AlertIcon />{error}</Alert>)}

        {/* OAUTH GRID */}
        <SimpleGrid columns={2} spacing={3} mb={6}>
          <Button 
            variant="outline" 
            borderColor={borderColor} 
            leftIcon={<Icon as={FaGoogle} />} 
            onClick={() => handleOAuthSignIn('google')}
            fontSize="sm"
            aria-label="Sign in with Google"
          >
            Google
          </Button>
          <Button 
            variant="outline" 
            borderColor={borderColor} 
            leftIcon={<Icon as={FaGithub} />} 
            onClick={() => handleOAuthSignIn('github')}
            fontSize="sm"
            aria-label="Sign in with GitHub"
          >
            GitHub
          </Button>
          <Button 
            variant="outline" 
            borderColor={borderColor} 
            leftIcon={<Icon as={FaLinkedin} color="#0077b5" />} 
            onClick={() => handleOAuthSignIn('linkedin_oidc')}
            fontSize="sm"
            aria-label="Sign in with LinkedIn"
          >
            LinkedIn
          </Button>
          <Button 
            variant="outline" 
            borderColor={borderColor} 
            leftIcon={<Icon as={FaTwitter} />} 
            onClick={() => handleOAuthSignIn('twitter')}
            fontSize="sm"
            aria-label="Sign in with X (Twitter)"
          >
            X (Twitter)
          </Button>
          <Button 
            variant="outline" 
            borderColor={borderColor} 
            leftIcon={<Icon as={SiNotion} />} 
            onClick={() => handleOAuthSignIn('notion')}
            fontSize="sm"
            gridColumn="span 2"
            _hover={{ bg: useColorModeValue('gray.50', 'whiteAlpha.100') }}
            aria-label="Sign in with Notion"
          >
            Continue with Notion
          </Button>
        </SimpleGrid>

        {/* DIVIDER */}
        <Flex align="center" mb={6}>
            <Divider borderColor={borderColor} />
            <Text px={4} fontSize="xs" color="gray.500" fontWeight="bold">OR</Text>
            <Divider borderColor={borderColor} />
        </Flex>

        {/* LOGIN FORM */}
        <form onSubmit={handleSignIn}>
          <Stack spacing={4}>
            <FormControl id="email" isRequired>
              <FormLabel fontSize="sm" color={labelColor}>Email address</FormLabel>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@company.com" 
                borderColor={borderColor}
                focusBorderColor="teal.500"
                _hover={{ borderColor: 'teal.300' }}
              />
            </FormControl>
            
            <FormControl id="password" isRequired>
              <FormLabel fontSize="sm" color={labelColor}>Password</FormLabel>
              <InputGroup size="md">
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  borderColor={borderColor}
                  focusBorderColor="teal.500"
                  _hover={{ borderColor: 'teal.300' }}
                />
                <InputRightElement width="3rem">
                  <Button h="1.75rem" size="sm" onClick={() => setShowPassword(!showPassword)} variant="ghost" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            
            <Flex justify="flex-end">
              <Link as={NextLink} href="/forgot-password" fontSize="xs" color={tealColor} fontWeight="bold">Forgot Password?</Link>
            </Flex>

            <Button width="full" colorScheme="teal" type="submit" isLoading={isLoading} size="lg" shadow="md">
              Sign In
            </Button>
          </Stack>
        </form>
        
        <Text mt={6} textAlign="center" fontSize="sm" color="gray.600">
          New to QuotePilot? <Link as={NextLink} href="/sign-up" color={tealColor} fontWeight="bold">Sign Up</Link>
        </Text>
      </Box>
    </AuthLayout>
  );
}