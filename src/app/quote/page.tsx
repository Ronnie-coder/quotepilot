// /src/app/quote/page.tsx
'use client'; // This page uses client components

import { Box, Container, Heading, VStack } from '@chakra-ui/react';
import InvoiceForm from '../../components/InvoiceForm';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function QuoteBuilderPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  // Add the same subtle animation as the landing page
  useEffect(() => {
    const elements = pageRef.current;
    if (elements) {
      gsap.fromTo(
        elements.querySelectorAll('.fade-in'),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power2.out',
        }
      );
    }
  }, []);

  return (
    // We removed the outer <Box> and the duplicate <Navbar />
    <Container maxW="container.xl" py={{ base: 6, md: 10 }} ref={pageRef}>
      <VStack spacing={8} align="stretch">
        {/* 1. Refined & Animated Heading */}
        <Box className="fade-in">
          <Heading as="h2" size="xl" fontWeight="semibold" color="gray.700">
            Quote & Invoice Builder
          </Heading>
        </Box>

        {/* 2. The form is now also animated */}
        <Box className="fade-in">
          <InvoiceForm />
        </Box>
      </VStack>
    </Container>
  );
}