'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Button, Flex, Heading, Switch, FormControl, FormLabel, Container, useColorModeValue, Icon, Text, Fade
} from '@chakra-ui/react';
import { ChevronLeft, FileText, Pencil } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';
import DocumentViewer from '@/components/DocumentViewer';

interface QuotePageClientProps {
  quote: any;
  profile: any;
  clients: any[];
  isViewing: boolean;
}

export default function QuotePageClient({ quote, profile, clients, isViewing = true }: QuotePageClientProps) {
  const router = useRouter();
  
  const [isEditMode, setIsEditMode] = useState(!isViewing);

  // --- THEME COLORS ---
  const mainBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  
  // Preview Area (The "Stage")
  const previewStageBg = useColorModeValue('gray.100', 'gray.900');
  
  // The "Paper" Document
  // Light: White paper
  // Dark: Gray 800 (Dark paper) to match the inner cards
  const paperBg = useColorModeValue('white', 'gray.800');
  const paperBorder = useColorModeValue('transparent', 'gray.700');

  const toggleMode = () => {
    setIsEditMode((prev) => !prev);
  };

  return (
    <Container maxW="container.xl" py={8}>
      {/* HEADER */}
      <Flex justify="space-between" align="center" mb={6}>
        <Button 
          variant="ghost" 
          leftIcon={<ChevronLeft size={18} />} 
          onClick={() => router.push('/dashboard/invoices')}
        >
          Back to Invoices
        </Button>
        
        <Flex align="center" gap={4} bg={mainBg} p={2} rounded="lg" border="1px" borderColor={borderColor} shadow="sm">
           <FormControl display='flex' alignItems='center'>
             <FormLabel htmlFor='mode-switch' mb='0' fontSize="sm" fontWeight="medium" display="flex" alignItems="center" gap={2} cursor="pointer" color={textColor}>
               {isEditMode ? <><Icon as={Pencil} size={14} /> Editing</> : <><Icon as={FileText} size={14} /> Viewing</>}
             </FormLabel>
             <Switch 
                id='mode-switch' 
                isChecked={isEditMode} 
                onChange={toggleMode} 
                colorScheme="brand" 
                size="sm"
             />
           </FormControl>
        </Flex>
      </Flex>

      {/* MAIN CONTENT AREA */}
      <Box 
        bg={mainBg} 
        rounded="xl" 
        shadow="sm" 
        borderWidth="1px" 
        borderColor={borderColor} 
        overflow="hidden"
        minH="80vh"
      >
        {isEditMode ? (
          <Fade in={true}>
            <Box p={6}>
              <Flex justify="space-between" align="center" mb={6} borderBottomWidth="1px" pb={4} borderColor={borderColor}>
                  <Heading size="md" color={textColor}>Edit Invoice #{quote.invoice_number}</Heading>
                  <Text fontSize="sm" color={subTextColor}>Make changes to your invoice below.</Text>
              </Flex>
              
              <InvoiceForm 
                defaultValues={quote} 
                clients={clients} 
                profile={profile} 
              />
            </Box>
          </Fade>
        ) : (
          /* 🟢 VIEW MODE (Polished) */
          <Box 
            p={{ base: 4, md: 8 }} 
            bg={previewStageBg} 
            minH="80vh" 
            display="flex" 
            justifyContent="center"
          >
            {/* The "Paper" Container */}
            <Box 
                w="full" 
                maxW="210mm" 
                bg={paperBg} 
                shadow="xl" 
                minH="297mm"
                borderWidth={useColorModeValue('0', '1px')}
                borderColor={paperBorder}
                // Ensure text inside DocumentViewer inherits readable colors if not explicitly set
                color={textColor} 
                transition="background 0.2s"
            >
                {/* 
                   Since DocumentViewer components are theme-aware (dark cards),
                   placing them on a dark paperBg (gray.800) creates a cohesive Dark UI.
                */}
                <DocumentViewer 
                    quote={quote} 
                    profile={profile} 
                />
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
}