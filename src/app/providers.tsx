'use client'

import { ChakraProvider } from '@chakra-ui/react'
import theme from '@/styles/theme'
import { Flex, Box } from '@chakra-ui/react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import NextTopLoader from 'nextjs-toploader';

// OBSOLETE SupabaseProvider import and wrapper have been PERMANENTLY REMOVED.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <NextTopLoader
        color="#319795"
        initialPosition={0.08}
        crawlSpeed={200}
        height={4}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
      />
      <Flex direction="column" minH="100vh">
        <Navbar />
        <Box as="main" flex="1" display="flex" flexDirection="column">
          {children}
        </Box>
        <Footer />
      </Flex>
    </ChakraProvider>
  )
}