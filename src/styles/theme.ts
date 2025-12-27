'use client';

import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Manual mode helper to avoid dependency issues
const mode = (light: string, dark: string) => (props: { colorMode: 'light' | 'dark' }) => {
  return props.colorMode === 'dark' ? dark : light;
};

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const styles = {
  global: (props: any) => ({
    body: {
      bg: mode('gray.50', 'black')(props),
      color: mode('gray.800', 'gray.100')(props),
    },
  }),
};

// --- STRATEGIC BRAND REALIGNMENT: NEW PALETTE ---
// The new teal/blue palette is professional, calming, and provides excellent contrast.
const colors = {
  brand: {
    50: '#E6FFFA',
    100: '#B2F5EA',
    200: '#81E6D9',
    300: '#4FD1C5',
    400: '#38B2AC',
    500: '#319795', // Core Brand Color
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
    900: '#1D4044',
  },
};

const fonts = {
  heading: `'Inter', sans-serif`,
  body: `'Inter', sans-serif`,
};

// Refined component styles to better match the new brand
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
    },
    variants: {
      solid: (props: any) => ({
        // All solid buttons now default to the primary brand color
        bg: props.colorScheme === 'brand' ? 'brand.500' : undefined,
        color: props.colorScheme === 'brand' ? 'white' : undefined,
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.600' : undefined,
          _disabled: {
            bg: 'brand.500',
          },
        },
      }),
    },
  },
  Link: {
    baseStyle: (props: any) => ({
      color: 'brand.500', // All links default to brand color
      _hover: {
        textDecoration: 'underline',
        color: 'brand.600',
      },
    }),
  },
};

const theme = extendTheme({ config, styles, components, colors, fonts });

export default theme;