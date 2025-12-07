'use client';

import Lottie from 'lottie-react';
import { Flex, useColorModeValue } from '@chakra-ui/react';
import loaderAnimation from '@/assets/animations/loader.json';

export default function Loading() {
  const bg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(23, 25, 35, 0.9)');

  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      zIndex={9999}
      align="center"
      justify="center"
      bg={bg}
      backdropFilter="blur(10px)"
    >
      <div style={{ width: 250, height: 250 }}>
        <Lottie animationData={loaderAnimation} loop autoplay />
      </div>
    </Flex>
  );
}
