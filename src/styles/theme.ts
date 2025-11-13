// FILE: src/styles/theme.ts (COMPLETE & UPGRADED)
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const styles = {
  global: (props: any) => ({
    body: {
      // TACTICAL UPGRADE: Pure white and pure black for high contrast
      bg: mode('#FFFFFF', '#000000')(props),
      color: mode('gray.800', 'gray.100')(props),
    },
  }),
};

const components = {
  Button: {
    variants: {
      solid: (props: any) => ({
        bg: 'brand.500',
        color: 'gray.900', // High contrast text on gold button
        _hover: { 
          bg: 'brand.600',
          _disabled: {
            bg: 'brand.500'
          }
        },
      }),
      // TACTICAL ADDITION: New variant for secondary CTA
      outline: (props: any) => ({
        borderColor: mode('gray.800', 'white')(props),
        color: mode('gray.800', 'white')(props),
        _hover: {
          bg: mode('gray.100', 'whiteAlpha.100')(props),
        }
      })
    },
  },
  Card: {
    baseStyle: (props: any) => ({
      container: {
        bg: mode('#FFFFFF', '#1A1A1A')(props),
      },
    }),
  },
  Input: {
    variants: {
      outline: (props: any) => ({
        field: {
          bg: mode('white', 'gray.800')(props),
          borderColor: mode('gray.200', 'gray.600')(props),
          _hover: {
            borderColor: mode('gray.300', 'gray.500')(props),
          },
        },
      }),
    },
  },
  Select: {
    variants: {
      outline: (props: any) => ({
        field: {
          bg: mode('white', 'gray.800')(props),
          borderColor: mode('gray.200', 'gray.600')(props),
          _hover: {
            borderColor: mode('gray.300', 'gray.500')(props),
          },
        },
      }),
    },
  },
  Textarea: {
    variants: {
      outline: (props: any) => ({
        bg: mode('white', 'gray.800')(props),
        borderColor: mode('gray.200', 'gray.600')(props),
        _hover: {
          borderColor: mode('gray.300', 'gray.500')(props),
        },
      }),
    },
  },
  Table: {
    variants: {
      simple: (props: any) => ({
        th: {
          borderColor: mode('gray.200', 'gray.700')(props),
        },
        td: {
          borderColor: mode('gray.200', 'gray.700')(props),
        },
      }),
    },
  },
  Link: {
    baseStyle: (props: any) => ({
      color: mode('gray.600', 'gray.200')(props),
      _hover: {
        textDecoration: 'none',
        color: 'brand.500',
      },
    }),
  },
};

const colors = {
  brand: {
    50: '#FBF6E1', 100: '#F5E8B8', 200: '#EFDA8E', 300: '#E8CC65', 400: '#E2BF3B',
    500: '#D4AF37', 600: '#B5952F', 700: '#967B27', 800: '#77611F', 900: '#584717',
  },
};

const fonts = {
  heading: `'Inter', sans-serif`,
  body: `'Inter', sans-serif`,
};

const theme = extendTheme({ config, styles, components, colors, fonts });

export default theme;