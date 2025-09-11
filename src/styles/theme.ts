// /src/styles/theme.ts
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const styles = {
  global: (props: any) => ({
    body: {
      bg: mode('gray.50', '#000000')(props), // Light grey for light mode, pure black for dark
      color: mode('gray.800', 'whiteAlpha.900')(props),
    },
  }),
};

const components = {
  // Example of component-specific styling if needed in the future
  // Button: {
  //   baseStyle: {
  //     fontWeight: 'bold',
  //   },
  // },
};

const theme = extendTheme({
  config,
  styles,
  components,
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  colors: {
    brand: {
      50: '#e6f6ff',
      100: '#b3e0ff',
      200: '#80c9ff',
      300: '#4db3ff',
      400: '#1a9cff',
      500: '#007acc', // Primary brand color
      600: '#0062a3',
      700: '#00497a',
      800: '#003152',
      900: '#001829',
    },
  },
});

export default theme;