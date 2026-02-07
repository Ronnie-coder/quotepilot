import type { Metadata } from 'next';
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container, Flex, ColorModeScript } from '@chakra-ui/react';
import AuthListener from '@/components/AuthListener';
import BackToTop from '@/components/BackToTop';
import { Inter } from 'next/font/google';

// Load the font so the theme can use it
const inter = Inter({ subsets: ['latin'] });

const siteUrl = 'https://quotepilot.coderon.co.za/';

export const metadata: Metadata = {
  title: 'QuotePilot – Professional Invoicing for African Freelancers & SMEs',
  description: 'Send professional invoices via WhatsApp and get paid faster. QuotePilot helps African freelancers and SMEs create verified invoices and accept online or crypto payments.',
  keywords: [
    'invoicing software Africa',
    'WhatsApp invoicing',
    'freelancer invoicing',
    'SME invoicing',
    'invoice payments Africa',
    'crypto invoicing',
    'USDT payments',
    'online invoicing tool',
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'QuotePilot – WhatsApp‑First Invoicing for Africa',
    description: 'Create professional invoices, share them instantly via WhatsApp, and get paid faster with online or crypto payments.',
    url: siteUrl,
    siteName: 'QuotePilot',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'QuotePilot Application Interface' }],
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuotePilot – WhatsApp‑First Invoicing for Africa',
    description: 'Create professional invoices, share them instantly via WhatsApp, and get paid faster with online or crypto payments.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: { icon: '/logo.svg', shortcut: '/logo.svg', apple: '/logo.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ scrollBehavior: 'smooth' }} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* This script prevents the color mode flash on reload */}
        <ColorModeScript initialColorMode="light" />
        
        <Providers>
          <AuthListener />
          <Flex direction="column" minH="100vh">
            <Navbar />
            <Container as="main" maxW="container.xl" flex="1" py={{ base: 6, md: 8 }}>
              {children}
            </Container>
            <Footer />
          </Flex>
        </Providers>
        
        <Analytics />
        <BackToTop />
      </body>
    </html>
  );
}