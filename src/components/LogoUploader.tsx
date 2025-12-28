'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Image, Text, VStack, Icon, Center, useColorModeValue, Spinner, Button, HStack, FormControl, FormLabel } from '@chakra-ui/react';
import { UploadCloud, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
// 🟢 FIX: Import Database type directly
import { Database } from '@/types/supabase';

// 🟢 FIX: Local type helper for Tables
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

interface LogoUploaderProps {
  profile: Tables<'profiles'> | null;
  formAction: (payload: FormData) => void;
  state: { success: boolean; message: string; isSubmitting?: boolean };
}

export default function LogoUploader({ profile, formAction, state }: LogoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(profile?.logo_url || null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const hoverBorderColor = useColorModeValue('yellow.500', 'yellow.300');
  const dropzoneBg = useColorModeValue('gray.50', 'gray.800');

  useEffect(() => {
    if (state.success) {
      setFileToUpload(null);
      // Let the profile prop update the preview naturally from the router.refresh()
    }
  }, [state.success]);
  
  // Effect to update preview if profile prop changes from outside
  useEffect(() => {
    setPreview(profile?.logo_url || null);
  }, [profile?.logo_url]);


  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFileToUpload(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg'] },
    maxSize: 2 * 1024 * 1024, // 2MB
    multiple: false,
  });
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileToUpload(null);
  };

  const currentLogo = fileToUpload ? preview : (profile?.logo_url ? `${profile.logo_url}?t=${new Date().getTime()}` : null);

  return (
    <VStack as="form" action={formAction} spacing={4} w="full">
      <FormControl>
        <FormLabel>Company Logo</FormLabel>
        <Center
          {...getRootProps()}
          p={6}
          bg={dropzoneBg}
          cursor="pointer"
          border="2px dashed"
          borderColor={isDragActive ? hoverBorderColor : borderColor}
          borderRadius="md"
          textAlign="center"

          transition="border-color 0.2s"
          w="full"
        >
          <input {...getInputProps()} name="logo" />
          {currentLogo ? (
            <Image src={currentLogo} alt="Logo Preview" boxSize="100px" objectFit="contain" />
          ) : (
            <VStack>
              <Icon as={UploadCloud} boxSize={8} color="gray.500" />
              <Text fontWeight="medium">Click to upload or drag & drop</Text>
              <Text fontSize="sm" color="gray.500">SVG, PNG, JPG (max. 2MB)</Text>
            </VStack>
          )}
        </Center>
      </FormControl>
      
      <HStack w="full" justify="flex-start">
        <Button 
          type="submit" 
          leftIcon={state.isSubmitting ? <Spinner size="sm" /> : <UploadCloud />}
          isDisabled={!fileToUpload || state.isSubmitting}
        >
          {state.isSubmitting ? 'Uploading...' : 'Upload New Logo'}
        </Button>
        {currentLogo && (
          <Button
            type="button" // --- CRITICAL FIX: PREVENTS FORM SUBMISSION ---
            variant="ghost"
            colorScheme="red"
            size="sm"
            onClick={handleRemove}
            leftIcon={<Trash2 size={16} />}
          >
            Remove
          </Button>
        )}
      </HStack>
    </VStack>
  );
}