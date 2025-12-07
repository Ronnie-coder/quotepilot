// FILE: src/app/loading.tsx
'use client';

import Lottie from 'lottie-react'; 
import { Flex, useColorModeValue } from '@chakra-ui/react';
// Ensure this path matches where you saved the JSON file
import loaderAnimation from '@/assets/animations/loader.json';

export default function Loading() {
  // Modern Glassmorphism Background
  // Light Mode: White with 80% opacity
  // Dark Mode: Black with 80% opacity
  const bg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(23, 25, 35, 0.9)');

  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      zIndex={9999} // Maximum Priority
      align="center"
      justify="center"
      bg={bg}
      backdropFilter="blur(10px)" // The "Frosted Glass" effect
    >
      {/* Container to control size of the animation */}
      <div style={{ width: 250, height: 250 }}>
        <Lottie 
          animationData={loaderAnimation} 
          loop={true} 
          autoplay={true}
        />
      </div>
    </Flex>
  );
}