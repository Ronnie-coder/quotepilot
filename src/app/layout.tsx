// src/app/layout.tsx (FULL REPLACEMENT)

import { ClerkProvider } from '@clerk/nextjs';
import SupabaseProvider from '@/providers/SupabaseProvider'; // <-- IMPORT: Establish Command Center Link
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'QuotePilot - Your Business, Streamlined.',
  description: 'Generate, send, and track professional quotes in seconds.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/logo.svg" />
        </head>
        <body>
          <SupabaseProvider> {/* <-- DEPLOYED: New Auth Pipeline Active */}
            <Providers>
              {children}
            </Providers>
          </SupabaseProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}