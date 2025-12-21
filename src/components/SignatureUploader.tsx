'use client';

import { 
  Box, Button, Flex, FormControl, FormLabel, Icon, Image, Input, Text, useColorModeValue, VStack 
} from '@chakra-ui/react';
import { PenTool, Upload } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="sm"
      colorScheme="cyan"
      isLoading={pending}
      loadingText="Saving..."
      leftIcon={<Icon as={Upload} />}
      variant="outline"
      width="full"
    >
      Upload Signature
    </Button>
  );
}

export default function SignatureUploader({ profile, formAction, state }: { profile: any, formAction: any, state: any }) {
  const [preview, setPreview] = useState<string | null>(profile?.signature_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgBox = useColorModeValue('gray.50', 'gray.700');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Box as="form" action={formAction}>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel fontSize="sm" color="gray.500">
            Upload a PNG of your signature (transparent background).
          </FormLabel>
          
          <Flex 
            direction="column" 
            align="center" 
            justify="center"
            border="2px dashed" 
            borderColor={borderColor}
            borderRadius="lg"
            bg={bgBox}
            p={4}
            cursor="pointer"
            onClick={() => fileInputRef.current?.click()}
            transition="all 0.2s"
            _hover={{ borderColor: 'cyan.400', bg: useColorModeValue('cyan.50', 'whiteAlpha.200') }}
            h="120px"
          >
            {preview ? (
              <Image 
                src={preview} 
                alt="Signature Preview" 
                maxH="80px" 
                objectFit="contain" 
              />
            ) : (
              <VStack spacing={1}>
                <Icon as={PenTool} boxSize={6} color="gray.400" />
                <Text fontSize="xs" color="gray.500">Click to upload</Text>
              </VStack>
            )}
            
            <Input 
              type="file" 
              name="signature" 
              accept=".png,.jpg,.jpeg" 
              ref={fileInputRef} 
              display="none" 
              onChange={handleFileChange} 
            />
          </Flex>
        </FormControl>

        <SubmitButton />
        
        {state?.message && (
             <Text fontSize="xs" color={state.success ? "green.500" : "red.500"} textAlign="center">
               {state.message}
             </Text>
        )}
      </VStack>
    </Box>
  );
}