'use client';

import { useState, useEffect } from 'react';
import { IconButton, useColorModeValue } from '@chakra-ui/react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  
  // 🟢 FIX: Ensure colors are extremely explicit for both modes
  // Light: Teal 600, Dark: Teal 400
  const bg = useColorModeValue('teal.600', 'teal.400');
  const hoverBg = useColorModeValue('teal.700', 'teal.300');
  const arrowColor = useColorModeValue('white', 'gray.900');

  const toggleVisibility = () => {
    if (window.scrollY > 100) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          style={{ 
            position: 'fixed', 
            bottom: '2rem', 
            right: '2rem', 
            zIndex: 9999 // 🟢 FIX: Ensure it floats above everything
          }}
        >
          <IconButton
            aria-label="Back to top"
            icon={<ArrowUp size={24} />}
            onClick={scrollToTop}
            variant="solid"
            colorScheme="teal" // 🟢 FIX: Fallback color scheme
            bg={bg}
            color={arrowColor}
            size="lg"
            isRound
            shadow="xl"
            _hover={{ 
              bg: hoverBg,
              transform: 'translateY(-4px)', 
              shadow: '2xl' 
            }}
            transition="all 0.2s"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}