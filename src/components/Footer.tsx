'use client';

import { 
  Box, 
  Text, 
  Container, 
  useColorModeValue, 
  Divider, 
  Link, 
  SimpleGrid, 
  Heading, 
  VStack,
  HStack,
  Flex
} from '@chakra-ui/react';
import NextLink from 'next/link';
import Image from 'next/image';

const FooterLink = ({ href, children, isExternal = false }: { href: string; children: React.ReactNode; isExternal?: boolean }) => {
  const textColor = useColorModeValue('gray.600', 'gray.400'); // Darkened for AA contrast
  const hoverColor = useColorModeValue('gray.900', 'white'); 
  
  return (
    <Link 
      as={NextLink} 
      href={href} 
      color={textColor} 
      isExternal={isExternal}
      fontSize="sm"
      _hover={{ 
        color: hoverColor, 
        textDecoration: 'underline' // Added underline on hover for accessibility
      }}
      transition="color 0.2s"
    >
      {children}
    </Link>
  );
};

const Footer = () => {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const headingColor = useColorModeValue('gray.900', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  const logoFilter = useColorModeValue(
    'grayscale(100%)', 
    'brightness(0) invert(1)' 
  );

  return (
    <Box as="footer" width="100%" bg={bgColor} borderTop="1px" borderColor={borderColor}>
      <Container maxW="container.xl" py={16} px={{ base: 6, md: 8 }}>
        
        {/* Top Section */}
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={12} mb={12}>
          
          {/* Column 1: Brand */}
          <VStack align="flex-start" spacing={4}>
            <HStack as={NextLink} href="/" spacing={3}>
              <Box filter={logoFilter} opacity={0.8}>
                <Image src="/logo.svg" alt="QuotePilot Logo" width={24} height={24} />
              </Box>
              <Heading as="h3" size="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" color={headingColor}>
                QuotePilot
              </Heading>
            </HStack>
            <Text fontSize="sm" color={textColor} lineHeight="relaxed" maxW="xs">
              Professional invoicing for African freelancers and SMEs.
            </Text>
            <Text fontSize="xs" color="gray.500" pt={2}>
              Made in South Africa 🇿🇦
            </Text>
          </VStack>

          {/* Column 2: Product */}
          <VStack align="flex-start" spacing={4}>
            <Heading as="h4" size="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color={headingColor}>
              Product
            </Heading>
            <FooterLink href="/sign-up">Sign up</FooterLink>
            <FooterLink href="/sign-in">Log in</FooterLink>
            <FooterLink href="/dashboard">Dashboard</FooterLink>
          </VStack>

          {/* Column 3: Legal */}
          <VStack align="flex-start" spacing={4}>
            <Heading as="h4" size="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color={headingColor}>
              Legal
            </Heading>
            <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
            <FooterLink href="/terms-of-service">Terms of Service</FooterLink>
          </VStack>

          {/* Column 4: Contact */}
          <VStack align="flex-start" spacing={4}>
            <Heading as="h4" size="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color={headingColor}>
              Support
            </Heading>
            <FooterLink href="mailto:support@coderon.co.za">support@coderon.co.za</FooterLink>
          </VStack>

        </SimpleGrid>

        <Divider borderColor={borderColor} opacity={0.5} />

        {/* Bottom Section */}
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between" 
          align={{ base: 'center', md: 'center' }}
          mt={8}
          gap={4}
        >
          <Text fontSize="xs" color={textColor}>
            © {new Date().getFullYear()} Coderon (Pty) Ltd.
          </Text>
          
          <Text fontSize="xs" color={textColor} opacity={0.7}>
            Founder-built in South Africa.
          </Text>
        </Flex>

      </Container>
    </Box>
  );
};

export default Footer;