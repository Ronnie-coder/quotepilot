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
  VStack,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react'; // <-- IMPORT ICONS
import Image from 'next/image';
import NextLink from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

type NavbarClientProps = {
  user: User | null;
};

const NavbarClient = ({ user }: NavbarClientProps) => {
  const supabase = createSupabaseBrowserClient();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const { isOpen, onToggle } = useDisclosure();

  const bgColor = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(0, 0, 0, 0.75)');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Signed out.',
      description: 'You have been successfully signed out.',
      status: 'info',
      duration: 5000,
      isClosable: true,
      position: 'top-right',
    });
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  const handleMobileLinkClick = () => {
    if (isOpen) {
      onToggle();
    }
  };

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={50}
      w="full"
      bg={bgColor}
      backdropFilter="saturate(180%) blur(5px)"
      borderBottom="1px"
      borderColor={borderColor}
      transition="background-color 0.2s ease-in-out"
    >
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="container.xl" mx="auto" px={{ base: 4, md: 8 }}>
        <ChakraLink as={NextLink} href={user ? '/dashboard' : '/'} _hover={{ textDecoration: 'none', opacity: 0.8 }} transition="opacity 0.2s ease-in-out">
          <HStack spacing={3}>
            <Image src="/logo.svg" alt="QuotePilot Logo" width={32} height={32} />
            <Heading as="h1" size="md" fontWeight="bold" letterSpacing="wider" textTransform="uppercase">
              QuotePilot
            </Heading>
          </HStack>
        </ChakraLink>

        <Spacer />

        {/* --- DESKTOP MENU --- */}
        <HStack spacing={{ base: 2, md: 4 }} display={{ base: 'none', md: 'flex' }}>
          <IconButton onClick={toggleColorMode} variant="ghost" aria-label="Toggle Color Mode" icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} />
          {!user ? (
            <HStack spacing={2}>
              <Button as={NextLink} href="/sign-in" variant="outline" size="sm">Log In</Button>
              <Button as={NextLink} href="/sign-up" variant="solid" colorScheme="yellow" size="sm">Sign Up</Button>
            </HStack>
          ) : (
            <HStack spacing={4}>
              <Button as={NextLink} href="/dashboard" variant="ghost">Dashboard</Button>
              <Button as={NextLink} href="/dashboard/quotes" variant="ghost">Documents</Button>
              <NextLink href="/dashboard/settings" passHref legacyBehavior>
                {/* We use the Lucide icon here for consistency with the mobile menu */}
                <IconButton variant="ghost" aria-label="User Settings" icon={<Icon as={Settings} />} />
              </NextLink>
              <Button variant="ghost" onClick={handleLogout}>Logout</Button>
            </HStack>
          )}
        </HStack>

        {/* --- MOBILE MENU TOGGLE --- */}
        <Flex display={{ md: 'none' }} gap={2}>
          <IconButton onClick={toggleColorMode} variant="ghost" aria-label="Toggle Color Mode" icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} />
          <IconButton
            onClick={onToggle}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            variant="ghost"
            aria-label="Toggle Navigation"
          />
        </Flex>
      </Flex>

      {/* --- COLLAPSIBLE MOBILE MENU --- */}
      <Collapse in={isOpen} animateOpacity>
        <Box pb={4} display={{ md: 'none' }} borderBottom="1px" borderColor={borderColor}>
          <VStack as="nav" spacing={2} align="stretch" px={4} pt={2}>
            {!user ? (
              <>
                <Button as={NextLink} href="/sign-in" variant="outline" w="full" onClick={handleMobileLinkClick}>Log In</Button>
                <Button as={NextLink} href="/sign-up" colorScheme="yellow" w="full" onClick={handleMobileLinkClick}>Sign Up</Button>
              </>
            ) : (
              <>
                {/* --- ENHANCEMENT: Icons added to mobile navigation links --- */}
                <Button as={NextLink} href="/dashboard" variant="ghost" w="full" justifyContent="flex-start" leftIcon={<Icon as={LayoutDashboard} />} onClick={handleMobileLinkClick}>Dashboard</Button>
                <Button as={NextLink} href="/dashboard/quotes" variant="ghost" w="full" justifyContent="flex-start" leftIcon={<Icon as={FileText} />} onClick={handleMobileLinkClick}>Documents</Button>
                <Button as={NextLink} href="/dashboard/settings" variant="ghost" w="full" justifyContent="flex-start" leftIcon={<Icon as={Settings} />} onClick={handleMobileLinkClick}>Settings</Button>
                <Divider my={2} />
                <Button variant="ghost" w="full" justifyContent="flex-start" colorScheme='red' leftIcon={<Icon as={LogOut} />} onClick={handleLogout}>Logout</Button>
              </>
            )}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default NavbarClient;