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
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight, CheckCircle2, PlayCircle, Users } from 'lucide-react';

export default function LandingPageClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const floatCardRef = useRef<HTMLDivElement>(null);

  const textColor = useColorModeValue('gray.600', 'gray.300');
  const brandColor = useColorModeValue('brand.600', 'brand.300'); // Ensure 'brand' colors exist in theme.ts, otherwise fallback to teal.500
  const blobColor = useColorModeValue('teal.100', 'teal.900'); // Explicit Teal alignment
  
  // Glass Card Styles
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(23, 25, 35, 0.8)');
  const cardBorder = useColorModeValue('gray.100', 'whiteAlpha.100');

  // SMOOTH SCROLL HANDLER
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn("Commander Warning: 'features' ID not found. Ensure Features.tsx has id='features'");
    }
  };

  useEffect(() => {
    const cyclingWords = ['Invoice', 'Quote', 'Proposal'];
    let wordIndex = 0;

    const ctx = gsap.context(() => {
      // 1. Entrance Animation
      gsap.fromTo(
        '.hero-animate',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
      );

      // 2. Ambient Blob Animation
      const blobTl = gsap.timeline({ repeat: -1, yoyo: true });
      blobTl.to(blobRef.current, {
        duration: 15,
        x: '+=80',
        y: '+=40',
        scale: 1.15,
        rotation: 10,
        ease: 'sine.inOut',
      }).to(blobRef.current, {
        duration: 15,
        x: '-=40',
        y: '-=80',
        scale: 1,
        rotation: -5,
        ease: 'sine.inOut',
      });
      
      // 3. Dynamic Headline
      const wordTl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });
      wordTl.to(wordRef.current, {
        duration: 0.4,
        y: -20,
        opacity: 0,
        ease: 'power2.in',
        onComplete: () => {
          wordIndex = (wordIndex + 1) % cyclingWords.length;
          if(wordRef.current) wordRef.current.textContent = cyclingWords[wordIndex];
        },
      })
      .set(wordRef.current, { y: 20 })
      .to(wordRef.current, {
        duration: 0.4,
        y: 0,
        opacity: 1,
        ease: 'power2.out',
      });

      // 4. Floating Card "Levitation"
      gsap.to(floatCardRef.current, {
        y: -15,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });

      // 5. Parallax Effect (Mouse Movement)
      const handleMouseMove = (e: MouseEvent) => {
        if (!contentRef.current || !blobRef.current) return;
        const { clientX, clientY } = e;
        // Normalize coordinates
        const x = (clientX / window.innerWidth - 0.5) * 2;
        const y = (clientY / window.innerHeight - 0.5) * 2;

        gsap.to(contentRef.current, {
          duration: 0.7,
          x: -x * 15,
          y: -y * 15,
          ease: 'power2.out',
        });

        gsap.to(blobRef.current, {
          duration: 0.7,
          x: x * 40,
          y: y * 40,
          ease: 'power2.out',
        });
        
        gsap.to(floatCardRef.current, {
            duration: 1,
            x: x * 20,
            rotationY: x * 5,
            rotationX: -y * 5,
            ease: 'power2.out'
        });
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <Box position="relative" overflow="hidden" ref={containerRef}>
        {/* BACKGROUND BLOBS */}
        <Box
            ref={blobRef}
            position="absolute"
            top="-30%"
            left="50%"
            transform="translateX(-50%)"
            width="120%"
            height="120%"
            bgGradient={`radial(${blobColor} 0%, transparent 60%)`}
            opacity={useColorModeValue(0.5, 0.15)} 
            zIndex={-1}
            pointerEvents="none"
        />

        <Container 
          maxW="container.lg" 
          centerContent 
          display="flex"
          flexDirection="column"
          justifyContent="center"
          pt={{ base: 24, md: 36 }}
          pb={{ base: 20, md: 32 }}
          minH={{ base: 'auto', md: 'calc(100vh - 80px)' }}
        >
          <Box ref={contentRef} position="relative" w="full">
            <VStack spacing={8} textAlign="center" alignItems="center">
              
              {/* SOCIAL PROOF */}
              <Box className="hero-animate">
                <HStack 
                  spacing={2} 
                  bg={useColorModeValue('whiteAlpha.600', 'whiteAlpha.100')} 
                  px={4} py={1.5} 
                  rounded="full" 
                  border="1px solid" 
                  borderColor={useColorModeValue('gray.200', 'whiteAlpha.200')}
                >
                  <Icon as={Users} size={16} color="teal.500" />
                  <Text fontSize="xs" fontWeight="bold" color={textColor}>
                    Joined by 10+ Early Pilots
                  </Text>
                </HStack>
              </Box>

              {/* HEADLINE */}
              <Box className="hero-animate" maxW="4xl">
                  <Heading 
                      as="h1" 
                      size={{ base: '2xl', md: '4xl', lg: '5xl' }} 
                      fontWeight="900" 
                      letterSpacing="tight"
                      lineHeight="1.1"
                  >
                    Building Africa&apos;s Ambition,<br />
                    One <Box as="span" color="teal.400" display="inline-block" minW="180px"><span ref={wordRef}>Invoice</span></Box> at a Time.
                  </Heading>
              </Box>

              {/* SUBTEXT */}
              <Text 
                  fontSize={{ base: 'lg', md: 'xl' }} 
                  color={textColor} 
                  maxW="2xl" 
                  lineHeight="1.6"
                  className="hero-animate"
              >
                The professional command center for African creators and businesses. 
                Create beautiful documents and track your revenue. Completely free for early pilots.
              </Text>

              {/* ACTION BUTTONS */}
              <HStack 
                spacing={4} 
                className="hero-animate" 
                pt={4} 
                flexDir={{ base: 'column', sm: 'row' }} 
                w={{ base: 'full', sm: 'auto' }}
              >
                <Button 
                  as={NextLink} 
                  href="/sign-up" 
                  colorScheme="teal" 
                  size="lg" 
                  h={14}
                  px={10} 
                  fontSize="md"
                  w={{ base: 'full', sm: 'auto' }}
                  rightIcon={<Icon as={ArrowRight} />}
                  boxShadow="lg"
                  _hover={{ 
                    transform: 'translateY(-2px)', 
                    boxShadow: '0 0 20px rgba(49, 151, 149, 0.5)' // Teal Glow on Hover
                  }}
                >
                  Start Flying Free
                </Button>
                
                <Button 
                  onClick={scrollToFeatures} // ATTACHED SCROLL HANDLER HERE
                  variant="outline" 
                  size="lg"
                  h={14}
                  px={8}
                  w={{ base: 'full', sm: 'auto' }}
                  leftIcon={<Icon as={PlayCircle} />}
                  borderColor={useColorModeValue('gray.300', 'gray.600')}
                  _hover={{ bg: useColorModeValue('gray.50', 'whiteAlpha.100') }}
                >
                  See How It Works
                </Button>
              </HStack>

              <Text fontSize="sm" color="gray.500" className="hero-animate" pt={2} fontWeight="medium">
                  No credit card required •  Free for early adopters
              </Text>

              {/* --- THE "MONEY SHOT" VISUAL --- */}
              <Box 
                className="hero-animate" 
                mt={16} 
                sx={{ perspective: '1000px' }} // Ensures 3D effect works
              >
                 <Box
                    ref={floatCardRef}
                    bg={cardBg}
                    backdropFilter="blur(20px) saturate(180%)"
                    border="1px solid"
                    borderColor={cardBorder}
                    rounded="2xl"
                    p={6}
                    shadow="2xl"
                    maxW="sm"
                    mx="auto"
                    position="relative"
                    textAlign="left"
                    // 🟢 COMMANDER FIX: Move CSS property to style prop
                    style={{ transformStyle: 'preserve-3d' }} 
                 >
                    {/* Fake Invoice UI */}
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
                    
                    <Box h="2px" bg="gray.100" my={4} position="relative" overflow="hidden" rounded="full">
                         <Box position="absolute" top={0} left={0} h="full" w="100%" bg="teal.400" />
                    </Box>

                    <HStack justify="space-between" fontSize="xs" color="gray.500">
                        <Text>Invoice #QP-2025-001</Text>
                        <Text>Client: CODERON</Text>
                    </HStack>

                    {/* Decorative Elements around the card */}
                    <Box position="absolute" top="-10px" right="-10px" w={4} h={4} bg="orange.400" rounded="full" opacity={0.8} />
                    <Box position="absolute" bottom="-15px" left="20px" w={8} h={8} bg="blue.400" rounded="full" opacity={0.6} zIndex={-1} />
                 </Box>
              </Box>

            </VStack>
          </Box>
        </Container>
    </Box>
  );
}