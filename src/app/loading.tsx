'use client';

// --- Uses the new, reliable lottie-react library ---
import Lottie from 'lottie-react'; 
import { Flex } from '@chakra-ui/react';

// --- Imports the animation JSON directly from its new location in src/assets ---
import loaderAnimation from '@/assets/animations/loader.json';

export default function Loading() {
  return (
    <Flex
      width="100%"
      height="100vh"
      alignItems="center"
      justifyContent="center"
      position="fixed"
      top="0"
      left="0"
      bg="rgba(255, 255, 255, 0.8)"
      backdropFilter="blur(5px)"
      zIndex="9999"
    >
      {/* --- This is the correct, working component --- */}
      <Lottie 
        animationData={loaderAnimation} 
        loop={true} 
        style={{ width: '300px', height: '300px' }}
      />
    </Flex>
  );
}