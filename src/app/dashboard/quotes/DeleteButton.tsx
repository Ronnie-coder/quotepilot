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

type DeleteButtonProps = {
  quoteId: string;
  clientName: string;
  isDisabled?: boolean;
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
          title: 'Purge Failed',
          description: result.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Document Purged',
          description: `The document for ${clientName} has been permanently removed.`,
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
        variant="ghost"
        onClick={onOpen}
        isLoading={isPending}
        isDisabled={isDisabled || isPending}
      />

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay bg="blackAlpha.300" backdropFilter="blur(2px)">
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="red.600">
              Confirm Deletion
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this document for <strong>{clientName}</strong>? 
              <br /><br />
              This action creates a permanent record gap and cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} isDisabled={isPending} variant="ghost">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={isPending}
              >
                Delete Permanently
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}