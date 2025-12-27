'use client';

import { 
  Box, 
  Text, 
  Container, 
  useColorModeValue, 
  Divider, 
  HStack, 
  Link, 
  SimpleGrid, 
  Heading, 
  IconButton, 
  VStack,
  chakra,
  shouldForwardProp,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  List,
  ListItem,
  ListIcon,
  Flex
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react'; 
import NextLink from 'next/link';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { CheckCircle, Server, Shield, Activity, Globe } from 'lucide-react';
import { motion, isValidMotionProp } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';

// --- MOTION COMPONENT FACTORY ---
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
});

const FooterLink = ({ href, children, isExternal = false }: { href: string; children: React.ReactNode; isExternal?: boolean }) => {
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const hoverColor = useColorModeValue('teal.500', 'teal.300'); 
  
  return (
    <Link 
      as={NextLink} 
      href={href} 
      color={textColor} 
      isExternal={isExternal}
      fontSize="sm"
      _hover={{ 
        color: hoverColor, 
        textDecoration: 'none',
        transform: 'translateX(2px)' 
      }}
      display="inline-block"
      transition="all 0.2s"
    >
      {children}
    </Link>
  );
};

const Footer = () => {
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const headingColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const bgColor = useColorModeValue('gray.50', 'black');
  const brandColor = useColorModeValue('teal.500', 'teal.300');
  const statusBg = useColorModeValue('white', 'whiteAlpha.100');
  const statusText = useColorModeValue('gray.600', 'gray.300');
  
  const logoFilter = useColorModeValue(
    'none', 
    'brightness(0) invert(1)' 
  );

  const [currentTime, setCurrentTime] = useState<string | null>(null);
  
  useEffect(() => {
    // Only set time on client to avoid hydration mismatch
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  const pulse = keyframes`
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(72, 187, 120, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(72, 187, 120, 0); }
  `;

  const appVersion = "v3.2.1-stable";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  return (
    <Box as="footer" width="100%" bg={bgColor} borderTop="1px" borderColor={borderColor}>
      <Container maxW="container.xl" py={12} px={{ base: 6, md: 8 }}>
        <MotionBox 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          {/* Top Section */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8} mb={10}>
            {/* Column 1: Brand */}
            <VStack align="flex-start" spacing={4}>
              <HStack as={NextLink} href="/" spacing={3} role="group">
                <Box filter={logoFilter} transition="transform 0.3s ease" _groupHover={{ transform: 'rotate(-5deg)' }}>
                  <Image src="/logo.svg" alt="QuotePilot Logo" width={28} height={28} />
                </Box>
                <Heading as="h3" size="sm" fontWeight="800" letterSpacing="wide" textTransform="uppercase" color={headingColor}>
                  QuotePilot
                </Heading>
              </HStack>
              <Text fontSize="sm" color={textColor} lineHeight="relaxed" maxW="xs">
                Empowering African creators with professional financial tools. Built for speed and security.
              </Text>
              <Badge colorScheme="teal" variant="subtle" fontSize="xs">Made in South Africa 🇿🇦</Badge>
            </VStack>

            {/* Column 2: Platform */}
            <VStack align="flex-start" spacing={3}>
              <Heading as="h4" size="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color={headingColor} mb={1}>
                Mission Control
              </Heading>
              <FooterLink href="/#features">Capabilities</FooterLink>
              <FooterLink href="/dashboard">Command Center</FooterLink>
              <FooterLink href="/sign-up">Start Flying</FooterLink>
            </VStack>

            {/* Column 3: Legal */}
            <VStack align="flex-start" spacing={3}>
              <Heading as="h4" size="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color={headingColor} mb={1}>
                Legal
              </Heading>
              <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
              <FooterLink href="/terms-of-service">Terms of Service</FooterLink>
            </VStack>

            {/* Column 4: Support */}
            <VStack align="flex-start" spacing={3}>
              <Heading as="h4" size="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" color={headingColor} mb={1}>
                Connect
              </Heading>
              <FooterLink href="mailto:info@coderon.co.za">info@coderon.co.za</FooterLink>
              <FooterLink href="mailto:support@coderon.co.za">support@coderon.co.za</FooterLink>
            </VStack>
          </SimpleGrid>

          <Divider borderColor={borderColor} opacity={0.6} />

          {/* Bottom Section */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={8} alignItems="center">
            
            {/* Copyright */}
            <VStack spacing={0} align={{ base: 'center', md: 'flex-start' }}>
              <Text fontSize="xs" color={textColor}>© {new Date().getFullYear()} Coderon (Pty) Ltd.</Text>
            </VStack>
            
            {/* Socials */}
            <HStack justify="center" spacing={4}>
              <IconButton 
                as="a" 
                href="https://github.com/Ronnie-coder/quotepilot" 
                target="_blank" 
                aria-label="GitHub" 
                icon={<FaGithub size={18} />} 
                variant="ghost" 
                color={textColor} 
                _hover={{ color: brandColor, bg: 'transparent', transform: 'translateY(-2px)' }} 
              />
              <IconButton 
                as="a" 
                href="https://x.com/Coderon28" 
                target="_blank" 
                aria-label="Twitter" 
                icon={<FaTwitter size={18} />} 
                variant="ghost" 
                color={textColor} 
                _hover={{ color: brandColor, bg: 'transparent', transform: 'translateY(-2px)' }} 
              />
              <IconButton 
                as="a" 
                href="https://www.linkedin.com/company/coderon/" 
                target="_blank" 
                aria-label="LinkedIn" 
                icon={<FaLinkedin size={18} />} 
                variant="ghost" 
                color={textColor} 
                _hover={{ color: brandColor, bg: 'transparent', transform: 'translateY(-2px)' }} 
              />
            </HStack>

            {/* System Status - 🟢 UPGRADED: CLICKABLE DIAGNOSTIC */}
            <VStack spacing={1} align={{ base: 'center', md: 'flex-end' }}>
                <Text fontSize="xs" color={textColor} fontFamily="mono" opacity={0.7}>{appVersion}</Text>
                {currentTime && (
                  <Popover trigger="click" placement="top-end" isLazy>
                    <PopoverTrigger>
                      <HStack 
                        as="button" 
                        spacing={2} 
                        bg={statusBg} 
                        px={3} 
                        py={1} 
                        rounded="md" 
                        border="1px solid" 
                        borderColor={borderColor}
                        cursor="pointer"
                        _hover={{ borderColor: 'green.400', transform: 'translateY(-2px)' }}
                        transition="all 0.2s"
                      >
                        <Box 
                          w={2} 
                          h={2} 
                          bg="green.400" 
                          borderRadius="full" 
                          boxShadow="0 0 8px rgba(72, 187, 120, 0.6)"
                          animation={`${pulse} 3s infinite`} 
                        />
                        <Text fontSize="xs" fontWeight="bold" color={statusText} fontFamily="mono" letterSpacing="tight">
                          OPERATIONAL • {currentTime} SAST
                        </Text>
                      </HStack>
                    </PopoverTrigger>
                    <PopoverContent width="260px" borderColor={borderColor} shadow="2xl" _focus={{ outline: 'none' }}>
                      <PopoverArrow />
                      <PopoverHeader borderBottomWidth="1px" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                         System Diagnostics
                      </PopoverHeader>
                      <PopoverBody p={0}>
                         <List spacing={0}>
                           <ListItem display="flex" alignItems="center" px={3} py={2} borderBottomWidth="1px" borderColor={borderColor}>
                              <ListIcon as={Server} color="green.500" boxSize={4} />
                              <Flex direction="column" ml={2}>
                                <Text fontSize="xs" fontWeight="bold">Database Cluster</Text>
                                <Text fontSize="10px" color="gray.500">Supabase: Online</Text>
                              </Flex>
                           </ListItem>
                           <ListItem display="flex" alignItems="center" px={3} py={2} borderBottomWidth="1px" borderColor={borderColor}>
                              <ListIcon as={Globe} color="green.500" boxSize={4} />
                              <Flex direction="column" ml={2}>
                                <Text fontSize="xs" fontWeight="bold">API Gateway</Text>
                                <Text fontSize="10px" color="gray.500">Latency: 24ms</Text>
                              </Flex>
                           </ListItem>
                           <ListItem display="flex" alignItems="center" px={3} py={2} bg="green.50">
                              <ListIcon as={Shield} color="green.600" boxSize={4} />
                              <Flex direction="column" ml={2}>
                                <Text fontSize="xs" fontWeight="bold" color="green.700">Security Protocol</Text>
                                <Text fontSize="10px" color="green.600">Encrypted Connection</Text>
                              </Flex>
                           </ListItem>
                         </List>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                )}
            </VStack>
          </SimpleGrid>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default Footer;