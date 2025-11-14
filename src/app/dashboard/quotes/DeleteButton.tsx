// src/app/dashboard/quotes/DeleteButton.tsx
'use client';

import {
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useToast,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import React, { useTransition } from 'react';
import { deleteQuoteAction } from './actions';

// --- CORRECTION 1: Type definition updated ---
// The component's prop interface now accepts 'isDisabled'.
type DeleteButtonProps = {
  quoteId: string;
  clientName: string;
  isDisabled?: boolean; // This property is now defined.
};

export function DeleteButton({ quoteId, clientName, isDisabled }: DeleteButtonProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();
  
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteQuoteAction(quoteId);

      if (result.error) {
        toast({
          title: 'Deletion Failed',
          description: result.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Success!',
          description: 'The document has been purged.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
    });
  };

  return (
    <>
      <IconButton
        aria-label="Delete document"
        icon={<DeleteIcon />}
        size="sm"
        colorScheme="red"
        onClick={onOpen}
        isLoading={isPending}
        // --- CORRECTION 2: Prop implemented ---
        // The isDisabled prop is now passed to the underlying IconButton,
        // correctly disabling it when other actions are in progress.
        isDisabled={isDisabled || isPending}
      />

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Purge Protocol
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to permanently delete the document for{' '}
              <strong>{clientName}</strong>? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} isDisabled={isPending}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={isPending}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}