// /src/app/layout.tsx
'use client';

// Import ClerkProvider
import { ClerkProvider } from '@clerk/nextjs';

import { ChakraProvider, Box, Flex } from '@chakra-ui/react';
import theme from '../styles/theme';
import { Inter } from 'next/font/google';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Wrap the entire application with ClerkProvider
    <ClerkProvider>
      <html lang="en">
        <head>
          <title>QuotePilot</title>
          <meta name="description" content="Smart Quote and Invoice Generator" />
          <link rel="icon" href="/logo.svg" />
        </head>
        <body className={inter.className}>
          {/* Our existing ChakraProvider and layout structure remains intact */}
          <ChakraProvider theme={theme}>
            <Flex direction="column" minH="100vh">
              <Navbar />
              <Box as="main" flex="1" display="flex" flexDirection="column">
                {children}
              </Box>
              <Footer />
            </Flex>
          </ChakraProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}