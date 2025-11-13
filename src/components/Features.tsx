'use client';

import { Box, Container, Heading, SimpleGrid, Icon, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { FileText, Users, LayoutDashboard, Palette, ShieldCheck } from 'lucide-react';

// --- REFINEMENT: Updated component for modern look and hover effects ---
const Feature = ({ title, text, icon }: { title: string; text: string; icon: React.ElementType }) => {
  return (
    <VStack
      spacing={4}
      p={8}
      bg={useColorModeValue('white', 'gray.800')}
      borderRadius="xl"
      border="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      textAlign="center"
      align="center"
      boxShadow="md"
      transition="transform 0.2s ease-out, box-shadow 0.2s ease-out"
      _hover={{
        transform: 'translateY(-5px)',
        boxShadow: 'lg',
      }}
    >
      <Icon as={icon} w={10} h={10} color={useColorModeValue('yellow.500', 'yellow.300')} strokeWidth={1.5} />
      <Heading as="h3" size="md">{title}</Heading>
      <Text color={useColorModeValue('gray.600', 'gray.400')}>{text}</Text>
    </VStack>
  );
};

export default function Features() {
  return (
    <Box as="section" id="features" py={{ base: 16, md: 24 }} bg={useColorModeValue('gray.50', 'black')}>
      <Container maxW="container.xl">
        {/* --- REFINEMENT: Stronger, more confident heading copy --- */}
        <VStack spacing={4} textAlign="center" mb={16}>
          <Heading as="h2" size="2xl">Engineered for Ambition</Heading>
          <Text fontSize="lg" color={useColorModeValue('gray.600', 'gray.400')} maxW="3xl">
            QuotePilot isn't just a tool; it's your command center for getting paid. Fast, intuitive, and designed for the modern African professional.
          </Text>
        </VStack>
        {/* --- REFINEMENT: Benefit-driven, concise, and accurate feature descriptions --- */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
          <Feature
            icon={FileText}
            title="Effortless Invoicing"
            text="Generate and dispatch professional quotes and invoices in seconds. Convert accepted quotes to invoices with a single click."
          />
          <Feature
            icon={Palette}
            title="Professional Branding"
            text="Upload your logo and set company details once. Every document you create is automatically and perfectly branded."
          />
          <Feature
            icon={Users}
            title="Simple Client Management"
            text="An integrated CRM to keep client details in one place for rapid document creation and effortless tracking."
          />
          <Feature
            icon={LayoutDashboard}
            title="Mission Control Dashboard"
            text="Your command center. Instantly view total revenue, active clients, and recent document activity in one clear view."
          />
          <Feature
            icon={ShieldCheck}
            title="Secure & Reliable"
            text="Built on enterprise-grade infrastructure. Your data is secure, backed-up, and accessible from anywhere, anytime."
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
}