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
  Flex,
  SimpleGrid,
  Stack,
  Avatar,
  Badge
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { 
  ArrowRight, 
  CheckCircle2, 
  PlayCircle, 
  Users, 
  FileText, 
  Send, 
  Wallet, 
  Smartphone, 
  Globe, 
  ShieldCheck,
  Quote 
} from 'lucide-react';

// --- SUB-COMPONENTS ---

const FeatureStep = ({ icon, step, title, text }: { icon: any, step: string, title: string, text: string }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.100', 'gray.700');
  return (
    <VStack 
      bg={bg} p={6} rounded="2xl" borderWidth="1px" borderColor={border}
      align="start" spacing={4} shadow="lg" h="full"
      transition="transform 0.2s" _hover={{ transform: 'translateY(-5px)' }}
    >
      <HStack justify="space-between" w="full">
        <Box p={3} bg="teal.50" rounded="lg" color="teal.500">
          <Icon as={icon} size={24} />
        </Box>
        <Text fontSize="4xl" fontWeight="900" color="gray.100" lineHeight={1}>
          {step}
        </Text>
      </HStack>
      <Box>
        <Heading size="md" mb={2}>{title}</Heading>
        <Text color="gray.500" fontSize="sm">{text}</Text>
      </Box>
    </VStack>
  );
};

const TestimonialCard = ({ quote, author, company }: { quote: string, author: string, company: string }) => {
  const bg = useColorModeValue('gray.50', 'gray.900');
  return (
    <Box bg={bg} p={8} rounded="xl" position="relative">
      <Icon as={Quote} position="absolute" top={6} left={6} size={24} color="teal.500" opacity={0.2} fill="currentColor" />
      <VStack align="start" spacing={6} position="relative" zIndex={1}>
        <Text fontSize="md" fontStyle="italic" fontWeight="medium" pt={4}>
          "{quote}"
        </Text>
        <HStack>
          <Avatar name={author} size="sm" bg="teal.600" color="white" />
          <Box>
            <Text fontWeight="bold" fontSize="sm">{company}</Text>
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
};

const FeatureRow = ({ icon, title, text }: { icon: any, title: string, text: string }) => (
  <HStack align="start" spacing={4}>
    <Box p={2} bg="teal.100" color="teal.700" rounded="lg" mt={1}>
      <Icon as={icon} size={20} />
    </Box>
    <Box>
      <Text fontWeight="bold" fontSize="md">{title}</Text>
      <Text fontSize="sm" color="gray.500">{text}</Text>
    </Box>
  </HStack>
);

// --- MAIN COMPONENT ---

export default function LandingPageClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const floatCardRef = useRef<HTMLDivElement>(null);

  const textColor = useColorModeValue('gray.600', 'gray.300');
  const blobColor = useColorModeValue('teal.100', 'teal.900'); 
  
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(23, 25, 35, 0.8)');
  const cardBorder = useColorModeValue('gray.100', 'whiteAlpha.100');

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const cyclingWords = ['Invoice', 'Quote', 'Proposal'];
    let wordIndex = 0;

    const ctx = gsap.context(() => {
      // 1. Entrance Animation
      gsap.fromTo('.hero-animate', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
      );

      // 2. Ambient Blob
      gsap.to(blobRef.current, {
        duration: 15, x: '+=80', y: '+=40', scale: 1.15, rotation: 10, repeat: -1, yoyo: true, ease: 'sine.inOut',
      });
      
      // 3. Dynamic Headline
      const wordTl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });
      wordTl.to(wordRef.current, { duration: 0.4, y: -20, opacity: 0, ease: 'power2.in', onComplete: () => {
          wordIndex = (wordIndex + 1) % cyclingWords.length;
          if(wordRef.current) wordRef.current.textContent = cyclingWords[wordIndex];
      }}).set(wordRef.current, { y: 20 }).to(wordRef.current, { duration: 0.4, y: 0, opacity: 1, ease: 'power2.out' });

      // 4. Floating Card
      gsap.to(floatCardRef.current, { y: -15, duration: 2, repeat: -1, yoyo: true, ease: "power1.inOut" });

      // 5. Parallax
      const handleMouseMove = (e: MouseEvent) => {
        if (!contentRef.current) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to(contentRef.current, { duration: 0.7, x: -x * 15, y: -y * 15, ease: 'power2.out' });
        gsap.to(floatCardRef.current, { duration: 1, x: x * 20, rotationY: x * 5, rotationX: -y * 5, ease: 'power2.out' });
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <Box position="relative" overflowX="hidden" ref={containerRef}>
        
        {/* === HERO SECTION (UNTOUCHED) === */}
        <Box position="relative">
            <Box
                ref={blobRef}
                position="absolute" top="-30%" left="50%" transform="translateX(-50%)"
                width="120%" height="120%"
                bgGradient={`radial(${blobColor} 0%, transparent 60%)`}
                opacity={useColorModeValue(0.5, 0.15)} 
                zIndex={-1} pointerEvents="none"
            />

            <Container 
                maxW="container.lg" centerContent display="flex" flexDirection="column" justifyContent="center"
                pt={{ base: 24, md: 36 }} pb={{ base: 20, md: 32 }} minH={{ base: 'auto', md: 'calc(100vh - 80px)' }}
            >
                <Box ref={contentRef} position="relative" w="full">
                    <VStack spacing={8} textAlign="center" alignItems="center">
                    
                        <Box className="hero-animate">
                            <HStack spacing={2} bg={useColorModeValue('whiteAlpha.600', 'whiteAlpha.100')} px={4} py={1.5} rounded="full" border="1px solid" borderColor={useColorModeValue('gray.200', 'whiteAlpha.200')}>
                                <Icon as={Users} size={16} color="teal.500" />
                                <Text fontSize="xs" fontWeight="bold" color={textColor}>Joined by 14+ Early Pilots</Text>
                            </HStack>
                        </Box>

                        <Box className="hero-animate" maxW="4xl">
                            <Heading as="h1" size={{ base: '2xl', md: '4xl', lg: '5xl' }} fontWeight="900" letterSpacing="tight" lineHeight="1.1">
                                Building Africa&apos;s Ambition,<br />
                                One <Box as="span" color="teal.400" display="inline-block" minW="180px"><span ref={wordRef}>Invoice</span></Box> at a Time.
                            </Heading>
                        </Box>

                        <Text fontSize={{ base: 'lg', md: 'xl' }} color={textColor} maxW="2xl" lineHeight="1.6" className="hero-animate">
                            The professional command center for African creators and businesses. 
                            Create beautiful documents and track your revenue. Completely free for early pilots.
                        </Text>

                        <HStack spacing={4} className="hero-animate" pt={4} flexDir={{ base: 'column', sm: 'row' }} w={{ base: 'full', sm: 'auto' }}>
                            <Button as={NextLink} href="/sign-up" colorScheme="teal" size="lg" h={14} px={10} fontSize="md" w={{ base: 'full', sm: 'auto' }} rightIcon={<Icon as={ArrowRight} />} boxShadow="lg" _hover={{ transform: 'translateY(-2px)', boxShadow: '0 0 20px rgba(49, 151, 149, 0.5)' }}>
                                Start Flying Free
                            </Button>
                            <Button onClick={scrollToFeatures} variant="outline" size="lg" h={14} px={8} w={{ base: 'full', sm: 'auto' }} leftIcon={<Icon as={PlayCircle} />} borderColor={useColorModeValue('gray.300', 'gray.600')} _hover={{ bg: useColorModeValue('gray.50', 'whiteAlpha.100') }}>
                                See How It Works
                            </Button>
                        </HStack>

                        <Text fontSize="sm" color="gray.500" className="hero-animate" pt={2} fontWeight="medium">
                            No credit card required • Free for early adopters
                        </Text>

                        <Box className="hero-animate" mt={16} sx={{ perspective: '1000px' }}>
                            <Box ref={floatCardRef} bg={cardBg} backdropFilter="blur(20px) saturate(180%)" border="1px solid" borderColor={cardBorder} rounded="2xl" p={6} shadow="2xl" maxW="sm" mx="auto" position="relative" textAlign="left" style={{ transformStyle: 'preserve-3d' }}>
                                <Flex justify="space-between" align="center" mb={4}>
                                    <HStack>
                                        <Box w={8} h={8} rounded="full" bg="green.500" display="flex" alignItems="center" justifyContent="center">
                                            <Icon as={CheckCircle2} color="white" size={16} />
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Payment Received</Text>
                                            <Text fontSize="sm" fontWeight="bold" color="green.500">COMPLETE</Text>
                                        </VStack>
                                    </HStack>
                                    <Text fontSize="lg" fontWeight="800" fontFamily="mono">R 4,250.00</Text>
                                </Flex>
                                <Box h="2px" bg="gray.100" my={4} position="relative" overflow="hidden" rounded="full"><Box position="absolute" top={0} left={0} h="full" w="100%" bg="teal.400" /></Box>
                                <HStack justify="space-between" fontSize="xs" color="gray.500"><Text>Invoice #QP-2025-001</Text><Text>Client: CODERON</Text></HStack>
                            </Box>
                        </Box>
                    </VStack>
                </Box>
            </Container>
        </Box>

        {/* === 1. HOW IT WORKS === */}
        <Box id="features" py={20} bg={useColorModeValue('white', 'gray.900')}>
            <Container maxW="container.lg">
                <VStack spacing={12}>
                    <VStack textAlign="center" spacing={4}>
                        <Text color="teal.500" fontWeight="bold" letterSpacing="wide" fontSize="sm" textTransform="uppercase">Workflow</Text>
                        <Heading size="2xl">How QuotePilot Works</Heading>
                    </VStack>
                    
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
                        <FeatureStep 
                            step="01"
                            icon={FileText}
                            title="Create"
                            text="Generate a professional quote or invoice in seconds. Add your logo and details."
                        />
                        <FeatureStep 
                            step="02"
                            icon={Send}
                            title="Send"
                            text="Share the PDF directly via WhatsApp or Email. No complicated portals."
                        />
                        <FeatureStep 
                            step="03"
                            icon={Wallet}
                            title="Get Paid"
                            text="Track your revenue and get paid faster with clear, professional documents."
                        />
                    </SimpleGrid>
                </VStack>
            </Container>
        </Box>

        {/* === 2. BUILT FOR AFRICA === */}
        <Box py={20} bg={useColorModeValue('gray.50', 'blackAlpha.200')}>
            <Container maxW="container.lg">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={16} alignItems="center">
                    <VStack align="start" spacing={8}>
                        <Heading size="xl">Built for African Businesses</Heading>
                        <Text fontSize="lg" color="gray.500">
                            We understand the unique challenges of doing business on the continent. QuotePilot is designed to be lightweight, mobile-first, and currency-aware.
                        </Text>
                        
                        <Stack spacing={4} w="full">
                            <FeatureRow 
                                icon={Globe} 
                                title="Multi-Currency Support" 
                                text="Seamlessly switch between ZAR, USD, NGN, KES, and more." 
                            />
                            <FeatureRow 
                                icon={Smartphone} 
                                title="WhatsApp First" 
                                text="Documents are optimized for sharing on mobile platforms." 
                            />
                            <FeatureRow 
                                icon={ShieldCheck} 
                                title="Bank-Ready Invoices" 
                                text="Includes all necessary details for smooth EFT payments." 
                            />
                        </Stack>
                    </VStack>

                    {/* Visual Emphasis */}
                    <Box 
                        bgGradient="linear(to-br, teal.500, teal.700)" 
                        rounded="2xl" 
                        h="400px" 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center"
                        shadow="xl"
                        position="relative"
                        overflow="hidden"
                    >
                         {/* Decorative Circle */}
                         <Box position="absolute" top="-20%" right="-20%" w="300px" h="300px" bg="white" opacity={0.1} rounded="full" />
                         <VStack color="white" spacing={6} textAlign="center" zIndex={1} px={6}>
                             <Heading size="2xl">100%</Heading>
                             <Text fontSize="xl" fontWeight="medium">Free for early pilots</Text>
                             <Button as={NextLink} href="/sign-up" bg="white" color="teal.600" _hover={{ bg: 'gray.100' }}>
                                 Create Account Now
                             </Button>
                         </VStack>
                    </Box>
                </SimpleGrid>
            </Container>
        </Box>

        {/* === 3. TESTIMONIALS === */}
        <Box py={24} bg={useColorModeValue('white', 'gray.900')}>
            <Container maxW="container.lg">
                <VStack spacing={12}>
                    <Heading size="lg" textAlign="center">Trusted by Real Businesses</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
                        <TestimonialCard 
                            company="Palmsure Insurance Brokers"
                            author="Roy"
                            quote="QuotePilot helps us send professional invoices faster and track payments with ease."
                        />
                        <TestimonialCard 
                            company="MD Travels"
                            author="MD Travels"
                            quote="Simple, reliable, and built for the way we do business."
                        />
                    </SimpleGrid>
                </VStack>
            </Container>
        </Box>

        {/* === 4. FOOTER CTA === */}
        <Box py={20} bg="teal.600" color="white" textAlign="center">
            <Container maxW="container.md">
                <VStack spacing={8}>
                    <Heading size="2xl">Ready to upgrade?</Heading>
                    <Text fontSize="xl" opacity={0.9}>
                        Join other African businesses streamlining their workflow.
                    </Text>
                    <Button 
                        as={NextLink} href="/sign-up"
                        size="xl" h={16} px={12} 
                        bg="white" color="teal.600" 
                        fontSize="lg" fontWeight="bold"
                        rightIcon={<Icon as={ArrowRight} />}
                        _hover={{ transform: 'scale(1.05)', bg: 'gray.100' }}
                    >
                        Get Started for Free
                    </Button>
                    <Text fontSize="sm" opacity={0.7}>No credit card required. Cancel anytime.</Text>
                </VStack>
            </Container>
        </Box>

    </Box>
  );
}