// /src/components/LogoUploader.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box, Text, Image, Center, VStack, Icon, useColorModeValue, Button
} from '@chakra-ui/react';
import { FiUploadCloud, FiTrash2 } from 'react-icons/fi';
import { Control, useController } from 'react-hook-form'; // Import Control and useController
import { InvoiceFormData } from '../types/invoice';

// --- FIX: Define props to accept control object ---
interface LogoUploaderProps {
  onLogoUpload: (base64: string | null) => void;
  control: Control<InvoiceFormData>;
}

const LogoUploader = ({ onLogoUpload, control }: LogoUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const hoverBorderColor = useColorModeValue('brand.500', 'brand.300');

  // --- FIX: This hook now works because control is passed in ---
  const { field } = useController({ name: 'logo', control });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onLogoUpload(base64String);
        field.onChange(base64String); // Update react-hook-form state
      };
      reader.readAsDataURL(file);
    }
  }, [onLogoUpload, field]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.svg'] },
    maxSize: 1048576, // 1MB
  });

  const handleRemoveLogo = () => {
    setPreview(null);
    onLogoUpload(null);
    field.onChange(null); // Update react-hook-form state
  };

  return (
    <Box w="100%">
      {preview ? (
        <Center flexDirection="column">
          <Image src={preview} alt="Logo preview" boxSize="100px" objectFit="contain" mb={4} />
          <Button onClick={handleRemoveLogo} size="sm" variant="outline" colorScheme="red" leftIcon={<FiTrash2 />}>
            Remove Logo
          </Button>
        </Center>
      ) : (
        <Center
          {...getRootProps()}
          border="2px dashed"
          borderColor={isDragActive ? hoverBorderColor : borderColor}
          borderRadius="md"
          p={8}
          cursor="pointer"
          textAlign="center"
          transition="border-color 0.2s ease"
          w="100%"
        >
          <input {...getInputProps()} />
          <VStack>
            <Icon as={FiUploadCloud} boxSize={8} color="gray.500" />
            <Text>Drop your logo here, or click to select</Text>
            <Text fontSize="sm" color="gray.500">PNG, JPG, SVG up to 1MB</Text>
          </VStack>
        </Center>
      )}
    </Box>
  );
};

export default LogoUploader;