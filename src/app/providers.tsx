// DEFINITIVE REFINEMENT: src/app/providers.tsx
'use client';

import { ChakraProvider } from '@chakra-ui/react';
import theme from '@/styles/theme';
import NextTopLoader from 'nextjs-toploader';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader
        color="#319795" // TACTICAL UPGRADE: Synced with new brand.500
        initialPosition={0.08}
        crawlSpeed={200}
        height={4}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
      />
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </>
  );
}