'use client';

import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Progress,
  Icon,
  Button,
  useColorModeValue,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { CheckCircle2, Circle, ArrowRight, UserPlus, FileText, Send } from 'lucide-react';
import NextLink from 'next/link';

interface OnboardingChecklistProps {
  hasClients: boolean;
  hasInvoices: boolean;
  hasSent: boolean;
}

export default function OnboardingChecklist({ hasClients, hasInvoices, hasSent }: OnboardingChecklistProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.100', 'blue.900');
  const accentBg = useColorModeValue('blue.50', 'rgba(66, 153, 225, 0.1)');

  // 1. Define Steps
  const steps = [
    { 
      id: 1, 
      label: 'Add your first client', 
      isDone: hasClients, 
      icon: UserPlus, 
      action: 'Add Client', 
      link: null // Opens modal via context/parent if we wired it, or user uses Quick Actions
    },
    { 
      id: 2, 
      label: 'Create an invoice', 
      isDone: hasInvoices, 
      icon: FileText, 
      action: 'Create',
      link: '/quote/new'
    },
    { 
      id: 3, 
      label: 'Send via WhatsApp', 
      isDone: hasSent, 
      icon: Send, 
      action: 'Go to Invoice',
      link: '/dashboard/quotes'
    },
  ];

  // 2. Calculate Progress
  const completedCount = steps.filter(s => s.isDone).length;
  const progress = (completedCount / 3) * 100;

  // 3. Auto-hide if complete (Return null)
  if (completedCount === 3) return null;

  // 4. Render (No internal motion wrappers)
  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={6}
      mb={6} // Margin bottom to separate from stats
      position="relative"
      overflow="hidden"
      boxShadow="sm"
    >
      {/* Blue Accent Bar */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="4px"
        height="100%"
        bg="blue.400"
      />

      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'start', md: 'center' }} gap={6}>
        
        {/* Header Section */}
        <Box flex={1}>
          <HStack mb={2}>
            <Heading size="md" color="blue.600">Getting Started</Heading>
            <Badge colorScheme="blue" borderRadius="full" variant="subtle">
              {completedCount}/3 Completed
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.500" mb={3}>
            Follow these steps to send your first professional invoice.
          </Text>
          <Progress 
            value={progress} 
            size="xs" 
            colorScheme="blue" 
            borderRadius="full" 
            bg={accentBg} 
          />
        </Box>

        {/* Steps List */}
        <VStack align="stretch" flex={1.5} spacing={2}>
          {steps.map((step) => (
            <HStack 
              key={step.id} 
              justify="space-between" 
              p={2} 
              borderRadius="lg"
              bg={step.isDone ? 'transparent' : accentBg}
              opacity={step.isDone ? 0.5 : 1}
              borderWidth={step.isDone ? '0px' : '1px'}
              borderColor={step.isDone ? 'transparent' : 'blue.100'}
            >
              <HStack>
                <Icon 
                  as={step.isDone ? CheckCircle2 : Circle} 
                  color={step.isDone ? 'green.500' : 'blue.500'} 
                  boxSize={5}
                />
                <Text 
                  fontSize="sm" 
                  fontWeight={step.isDone ? 'normal' : 'bold'}
                  textDecoration={step.isDone ? 'line-through' : 'none'}
                >
                  {step.label}
                </Text>
              </HStack>

              {/* Action Button (only if not done) */}
              {!step.isDone && step.link && (
                <Button 
                  as={NextLink} 
                  href={step.link}
                  size="xs" 
                  colorScheme="blue" 
                  variant="solid"
                  rightIcon={<ArrowRight size={12} />}
                >
                  {step.action}
                </Button>
              )}
              
              {!step.isDone && !step.link && (
                 <Text fontSize="xs" color="blue.500" fontWeight="bold" pr={2}>
                    Use Quick Actions ↗
                 </Text>
              )}
            </HStack>
          ))}
        </VStack>

      </Flex>
    </Box>
  );
}