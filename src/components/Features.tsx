'use client';

import { 
  Box, 
  Container, 
  Heading, 
  SimpleGrid, 
  Icon, 
  Text, 
  VStack, 
  useColorModeValue, 
  Flex, 
  chakra, 
  shouldForwardProp 
} from '@chakra-ui/react';
import { FileText, Users, LayoutDashboard, Palette, ShieldCheck, Zap } from 'lucide-react';
import { motion, isValidMotionProp } from 'framer-motion';

// --- MOTION COMPONENT FACTORY (Clean & Warning-Free) ---
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
});

// --- FEATURE CARD COMPONENT ---
const FeatureCard = ({ title, text, icon }: { title: string; text: string; icon: React.ElementType }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const iconBg = useColorModeValue('brand.50', 'whiteAlpha.100');
  const iconColor = useColorModeValue('brand.500', 'brand.300'); // Tuned for better contrast in dark mode
  const hoverBorder = useColorModeValue('brand.400', 'brand.500');

  // Animation variants for the icon on card hover
  const iconVariants = {
    rest: { scale: 1, rotate: 0, transition: { duration: 0.3 } },
    hover: { scale: 1.15, rotate: -10, transition: { duration: 0.3 } },
  };

  // Animation variant for the card entry
  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <MotionBox
      variants={cardVariant}
      // Chakra styles
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      p={8}
      bg={bg}
      borderRadius="2xl"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
      transition="all 0.3s ease-out"
      _hover={{
        transform: 'translateY(-5px)',
        boxShadow: 'xl',
        borderColor: hoverBorder,
      }}
      h="full"
      // Framer props
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <MotionBox
        variants={iconVariants} 
        w={12}
        h={12}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="lg"
        bg={iconBg}
        mb={5}
      >
        <Icon as={icon} w={6} h={6} color={iconColor} strokeWidth={2} />
      </MotionBox>
      
      <Heading as="h3" size="md" fontWeight="bold" mb={3} letterSpacing="tight">
        {title}
      </Heading>
      
      <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="md" lineHeight="1.6">
        {text}
      </Text>
    </MotionBox>
  );
};

export default function Features() {
  // Atmospheric background gradient
  const gradientBg = useColorModeValue(
    'radial-gradient(circle at 50% -20%, var(--chakra-colors-brand-50), var(--chakra-colors-gray-50) 70%)',
    'radial-gradient(circle at 50% 0%, var(--chakra-colors-gray-900), black 70%)'
  );

  // --- Animation variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <Box as="section" id="features" py={{ base: 20, md: 32 }} bg={gradientBg}>
      <Container maxW="container.xl">
        
        {/* HEADER SECTION */}
        <MotionBox
          display="flex"
          flexDirection="column"
          alignItems="center"
          textAlign="center"
          mb={20}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <MotionBox variants={textVariants}>
            <Text
              color={useColorModeValue('brand.600', 'brand.400')}
              fontWeight="bold"
              letterSpacing="wide"
              textTransform="uppercase"
              fontSize="sm"
              mb={2}
            >
              The Toolkit
            </Text>
          </MotionBox>
          
          <MotionBox variants={textVariants}>
            <Heading as="h2" size="2xl" fontWeight="900" mb={4} letterSpacing="tight">
              Everything You Need,<br /> Nothing You Don't
            </Heading>
          </MotionBox>

          <MotionBox variants={textVariants}>
            <Text
              fontSize="lg"
              color={useColorModeValue('gray.600', 'gray.400')}
              maxW="2xl"
              lineHeight="relaxed"
            >
              We stripped away the bloat. QuotePilot gives you the essential tools to manage clients and get paid, packaged in a fast, beautiful interface.
            </Text>
          </MotionBox>
        </MotionBox>
        
        {/* GRID SECTION */}
        <MotionBox
          display="grid"
          gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
          gridGap={8}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          <FeatureCard
            icon={FileText}
            title="Instant PDFs"
            text="Create professional Quotes and Invoices that look great on any device. Download instantly as clean, branded PDFs."
          />
          <FeatureCard
            icon={Palette}
            title="Brand Consistency"
            text="Your logo, your identity. Set it up once in settings, and every document you generate carries your professional seal."
          />
          <FeatureCard
            icon={Users}
            title="Client Directory"
            text="Stop digging through emails. Keep all your client details in one secure list for rapid-fire document creation."
          />
          <FeatureCard
            icon={LayoutDashboard}
            title="Revenue Tracking"
            text="The Dashboard shows you exactly what matters: Total Revenue and recent document history."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Data Ownership"
            text="Your financial data is yours. We use enterprise-grade security (Supabase) to keep your records locked and safe."
          />
          <FeatureCard
            icon={Zap}
            title="Zero Latency"
            text="No loading spinners. QuotePilot is built on modern tech (Next.js) for instant transitions. Time is money."
          />
        </MotionBox>
      </Container>
    </Box>
  );
}