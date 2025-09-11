// src/components/LandingPageClient.tsx (CORRECTED)
'use client';

import { Box, Button, Container, Heading, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function LandingPageClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingColor = useColorModeValue('brand.500', 'brand.300');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    const elements = containerRef.current;
    if (elements) {
      gsap.fromTo(
        elements.querySelectorAll('.fade-in'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <Container 
      maxW="container.lg" 
      centerContent 
      ref={containerRef}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      flex="1"
    >
      <VStack spacing={6} textAlign="center">
        <Heading as="h1" size={{ base: '2xl', md: '4xl' }} color={headingColor} className="fade-in">
          Generate Professional Quotes in Seconds.
        </Heading>
        <Text fontSize={{ base: 'lg', md: 'xl' }} color={textColor} maxW="2xl" className="fade-in">
          QuotePilot is a smart quote and invoice generator for freelancers, SMEs, and small agencies in South Africa and beyond. Simple, fast, and free.
        </Text>
        <Box className="fade-in" pt={4}>
          {/* 
            VANGUARD DIRECTIVE: Trajectory Corrected.
            The href has been updated from "/quote" to the correct "/quote/new" route.
            The insurgency is neutralized.
          */}
          <Button as={NextLink} href="/quote/new" colorScheme="brand" size="lg" px={8} py={6}>
            Create Your First Quote
          </Button>
        </Box>
      </VStack>
    </Container>
  );
}