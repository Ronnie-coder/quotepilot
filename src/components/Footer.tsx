// FILE: src/components/Footer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Text, VStack, Container, useColorModeValue, Divider, HStack, Link, SimpleGrid, Heading, IconButton, Image } from '@chakra-ui/react';
import NextLink from 'next/link';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  return (
    <Link 
      as={NextLink} 
      href={href} 
      color={textColor} 
      _hover={{ color: useColorModeValue('yellow.500', 'yellow.300'), textDecoration: 'underline' }}
    >
      {children}
    </Link>
  );
};

const Footer = () => {
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('gray.50', 'black');

  // State & Effect for Live Clock
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  // Version Identifier
  const appVersion = "v1.0.0-PROD";

  return (
    <Box as="footer" width="100%" bg={bgColor} borderTop="1px" borderColor={borderColor}>
      <Container maxW="container.xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 8 }}>
        <VStack spacing={8} align="stretch">
          {/* Top Section: Links */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={{ base: 8, md: 10 }}>
            <VStack align="flex-start" spacing={3}>
              <Heading as="h3" size="md" letterSpacing="wider" textTransform="uppercase">QuotePilot</Heading>
              <Text fontSize="sm" color={textColor}>The professional invoicing tool for modern African creators, freelancers, and businesses.</Text>
            </VStack>
            <VStack align={{ base: 'flex-start' }} spacing={3}>
              <Heading as="h4" size="sm" color={textColor}>Product</Heading>
              <FooterLink href="/#features">Features</FooterLink>
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

          {/* Middle Section: Copyright, Socials, Version */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full" alignItems="center">
            <VStack spacing={0} align={{ base: 'center', md: 'flex-start' }}>
              <Text fontSize="sm" color={textColor}>© {new Date().getFullYear()} Coderon (Pty) Ltd.</Text>
              <Text fontSize="xs" color={textColor}>Reg: 2025 / 482790 / 07</Text>
            </VStack>
            
            <HStack justify={{ base: 'center', md: 'center' }}>
              <IconButton as="a" href="https://github.com/Ronnie-coder" target="_blank" rel="noopener noreferrer" aria-label="GitHub" icon={<FaGithub />} variant="ghost" color={textColor} />
              <IconButton as="a" href="https://x.com/Coderon28" target="_blank" rel="noopener noreferrer" aria-label="Twitter" icon={<FaTwitter />} variant="ghost" color={textColor} />
              <IconButton as="a" href="https://www.linkedin.com/in/ronnie-nyamhute-8b302b360" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" icon={<FaLinkedin />} variant="ghost" color={textColor} />
            </HStack>

            <VStack spacing={0} align={{ base: 'center', md: 'flex-end' }}>
                <Text fontSize="sm" color={textColor}>{appVersion}</Text>
                {currentTime && <Text fontSize="xs" color={textColor} aria-label="Current time in Johannesburg">{currentTime} SAST</Text>}
            </VStack>
          </SimpleGrid>
          
          <Divider borderColor={borderColor} />

          {/* Bottom Section: Powered by Coderon */}
          <VStack spacing={3} pt={4}>
            <Text fontSize="sm" color={textColor}>Powered by</Text>
            <Link as={NextLink} href="https://www.coderon.co.za" isExternal>
              <Image 
                // CORRECTED: Image source now points to the unique Coderon logo file
                src="/coderon-logo.svg" 
                alt="Coderon Logo" 
                height="40px" 
                filter={useColorModeValue('none', 'invert(1)')}
                transition="transform 0.2s ease-in-out"
                _hover={{ transform: 'scale(1.05)' }}
              />
            </Link>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Footer;