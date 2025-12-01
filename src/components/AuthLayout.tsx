'use client';

import { Box, Flex, useColorModeValue, Image, Heading, chakra, shouldForwardProp } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { motion, isValidMotionProp } from 'framer-motion';
import gsap from 'gsap';
import NextLink from 'next/link';

// --- FACTORY FIX ---
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
});

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);

  const bgColor = useColorModeValue('gray.50', 'black');
  // Dark mode blob color adjusted for better visibility
  const blobColor = useColorModeValue('brand.100', 'brand.900'); 
  const logoFilter = useColorModeValue('none', 'drop-shadow(0 0 5px rgba(49, 151, 149, 0.5))');

  // Ambient background animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const blobTl = gsap.timeline({ repeat: -1, yoyo: true });
      blobTl.to(blobRef.current, {
        duration: 25,
        x: '+=100',
        y: '+=80',
        scale: 1.2,
        rotation: 20,
        ease: 'sine.inOut',
      }).to(blobRef.current, {
        duration: 25,
        x: '-=100',
        y: '-=80',
        scale: 1,
        rotation: -15,
        ease: 'sine.inOut',
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Entrance animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <Flex
      ref={containerRef}
      minH="100vh"
      align="center"
      justify="center"
      p={4}
      bg={bgColor}
      position="relative"
      overflow="hidden"
    >
      {/* Background Decorative Blob */}
      <Box
        ref={blobRef}
        position="absolute"
        top="10%"
        left="50%"
        transform="translateX(-50%)"
        width={{ base: '150%', md: '100%'}}
        height="100%"
        bgGradient={`radial(${blobColor} 0%, transparent 60%)`}
        opacity={useColorModeValue(0.8, 0.4)}
        zIndex={0}
        pointerEvents="none"
      />
      
      <MotionBox
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={8}
        zIndex={1}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        width="full"
        maxW="md"
      >
        {/* Brand Logo */}
        <MotionBox 
            variants={itemVariants} 
            as={NextLink} 
            href="/" 
            display="flex"
            alignItems="center"
            gap={3}
            _hover={{ opacity: 0.8 }} 
            transition="opacity 0.2s"
        >
          <Box filter={logoFilter}>
             <Image src="/logo.svg" alt="QuotePilot Logo" boxSize="48px" />
          </Box>
          <Heading as="h1" size="lg" fontWeight="800" letterSpacing="tight" textTransform="uppercase">
            QuotePilot
          </Heading>
        </MotionBox>
        
        {/* Child Component (The Form) */}
        <MotionBox variants={itemVariants} w="full">
          {children}
        </MotionBox>
      </MotionBox>
    </Flex>
  );
};