'use client';

import {
  Box,
  Flex,
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
  shouldForwardProp,
  Kbd,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  VStack,
  Circle,
  Spinner
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { LayoutDashboard, FileText, Settings, LogOut, Users, HelpCircle, Search, Bell, ShieldCheck, Zap, Globe, AlertTriangle, Wifi, WifiOff, Info, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; 
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { motion, isValidMotionProp } from 'framer-motion';
import { SupportModal } from './SupportModal';
import { CommandPalette } from './CommandPalette';
import { useEffect, useState } from 'react';
// 🟢 FIX: Import Database directly
import { Database } from '@/types/supabase';

// 🟢 FIX: Local type helper for Tables
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

// --- ICON MAPPING (DB String -> Component) ---
const ICON_MAP: Record<string, any> = {
  ShieldCheck, Zap, Globe, AlertTriangle, Info, CheckCircle, Bell
};

// --- COLOR MAPPING ---
const TYPE_COLOR_MAP: Record<string, string> = {
  security: 'green',
  success: 'purple',
  warning: 'orange',
  info: 'blue'
};

const TAGLINE = "Join fellow pilots across Africa 🌍";

// --- MOTION COMPONENT FACTORY ---
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

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  
  const activeColor = useColorModeValue('teal.600', 'teal.300');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');
  const hoverColor = useColorModeValue('teal.500', 'teal.200');

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
  profile: Tables<'profiles'> | null;
};

const NavbarClient = ({ user, profile }: NavbarClientProps) => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter(); 
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  
  const { isOpen, onToggle } = useDisclosure();
  const { isOpen: isSupportOpen, onOpen: onSupportOpen, onClose: onSupportClose } = useDisclosure();
  const { isOpen: isCmdOpen, onOpen: onCmdOpen, onClose: onCmdClose } = useDisclosure();

  // 🟢 REAL: Network & Notification Logic
  const [isOnline, setIsOnline] = useState(true);
  const [notifications, setNotifications] = useState<Tables<'system_notifications'>[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  
  // 1. Fetch Real Notifications
  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        setIsLoadingNotifs(true);
        const { data } = await supabase
          .from('system_notifications')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (data) setNotifications(data);
        setIsLoadingNotifs(false);
      };
      fetchNotifs();
    }
  }, [user]);

  // 2. Network Listeners
  useEffect(() => {
    if (typeof window !== 'undefined') {
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }
  }, []);

  // 3. KBD Shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isCmdOpen) onCmdClose();
        else onCmdOpen();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isCmdOpen, onCmdClose, onCmdOpen]);

  const bgColor = useColorModeValue('rgba(255, 255, 255, 0.85)', 'rgba(23, 25, 35, 0.8)');
  const backdropFilter = "saturate(180%) blur(12px)";
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const logoFilter = useColorModeValue('none', 'drop-shadow(0 0 6px rgba(49, 151, 149, 0.6))'); 
  const searchBg = useColorModeValue('gray.100', 'whiteAlpha.200');
  const searchBorder = useColorModeValue('gray.200', 'whiteAlpha.300');
  const userAvatarFilter = useColorModeValue('none', 'invert(1) brightness(2)');

  // 🟢 FIX: Define Hook OUTSIDE the loop
  const notificationHoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');

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
  
  const mobileMenuVariants = {
    open: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
  };

  const mobileLinkVariants = {
    open: { y: 0, opacity: 1, transition: { y: { stiffness: 1000, velocity: -100 } } },
    closed: { y: 20, opacity: 0, transition: { y: { stiffness: 1000 } } }
  };

  const userDisplayName = profile?.company_name || 'Commander';
  const userAvatarSrc = profile?.logo_url || '';

  // Calculate unread count (Offline + DB Alerts)
  const unreadCount = (!isOnline ? 1 : 0) + notifications.length;

  // 🟢 REUSABLE NOTIFICATION COMPONENT TO AVOID DUPLICATION
  const NotificationPopover = () => (
    <Popover placement='bottom-end'>
        <PopoverTrigger>
            <IconButton 
                variant="ghost" 
                size="sm"
                aria-label="Notifications" 
                icon={
                    <Box position="relative">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <Circle size="8px" bg="red.400" position="absolute" top="0" right="0" border="2px solid white" />
                        )}
                    </Box>
                } 
                color="gray.500" 
                _hover={{ color: 'teal.500', bg: 'transparent' }} 
            />
        </PopoverTrigger>
        <PopoverContent borderColor={borderColor} shadow="xl" _focus={{ outline: 'none' }} width="340px">
            <PopoverArrow />
            <PopoverHeader fontWeight="bold" fontSize="sm" borderBottomWidth="1px" display="flex" justifyContent="space-between" alignItems="center">
                  Command Center Feed
                  {isOnline ? <Badge colorScheme="green" variant="subtle" fontSize="0.6em">ONLINE</Badge> : <Badge colorScheme="red" variant="solid" fontSize="0.6em">OFFLINE</Badge>}
            </PopoverHeader>
            <PopoverBody p={0}>
                <VStack align="stretch" spacing={0} divider={<Divider />}>
                    
                    {/* 1. OFFLINE WARNING (Real) */}
                    {!isOnline && (
                      <HStack p={3} spacing={3} bg="red.50">
                          <Flex align="center" justify="center" boxSize="32px" bg="red.100" color="red.600" borderRadius="full">
                              <WifiOff size={16} />
                          </Flex>
                          <Box>
                              <Text fontSize="xs" fontWeight="bold" color="red.700">Connection Lost</Text>
                              <Text fontSize="xs" color="red.600">You are currently offline.</Text>
                          </Box>
                      </HStack>
                    )}

                    {/* 2. DB LOADING STATE */}
                    {isLoadingNotifs && (
                        <Flex p={4} justify="center"><Spinner size="sm" color="teal.500" /></Flex>
                    )}

                    {/* 3. REAL NOTIFICATIONS (From DB) */}
                    {!isLoadingNotifs && notifications.length > 0 ? (
                        notifications.map((alert) => {
                            const color = TYPE_COLOR_MAP[alert.type] || 'gray';
                            const icon = ICON_MAP[alert.icon_key] || Bell;
                            return (
                                // 🟢 FIX: Using the variable from top level
                                <HStack key={alert.id} p={3} spacing={3} _hover={{ bg: notificationHoverBg }}>
                                    <Flex align="center" justify="center" boxSize="32px" bg={`${color}.100`} color={`${color}.600`} borderRadius="full">
                                        <Icon as={icon} size={16} />
                                    </Flex>
                                    <Box>
                                        <Text fontSize="xs" fontWeight="bold">{alert.title}</Text>
                                        <Text fontSize="xs" color="gray.500">{alert.message}</Text>
                                    </Box>
                                </HStack>
                            );
                        })
                    ) : (
                        !isLoadingNotifs && (
                            <Box p={4} textAlign="center"><Text fontSize="xs" color="gray.400">All systems operational.</Text></Box>
                        )
                    )}

                </VStack>
            </PopoverBody>
        </PopoverContent>
    </Popover>
  );

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
            
            <Tooltip label={TAGLINE} placement="bottom-start" hasArrow bg="teal.800" color="white" fontSize="xs">
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
                  <Text fontSize="xl" fontWeight="800" letterSpacing="tight" color={useColorModeValue('gray.800', 'white')}>
                    QuotePilot
                  </Text>
                </HStack>
              </ChakraLink>
            </Tooltip>

            <Spacer />

            <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
              {user && authenticatedLinks.map(link => (
                <NavLink key={link.label} href={link.href}>
                  <HStack spacing={1}>
                    <Icon as={link.icon} boxSize={4} />
                    <Text>{link.label}</Text>
                  </HStack>
                </NavLink>
              ))}
            </HStack>

            <Spacer display={{ base: 'none', md: 'flex' }} />

            {user && (
              <Box display={{ base: 'none', lg: 'block' }} mr={4}>
                <Button
                  size="sm"
                  variant="outline"
                  color="gray.500"
                  borderColor={searchBorder}
                  bg={searchBg}
                  fontWeight="normal"
                  w="240px" 
                  justifyContent="space-between"
                  onClick={onCmdOpen}
                  _hover={{ borderColor: 'teal.300', color: 'teal.500' }}
                >
                  <HStack><Search size={14} /><Text fontSize="xs">Search clients, invoices...</Text></HStack>
                  <HStack spacing={1}><Kbd fontSize="xs" variant="outline">⌘</Kbd><Kbd fontSize="xs" variant="outline">K</Kbd></HStack>
                </Button>
              </Box>
            )}

            {/* DESKTOP ACTIONS */}
            <HStack spacing={3} display={{ base: 'none', md: 'flex' }}>
              
              {/* 🟢 NOTIFICATION CENTER (Desktop) */}
              {user && <NotificationPopover />}

              <IconButton onClick={onSupportOpen} variant="ghost" aria-label="Support" icon={<HelpCircle size={20} />} color="gray.500" _hover={{ color: 'teal.500', bg: 'transparent', transform: 'scale(1.1)' }} transition="all 0.2s" />
              <IconButton onClick={toggleColorMode} variant="ghost" aria-label="Toggle Theme" icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} color="gray.500" _hover={{ color: 'teal.500', bg: 'transparent' }} />
              
              {!user ? (
                <>
                  <Button as={NextLink} href="/sign-in" variant="ghost" fontSize="sm" fontWeight="600">Log In</Button>
                  <Button as={NextLink} href="/sign-up" variant="solid" colorScheme="teal" size="sm" px={6} boxShadow="md" _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}>Sign Up Free</Button>
                </>
              ) : (
                <Menu>
                  <MenuButton as={Button} variant="ghost" rounded="full" cursor="pointer" minW={0} px={2}>
                    <HStack>
                      <Avatar 
                        size="sm" 
                        name={userDisplayName} 
                        src={userAvatarSrc} 
                        bg={userAvatarSrc ? 'transparent' : 'teal.500'} 
                        color={userAvatarSrc ? 'transparent' : 'white'}
                        icon={userAvatarSrc ? <Box /> : undefined}
                        sx={{
                          '& > img': {
                            filter: userAvatarFilter
                          }
                        }}
                      />
                      <Box display={{ base: 'none', lg: 'block' }} textAlign="left">
                          <Text fontSize="xs" fontWeight="bold">{userDisplayName}</Text>
                      </Box>
                    </HStack>
                  </MenuButton>
                  <MenuList borderColor={borderColor} boxShadow="xl" p={2}>
                    <Box px={3} py={2} bg={useColorModeValue('gray.50', 'whiteAlpha.100')} borderRadius="md" mb={2}>
                      <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Pilot Identity</Text>
                      <Text fontSize="sm" fontWeight="medium" isTruncated maxW="200px">{user.email}</Text>
                      <Badge mt={1} colorScheme="green" variant="subtle" fontSize="10px">SYSTEM ACTIVE</Badge>
                    </Box>
                    <MenuItem as={NextLink} href="/dashboard/settings" icon={<Settings size={16} />} borderRadius="md">Configuration</MenuItem>
                    <MenuItem onClick={onSupportOpen} icon={<HelpCircle size={16} />} borderRadius="md">Support</MenuItem>
                    <MenuDivider />
                    <MenuItem onClick={handleLogout} icon={<LogOut size={16} />} color="red.400" borderRadius="md">Abort Session</MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>

            {/* MOBILE ACTIONS */}
            <Flex display={{ md: 'none' }} gap={2}>
              {user && <IconButton onClick={onCmdOpen} variant="ghost" size="sm" aria-label="Search" icon={<Search size={18} />} />}
              
              {/* 🟢 NOTIFICATION CENTER (Mobile) - Added here! */}
              {user && <NotificationPopover />}

              <IconButton onClick={toggleColorMode} variant="ghost" size="sm" aria-label="Toggle Theme" icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} />
              <IconButton onClick={onToggle} icon={isOpen ? <CloseIcon /> : <HamburgerIcon />} variant="ghost" aria-label="Toggle Navigation" colorScheme="teal" />
            </Flex>
          </Flex>

          <Collapse in={isOpen} animateOpacity>
            <Box pb={6} display={{ md: 'none' }}>
              <MotionList display="flex" flexDirection="column" gap={2} alignItems="stretch" variants={mobileMenuVariants} initial="closed" animate="open" listStyleType="none" m={0} p={0}>
                <Divider my={2} />
                {!user ? (
                  <>
                    {unauthenticatedLinks.map(link => (
                       <MotionListItem key={link.label} variants={mobileLinkVariants}>
                        <Button as={NextLink} href={link.href} variant={link.variant === 'ghost' ? 'ghost' : 'solid'} colorScheme={link.variant === 'solid' ? "teal" : "gray"} w="full" onClick={handleMobileLinkClick} justifyContent="center">{link.label}</Button>
                       </MotionListItem>
                    ))}
                    <MotionListItem variants={mobileLinkVariants}><Button onClick={() => { handleMobileLinkClick(); onSupportOpen(); }} variant="ghost" w="full" leftIcon={<HelpCircle size={18} />}>Support</Button></MotionListItem>
                  </>
                ) : (
                  <>
                    <Box px={2} py={2}><Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="bold" letterSpacing="wider">Command Center</Text></Box>
                    {authenticatedLinks.map(link => (
                      <MotionListItem key={link.label} variants={mobileLinkVariants}>
                        <Button as={NextLink} href={link.href} variant="ghost" w="full" justifyContent="flex-start" leftIcon={<Icon as={link.icon} color="teal.500" />} onClick={handleMobileLinkClick}>{link.label}</Button>
                      </MotionListItem>
                    ))}
                    <MotionListItem variants={mobileLinkVariants}><Button as={NextLink} href="/dashboard/settings" variant="ghost" w="full" justifyContent="flex-start" leftIcon={<Settings size={18} />} onClick={handleMobileLinkClick}>Settings</Button></MotionListItem>
                     <MotionListItem variants={mobileLinkVariants}><Button onClick={() => { handleMobileLinkClick(); onSupportOpen(); }} variant="ghost" w="full" justifyContent="flex-start" leftIcon={<HelpCircle size={18} />}>Support</Button></MotionListItem>
                    <MotionListItem variants={mobileLinkVariants}><Divider my={2} /></MotionListItem>
                    <MotionListItem variants={mobileLinkVariants}><Button variant="ghost" w="full" justifyContent="flex-start" colorScheme='red' leftIcon={<LogOut size={18} />} onClick={handleLogout}>Logout</Button></MotionListItem>
                  </>
                )}
              </MotionList>
            </Box>
          </Collapse>
        </Container>
      </Box>
      <SupportModal isOpen={isSupportOpen} onClose={onSupportClose} email={user?.email} />
      <CommandPalette isOpen={isCmdOpen} onClose={onCmdClose} />
    </>
  );
};

export default NavbarClient;