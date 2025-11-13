// FILE: src/components/LandingPageClient.tsx (Refined)
'use client';

import { Box, Button, Container, Heading, Text, VStack, useColorModeValue, HStack } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function LandingPageClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const brandColor = useColorModeValue('yellow.500', 'yellow.300'); // Use a theme-consistent color

  useEffect(() => {
    const elements = containerRef.current;
    if (elements) {
      // Ensure GSAP targets are specific enough
      gsap.fromTo(
        elements.querySelectorAll('.gsap-fade-in'),
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
      py={{ base: 16, md: 24 }}
    >
      <VStack spacing={6} textAlign="center">
        {/* REFINED: The entire headline is now semantically within the H1 tag */}
        <Heading as="h1" size={{ base: '3xl', md: '4xl' }} fontWeight="extrabold" className="gsap-fade-in">
          Building Africa&apos;s Ambition,
          <Box as="span" color={brandColor}> One Invoice at a Time.</Box>
        </Heading>

        <Text fontSize={{ base: 'lg', md: 'xl' }} color={textColor} maxW="3xl" className="gsap-fade-in">
          The professional invoicing tool for modern African creators, freelancers, and businesses. Fast, beautiful, and built to empower your growth.
        </Text>

        <HStack spacing={4} className="gsap-fade-in" pt={4}>
          <Button 
            as={NextLink} 
            href="/sign-up" 
            colorScheme="yellow" // More idiomatic Chakra UI prop
            size="lg" 
            px={8} 
            py={7}
          >
            Get Started For Free
          </Button>
          <Button 
            as={NextLink} 
            href="/dashboard"
            variant="outline"
            size="lg"
            px={8}
            py={7}
          >
            View Dashboard
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}