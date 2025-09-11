// src/components/Navbar.tsx (UPGRADED)
'use client';

import { Box, Flex, Heading, Button, useColorMode, useColorModeValue, Spacer, HStack } from '@chakra-ui/react';
import { MoonIcon, SunIcon, AddIcon } from '@chakra-ui/icons'; // VANGUARD: Import AddIcon
import Image from 'next/image';
import NextLink from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  const bgColor = useColorModeValue('white', 'transparent');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  
  const logoRef = useRef<HTMLDivElement>(null);
  const appName = "QuotePilot";

  useEffect(() => {
    const chars = logoRef.current?.querySelectorAll('span');
    if (chars) {
      gsap.fromTo(chars,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, []);

  return (
    <Box
      bg={bgColor}
      px={{ base: 4, md: 8 }}
      shadow={colorMode === 'light' ? 'sm' : 'none'}
      position="sticky"
      top={0}
      zIndex={10}
      borderBottomWidth="1px"
      borderColor={borderColor}
    >
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="container.xl" mx="auto">
        
        <NextLink href="/">
          <Flex alignItems="center" cursor="pointer">
            <Image src="/logo.svg" alt="QuotePilot Logo" width={32} height={32} />
            <Heading as="h1" size="md" color={textColor} ml={3} ref={logoRef} display="flex">
              {appName.split('').map((char, index) => (
                <span key={index} style={{ display: 'inline-block' }}>{char}</span>
              ))}
            </Heading>
          </Flex>
        </NextLink>

        <Spacer />

        <Flex alignItems="center">
          <Button onClick={toggleColorMode} variant="ghost" mr={4}>
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>

          <SignedOut>
            <Flex>
              <NextLink href="/sign-in">
                <Button colorScheme="brand" variant="ghost" mr={2}>
                  Log In
                </Button>
              </NextLink>
              <NextLink href="/sign-up">
                <Button colorScheme="brand" variant="solid">
                  Sign Up
                </Button>
              </NextLink>
            </Flex>
          </SignedOut>
          
          <SignedIn>
            <HStack spacing={4} mr={4} align="center">
              <NextLink href="/dashboard">
                  <Button colorScheme="brand" variant="ghost">
                    Dashboard
                  </Button>
              </NextLink>
              {/* VANGUARD DIRECTIVE: Replace "Clients" link with a direct link to the Command Roster */}
              <NextLink href="/dashboard/quotes">
                  <Button colorScheme="brand" variant="ghost">
                    Documents
                  </Button>
              </NextLink>
              
              {/* VANGUARD DIRECTIVE: ADD HIGH-VISIBILITY "CREATE" BUTTON */}
              {/* This is the new, correct link to the InvoiceForm for creating documents. */}
              <NextLink href="/quote/new" passHref>
                <Button colorScheme="brand" variant="solid" leftIcon={<AddIcon />}>
                  Create
                </Button>
              </NextLink>
            </HStack>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;