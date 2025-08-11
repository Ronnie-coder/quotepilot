// /src/components/Footer.tsx
'use client';

import { Box, Text, VStack, Divider, Center } from '@chakra-ui/react';

const Footer = () => {
  return (
    <Box as="footer" width="100%" py={6} color="gray.500">
      <Center>
        <VStack spacing={2}>
          <Text fontSize="sm">Powered by QuotePilot</Text>
          <Text fontSize="sm">
            © {new Date().getFullYear()} Coderon (Pty) Ltd. All rights reserved.
          </Text>
        </VStack>
      </Center>
    </Box>
  );
};

export default Footer;

