'use client';

import { useState, useEffect } from 'react';
import { IconButton, useColorModeValue } from '@chakra-ui/react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  
  // 🟢 COMMANDER FIX: High contrast colors
  // Light Mode: Darker Teal (teal.600) so it stands out against white backgrounds
  // Dark Mode: Brighter Teal (teal.400) so it glows against dark backgrounds
  const bg = useColorModeValue('teal.600', 'teal.400');
  const hoverBg = useColorModeValue('teal.700', 'teal.300');
  const iconColor = 'white'; // Always white for best contrast on teal

  const toggleVisibility = () => {
    // Show sooner (100px)
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
            zIndex: 9999 // NUCLEAR Z-INDEX
          }}
        >
          <IconButton
            aria-label="Back to top"
            icon={<ArrowUp size={24} />}
            onClick={scrollToTop}
            bg={bg}
            color={iconColor}
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