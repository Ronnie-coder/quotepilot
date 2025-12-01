'use client';

import {
  Box,
  Flex,
  Heading,
  Button,
  useColorMode,
  useColorModeValue,
  Spacer,
  HStack,
  Link as ChakraLink,
  IconButton,
  useToast,
  useDisclosure,
  Collapse,
  Divider,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  MenuDivider,
  Tooltip,
  Badge,
  Container,
  chakra,
  shouldForwardProp
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { LayoutDashboard, FileText, Settings, LogOut, Users, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; 
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { motion, isValidMotionProp } from 'framer-motion';
import { SupportModal } from './SupportModal';

// --- CONFIGURATION ---
const TAGLINE = "Join fellow pilots across Africa 🌍";

// --- MOTION COMPONENT FACTORY ---
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
});

const MotionList = chakra(motion.ul, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
});

const MotionListItem = chakra(motion.li, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
});

const authenticatedLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/quotes', label: 'Documents', icon: FileText },
];

const unauthenticatedLinks = [
  { href: '/sign-in', label: 'Log In', variant: 'ghost' },
  { href: '/sign-up', label: 'Start Flying', variant: 'solid' },
];

// --- COMPONENTS ---

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  
  const activeColor = useColorModeValue('brand.600', 'brand.300');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');
  const hoverColor = useColorModeValue('brand.500', 'brand.200');

  return (
    <ChakraLink
      as={NextLink}
      href={href}
      p={2}
      fontSize="sm"
      fontWeight={600}
      color={isActive ? activeColor : inactiveColor}
      position="relative"
      _hover={{
        textDecoration: 'none',
        color: hoverColor,
      }}
    >
      {children}
      {/* The Underline Indicator */}
      <Box 
        position="absolute"
        bottom="0"
        left="0"
        h="2px"
        w="100%"
        bg={activeColor}
        transform={isActive ? 'scaleX(1)' : 'scaleX(0)'}
        transformOrigin="bottom left"
        transition="transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)"
      />
    </ChakraLink>
  );
};

type NavbarClientProps = {
  user: User | null;
};

const NavbarClient = ({ user }: NavbarClientProps) => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter(); 
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  
  // Mobile Menu State
  const { isOpen, onToggle } = useDisclosure();
  
  // Support Modal State
  const { isOpen: isSupportOpen, onOpen: onSupportOpen, onClose: onSupportClose } = useDisclosure();

  // Glassmorphism Variables
  const bgColor = useColorModeValue('rgba(255, 255, 255, 0.85)', 'rgba(23, 25, 35, 0.8)');
  const backdropFilter = "saturate(180%) blur(12px)";
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  
  const logoFilter = useColorModeValue('none', 'drop-shadow(0 0 6px rgba(79, 209, 197, 0.6))');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Systems powering down.',
      description: 'See you in the skies soon, Commander.',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
      variant: 'subtle', 
    });
    router.push('/');
    router.refresh(); 
  };

  const handleMobileLinkClick = () => {
    if (isOpen) onToggle();
  };
  
  // Animation Variants
  const mobileMenuVariants = {
    open: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
  };

  const mobileLinkVariants = {
    open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
    closed: { y: 20, opacity: 0, transition: { y: { stiffness: 1000 } } }
  };

  return (
    <>
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={100}
        w="full"
        bg={bgColor}
        backdropFilter={backdropFilter}
        borderBottom="1px"
        borderColor={borderColor}
        transition="all 0.2s ease-in-out"
      >
        <Container maxW="container.xl" px={{ base: 4, md: 8 }}>
          <Flex h={16} alignItems="center" justifyContent="space-between">
            
            {/* --- LOGO SECTION --- */}
            <Tooltip label={TAGLINE} placement="bottom-start" hasArrow bg="brand.800" color="white" fontSize="xs">
              <ChakraLink 
                as={NextLink} 
                href={user ? '/dashboard' : '/'} 
                _hover={{ textDecoration: 'none' }}
                role="group"
              >
                <HStack spacing={3}>
                  <Box 
                    filter={logoFilter} 
                    transition="transform 0.3s ease"
                    _groupHover={{ transform: 'rotate(-10deg) scale(1.1)' }} 
                  >
                    <Image src="/logo.svg" alt="QuotePilot Logo" width={32} height={32} priority />
                  </Box>
                  <Heading 
                    as="h1" 
                    size="md" 
                    fontWeight="800" 
                    letterSpacing="tight"
                    color={useColorModeValue('gray.800', 'white')}
                  >
                    QuotePilot
                  </Heading>
                </HStack>
              </ChakraLink>
            </Tooltip>

            <Spacer />

            {/* --- DESKTOP NAV LINKS --- */}
            <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
              {user && authenticatedLinks.map(link => (
                <NavLink key={link.label} href={link.href}>
                  <HStack spacing={1}>
                    <Icon as={link.icon} size={16} />
                    <Text>{link.label}</Text>
                  </HStack>
                </NavLink>
              ))}
            </HStack>

            <Spacer display={{ base: 'none', md: 'flex' }} />

            {/* --- DESKTOP ACTIONS --- */}
            <HStack spacing={3} display={{ base: 'none', md: 'flex' }}>
              {/* Support Button (Visible to everyone) */}
              <IconButton 
                onClick={onSupportOpen} 
                variant="ghost" 
                aria-label="Contact Support" 
                icon={<HelpCircle size={20} />}
                color="gray.500"
                _hover={{ color: 'brand.500', bg: 'transparent', transform: 'scale(1.1)' }}
                transition="all 0.2s"
              />

              <IconButton 
                onClick={toggleColorMode} 
                variant="ghost" 
                aria-label="Toggle Color Mode" 
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                color="gray.500"
                _hover={{ color: 'brand.500', bg: 'transparent' }}
              />
              
              {!user ? (
                // Visitor View
                <>
                  <Button as={NextLink} href="/sign-in" variant="ghost" fontSize="sm" fontWeight="600">
                    Log In
                  </Button>
                  <Button 
                    as={NextLink} 
                    href="/sign-up" 
                    variant="solid" 
                    colorScheme="brand" 
                    size="sm"
                    px={6}
                    boxShadow="md"
                    _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
                  >
                    Sign Up Free
                  </Button>
                </>
              ) : (
                // Pilot View
                <Menu>
                  <MenuButton 
                    as={Button} 
                    variant="ghost" 
                    rounded="full"
                    cursor="pointer"
                    minW={0}
                    px={2}
                  >
                    <HStack>
                      <Avatar size="sm" name={user.email} src="" bg="brand.500" color="white" />
                      <Box display={{ base: 'none', lg: 'block' }} textAlign="left">
                          <Text fontSize="xs" fontWeight="bold">Commander</Text>
                      </Box>
                    </HStack>
                  </MenuButton>
                  <MenuList borderColor={borderColor} boxShadow="xl" p={2}>
                    <Box px={3} py={2} bg={useColorModeValue('gray.50', 'whiteAlpha.100')} borderRadius="md" mb={2}>
                      <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Pilot Identity</Text>
                      <Text fontSize="sm" fontWeight="medium" isTruncated maxW="200px">{user.email}</Text>
                      <Badge mt={1} colorScheme="green" variant="subtle" fontSize="10px">SYSTEM ACTIVE</Badge>
                    </Box>
                    
                    <MenuItem as={NextLink} href="/dashboard/settings" icon={<Settings size={16} />} borderRadius="md">
                      Configuration
                    </MenuItem>
                    <MenuItem onClick={onSupportOpen} icon={<HelpCircle size={16} />} borderRadius="md">
                      Support
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem onClick={handleLogout} icon={<LogOut size={16} />} color="red.400" borderRadius="md">
                      Abort Session
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>

            {/* --- MOBILE TOGGLE --- */}
            <Flex display={{ md: 'none' }} gap={2}>
              <IconButton 
                onClick={toggleColorMode} 
                variant="ghost" 
                size="sm"
                aria-label="Toggle Color Mode" 
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} 
              />
              <IconButton
                onClick={onToggle}
                icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
                variant="ghost"
                aria-label="Toggle Navigation"
                colorScheme="brand"
              />
            </Flex>
          </Flex>

          {/* --- MOBILE MENU --- */}
          <Collapse in={isOpen} animateOpacity>
            <Box pb={6} display={{ md: 'none' }}>
              <MotionList 
                display="flex"
                flexDirection="column"
                gap={2}
                alignItems="stretch"
                variants={mobileMenuVariants} 
                initial="closed" 
                animate="open"
                listStyleType="none"
                m={0}
                p={0}
              >
                <Divider my={2} />
                
                {!user ? (
                  // Mobile Visitor
                  <>
                    {unauthenticatedLinks.map(link => (
                       <MotionListItem key={link.label} variants={mobileLinkVariants}>
                        <Button 
                          as={NextLink} 
                          href={link.href} 
                          variant={link.variant === 'ghost' ? 'ghost' : 'solid'} 
                          colorScheme={link.variant === 'solid' ? "brand" : "gray"}
                          w="full" 
                          onClick={handleMobileLinkClick}
                          justifyContent="center"
                        >
                          {link.label}
                        </Button>
                       </MotionListItem>
                    ))}
                    <MotionListItem variants={mobileLinkVariants}>
                      <Button onClick={() => { handleMobileLinkClick(); onSupportOpen(); }} variant="ghost" w="full" leftIcon={<HelpCircle size={18} />}>
                        Support
                      </Button>
                    </MotionListItem>
                    <MotionListItem variants={mobileLinkVariants}>
                      <Flex justify="center" mt={4} color="gray.500">
                        <Text fontSize="xs" fontStyle="italic" textAlign="center">
                          {TAGLINE}
                        </Text>
                      </Flex>
                    </MotionListItem>
                  </>
                ) : (
                  // Mobile Pilot
                  <>
                    <Box px={2} py={2}>
                      <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="bold" letterSpacing="wider">
                        Command Center
                      </Text>
                    </Box>
                    {authenticatedLinks.map(link => (
                      <MotionListItem key={link.label} variants={mobileLinkVariants}>
                        <Button 
                          as={NextLink} 
                          href={link.href} 
                          variant="ghost" 
                          w="full" 
                          justifyContent="flex-start" 
                          leftIcon={<Icon as={link.icon} color="brand.500" />} 
                          onClick={handleMobileLinkClick}
                        >
                          {link.label}
                        </Button>
                      </MotionListItem>
                    ))}
                    <MotionListItem variants={mobileLinkVariants}>
                      <Button 
                        as={NextLink} 
                        href="/dashboard/settings" 
                        variant="ghost" 
                        w="full" 
                        justifyContent="flex-start" 
                        leftIcon={<Settings size={18} />} 
                        onClick={handleMobileLinkClick}
                      >
                        Settings
                      </Button>
                    </MotionListItem>
                     <MotionListItem variants={mobileLinkVariants}>
                      <Button 
                        onClick={() => { handleMobileLinkClick(); onSupportOpen(); }}
                        variant="ghost" 
                        w="full" 
                        justifyContent="flex-start" 
                        leftIcon={<HelpCircle size={18} />} 
                      >
                        Support
                      </Button>
                    </MotionListItem>
                    <MotionListItem variants={mobileLinkVariants}><Divider my={2} /></MotionListItem>
                    <MotionListItem variants={mobileLinkVariants}>
                      <Button 
                        variant="ghost" 
                        w="full" 
                        justifyContent="flex-start" 
                        colorScheme='red' 
                        leftIcon={<LogOut size={18} />} 
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </MotionListItem>
                  </>
                )}
              </MotionList>
            </Box>
          </Collapse>
        </Container>
      </Box>
      
      {/* GLOBAL SUPPORT MODAL */}
      <SupportModal isOpen={isSupportOpen} onClose={onSupportClose} email={user?.email} />
    </>
  );
};

export default NavbarClient;