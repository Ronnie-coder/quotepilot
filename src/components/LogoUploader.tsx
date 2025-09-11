'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Image, Text, VStack, Button, Icon, Center, useColorModeValue } from '@chakra-ui/react';
import { FiUploadCloud, FiTrash2 } from 'react-icons/fi';

// This component NO LONGER uses onFileSelect. It is self-contained.
interface LogoUploaderProps {
  currentLogoUrl?: string | null;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ currentLogoUrl }) => {
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const hoverBorderColor = useColorModeValue('blue.500', 'blue.300');

  useEffect(() => {
    setPreview(currentLogoUrl || null);
  }, [currentLogoUrl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.svg'] },
    maxSize: 2 * 1024 * 1024, // 2MB limit
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop the file dialog from opening
    setPreview(null);
    // We clear the file input by resetting the form if needed, but for server actions,
    // not having a file is enough to signal removal if we code it that way.
    // Let's ensure the input is cleared.
    const fileInput = document.getElementById('logo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <Box w="100%" p={6} borderWidth={1} borderRadius="md">
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
        position="relative" // For positioning the remove button
      >
        {/* The name="logo" is CRITICAL for the server action */}
        <input {...getInputProps()} name="logo" id="logo-input" />
        
        {preview ? (
            <Image src={preview} alt="Company Logo" boxSize="150px" objectFit="contain" />
        ) : (
          <VStack>
            <Icon as={FiUploadCloud} boxSize={8} color="gray.500" />
            <Text>Drop your logo here, or click to select</Text>
            <Text fontSize="sm" color="gray.500">PNG, JPG, SVG up to 2MB</Text>
          </VStack>
        )}
      </Center>
      
      {preview && (
        <Center mt={4}>
            <Button onClick={handleRemove} size="sm" variant="outline" colorScheme="red" leftIcon={<FiTrash2 />}>
                Remove / Change Logo
            </Button>
        </Center>
      )}
    </Box>
  );
};

export default LogoUploader;