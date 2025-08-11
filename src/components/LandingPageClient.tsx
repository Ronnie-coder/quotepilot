// /src/components/LandingPageClient.tsx
'use client';

import { Box, Button, Container, Heading, Text, VStack, Flex } from '@chakra-ui/react';
import NextLink from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const LottiePlayer = dynamic(() => import('@lottiefiles/react-lottie-player').then(mod => mod.Player), {
  ssr: false,
});

export default function LandingPageClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation logic remains the same
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
    // --- THE SECOND KEY FIX ---
    // We replace the complex Flex container with a simple Container that grows.
    // This component no longer tries to create its own layout. It just fills the space
    // that layout.tsx gives it.
    <Container 
      maxW="container.lg" 
      centerContent 
      ref={containerRef}
      display="flex" // Use flex to center the VStack
      flexDirection="column"
      justifyContent="center"
      flex="1" // This makes the Container itself grow to fill the main area
    >
      {/* The Lottie Player is moved inside the main Container */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        zIndex={-1}
        opacity={0.1}
      >
        <LottiePlayer
          autoplay
          loop
          src="https://assets1.lottiefiles.com/packages/lf20_yCjSOT.json"
          style={{ width: '100%', height: '100%' }}
        />
      </Box>

      {/* The content VStack remains the same */}
      <VStack spacing={6} textAlign="center">
        <Heading as="h1" size={{ base: '2xl', md: '4xl' }} color="brand.500" className="fade-in">
          Generate Professional Quotes in Seconds.
        </Heading>
        <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.600" maxW="2xl" className="fade-in">
          QuotePilot is a smart quote and invoice generator for freelancers, SMEs, and small agencies in South Africa and beyond. Simple, fast, and free.
        </Text>
        <Box className="fade-in" pt={4}>
          <Button as={NextLink} href="/quote" colorScheme="brand" size="lg" px={8} py={6}>
            Create Your First Quote
          </Button>
        </Box>
      </VStack>
    </Container>
  );
}
