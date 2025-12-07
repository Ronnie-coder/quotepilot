'use client';

import React from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import Lottie from 'lottie-react';
import { FaCheckCircle } from 'react-icons/fa';

// Import Lottie JSON assets
// Ensure strict pathing based on SITREP
import invoicingAnim from '../assets/animations/invoicing.json';
import securityAnim from '../assets/animations/security.json';
import analyticsAnim from '../assets/animations/analytics.json';

interface FeatureProps {
  title: string;
  description: string;
  animationData: any;
  index: number;
}

const FeatureItem = ({ title, description, animationData, index }: FeatureProps) => {
  // Zig-Zag Logic: Even numbers = Text Left / Anim Right. Odd = Anim Left / Text Right.
  const isEven = index % 2 === 0;
  
  // Glassmorphism & Teal Theme Vars
  const glassBg = useColorModeValue('whiteAlpha.800', 'whiteAlpha.50');
  const glassBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = 'teal.400';

  return (
    <Flex
      align="center"
      justify="center"
      direction={{ base: 'column', lg: isEven ? 'row' : 'row-reverse' }}
      gap={{ base: 10, lg: 20 }}
      py={16}
    >
      {/* TEXT SECTION */}
      <Box
        flex={1}
        bg={glassBg}
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor={glassBorder}
        p={8}
        borderRadius="2xl"
        boxShadow="xl"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          bg: accentColor,
        }}
      >
        <Stack spacing={4}>
          <Flex align="center" color={accentColor} mb={2}>
            <Icon as={FaCheckCircle} w={5} h={5} mr={2} />
            <Text fontWeight="bold" letterSpacing="wide" fontSize="sm" textTransform="uppercase">
              Feature {index + 1}
            </Text>
          </Flex>
          
          <Heading as="h3" size="lg" fontWeight="bold">
            {title}
          </Heading>
          
          <Text fontSize="lg" color={textColor} lineHeight="tall">
            {description}
          </Text>
        </Stack>
      </Box>

      {/* ANIMATION SECTION */}
      <Box 
        flex={1} 
        maxW={{ base: '100%', lg: '500px' }}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Box 
            width="100%" 
            filter={`drop-shadow(0px 0px 20px rgba(56, 178, 172, 0.3))`} // Teal glow
        >
          <Lottie 
            animationData={animationData} 
            loop={true} 
            autoplay={true} 
          />
        </Box>
      </Box>
    </Flex>
  );
};

const Features = () => {
  const featuresData = [
    {
      title: 'Automated Invoicing Engine',
      description:
        'Stop chasing payments. Our automated engine generates professional, compliant invoices in seconds. Customize templates to match your brand and set up recurring billing cycles effortlessly.',
      animationData: invoicingAnim,
    },
    {
      title: 'Military-Grade Security',
      description:
        'Your client data is sacred. We utilize Row Level Security (RLS) and end-to-end encryption to ensure that your sensitive financial information remains accessible only to you.',
      animationData: securityAnim,
    },
    {
      title: 'Real-Time Analytics',
      description:
        'Fly by instrument, not by feel. Visual dashboards provide real-time insights into your revenue, outstanding payments, and client retention rates. Make decisions based on data, not guesses.',
      animationData: analyticsAnim,
    },
  ];

  return (
    <Box as="section" py={20} position="relative" overflow="hidden">
      {/* Decorative Background Elements */}
      <Box
        position="absolute"
        top="10%"
        right="0"
        width="400px"
        height="400px"
        bg="teal.500"
        opacity="0.1"
        filter="blur(100px)"
        zIndex="-1"
      />
      
      <Box
        position="absolute"
        bottom="10%"
        left="0"
        width="400px"
        height="400px"
        bg="blue.500"
        opacity="0.1"
        filter="blur(100px)"
        zIndex="-1"
      />

      <Container maxW="7xl">
        <Stack spacing={4} as={Container} maxW={'3xl'} textAlign={'center'} mb={16}>
          <Heading fontSize={{ base: '3xl', md: '5xl' }} fontWeight="bold">
            Built for <Text as="span" color="teal.400">Scale</Text>
          </Heading>
          <Text color={'gray.500'} fontSize={'xl'}>
            QuotePilot equips you with the tools necessary to ascend from freelancer to agency.
          </Text>
        </Stack>

        {featuresData.map((feature, index) => (
          <FeatureItem
            key={index}
            index={index}
            title={feature.title}
            description={feature.description}
            animationData={feature.animationData}
          />
        ))}
      </Container>
    </Box>
  );
};

export default Features;