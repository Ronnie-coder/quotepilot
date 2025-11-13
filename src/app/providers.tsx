// FILE: src/app/providers.tsx (COMPLETE & UPGRADED)
'use client';

import { ChakraProvider } from '@chakra-ui/react';
import theme from '@/styles/theme';
import NextTopLoader from 'nextjs-toploader';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <NextTopLoader
        color="#D4AF37" // TACTICAL UPGRADE: Synced with brand.500 gold
        initialPosition={0.08}
        crawlSpeed={200}
        height={4}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
      />
      {children}
    </ChakraProvider>
  );
}