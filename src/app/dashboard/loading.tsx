import { Spinner, VStack, Text } from '@chakra-ui/react';

export default function Loading() {
  return (
    <VStack spacing={4} justify="center" align="center" h="50vh">
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="brand.500"
        size="xl"
      />
      <Text>Loading Dashboard...</Text>
    </VStack>
  );
}