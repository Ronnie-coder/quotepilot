// FILE: src/app/layout.tsx
import type { Metadata } from 'next';
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Container, Flex } from '@chakra-ui/react';
import AuthListener from '@/components/AuthListener';
import BackToTop from '@/components/BackToTop';


const siteUrl = 'https://quotepilot.coderon.co.za/';

export const metadata: Metadata = {
  title: 'QuotePilot - Professional Invoices & Quotes for Africa',
  description: 'The premier invoice and quote generator for freelancers and SMEs in Africa. Fast, beautiful, and built to empower your growth.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'QuotePilot - Professional Invoices & Quotes for Africa',
    description: 'The premier invoice and quote generator for freelancers and SMEs in Africa.',
    url: siteUrl,
    siteName: 'QuotePilot',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'QuotePilot Application Interface' }],
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuotePilot - Professional Invoices & Quotes for Africa',
    description: 'The premier invoice and quote generator for freelancers and SMEs in Africa.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: { icon: '/logo.svg', shortcut: '/logo.svg', apple: '/logo.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: 'React.ReactNode' }>) {
  return (
    <html lang="en" style={{ scrollBehavior: 'smooth' }}> {/* <-- FIX 3: Smooth scrolling enabled globally --- */}
      <body>
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