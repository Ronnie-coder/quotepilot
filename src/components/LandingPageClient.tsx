'use client';

import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  useColorModeValue, 
  HStack, 
  Icon, 
  SimpleGrid,
  Stack,
  Flex
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Send, 
  Wallet, 
  ShieldCheck,
  Zap,
  Globe,
  Lock
} from 'lucide-react';

// --- SUB-COMPONENTS ---

const FeatureStep = ({ icon, step, title, text }: { icon: any, step: string, title: string, text: string }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700'); // Darkened for contrast
  
  return (
    <VStack 
      bg={bg} p={6} rounded="lg" borderWidth="1px" borderColor={border}
      align="start" spacing={4} shadow="sm" h="full"
      _hover={{ borderColor: 'brand.500', shadow: 'md' }}
      transition="all 0.2s"
    >
      <HStack justify="space-between" w="full">
        <Box p={2.5} bg="brand.50" rounded="md" color="brand.600">
          <Icon as={icon} size={20} aria-hidden="true" />
        </Box>
        <Text fontSize="lg" fontWeight="bold" color="gray.400">
          {step}
        </Text>
      </HStack>
      <Box>
        <Heading as="h3" size="sm" mb={2} fontWeight="700">{title}</Heading>
        <Text color="gray.600" fontSize="sm" lineHeight="tall">{text}</Text>
      </Box>
    </VStack>
  );
};

const TrustItem = ({ icon, title, text }: { icon: any, title: string, text: string }) => (
  <HStack align="start" spacing={3}>
    <Icon as={icon} size={20} color="brand.600" mt={1} aria-hidden="true" />
    <Box>
      <Text fontWeight="bold" fontSize="sm">{title}</Text>
      <Text fontSize="sm" color="gray.600">{text}</Text>
    </Box>
  </HStack>
);

// --- MAIN COMPONENT ---

export default function LandingPageClient() {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const heroBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box overflowX="hidden">
        
        {/* === 1. HERO SECTION === */}
        <Box bg={heroBg} borderBottom="1px" borderColor={cardBorder}>
            <Container maxW="container.lg" py={{ base: 20, md: 32 }}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={12} alignItems="center">
                    
                    {/* Left: Copy */}
                    <VStack align="start" spacing={6} maxW="lg">
                        <Heading as="h1" size="2xl" fontWeight="900" letterSpacing="-0.02em" lineHeight="1.1">
                            Send invoices on WhatsApp.<br />
                            Get paid faster.
                        </Heading>
                        <Text fontSize="lg" color={textColor} lineHeight="1.6">
                            The simplest way for African freelancers and SMEs to create professional invoices. No complex accounting. Just get paid.
                        </Text>
                        <HStack spacing={4} pt={2}>
                            <Button 
                                as={NextLink} href="/sign-up" 
                                colorScheme="brand" size="lg" px={8} 
                                fontSize="md" fontWeight="bold"
                                rightIcon={<Icon as={ArrowRight} size={18} />}
                                aria-label="Sign up for free"
                            >
                                Sign up free
                            </Button>
                        </HStack>
                        <Text fontSize="sm" color="gray.600" pt={2}>
                            No credit card required.
                        </Text>
                    </VStack>

                    {/* Right: Static Preview Card */}
                    <Box 
                        bg={cardBg} 
                        border="1px solid" borderColor={cardBorder} 
                        rounded="xl" p={6} shadow="lg" 
                        w="full" maxW="sm" mx="auto"
                        role="img" aria-label="Example invoice showing paid status"
                    >
                        <Flex justify="space-between" align="center" mb={6}>
                            <HStack>
                                <Box w={8} h={8} rounded="full" bg="green.100" color="green.700" display="flex" alignItems="center" justifyContent="center">
                                    <Icon as={CheckCircle2} size={16} />
                                </Box>
                                <VStack align="start" spacing={0}>
                                    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Status</Text>
                                    <Text fontSize="sm" fontWeight="bold" color="green.700">PAID</Text>
                                </VStack>
                            </HStack>
                            <Text fontSize="lg" fontWeight="800" fontFamily="mono">R 4,250.00</Text>
                        </Flex>
                        
                        <Stack spacing={3}>
                            <Box h="2px" bg="gray.100" w="full" rounded="full" overflow="hidden">
                                <Box h="full" w="100%" bg="green.500" />
                            </Box>
                            <HStack justify="space-between" fontSize="xs" color="gray.600">
                                <Text>Invoice #INV-001</Text>
                                <Text>Client: Palmsure</Text>
                            </HStack>
                        </Stack>

                        <Box mt={6} pt={4} borderTop="1px dashed" borderColor="gray.300">
                             <Flex align="center" gap={3}>
                                <Box p={2} bg="brand.50" rounded="md" color="brand.600">
                                    <Icon as={Send} size={16} />
                                </Box>
                                <Box>
                                    <Text fontSize="xs" fontWeight="bold">Sent via WhatsApp</Text>
                                    <Text fontSize="xs" color="gray.500">Today at 09:42 AM</Text>
                                </Box>
                             </Flex>
                        </Box>
                    </Box>

                </SimpleGrid>
            </Container>
        </Box>

        {/* === 2. HOW IT WORKS === */}
        <Box py={24} as="section" aria-labelledby="how-it-works-heading">
            <Container maxW="container.lg">
                <VStack spacing={12}>
                    <Box textAlign="center" maxW="2xl" mx="auto">
                        <Heading as="h2" size="lg" mb={4} fontWeight="800" id="how-it-works-heading">
                            Professional workflow. Zero friction.
                        </Heading>
                        <Text color={textColor} fontSize="lg">
                            QuotePilot replaces messy Word documents with a streamlined system designed for speed.
                        </Text>
                    </Box>
                    
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
                        <FeatureStep 
                            step="01"
                            icon={FileText}
                            title="Create"
                            text="Draft invoices in seconds. Your logo, your currency, your terms."
                        />
                        <FeatureStep 
                            step="02"
                            icon={Send}
                            title="Send"
                            text="Share a secure link directly on WhatsApp. Clients view it instantly on any device."
                        />
                        <FeatureStep 
                            step="03"
                            icon={Wallet}
                            title="Get Paid"
                            text="Accept payments via Bank Transfer or USDT (Stablecoin) directly to your wallet."
                        />
                    </SimpleGrid>
                </VStack>
            </Container>
        </Box>

        {/* === 3. TRUST & FEATURES === */}
        <Box py={20} bg={useColorModeValue('gray.50', 'gray.900')} borderTop="1px" borderColor={cardBorder} as="section">
            <Container maxW="container.lg">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={16}>
                    
                    <VStack align="start" spacing={6}>
                        <Heading as="h2" size="md">Why QuotePilot?</Heading>
                        <Text color={textColor} lineHeight="1.6">
                            We built this because traditional accounting software is too complex. 
                            You don't need a full ledger; you just need to send a bill and get paid.
                        </Text>
                    </VStack>

                    <Stack spacing={6}>
                        <TrustItem 
                            icon={Zap} 
                            title="Built for Speed" 
                            text="Create an invoice in under 2 minutes." 
                        />
                        <TrustItem 
                            icon={Globe} 
                            title="Local & Crypto" 
                            text="Supports ZAR, USD, NGN, and USDT on Polygon." 
                        />
                        <TrustItem 
                            icon={Lock} 
                            title="Verified Invoices" 
                            text="Cryptographic verification prevents invoice fraud." 
                        />
                    </Stack>

                </SimpleGrid>
            </Container>
        </Box>

        {/* === 4. FOOTER CTA === */}
        <Box py={24} textAlign="center" as="section">
            <Container maxW="container.sm">
                <VStack spacing={6}>
                    <Heading size="xl" fontWeight="900" letterSpacing="-0.02em">
                        Start sending professional invoices today.
                    </Heading>
                    <Text fontSize="lg" color={textColor}>
                        Simple. Professional. Free for early users.
                    </Text>
                    <Button 
                        as={NextLink} href="/sign-up"
                        size="lg" h={14} px={10} 
                        colorScheme="brand"
                        fontSize="md" fontWeight="bold"
                        mt={4}
                    >
                        Sign up free
                    </Button>
                </VStack>
            </Container>
        </Box>

    </Box>
  );
}