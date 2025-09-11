// src/components/Footer.tsx (ENHANCED)
'use client';

import { Box, Text, VStack, Center, useColorModeValue, Divider, HStack, Link, Spacer } from '@chakra-ui/react';
import NextLink from 'next/link';

const Footer = () => {
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box as="footer" width="100%" py={6}>
      <VStack spacing={4}>
        <Divider borderColor={borderColor} />
        <Center as={HStack} w="full" maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Text fontSize="sm" color={textColor}>
            © {new Date().getFullYear()} Coderon (Pty) Ltd. All rights reserved.
          </Text>
          <Spacer />
          <HStack spacing={4}>
            {/* VANGUARD DIRECTIVE: Placeholder links for professional credibility. */}
            <Link as={NextLink} href="#" fontSize="sm" color={textColor} _hover={{ textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
            <Link as={NextLink} href="#" fontSize="sm" color={textColor} _hover={{ textDecoration: 'underline' }}>
              Terms of Service
            </Link>
          </HStack>
        </Center>
      </VStack>
    </Box>
  );
};

export default Footer;