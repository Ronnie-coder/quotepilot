'use client';

import {
  MenuItem,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useToast,
  Icon
} from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import React, { useTransition } from 'react';
import { deleteClientAction } from './actions';

type DeleteClientButtonProps = {
  clientId: string;
  clientName: string;
};

export function DeleteClientButton({ clientId, clientName }: DeleteClientButtonProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClientAction(clientId);
      if (result.success) {
        toast({ title: 'Client Deleted', status: 'success', duration: 3000 });
      } else {
        toast({ title: 'Deletion Failed', description: result.error, status: 'error', duration: 5000 });
      }
      onClose();
    });
  };

  return (
    <>
      <MenuItem icon={<Icon as={Trash2} boxSize={4} />} color="red.500" onClick={onOpen}>
        Delete
      </MenuItem>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Confirm Deletion</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete <strong>{clientName}</strong>? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} isDisabled={isPending}>Cancel</Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3} isLoading={isPending}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}