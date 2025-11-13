// FILE: src/components/Footer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Text, VStack, Container, useColorModeValue, Divider, HStack, Link, SimpleGrid, Heading, Spacer, IconButton } from '@chakra-ui/react';
import NextLink from 'next/link';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  return (
    <Link as={NextLink} href={href} color={textColor} _hover={{ color: useColorModeValue('yellow.500', 'yellow.300'), textDecoration: 'underline' }}>
      {children}
    </Link>
  );
};

const Footer = () => {
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('gray.50', 'black');

  // [1] STATE & EFFECT FOR LIVE CLOCK (from Coderon inspiration)
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    // Set initial time to avoid layout shift
    setCurrentTime(new Date().toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // [2] VERSION IDENTIFIER
  const appVersion = "v2.0 PRE-LAUNCH";

  return (
    <Box as="footer" width="100%" bg={bgColor} borderTop="1px" borderColor={borderColor}>
      <Container maxW="container.xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 8 }}>
        <VStack spacing={8} align="stretch">
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={{ base: 8, md: 10 }}>
            <VStack align="flex-start" spacing={3}>
              <Heading as="h3" size="md" letterSpacing="wider" textTransform="uppercase">QuotePilot</Heading>
              <Text fontSize="sm" color={textColor}>The professional invoicing tool for modern African creators, freelancers, and businesses.</Text>
            </VStack>
            <VStack align={{ base: 'flex-start' }} spacing={3}>
              <Heading as="h4" size="sm" color={textColor}>Product</Heading>
              <FooterLink href="/#features">Features</FooterLink>
              <FooterLink href="/#pricing">Pricing</FooterLink>
              <FooterLink href="/dashboard">Dashboard</FooterLink>
            </VStack>
            <VStack align={{ base: 'flex-start' }} spacing={3}>
              <Heading as="h4" size="sm" color={textColor}>Legal</Heading>
              <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
              <FooterLink href="/terms-of-service">Terms of Service</FooterLink>
            </VStack>
            <VStack align={{ base: 'flex-start' }} spacing={3}>
              <Heading as="h4" size="sm" color={textColor}>Contact Us</Heading>
              <FooterLink href="mailto:ronnie@coderon.co.za">ronnie@coderon.co.za</FooterLink>
              <FooterLink href="https://www.coderon.co.za">coderon.co.za</FooterLink>
            </VStack>
          </SimpleGrid>

          <Divider borderColor={borderColor} />

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full" alignItems="center">
            {/* Left: Copyright & Registration */}
            <VStack spacing={0} align={{ base: 'center', md: 'flex-start' }}>
              <Text fontSize="sm" color={textColor}>© {new Date().getFullYear()} Coderon (Pty) Ltd.</Text>
              <Text fontSize="xs" color={textColor}>Reg: 2025 / 482790 / 07</Text>
            </VStack>
            
            {/* Center: Social Links */}
            <HStack justify={{ base: 'center', md: 'center' }}>
              <IconButton as="a" href="https://github.com/Ronnie-coder" target="_blank" rel="noopener noreferrer" aria-label="GitHub" icon={<FaGithub />} variant="ghost" color={textColor} />
              <IconButton as="a" href="https://x.com/Coderon28" target="_blank" rel="noopener noreferrer" aria-label="Twitter" icon={<FaTwitter />} variant="ghost" color={textColor} />
              <IconButton as="a" href="https://www.linkedin.com/in/ronnie-nyamhute-8b302b360" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" icon={<FaLinkedin />} variant="ghost" color={textColor} />
            </HStack>

            {/* Right: Version & Clock */}
            <VStack spacing={0} align={{ base: 'center', md: 'flex-end' }}>
                <Text fontSize="sm" color={textColor}>{appVersion}</Text>
                <Text fontSize="xs" color={textColor} aria-label="Current time in Johannesburg">{currentTime} SAST</Text>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default Footer;